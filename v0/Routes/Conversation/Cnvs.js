/*
 * ---CONVERSATION---
 * id          - Id of the Conversation
 * title       - Title of the Conversation. limited to 80 chars. unique title
 * ownerId     - Owner of the Conversation
 * lastMessage - int ms since epoch. When Conversation was last posted to. May be null.
 */

var Express = require('express');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
var async = require('async');

router.baseURL = '/Cnvs';

/**
 * Any AU is acceptable. Return, for each Conversation in the system:
 *      id - Id of the Conversation
 *      title - Title of the Conversation
 *      ownerId - Owner of the Conversation
 *      lastMessage - int ms since epoch. When Conversation was last posted to. May be null.
 */
/**
 * TESTS: DONE
 *    Create a new conversation
 *    Check to make sure the conversation was created (get)
 */
router.get('/', function (req, res) {
    var cnn = req.cnn;
    var vld = req.validator;

    cnn.chkQry(vld, 'SELECT * FROM Conversation', null,
        function (err, cnvs) {
            if (!err)
                res.json(cnvs);
            cnn.release();
            console.log("CONNECTION RELEASED");
        }
    );
});


/**
 * DONE
 * GET datetime ={dateTime} num={num}
 *
 * Return all Messages for the indicated Conversation, in reverse chronological order.
 * Limit this to num Messages ending before datetime. If datetime is omitted, use current time. If num is
 * omitted return all posts prior to the indicated date. Datetime is integer number of mS since epoch. Return
 * for each Message, in increasing datetime order:
 *      id - Message ID
 *      whenMade - Date and time, in mS since epoch, when the Message was made
 *      email - Email of the poster
 *      content - Content of the Message
 */
router.get('/:cnvId/Msgs', function (req, res) {
    var vld = req.validator;
    var cnvId = req.params.cnvId;
    var params = [cnvId];
    var cnn = req.cnn;
    var num = req.query.num;
    var datetime = req.query.dateTime;
    var query = 'SELECT whenMade, email, content FROM Conversation c'
        + ' JOIN Message ON cnvId = c.id join Person p ON prsId = p.id WHERE c.id = ?'
        + ' && whenMade < FROM_UNIXTIME(?/1000) ORDER BY whenMade DESC';

    params.push(datetime ? datetime : new Date().getTime()); //CHANGED added datetime filtering

    // And finally add a limit clause and parameter if indicated.
    if (num) { //CHANGED req.params.num to num
        query += ' LIMIT ?';
        params.push(num); //CHANGED req.params.num to num
    }

    params = params.map(Number); //CHANGED added to convert strings to integers

    async.waterfall([
            function (cb) {  // Check for existence of conversation
                cnn.chkQry(vld, 'select * from Conversation where id = ?', [cnvId], cb);
            },
            function (cnvs, fields, cb) { // Get indicated messages
                if (vld.check(cnvs.length, Tags.notFound, null, cb))
                    cnn.chkQry(vld, query, params, cb);
            }], //CHANGED removed last function, not needed
        function (err, msgs) {
            if (!err)
                res.json(msgs);
            cnn.release();
            console.log("CONNECTION RELEASED");
        });
});


/**
 * Create a new Conversation, owned by the current AU. Error dupTitle if title is a duplicate. Fields are:
 *      title - Title of the new conversation, limited to 80 chars
 * Example body;
 * {
 *   "title": "First Convo"
 * }
 */
/**
 * TESTS: DONE
 *    Create a bad request (no body), to make sure it fails
 *    Create a good request to make sure it succeeds
 */
router.post('/', function (req, res) {
    var vld = req.validator;
    var body = req.body;
    var cnn = req.cnn;

    async.waterfall([
            function (cb) {
                if (vld.check(body && body.title && body.title.length <= 80, Tags.missingField, null, cb)) //CHANGED added this check
                    cnn.chkQry(vld, 'select * from Conversation where title = ?', body.title, cb);
            },
            function (existingCnv, fields, cb) {
                if (vld.check(!existingCnv.length, Tags.dupTitle, null, cb)) {
                    body.ownerId = req.session.id; //CHANGED added the session id as the ownerId
                    cnn.chkQry(vld, "insert into Conversation set ?", body, cb);
                }
            },
            function (insRes, fields, cb) {
                res.location(router.baseURL + '/' + insRes.insertId).end();
                cb();
            }],
        function (err) {
            cnn.release();
            console.log("CONNECTION RELEASED");
        });
});


