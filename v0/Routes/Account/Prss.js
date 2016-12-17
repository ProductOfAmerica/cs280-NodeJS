/*
 * ---PERSON---
 * id               - unique primary auto
 * email            - unique Email for new person
 * firstName
 * lastName
 * role             - 0 normal, 1 admin
 * termsAccepted    - boolean--were site terms and conditions accepted?
 * whenRegistered   - datetime
 */
var Express = require('express');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
var async = require('async');
var mysql = require('mysql');

router.baseURL = '/Prss';

/**
 * GET email={email or email prefix}
 * Returns list of zero or more Persons, as resource URLs. Limits response to Persons with specified email or
 * email prefix, if applicable. No data for other than the AU is returned in any event, unless
 * the AU is an admin.
 *
 *  Data per person:
 *      email - principal string identifier, unique across all Persons
 *      id - id of person with said email, so that URI would be Prss/{id}
 */
/**
 * TESTS: DONE
 *    Check that an email is returned if it exists
 *    Check that the email/id are returned
 *    Check that you ONLY get the current session's email returned if not an Admin
 *    Check that you get ANY email returned per request if Admin
 */
router.get('/', function (req, res) { //request, response
    var email = (req.session.isAdmin() && req.query.email) || (!req.session.isAdmin() && req.session.email); //CHANGED req.session.email to req.query.email
    var vld = req.validator;
    var cnn = req.cnn;

    var handler = function (err, result) { //CHANGED (prsArr) to (err, res)
        res.json(result);
        cnn.release();
        console.log("CONNECTION RELEASED");
    };

    if (email)
        cnn.chkQry(vld, 'select id, email from Person where email = ?', [email], handler); //Returns specific user from email
    else
        cnn.chkQry(vld, 'select id, email from Person', null, handler); //Returns all emails
});


/**
 * Returns object for Person {prsId}, with fields as specified in POST for Prss, plus dates termsAccepted and
 * whenRegistered, less password. The dates give time of term acceptance and registration, and will generally be
 * equal, but are listed separately for legal reasons. AU must be person {prsId} or admin.
 */
/**
 * TESTS: DONE
 *   Check to make sure password isn't returned
 *   Check to make sure AU is the current user OR admin
 *   Check for all other fields:
 *        email
 *        firstName
 *        lastName
 *        role
 *        termsAccepted
 *        whenRegistered
 */
router.get('/:id', function (req, res) {
    var vld = req.validator;
    var cnn = req.cnn;

    if (vld.checkPrsOK(req.params.id)) {
        cnn.query('select email, firstName, lastName, role, termsAccepted, ' + //CHANGED 'select * from Person where id = ?' to new query
            'whenRegistered from Person where id = ?', [req.params.id], //CHANGED req.body.id to req.params.id
            function (err, prsArr) {
                console.log("Query: ", prsArr); //TODO REMOVE
                if (vld.check(prsArr.length, Tags.notFound))
                    res.json(prsArr);
                cnn.release();
                console.log("CONNECTION RELEASED");
            });
    } else {
        cnn.release();
        console.log("CONNECTION RELEASED");
    }
});


/**
 * Adds a new Person, returning newly added Person. No AU required, as this resource/verb is used for registration.
 *      email - unique Email for new person
 *      firstName
 *      lastName
 *      password
 *      role - 0 for student, 1 for admin
 *      termsAccepted - boolean--were site terms and conditions accepted?
 *
 * Email and lastName required. Error if email is nonunique. Error if terms were not accepted and AU is not admin.
 * Error forbiddenRole if role is not student unless AU is admin. Password required iff AU is admin, in which case a
 * blocking password is recorded, preventing further access to the account.
 */
/**
 * TESTS: DONE
 *    Register a student (without needing to log in)
 *    Check to make sure the student was registered/returned
 *    Check to make sure that duplicating an email fails
 *    Check to make sure you can't register without a email/lastName
 *    Check to make sure you can't register without accepting terms
 *    Check to make sure you can't create admin account without being logged in
 *    Check to make sure admin can create account without needing password
 */
