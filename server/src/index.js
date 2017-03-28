// jshint esversion: 6, node: true
"use strict";

// Enviroment
process.env.DESA = require('./config.json').desa ? 'true' : '';

// Log
require('./log');

// Start message
log('starting');

// Uncaught exception
process.on('uncaughtException', function (err) {
    error('Caught exception:', err, err.stack);
    process.exit(1);
});

// Global constants
const port            = process.env.PORT || 8082;
const WebSocketServer = require('ws').Server;
const crypto          = require("crypto");
const version         = require('../package.json').version;

// Routes
const channels = {
    pingpong  : require('./channels/pingpong'),
    algorithms: require('./channels/algorithms'),
    datasets  : require('./channels/datasets'),
    datafiles : require('./channels/datafiles'),
    jobs      : require('./channels/jobs'),
    tasks     : require('./channels/tasks'),
    users     : require('./channels/users'),
    workers   : require('./channels/workers'),
    workertask: require('./channels/workertask')
};

// Websocket
const wss = new WebSocketServer({port: port}, () => log('started'));

process.on('SIGTERM', function () {
    wss.close(function () {
        log('closed');
        process.exit(0);
    });
});

// Open connection
wss.on('connection', function connection(ws) {

    // Generate id
    ws.id = crypto.randomBytes(8).toString("hex");
    warning(`open connection from ${ws.upgradeReq.headers['x-forwarded-for'] || ws.upgradeReq.connection.remoteAddress} (${ws.id})`);

    // Welcome message
    ws.send(JSON.stringify({
        "ok"    : true,
        "type"  : "welcome",
        "server": {version}
    }));

    // Close connection
    ws.on('close', function close() {
        warning(`close connection from ${ws.upgradeReq.headers['x-forwarded-for'] || ws.upgradeReq.connection.remoteAddress} (${ws.id})`);
    });

    // Connection error
    ws.on('error', function error(err) {
        error(`close connection from ${ws.upgradeReq.headers['x-forwarded-for'] || ws.upgradeReq.connection.remoteAddress} (${ws.id})`, err);
    });

    // Message management
    ws.on('message', function incoming(message) {

        // Get flat text
        let msgText = decodeURIComponent(message);
        let msgObject;
        try {
            msgObject = JSON.parse(msgText);
        } catch (err) {
            error(`wrong message from ${ws.upgradeReq.headers['x-forwarded-for'] || ws.upgradeReq.connection.remoteAddress} (${ws.id})`, msgText);
            msgObject = {};
        }
        if (msgObject === null || typeof msgObject !== 'object') {
            msgObject = {};
        }
        warning(`message from ${ws.upgradeReq.headers['x-forwarded-for'] || ws.upgradeReq.connection.remoteAddress} (${ws.id})`, msgText);

        if (typeof msgObject.channel === 'string' && channels[msgObject.channel]) {
            channels[msgObject.channel](ws, msgObject)
                .catch((err) => {
                    error(err);
                    error(err.trace);
                });
        } else {
            error('unknown channel', msgObject.channel);
            ws.send(JSON.stringify({
                ok     : false,
                error  : 404,
                type   : "error",
                replyTo: msgObject.id,
                data   : {
                    message: msgText
                }
            }));
        }
    });
});

