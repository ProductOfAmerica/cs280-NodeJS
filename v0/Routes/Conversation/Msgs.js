/*
 * ---MESSAGE---
 * id       - Id of the message
 * cnvId    - The id of the conversation the message belongs to
 * prsId    - The id of the owner of the message
 * whenMade - Int ms since epoch. when the message was created
 * content  - Full content of the message
 */
var Express = require('express');
var Tags = require('../Validator.js').Tags;
var router = Express.Router({caseSensitive: true});
var async = require('async');

router.baseURL = '/Msgs';


/**
 * Return the following for the indicated message:
 *      content  - Full content of the message
 *      numLikes - number of Likes
 *      replies  - number of replies
 */
router.get('/:msgId', function (req, res) {

});


/**
 * GET datetime ={dateTime} num={num}
 *
 * Return all Replies for the indicated Message, in reverse chronological order.
 * Limit this to num Replies ending before datetime. If datetime is omitted, use current time. If num is
 * omitted return all posts prior to the indicated date. Datetime is integer number of mS since epoch. Return
 * for each Reply, in increasing datetime order:
 */
router.get('/:msgId/Replies', function (req, res) {

});


/**
 * Return list of all first/last names of Persons who liked the Message, as array of objects of form:
 *      firstName - First name of Person
 *      lastName  - Last name of Person
 */
router.get('/:msgId/Likes', function (req, res) {

});


/**
 * As for Cnvs/{cnvId}/Msgs POST, but adds a reply to the indicated message.
 */
router.post('/:msgId/Replies', function (req, res) {

});


/**
 * Post a new Like. Req body is empty since AU is the person doing the like.
 * Repeated likes by same Person are simply ignored without error.
 */
router.post('/:msgId/Likes', function (req, res) {

});

module.exports = router;