router.post('/', function (req, res) {
    var vld = req.validator;  // Shorthands
    var body = req.body;
    var admin = req.session && req.session.isAdmin();
    var cnn = req.cnn;

    if (admin && !body.password)
        body.password = "*";                       // Blocking password
    body.whenRegistered = new Date();

    async.waterfall([
            function (cb) { // Check properties and search for Email duplicates
                if (vld.hasFields(body, ["email", "lastName", "password", "role"], cb) &&
                    vld.chain(body.role == 0 || admin, Tags.noPermission)
                        .chain(body.termsAccepted || admin, Tags.noTerms)
                        .check(body.role >= 0, Tags.badValue, ["role"], cb)) {
                    cnn.chkQry(vld, 'select * from Person where email = ?', body.email, cb);
                }
            },
            function (existingPrss, fields, cb) {  // If no duplicates, insert new Person
                if (vld.check(!existingPrss.length, Tags.dupEmail, null, cb)) {
                    body.termsAccepted = body.termsAccepted && new Date();
                    console.log('Body:', body); //TODO remove
                    cnn.chkQry(vld, 'insert into Person set ?', body, cb);
                }
            },
            function (result, fields, cb) { // Return location of inserted Person
                res.location(router.baseURL + '/' + result.insertId).end();
                cb();
            }],
        function (err) {
            if (err)
                console.log('Prss POST error: ', err); //TODO REMOVE
            cnn.release();
            console.log("CONNECTION RELEASED");
        });
});

/**
 * Update Person {prsId}, with body giving an object with one or more of firstName, lastName, password,
 * role, but no other fields. All changes require the AU be the Person in question, or an admin.
 * Role changes result in noPermission for nonadmins. Unless AU is admin, an additional field
 * oldPassword is required for changing password.
 */
/**
 * TESTS: DONE
 *    Check to make sure update works with one of the fields
 *    Check to make sure update works with all fields
 *    Check to make sure update fails with no required fields
 *    Check to make sure admin/person in question to update - noPerms
 *    Check to make sure password won't be changed without oldPassword
 *    Check to make sure you can't update the wrong value
 *    Check to make sure a single required field is required to work
 */
router.put('/:id', function (req, res) {
    var vld = req.validator;
    var body = req.body;
    var admin = req.session.isAdmin();
    var cnn = req.cnn;

    var extraVars = []; //CHANGED added this validation
    var names = Object.getOwnPropertyNames(body);
    for (var x in names) {
        if (names[x] != 'lastName' && names[x] != 'role' && names[x] != 'password' && names[x] != 'firstName' && names[x] != 'oldPassword')
            extraVars.push(names[x]);
    }

    async.waterfall([
            function (cb) {
                if (vld.checkPrsOK(req.params.id, cb) && vld.check(!extraVars.length, Tags.forbiddenField, extraVars, cb) &&
                    vld.chain(!body.hasOwnProperty('role') || admin, Tags.noPermission) //CHANGED !body.role to !body.hasOwnProperty('role')
                        .chain(!(body.role < 0), Tags.badValue, ["role"])
                        .chain(body.password || body.firstName || body.lastName || body.role, Tags.missingField, ["No required fields"]) //CHANGED
                        .check(!body.password || body.oldPassword || admin, Tags.noOldPwd, null, cb))
                    cnn.chkQry(vld, "select * from Person where id = ?", [req.params.id], cb);
            },
            function (qRes, fields, cb) {
                if (vld.check(admin || !body.password || qRes[0].password === body.oldPassword, Tags.oldPwdMismatch, null, cb)) {
                    delete body.oldPassword;
                    cnn.chkQry(vld, "update Person set ? where id = ?", [body, req.params.id], cb);
                }
            }],
        function (err) {
            if (!err)
                res.status(200).end();
            cnn.release();
            console.log("CONNECTION RELEASED");
        });
});


/**
 * Delete the Person in question, including all Cnvs and Msgs owned by Person. Requires admin AU.
 */
/**
 * TESTS: DONE
 *    Check to make sure only an Admin can do this call
 *    Check to make sure all Persons with the user id are removed.
 *    Check to make sure all messages associated are removed.
 *    Check to make sure all conversations are removed.
 */
router.delete('/:id', function (req, res) {
    var vld = req.validator;
    var cnn = req.cnn;

    async.waterfall([ //CHANGED
            function (cb) {
                if (vld.checkAdmin(cb) && vld.check(req.params.id, Tags.missingField, null, cb)) {
                    cnn.chkQry(vld, 'DELETE from Person where id = ?', [req.params.id], cb);
                }
            },
            function (qRes, fields, cb) {
                console.log("---Deleted", qRes.affectedRows, "instances of [User", req.params.id + "] from Person---"); //TODO REMOVE
                cnn.chkQry(vld, 'DELETE FROM Message WHERE prsId = ?', [req.params.id], cb);
            }],
        function (err) {
            if (!err)
                res.status(200).end();
            cnn.release();
            console.log("CONNECTION RELEASED");
        });


    // ---OLD---
    // if (vld.checkAdmin() && req.params.id) {
    //     cnn.query('DELETE from Person where id = ?', [req.params.id], function (err, result) {
    //         if (!err && vld.check(result.affectedRows, Tags.notFound)) {
    //             res.status(200).end();
    //         }
    //         cnn.release();
    //     });
    // } else {
    //     cnn.release();
    // }
});

module.exports = router;