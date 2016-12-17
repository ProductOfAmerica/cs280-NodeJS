var Express = require('express');
var CnnPool = require('../CnnPool.js');
var Tags = require('../Validator.js').Tags;
var ssnUtil = require('../Session.js');
var router = Express.Router({caseSensitive: true});

router.baseURL = '/Ssns';

/**
 * Returns a list of all active sessions. Admin-privileged AU required. Returns array of
 *      cookie    - Unique cookie value for session
 *      prsId     - ID of Person logged in
 *      loginTime - Date and time of login
 */
/**
 * TESTS: DONE
 *    Check for admin
 *    Check to make sure user session is returned
 */
router.get('/', function (req, res) {
    var body = [], ssn;
    var cnn = req.cnn;

    if (req.validator.checkAdmin()) {
        for (var cookie in ssnUtil.sessions) {
            ssn = ssnUtil.sessions[cookie];
            console.log("Session: " + cookie + ' -> ' + ssn); //TODO REMOVE this used to be a comment
            body.push({cookie: cookie, prsId: ssn.id, loginTime: ssn.loginTime});
        }
        res.status(200).json(body);
    }
    cnn.release();
    console.log("CONNECTION RELEASED");
});


router.get('/:cookie', function (req, res, next) { //CHANGED '/cookie' to '/:cookie'
    var cookie = req.params.cookie;
    var vld = req.validator;

    if (vld.checkPrsOK(ssnUtil.sessions[cookie].id)) {
        res.json({prsId: req.session.id});
    }
    req.cnn.release();
    console.log("CONNECTION RELEASED");
});


/**
 * A successful POST generates a browser-session cookie that will permit continued access for 2 hours. Indicated
 * Person becomes the AU. An unsuccesful POST results in a 400/No Permission error code, with no further information.
 *
 *      email - Email of user requesting login
 *      password - Password of user
 */
/**
 * TESTS: DONE
 *    Test unsuccessful login (bad email) - should give 400
 */
router.post('/', function (req, res) {
    var cookie;
    var cnn = req.cnn;

    cnn.query('select * from Person where email = ?', [req.body.email], function (err, result) {
        if (req.validator.check(result.length && result[0].password === req.body.password, Tags.badLogin)) {
            cookie = ssnUtil.makeSession(result[0], res);
            res.location(router.baseURL + '/' + cookie).status(200).end();
        }
        cnn.release();
        console.log("CONNECTION RELEASED");
    });
});


/**
 * Log out the specified Session. AU must be owner of Session or admin.
 */
/**
 * TESTS: DONE
 *    Check to see logged out successfully
 *    Check to be AU owner of session or admin.
 */
router.delete('/:cookie', function (req, res, next) {
    if (req.validator.check(req.params.cookie === req.cookies[ssnUtil.cookieName] || req.session.isAdmin(), Tags.noPermission)) { //CHANGED || req.session.isAdmin()
        ssnUtil.deleteSession(req.params.cookie); //CHANGED req.query.cookie to req.params.cookie
        res.status(200).end();
    }

    req.cnn.release();
    console.log("CONNECTION RELEASED");
});

module.exports = router;