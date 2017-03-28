// jshint esversion: 6, node: true
"use strict";

require('../log');

const getConnection = require('../db');

module.exports = {
    lst: async() => {
        try {
            let connection = await getConnection();
            let [rows]     = await connection.execute('SELECT id, name, description FROM algorithms');
            return rows;
        } catch (e) {
            error(e);
        }
    },
    get: async(id) => {
        try {
            let connection = await getConnection();
            let [rows]     = await connection.execute('SELECT * FROM algorithms WHERE id = ?', [id]);
            return rows.length === 0 ? {} : rows[0];
        } catch (e) {
            error(e);
        }
    },
    add: async(record) => {
        try {

            // Check values
            if (typeof record.id !== 'undefined')             throw new Error('"id" field is not allowed in new records');
            if (typeof record.name === 'undefined')           throw new Error('"name" field is mandatory');
            else if (typeof record.name !== 'string')         throw new Error('"name" must be a string');
            if (typeof record.description !== 'undefined'
                && typeof record.description !== 'string')    throw new Error('"description" must be a string');
            if (typeof record.inputformat === 'undefined')    throw new Error('"inputformat" field is mandatory');
            else if (typeof record.inputformat !== 'string')  throw new Error('"inputformat" must be a string');
            if (typeof record.outputformat === 'undefined')   throw new Error('"outputformat" field is mandatory');
            else if (typeof record.outputformat !== 'string') throw new Error('"outputformat" must be a string');
            if (typeof record.source === 'undefined')         throw new Error('"source" field is mandatory');
            else if (typeof record.source !== 'string')       throw new Error('"source" must be a string');

            // Database operation
            let connection = await getConnection();
            let [result]   = await connection.execute(
                'INSERT INTO algorithms (name, description, inputformat, outputformat, source) VALUES (?,?,?,?,?)',
                [record.name, record.description || null, record.inputformat, record.outputformat, record.source]);
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
            if (typeof record.name !== 'undefined') {
                if (typeof record.name !== 'string')         throw new Error('"name" must be a string');
                fields.push('name = ?');
                values.push(record.name);
            }
            if (typeof record.description !== 'undefined' && record.description !== null) {
                if (typeof record.description !== 'string')  throw new Error('"description" must be a string');
                fields.push('description = ?');
                values.push(record.description);
            }

            if (typeof record.inputformat !== 'undefined') {
                if (typeof record.inputformat !== 'string')  throw new Error('"inputformat" must be a string');
                fields.push('inputformat = ?');
                values.push(record.inputformat);
            }
            if (typeof record.outputformat !== 'undefined') {
                if (typeof record.outputformat !== 'string')  throw new Error('"outputformat" must be a string');
                fields.push('outputformat = ?');
                values.push(record.outputformat);
            }
            if (typeof record.source !== 'undefined') {
                if (typeof record.source !== 'string')       throw new Error('"source" must be a string');
                fields.push('source = ?');
                values.push(record.source);
            }
            if (fields.length === 0) {
                return 0;
            }
            values.push(id);

            // Database operation
            let connection = await getConnection();
            let [result]   = await connection.execute(
                'UPDATE algorithms SET ' + fields.join(',') + ' WHERE id = ?', values);
            return result.affectedRows;
        } catch (e) {
            throw e;
        }
    },
    del: async(id) => {
        // Database operation
        let connection = await getConnection();
        let [result]   = await connection.execute(
            'DELETE FROM algorithms WHERE id = ?', [id]);
        return result.affectedRows;
    }
};