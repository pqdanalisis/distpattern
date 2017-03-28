// jshint esversion: 6, node: true
"use strict";

require('../log');
const config = require('../config.json');
const DESA = process.env.DESA || config.desa;

const path = require('path');

if (DESA) {
    const fs = require('fs');
    config.ssh.privateKey = require('fs').readFileSync(path.join(__dirname, config.ssh.privateKeyFile));
    require('inject-tunnel-ssh')([config.ssh]).on('error', error);
}

let mysql = require('mysql2/promise');
let connection;
function getConnection() {
    if (connection) {
        return Promise.resolve(connection);
    }
    return new Promise((resolve, reject) => {
        mysql.createConnection(config.db)
            .then((newConnection) => {
                log('Database open');
                connection = newConnection;
                resolve(connection);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

module.exports = getConnection;