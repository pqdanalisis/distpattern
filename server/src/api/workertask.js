// jshint esversion: 6, node: true
"use strict";

require('../log');

const crypto        = require("crypto");
const getConnection = require('../db');
const tasks         = require('./tasks');
const workers       = require('./workers');
const jobs          = require('./jobs');

const PENDING = 1;
const RUN     = 2;
const FINISH  = 3;
const KO      = 4;
const STOPPED = 5;


// Sanitize
(async() => {
    try {
        let connection = await getConnection();
        await connection.execute('UPDATE workers SET status = 1 WHERE status = 2 OR status = 3');
        await connection.execute('UPDATE tasks SET status = ' + PENDING + ', worker = NULL WHERE status = ' + RUN);
    } catch (e) {
        throw e;
    }
})();


let workertask = {
    run   : async(workerId) => {
        try {
            let connection = await getConnection();
            await workers.edt(workerId, {status: 3});
            let [rows]     = await connection.execute('SELECT * FROM tasks WHERE status = ' + PENDING + ' LIMIT 1 FOR UPDATE');
            if (rows.length) {
                await tasks.edt(rows[0].id, 1, {worker: workerId, status: RUN});
                rows[0].status = RUN;
                rows[0].worker = workerId;
                return rows[0];
            } else {
                await workers.edt(workerId, {status: 2});
            }
            return null;
        } catch (e) {
            error(e);
            return null;
        }
    },
    cancel: async(workerId) => {
        try {
            let connection = await getConnection();
            let task       = await tasks.query({worker: workerId});
            for (let t of task) {
                await tasks.edt(t.id, RUN, {status: PENDING, worker: null});
            }
            return true;
        } catch (e) {
            error(e);
            return false;
        }
    },
    finish: async(taksId) => {
        try {
            await tasks.edt(taksId, RUN, {status: FINISH});
            let jobTasks       = await tasks.query({jobid: (await tasks.get(taksId)).jobid});
            let jobTasksFinish = 0;
            for (let t of jobTasks) {
                if (t.status === FINISH && ++jobTasksFinish === jobTasks.length) {
                    await jobs.edt(t.jobid, {status: FINISH});
                    break;
                } else if (t.status === KO) {
                    await jobs.edt(t.jobid, {status: KO});
                    break;
                }
            }
        } catch (e) {
            error(e);
            return false;
        }
        return true;
    }
    ,
    error : async(taksId) => {
        try {
            await tasks.edt(taksId, RUN, {status: KO});
            return true;
        } catch (e) {
            error(e);
            return false;
        }
    }
};


module.exports = workertask;