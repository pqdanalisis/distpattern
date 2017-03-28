const datasets  = require('../api/datasets');
const datafiles  = require('../api/datafiles');
const channelName = 'datasets';
const manager     = {
    post    : async(ws, msg) => {
        try {
            // api
            let result = await datasets.add(msg.data);
            // confirmar
            ws.send(JSON.stringify({
                ok     : true,
                replyTo: msg.id,
                channel: channelName,
                type   : "confirm",
                data   : result
            }))
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
    get     : async (ws, msg) => {
        try {
            let data;
            if (typeof msg.data === 'object' && msg.data.id) {
                data = (await datasets.query({id: msg.data.id}))[0] || {};
            } else {
                data = await datasets.lst();
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
    put  : async (ws, msg) => {
        try {
            let data = await datasets.edt(msg.data.id, msg.data.record);
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
            let data = await datasets.del(msg.data.id);
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