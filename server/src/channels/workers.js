const activeWorkers = {};
const workers       = require('../api/workers');
const channelName   = 'workers';
const manager       = {
    get     : async (ws, msg) => {
        try {
            let data;
            if (typeof msg.data === 'undefined') {
                data = await workers.lst();
            } else if (typeof msg.data === 'object') {
                if (msg.data.id) {
                    data = await workers.get(msg.data.id);
                } else {
                    data = await workers.query(msg.data);
                }
            }
            ws.send(JSON.stringify({
                ok     : true,
                replyTo: msg.id,
                channel: channelName,
                type   : "result",
                data
            }));
        } catch (err) {
            ws.send(JSON.stringify({
                ok     : false,
                replyTo: msg.id,
                channel: channelName,
                type   : "confirm",
                data   : {
                    error: err.message
                }
            }))
        }
    },
    delete  : async (ws, msg) => {
        try {
            let data = await workers.del(msg.data.id);
            ws.send(JSON.stringify({
                ok     : true,
                replyTo: msg.id,
                channel: channelName,
                type   : "result",
                data
            }));
        } catch (err) {
            ws.send(JSON.stringify({
                ok     : false,
                replyTo: msg.id,
                channel: channelName,
                type   : "confirm",
                data   : {
                    error: err.message
                }
            }))
        }
    },
    sub: async (ws, msg) => {
        let add = (data) => {
            let msg = JSON.stringify({
                channel: channelName,
                type   : "add",
                data   : data
            });
            ws.send(msg);
            warning(`message to ${ws.upgradeReq.headers['x-forwarded-for'] || ws.upgradeReq.connection.remoteAddress} (${ws.id})`, msg);
        };
        let edt = (data) => {
            let msg = JSON.stringify({
                channel: channelName,
                type   : "edt",
                data   : data
            });
            ws.send(msg);
            warning(`message to ${ws.upgradeReq.headers['x-forwarded-for'] || ws.upgradeReq.connection.remoteAddress} (${ws.id})`, msg);
        };
        let del = (id) => {
            let msg = JSON.stringify({
                channel: channelName,
                type   : "del",
                data   : id
            });
            ws.send(msg);
            warning(`message to ${ws.upgradeReq.headers['x-forwarded-for'] || ws.upgradeReq.connection.remoteAddress} (${ws.id})`, msg);
        };
        workers.on('add', add);
        workers.on('edt', edt);
        workers.on('del', del);
        ws.on('close', () => {
            workers.off('add', add);
            workers.off('edt', edt);
            workers.off('del', del);
        });
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