/**
 * Update the title of the Conversation. Fields as for Conversations POST. Error dupTitle if title is duplicate.
 * AU must be Conversation owner or admin.
 *
 * Example body;
 * {
 *   "title": "Updated title"
 * }
 */
/**
 * TESTS: DONE
 *    Check for good response code.
 */
router.put('/:cnvId', function (req, res) {
    var vld = req.validator;
    var body = req.body;
    var cnn = req.cnn;
    var cnvId = req.params.cnvId;

    async.waterfall([
            function (cb) {
                cnn.chkQry(vld, 'SELECT * FROM Conversation WHERE id = ?', [cnvId], cb);
            },
            function (cnvs, fields, cb) {
                if (vld.check(cnvs.length, Tags.notFound, null, cb) && vld.checkPrsOK(cnvs[0].ownerId, cb)) //CHANGED result[0] to cnvs[0] CHANGED prsId to ownerId
                    cnn.chkQry(vld, 'SELECT * FROM Conversation WHERE title = ?', [body.title], cb); //CHANGED updated query SELECT * FROM Conversation WHERE id <> ? && title = ?   to   SELECT * FROM Conversation WHERE title = ?
            },
            function (sameTtl, fields, cb) {
                if (vld.check(!sameTtl.length, Tags.dupTitle, null, cb)) //CHANGED Added params (null)
                    cnn.chkQry(vld, "UPDATE Conversation SET title = ? WHERE id = ?", [body.title, cnvId], cb);
            }],
        function (err) {
            if (!err)
                res.status(200).end();
            req.cnn.release();
            console.log("CONNECTION RELEASED");
        });
});


/**
 * Delete the Conversation, including all associated Messages. AU must be Conversation owner or admin
 */
/**
 * TESTS: DONE
 *    Create a conversation
 *    Delete the conversation
 *    Check to make sure the conversation was deleted successfully
 */
router.delete('/:cnvId', function (req, res) {
    var vld = req.validator;
    var cnvId = req.params.cnvId;
    var cnn = req.cnn;

    async.waterfall([
            function (cb) {
                cnn.chkQry(vld, 'SELECT * FROM Conversation WHERE id = ?', [cnvId], cb);
            },
            function (qRes, fields, cb) {
                if (vld.check(qRes.length, Tags.notFound, null, cb) && vld.checkPrsOK(qRes[0].ownerId, cb)) //CHANGED qRes[0].ownerId
                    cnn.chkQry(vld, 'DELETE FROM Conversation WHERE id = ?', [cnvId], cb); //Deletes convos AND messages tied to it
            }],
        function (err) {
            if (!err)
                res.status(200).end(); //CHANGED .end() added;
            cnn.release();
            console.log("CONNECTION RELEASED");
        });
});


/**
 * Add a new Message, stamped with the current AU and date/time.
 *      content - Content of the Message, up to 5000 chars
 */
/**
 * TESTS: DONE
 *    Check to make sure message is added properly
 */
router.post('/:cnvId/Msgs', function (req, res) {
    var vld = req.validator;
    var cnn = req.cnn;
    var cnvId = req.params.cnvId;
    var now;

    async.waterfall([
            function (cb) {
                cnn.chkQry(vld, 'select * from Conversation where id = ?', [cnvId], cb);
            },
            function (cnvs, fields, cb) {
                if (vld.chain(req.body.content, Tags.missingField, ["Content"]).check(cnvs.length, Tags.notFound, null, cb)) { //CHANGED added content check
                    var message = { //INSERT INTO Message (cnvId, prsId, whenMade, content)
                        cnvId: cnvId, prsId: req.session.id,
                        whenMade: now = new Date(), content: req.body.content.substring(0, 5000) //CHANGED added .substring(0, 5000) to only take 5000 chars
                    };
                    cnn.chkQry(vld, 'insert into Message set ?', message, cb);
                }
            },
            function (insRes, fields, cb) {
                res.location(router.baseURL + '/' + cnvId + '/' + insRes.insertId).end(); //CHANGED added correct route
                cnn.chkQry(vld, "UPDATE Conversation SET lastMessage = ? WHERE id = ?", [now, cnvId], cb); //CHANGED updated query from 'content' to 'lastMessage'
            }],
        function (err) {
            if (!err)
                res.status(200).end(); //CHANGED .end() added;
            cnn.release();
            console.log("CONNECTION RELEASED");
        });
});

module.exports = router;