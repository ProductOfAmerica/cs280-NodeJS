var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');

var bodyParser = require('body-parser');
var Session = require('./Routes/Session.js');
var Validator = require('./Routes/Validator.js');
var CnnPool = require('./Routes/CnnPool.js');

var port = 3002;

var async = require('async');

var app = express();
//app.use(function(req, res, next) {console.log("Hello"); next();});

// Static paths to be served like index.html and all client side js
app.use(express.static(path.join(__dirname, 'public')));

// Parse all request bodies using JSON
app.use(bodyParser.json());

// Attach cookies to req as req.cookies.<cookieName>
app.use(cookieParser());

// Set up Session on req if available
app.use(Session.router);

// Check general login.  If OK, add Validator to |req| and continue processing,
// otherwise respond immediately with 401 and noLogin error tag.
//POST
app.use(function (req, res, next) {
    console.log('------------'); //TODO remove
    console.log('Path:', req.method, req.path); //TODO remove
    console.log('Session:',
        req.session || (req.method === 'POST'
        && (req.path === '/Prss' || req.path === '/Ssns')) ? 'GOOD SESSION' : 'BAD SESSION'); //TODO remove

    if (req.session || (req.method === 'POST' && (req.path === '/Prss' || req.path === '/Ssns'))) {
        req.validator = new Validator(req, res);
        next();
    } else {
        console.log("CONNECTION RELEASED");
        res.status(401).end(); //res.status(401).json([{tag: Validator.Tags.noLogin}]); <-- possible change?
    }
});

// Add DB connection, with smart chkQry method, to |req|
app.use(CnnPool.router);

// Load all subroutes
app.use('/Prss', require('./Routes/Account/Prss'));
app.use('/Ssns', require('./Routes/Account/Ssns'));
app.use('/Cnvs', require('./Routes/Conversation/Cnvs.js'));

// Special debugging route for /DB DELETE.  Clears all table contents, resets all
// auto_increment keys to start at 1, and reinserts one admin user.
app.delete('/DB', function (req, res) { //FIXME change the queries to match the updated schema
    // Callbacks to clear tables
    var cbs = ["Conversation", "Message", "Person"].map(function (tblName) {
        return function (cb) {
            req.cnn.query("delete from " + tblName, cb);
        };
    });

    // Callbacks to reset increment bases
    cbs = cbs.concat(["Conversation", "Message", "Person"].map(function (tblName) {
        return function (cb) {
            req.cnn.query("alter table " + tblName + " auto_increment = 1", cb);
        };
    }));

    // Callback to reinsert admin user
    cbs.push(function (cb) {
        req.cnn.query('INSERT INTO Person (firstName, lastName, email,' +
            ' password, whenRegistered, role) VALUES ' +
            '("Joe", "Admin", "adm@11.com", "password", NOW(), 1);', cb);
    });

    // Callback to clear sessions, release connection and return result
    cbs.push(function (callback) {
        for (var session in Session.sessions)
            delete Session.sessions[session];
        callback();
    });

    async.series(cbs, function (err, status) {
        req.cnn.release();
        console.log("CONNECTION RELEASED");
        if (err)
            res.status(400).json(err);
        else
            res.status(200).end();
    });
});

// Handler of last resort.  Print a stacktrace to console and send a 404 response.
app.use(function (err, req, res, next) {
    console.error('Stack error:', req.stack);
    res.status(404).end();
    req.cnn.release(); //CHANGED res.cnn.release(); to req.cnn.release();
});

app.listen(port, function () {
    console.log('App Listening on port', port);
});