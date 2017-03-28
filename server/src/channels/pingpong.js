const channelName = 'pingpong';
const manager     = {
    ping    : function (ws, msg) {
        ws.send(JSON.stringify({
            ok     : true,
            replyTo: msg.id,
            channel: channelName,
            type   : "pong",
            data   : msg.data
        }))
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