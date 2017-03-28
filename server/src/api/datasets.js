// jshint esversion: 6, node: true
"use strict";

require('../log');

const crypto        = require("crypto");
const getConnection = require('../db');
const datafiles     = require('./datafiles');

module.exports = {
    lst  : async() => {
        try {
            let connection = await getConnection();
            let [rows]     = await connection.execute('SELECT id, name, description FROM datasets');
            return rows;
        } catch (e) {
            error(e);
        }
    },
    get  : async(id) => {
        try {
            let connection = await getConnection();
            let [rows]     = await connection.execute('SELECT * FROM datasets WHERE id = ?', [id]);
            return rows.length === 0 ? {} : rows[0];
        } catch (e) {
            error(e);
        }
    },
    query: async(query) => {
        try {
            let connection = await getConnection();
            let keys       = Object.keys(query);
            if (keys.length === 0) {
                return {};
            }

            let [rows]     = await connection.execute('SELECT * FROM datasets WHERE ' + keys.map((v) => v + '= ?').join(','), keys.map((v) => query[v]));
            for (let r = 0; r < rows.length; r++) {
                rows[r].datafiles = await datafiles.lst(rows[r].folder, true);
            }
            return rows;
        } catch (e) {
            error(e);
        }
    },
    add  : async(record) => {
        try {

            // Check values
            if (typeof record.id !== 'undefined')             throw new Error('"id" field is not allowed in new records');
            if (typeof record.name === 'undefined')           throw new Error('"name" field is mandatory');
            else if (typeof record.name !== 'string')         throw new Error('"name" must be a string');
            if (typeof record.description !== 'undefined'
                && typeof record.description !== 'string')    throw new Error('"description" must be a string');
            if (typeof record.format === 'undefined')         throw new Error('"format" field is mandatory');
            else if (typeof record.format !== 'string')       throw new Error('"format" must be a string');

            record.folder = crypto.randomBytes(8).toString("hex");

            // Database operation
            let connection = await getConnection();
            let [result]   = await connection.execute(
                'INSERT INTO datasets (name, description, format, folder) VALUES (?,?,?,?)',
                [record.name, record.description || null, record.format, record.folder]);
            return {id: result.insertId, folder: record.folder};
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
                if (typeof record.name !== 'string')         throw new Error('"name" must be a string');
                fields.push('name = ?');
                values.push(record.name);
            }
            if (typeof record.description !== 'undefined' && record.description !== null) {
                if (typeof record.description !== 'string')  throw new Error('"description" must be a string');
                fields.push('description = ?');
                values.push(record.description);
            }

            if (typeof record.format !== 'undefined') {
                if (typeof record.format !== 'string')       throw new Error('"format" must be a string');
                fields.push('format = ?');
                values.push(record.format);
            }
            if (fields.length === 0) {
                return 0;
            }
            values.push(id);

            // Database operation
            let connection = await getConnection();
            let [result]   = await connection.execute(
                'UPDATE datasets SET ' + fields.join(',') + ' WHERE id = ?', values);
            return result.affectedRows;
        } catch (e) {
            throw e;
        }
    },
    del  : async(id) => {
        // Database operation
        let connection = await getConnection();
        let [path]     = await connection.execute(
            'SELECT folder FROM datasets WHERE id = ?', [id]);
        datafiles.remove(path[0].folder);
        let [result]   = await connection.execute(
            'DELETE FROM datasets WHERE id = ?', [id]);
        return result.affectedRows;
    }
};