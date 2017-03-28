// jshint esversion: 6, node: true
"use strict";

require('../log');

const crypto        = require("crypto");
const getConnection = require('../db');

const eventHandlers = {
    'add': [],
    'del': [],
    'edt': []
};

const SELECT = 'SELECT workers.id, workers.name, workers.ip, workers.type, workers.status, workers.info FROM workers  ';

let workers = {
    lst  : async() => {
        try {
            let connection = await getConnection();
            let [rows]     = await connection.execute(SELECT);
            return rows;
        } catch (e) {
            error(e);
        }
    },
    get  : async(id) => {
        try {
            let connection = await getConnection();
            let [rows]     = await connection.execute(SELECT + 'WHERE workers.id = ?', [id]);
            return rows.length === 0 ? {} : rows[0];
        } catch (e) {
            error(e);
        }
    },
    query: async(query, forUpdate) => {
        try {
            let connection = await getConnection();
            let keys       = Object.keys(query);
            if (keys.length === 0) {
                return {};
            }
            let [rows]     = await connection.execute(SELECT + 'WHERE ' + keys.map((v) => 'workers.' + v + '= ?').join(',') + (forUpdate ? ' FOR UPDATE' : ''), keys.map((v) => query[v]));
            return rows;
        } catch (e) {
            error(e);
        }
    },
    add  : async(record) => {
        try {
            // Check values
            if (typeof record.id !== 'undefined')           throw new Error('"id" field is not allowed in new records');
            if (typeof record.type === 'undefined')         throw new Error('"type" field is mandatory');
            else if (typeof record.type !== 'string')       throw new Error('"type" must be a string');
            if (typeof record.status !== 'undefined'
                && typeof record.status !== 'number')       throw new Error('"status" must be a number');
            if (typeof record.info !== 'undefined'
                && typeof record.info !== 'object')         throw new Error('"info" must be a object');

            record.name = record.type + '-' + crypto.randomBytes(4).toString("hex");

            // Database operation
            let connection = await getConnection();
            let [result]   = await connection.execute(
                'INSERT INTO workers (name, ip, type, status, info) VALUES ( ?, ?, ?, IFNULL(?,DEFAULT(status)), ? )',
                [record.name, record.ip, record.type, record.status || null, JSON.stringify(record.info) || null]);
            let [wk] = await connection.execute(SELECT + 'WHERE workers.id = ? ', [result.insertId]);
            workers.fire('add', wk[0]);
            return result.insertId;
        } catch (e) {
            throw e;
        }
    },
    edt  : async(id, record) => {
        try {

            // Check values
            let fields = [];
            let values = [];
            if (typeof record.name !== 'undefined') {
                if (typeof record.name !== 'string')    throw new Error('"name" must be a number');
                fields.push('name = ?');
                values.push(record.name);
            }
            if (typeof record.type !== 'undefined') {
                if (typeof record.type !== 'string')    throw new Error('"type" must be a string');
                fields.push('type = ?');
                values.push(record.type);
            }

            if (typeof record.status !== 'undefined') {
                if (typeof record.status !== 'number')  throw new Error('"status" must be a number');
                fields.push('status = ?');
                values.push(record.status);
            }

            if (typeof record.info !== 'undefined') {
                if (typeof record.info !== 'string')    throw new Error('"info" must be a string');
                fields.push('info = ?');
                values.push(record.info);
            }
            values.push(id);

            // Database operation
            let connection = await getConnection();
            let [result]   = await connection.execute(
                'UPDATE workers SET ' + fields.join(',') + ' WHERE id = ? ', values);
            let [wk] = await connection.execute(SELECT + 'WHERE workers.id = ? ', [id]);
            workers.fire('edt', wk[0]);
            return result.affectedRows;
        } catch (e) {
            throw e;
        }
    },
    del  : async(id) => {
        // Database operation
        let connection = await getConnection();
        let [result]   = await connection.execute(
            'DELETE FROM workers WHERE id = ? AND status != 2', [id]);
        if (result.affectedRows) {
            workers.fire('del', {id: parseInt(id, 10)});
        }
        return result.affectedRows;
    },
    on      : (msg, cb)     => { eventHandlers[msg] && eventHandlers[msg].push(cb); },
    fire    : (msg, ...arg) => { eventHandlers[msg] && eventHandlers[msg].forEach(cb => cb(...arg)) },
    off     : (msg, cb)     => { eventHandlers[msg] && delete eventHandlers[msg][eventHandlers[msg].indexOf(cb)] }
};


module.exports = workers;