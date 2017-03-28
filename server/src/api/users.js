// jshint esversion: 6, node: true
"use strict";

require('../log');

const getConnection = require('../db');

module.exports = {
    chk: async(usr, pwd) => {
        let connection = await getConnection();
        let [rows]     = await connection.execute('SELECT id, login, name, admin FROM users WHERE login = ? AND password = ?', [usr.toLowerCase(), encrypt(pwd)]);
        return rows.length === 0 ? undefined : rows[0];
    },
    lst: async() => {
        try {
            let connection = await getConnection();
            let [rows]     = await connection.execute('SELECT id, login, name, admin FROM users');
            return rows;
        } catch (e) {
            error(e);
        }
    },
    get: async(id) => {
        try {
            let connection = await getConnection();
            let [rows]     = await connection.execute('SELECT id, login, name, admin FROM users WHERE id = ?', [id]);
            return rows.length === 0 ? {} : rows[0];
        } catch (e) {
            error(e);
        }
    },
    add: async(record) => {
        try {

            // Check values
            if (typeof record.id !== 'undefined')             throw new Error('"id" field is not allowed in new records');
            if (typeof record.login === 'undefined')          throw new Error('"login" field is mandatory');
            else if (typeof record.login !== 'string')        throw new Error('"login" must be a string');
            if (typeof record.name === 'undefined')           throw new Error('"name" field is mandatory');
            else if (typeof record.name !== 'string')         throw new Error('"name" must be a string');
            if (typeof record.password === 'undefined')       throw new Error('"password" field is mandatory');
            else if (typeof record.password !== 'string')     throw new Error('"password" must be a string');

            // Database operation
            let connection = await getConnection();
            let [result]   = await connection.execute(
                'INSERT INTO users (login, name, password, admin) VALUES (?,?,?,?)',
                [record.login.toLowerCase(), record.name, encrypt(record.password), record.admin ? 1 : 0]);
            return result.insertId;
        } catch (e) {
            throw e;
        }
    },
    edt: async(id, record) => {
        try {

            // Check values
            let fields = [];
            let values = [];
            if (typeof record.login !== 'undefined') {
                if (typeof record.login !== 'string')         throw new Error('"name" must be a string');
                fields.push('login = ?');
                values.push(record.login.toLowerCase());
            }
            if (typeof record.name !== 'undefined' && record.name !== null) {
                if (typeof record.name !== 'string')          throw new Error('"name" must be a string');
                fields.push('name = ?');
                values.push(record.name);
            }

            if (typeof record.password !== 'undefined') {
                if (typeof record.password !== 'string')      throw new Error('"password" must be a string');
                fields.push('password = ?');
                values.push(encrypt(record.password));
            }
            if (typeof record.admin !== 'undefined') {
                fields.push('admin = ?');
                values.push(record.admin ? 1 : 0);
            }
            if (fields.length === 0) {
                return 0;
            }
            values.push(id);

            // Database operation
            let connection = await getConnection();
            let [result]   = await connection.execute(
                'UPDATE users SET ' + fields.join(',') + ' WHERE id = ?', values);
            return result.affectedRows;
        } catch (e) {
            throw e;
        }
    },
    del: async(id) => {
        // Database operation
        let connection = await getConnection();
        let [result]   = await connection.execute(
            'DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows;
    }
};

let crypto = require('crypto');
function encrypt(text){
    var cipher = crypto.createCipher('aes-256-cbc','d6F3Efeq');
    var crypted = cipher.update(text,'utf8','hex');
    crypted += cipher.final('hex');
    return crypted;
}