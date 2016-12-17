var mysql = require('mysql');
var Validator = require('./Validator.js');

// Constructor for DB connection pool
var CnnPool = function () {
    var poolCfg = require('./connection.json');
    var env = process.env;

    /* Use openshift environment variables if available, else connection.json default.
     poolCfg.host = env.OPENSHIFT_MYSQL_DB_HOST || poolCfg.host;
     poolCfg.user = env.OPENSHIFT_MYSQL_DB_USERNAME || poolCfg.user;
     poolCfg.password = env.OPENSHIFT_MYSQL_DB_PASSWORD || poolCfg.password;
     poolCfg.port = env.OPENSHIFT_MYSQL_DB_PORT || poolCfg.port;
     poolCfg.database = env.OPENSHIFT_GEAR_NAME || poolCfg.database;
     */

    poolCfg.connectionLimit = CnnPool.PoolSize;
    this.pool = mysql.createPool(poolCfg);
};

CnnPool.PoolSize = 1;

// Conventional getConnection, drawing from the pool
CnnPool.prototype.getConnection = function (cb) {
    this.pool.getConnection(cb);
};

// Router function for use in auto-creating CnnPool for a request
CnnPool.router = function (req, res, next) {
    console.log("Getting connection");
    CnnPool.singleton.getConnection(function (err, cnn) {
        if (err) {
            console.log('Error: ', err);
            res.status(500).json('Failed to get connection');
        } else {
            console.log("Connection acquired");
            cnn.chkQry = function (vld, qry, values, cb) {
                // Run real qry, checking for error
                this.query(qry, values, function (err, qRes, fields) { //CHANGED res to qRes
                    if (err)
                        res.status(500).json('Failed query ' + qry);
                    cb(err, qRes, fields);
                });
            };
            req.cnn = cnn;
            next();
        }
    });
};

// The one (and probably only) CnnPool object needed for the app
CnnPool.singleton = new CnnPool();

module.exports = CnnPool;
