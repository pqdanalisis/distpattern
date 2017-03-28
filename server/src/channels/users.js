const users       = require('../api/users');
const channelName = 'users';
const manager     = {
    login   : async (ws, msg) => {
        try {
            let result = await users.chk(msg.data.usr, msg.data.pwd);
            if (result) {
                return ws.send(JSON.stringify({
                    ok     : true,
                    replyTo: msg.id,
                    channel: channelName,
                    type   : "confirm",
                    data   : result
                }))
            }
            ws.send(JSON.stringify({
                ok     : false,
                replyTo: msg.id,
                channel: channelName,
                type   : "confirm",
                data   : {
                    error: 'user or password wrong'
                }
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
    post    : async (ws, msg) => {
        try {
            // api
            let result = await users.add(msg.data);
            // confirmar
            ws.send(JSON.stringify({
                ok     : true,
                replyTo: msg.id,
                channel: channelName,
                type   : "confirm",
                data   : {
                    id: result
                }
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
                data = await users.get(msg.data.id);
            } else {
                data = await users.lst();
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
    put     : async (ws, msg) => {
        try {
            let data = await users.edt(msg.data.id, msg.data.record);
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
            let data = await users.del(msg.data.id);
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