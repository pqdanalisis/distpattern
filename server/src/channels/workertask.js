const DISCONNECT  = 1;
const READY       = 2;
const BUSY        = 3;
const tasks       = require('../api/tasks');
const workers     = require('../api/workers');
const workertask  = require('../api/workertask');
const channelName = 'workertask';
const workersConn = [];

tasks.on('add', async (task) => {
    let workersAvailables = await workers.query({status: READY});
    if (workersAvailables.length) {
        let task = await workertask.run(workersAvailables[0].id);
        if (task !== null) {
            workersConn[workersAvailables[0].id].send(JSON.stringify({
                channel: channelName,
                type   : 'task',
                data   : task
            }));
        }
    }
});

const manager = {
    welcome : async (ws, msg) => {
        let worker      = [];
        msg.data.status = BUSY;
        msg.data.ip     = ws.upgradeReq.headers['x-forwarded-for'] || ws.upgradeReq.connection.remoteAddress;
        if (msg.data && msg.data.name) {
            worker = await workers.query({name: msg.data.name});
        }
        if (worker.length === 0) {
            worker = await workers.query({
                id: await workers.add(msg.data)
            });
        } else {
            await workers.edt(worker[0].id, {status: msg.data.status, ip: msg.data.ip})
        }
        worker                 = worker[0];
        workersConn[worker.id] = ws;
        ws.on('close', async (event) => {
            await workers.edt(worker.id, {status: DISCONNECT});
            await workertask.cancel(worker.id);
        });
        ws.send(JSON.stringify({
            ok     : true,
            replyTo: msg.id,
            channel: channelName,
            type   : "welcome",
            data   : {
                id  : worker.id,
                name: worker.name
            }
        }));
    },
    ready   : async (ws, msg) => {
        await workers.edt(msg.data.id, {status: READY});
        ws.send(JSON.stringify({
            ok     : true,
            replyTo: msg.id,
            channel: channelName
        }));
        let task = await workertask.run(msg.data.id);
        if (task !== null) {
            ws.send(JSON.stringify({
                channel: channelName,
                type   : 'task',
                data   : task
            }));
        }
    },
    finish  : async (ws, msg) => {
        await workertask.finish(msg.data.id);
        ws.send(JSON.stringify({
            ok     : true,
            replyTo: msg.id,
            channel: channelName,
            type   : "return"
        }));
    },
    error   : async (ws, msg) => {
        await workertask.error(msg.data.id);
        ws.send(JSON.stringify({
            ok     : true,
            replyTo: msg.id,
            channel: channelName,
            type   : "return"
        }));
    },
    error405: function (ws, msg) {
        ws.send(JSON.stringify({
            ok     : false,
            replyTo: msg.id,
            channel: channelName,
            type   : "error",
            error  : 405,
            data   : {
                message: JSON.stringify(msg)
            }
        }))
    }
};

module.exports = function (ws, message) {
    if (typeof manager[message.type] === 'function') {
        return manager[message.type](ws, message);
    }
    manager.error405(ws, message);
};