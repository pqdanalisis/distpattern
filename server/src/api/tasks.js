// jshint esversion: 6, node: true
"use strict";

require('../log');

const getConnection = require('../db');
const eventHandlers = {
    'add': [],
    'del': [],
    'edt': []
};

let tasks = {
    add  : async(record) => {
        try {

            // Check values
            if (typeof record.id !== 'undefined')           throw new Error('"id" field is not allowed in new records');
            if (typeof record.worker !== 'undefined')       throw new Error('"worker" field is not allowed in new records');
            if (typeof record.name === 'undefined')         throw new Error('"name" field is mandatory');
            else if (typeof record.name !== 'string')       throw new Error('"name" must be a string');
            if (typeof record.jobid === 'undefined')        throw new Error('"jobid" field is mandatory');
            else if (typeof record.jobid !== 'number')      throw new Error('"jobid" must be a number');
            if (typeof record.job === 'undefined')          throw new Error('"job" field is mandatory');
            else if (typeof record.job !== 'string')        throw new Error('"job" must be a number');
            if (typeof record.inputfile === 'undefined')    throw new Error('"inputfile" field is mandatory');
            else if (typeof record.inputfile !== 'string')  throw new Error('"inputfile" must be a string');
            if (typeof record.resultfile === 'undefined')   throw new Error('"resultfile" field is mandatory');
            else if (typeof record.resultfile !== 'string') throw new Error('"resultfile" must be a string');
            if (typeof record.algorithm === 'undefined')    throw new Error('"algorithm" field is mandatory');
            else if (typeof record.algorithm !== 'string')  throw new Error('"algorithm" must be a string');

            // Database operation
            let connection = await getConnection();
            let [result]   = await connection.execute(
                'INSERT INTO tasks (name,       jobid,        job,        inputfile,        resultfile,        algorithm,        status,                progress) VALUES (?, ?,?,?,?,?,IFNULL(?,DEFAULT(status)),IFNULL(?,DEFAULT(progress)))',
                [                  record.name, record.jobid, record.job, record.inputfile, record.resultfile, record.algorithm, record.status || null, record.progress || null]);
            tasks.fire('add', await tasks.get(result.insertId));
            return result.insertId;
        } catch (e) {
            throw e;
        }
    },
    lst  : async() => {
        try {
            let connection = await getConnection();
            // let [rows]     = await connection.execute('SELECT id, name, status, job, worker FROM tasks');
            let [rows]     = await connection.execute(
                `SELECT t.id, t.jobid, t.job, t.name, algorithms.name as algorithm, t.inputfile, t.status, t.worker, t.progress 
                FROM (
                    SELECT  tasks.id, jobs.id AS jobid, jobs.name AS job, tasks.name, jobs.algorithm as algorithm, inputfile, 
                            taskstatus.name AS status, workers.name AS worker, tasks.progress
                    FROM tasks
                    JOIN taskstatus ON (tasks.status = taskstatus.id)
                    JOIN jobs ON (tasks.jobid = jobs.id)
                    LEFT JOIN workers ON (tasks.worker = workers.id)
                ) as t
                JOIN algorithms ON (t.algorithm  = algorithms.id)`);
            return rows;
        } catch (e) {
            error(e);
        }
    },
    get  : async(id) => {
        try {
            let connection = await getConnection();
            let [rows]     = await connection.execute(
                `SELECT t.id, t.jobid, t.job, t.name, algorithms.name as algorithm, t.inputfile,  t.resultfile, t.status, t.worker, t.progress 
                FROM (
                    SELECT  tasks.id, jobs.id AS jobid, jobs.name AS job, tasks.name, jobs.algorithm as algorithm, inputfile, resultfile, 
                            taskstatus.name AS status, workers.name AS worker, tasks.progress
                    FROM tasks
                    JOIN taskstatus ON (tasks.status = taskstatus.id)
                    JOIN jobs ON (tasks.jobid = jobs.id)
                    LEFT JOIN workers ON (tasks.worker = workers.id)
                    WHERE tasks.id = ?
                ) as t
                JOIN algorithms ON (t.algorithm  = algorithms.id)`,
                [id]);
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
            let [rows]     = await connection.execute('SELECT * FROM tasks WHERE ' + keys.map((v) => v + '= ?').join(','), keys.map((v) => query[v]));
            return rows;
        } catch (e) {
            error(e);
        }
    },
    edt  : async(id, status, record) => {
        try {

            // Check values
            let fields = [];
            let values = [];
            if (typeof record.name !== 'undefined') {
                if (typeof record.name !== 'string')       throw new Error('"name" must be a string');
                fields.push('name = ?');
                values.push(record.name);
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
            if (typeof record.worker !== 'undefined') {
                if (record.worker !== null &&
                    typeof record.worker !== 'number')     throw new Error('"worker" must be a number');
                fields.push('worker = ?');
                values.push(record.worker);
            }
            if (fields.length === 0) {
                return 0;
            }
            values.push(id);
            values.push(status);

            // Database operation
            let connection = await getConnection();
            let [result]   = await connection.execute(
                'UPDATE tasks SET ' + fields.join(',') + ' WHERE id = ? AND status = ?', values);
            tasks.fire('edt', await tasks.get(id));
            return result.affectedRows;
        } catch (e) {
            throw e;
        }
    },
    del  : async(id) => {
        // Database operation
        let connection = await getConnection();
        let [result]   = await connection.execute(
            'DELETE FROM tasks WHERE id = ?', [id]);
        tasks.fire('del', id);
        return result.affectedRows;
    },
    on      : (msg, cb)     => { eventHandlers[msg] && eventHandlers[msg].push(cb); },
    fire    : (msg, ...arg) => { eventHandlers[msg] && eventHandlers[msg].forEach(cb => cb(...arg)) },
    off     : (msg, cb)     => { eventHandlers[msg] && delete eventHandlers[msg][eventHandlers[msg].indexOf(cb)] }
};

module.exports = tasks;