// jshint esversion: 6, node: true
"use strict";

require('../log');

const config        = require('../config.json');
const crypto        = require("crypto");
const getConnection = require('../db');
const algorithms    = require('./algorithms');
const datafiles     = require('./datafiles');
const datasets      = require('./datasets');
const tasks         = require('./tasks');
const path          = require('path');

const jobs = {
    lst  : async() => {
        try {
            let connection = await getConnection();
            let [rows]     = await connection.execute('SELECT id, name, description, status FROM jobs');
            return rows;
        } catch (e) {
            error(e);
        }
    },
    get  : async(id) => {
        try {
            let connection = await getConnection();
            let [rows]     = await connection.execute('SELECT * FROM jobs WHERE id = ?', [id]);
            return rows.length === 0 ? {} : rows[0];
        } catch (e) {
            error(e);
        }
    },
    add  : async(record) => {
        try {

            // Check values
            if (typeof record.id !== 'undefined')           throw new Error('"id" field is not allowed in new records');
            if (typeof record.inputset === 'undefined')     throw new Error('"inputset" field is mandatory');
            else if (typeof record.inputset !== 'number')   throw new Error('"inputset" must be a number');
            if (typeof record.resultset === 'undefined')    throw new Error('"resultset" field is mandatory');
            else if (typeof record.resultset !== 'number')  throw new Error('"resultset" must be a number');
            if (typeof record.algorithm === 'undefined')    throw new Error('"algorithm" field is mandatory');
            else if (typeof record.algorithm !== 'number')  throw new Error('"algorithm" must be a number');
            if (typeof record.name === 'undefined')         throw new Error('"name" field is mandatory');
            else if (typeof record.name !== 'string')       throw new Error('"name" must be a string');
            if (typeof record.description !== 'undefined'
                && typeof record.description !== 'string')  throw new Error('"description" must be a string');
            if (typeof record.status !== 'undefined'
                && typeof record.status !== 'number')       throw new Error('"status" must be a string');
            // Database operation
            let connection = await getConnection();
            let [result]   = await connection.execute(
                'INSERT INTO jobs (name, description, inputset, resultset, algorithm) VALUES (?,?,?,?,?)',
                [record.name, record.description || null, record.inputset, record.resultset, record.algorithm]);
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
                if (typeof record.name !== 'string')        throw new Error('"name" must be a string');
                fields.push('name = ?');
                values.push(record.name);
            }
            if (typeof record.description !== 'undefined'  && record.description !== null) {
                if (typeof record.description !== 'string') throw new Error('"description" must be a string');
                fields.push('description = ?');
                values.push(record.description);
            }
            if (typeof record.inputset !== 'undefined') {
                if (typeof record.inputset !== 'number')   throw new Error('"inputset" must be a number');
                fields.push('inputset = ?');
                values.push(record.inputset);
            }
            if (typeof record.resultset !== 'undefined') {
                if (typeof record.resultset !== 'number')  throw new Error('"resultset" must be a number');
                fields.push('resultset = ?');
                values.push(record.resultset);
            }
            if (typeof record.algorithm !== 'undefined') {
                if (typeof record.algorithm !== 'number')  throw new Error('"algorithm" must be a number');
                fields.push('algorithm = ?');
                values.push(record.algorithm);
            }
            if (typeof record.status !== 'undefined') {
                if (typeof record.status !== 'number')     throw new Error('"status" must be a number');
                fields.push('status = ?');
                values.push(record.status);
            }
            if (typeof record.progress !== 'undefined') {
                if (typeof record.progress !== 'number')   throw new Error('"progress" must be a number');
                fields.push('progress = ?');
                values.push(record.progress);
            }
            if (fields.length === 0) {
                return 0;
            }
            values.push(id);

            // Database operation
            let connection = await getConnection();
            let [result]   = await connection.execute(
                'UPDATE jobs SET ' + fields.join(',') + ' WHERE id = ? ', values);
            return result.affectedRows;
        } catch (e) {
            throw e;
        }
    },
    start: async(id) => {
        // Check status
        let runJob = await jobs.get(id);
        if (runJob.status === 2) {
            return false;
        }
        // Get datafiles
        let inputFolder  = (await datasets.get(runJob.inputset)).folder;
        let inputFiles   = await datafiles.lst(inputFolder);
        let resultSet    = await datasets.get(runJob.resultset);
        let resultFolder = resultSet.folder;
        // Get algorithm
        let algorithm    = (await algorithms.get(runJob.algorithm)).source
        // Cancel previous tasks
        await jobs.stop(id);
        let pending = [];
        for (let ts of await tasks.query({jobid: id})) {
            pending.push(tasks.del(ts.id));
        }
        await Promise.all(pending);
        // Add tasks
        for (let f of inputFiles) {
            let file = path.basename(f);
            await tasks.add({
                name      : 'task-' + crypto.randomBytes(4).toString("hex"),
                jobid     : runJob.id,
                job       : runJob.name,
                inputfile : config.urlFiles + inputFolder +'/' + f,
                resultfile: resultFolder + '/' + f,
                algorithm : algorithm
            });
        }
        // Change status
        jobs.edt(runJob.id, {status: 2});
        return {job: await jobs.get(runJob.id), tasks: await tasks.query({job: runJob.id})};
    },
    stop : async(id) => {
        // Cambiar estado de las tareas
        for (let ts of await tasks.query({jobid: id})) {
            await Promise.all([
                tasks.edt(ts.id, 1, {status: 5}),
                tasks.edt(ts.id, 2, {status: 5})
            ]);
        }
        // Cambiar el estado del job
        let j = await jobs.get(id);
        if (j.status === 1 || j.status === 2) {
            await jobs.edt(id, {status: 5});
        }
        return {job: await jobs.get(id), tasks: await tasks.query({job: id})};
    },
    del  : async(id) => {
        // TODO: Completar borrado de JOB
        // El estado del job no puede ser en ejecución

        // Borrar las tareas

        // // Database operation
        let connection = await getConnection();
        let [result]   = await connection.execute(
            'DELETE FROM jobs WHERE id = ?', [id]);
        return result.affectedRows;
    }
};

module.exports = jobs;