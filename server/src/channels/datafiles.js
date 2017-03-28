const datasets    = require('../api/datasets');
const datafiles   = require('../api/datafiles');
const path        = require('path');
const fs          = require('pify')(require('fs'));
const crypto      = require("crypto");
const channelName = 'datafiles';
const config      = require('../config');

const manager = {
    post    : async(ws, msg) => {
        let fileName    = msg.name;
        let folderName  = msg.folder || (await datasets.get(msg.dataset)).folder;
        let partial     = msg.partial || ('.partial' + crypto.randomBytes(8).toString("hex"));
        let tmpFileName = path.join(__dirname, config.tmpFolder, msg.name + '.' + msg.size + partial);
        if (typeof msg.action === 'undefined') {
            ws.on('close', () => {
                fs.unlink(tmpFileName, () => void(0));
            });
            ws.on('error', (err) => {
                fs.unlink(tmpFileName, () => void(0));
                error(err);
            });
            await fs.writeFile(tmpFileName, '');
            ws.send(JSON.stringify({
                ok     : true,
                replyTo: msg.id,
                channel: channelName,
                type   : "startupload",
                partial
            }));
        } else if (msg.action === 'uploadchunk') {
            // await fs.appendFile(tmpFileName, new Buffer(base64ToArrayBuffer(msg.chunk)));
            await fs.appendFile(tmpFileName, msg.chunk);
            const stats = await fs.stat(tmpFileName);
            if (stats.size === msg.size) {
                await datafiles.add(folderName, fileName, tmpFileName);
                ws.send(JSON.stringify({
                    ok     : true,
                    replyTo: msg.id,
                    channel: channelName,
                    type   : "endupload"
                }));
                return;
            }
            ws.send(JSON.stringify({
                ok     : true,
                replyTo: msg.id,
                channel: channelName,
                type   : "nextupload",
                partial
            }));
        }
    },
    get     : async(ws, msg) => {
        try {
            if (typeof msg.data.folder === 'undefined') {
                return ws.send(JSON.stringify({
                    ok     : true,
                    replyTo: msg.id,
                    channel: channelName,
                    type   : "result",
                    data   : {}
                }));
            }
            ws.send(JSON.stringify({
                ok     : true,
                replyTo: msg.id,
                channel: channelName,
                type   : "result",
                data   : msg.data.file ? datafiles.lst(msg.data.folder) : datafiles.get(msg.data.folder, msg.data.file)
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
    delete  : async(ws, msg) => {
        try {
            if (typeof msg.data.folder === 'undefined' ||
                typeof msg.data.name === 'undefined') {
                return ws.send(JSON.stringify({
                    ok     : true,
                    replyTo: msg.id,
                    channel: channelName,
                    type   : "result",
                    data   : false
                }));
            }
            let data = await datafiles.del(msg.data.folder, msg.data.name);
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

// let btoa = typeof window !== 'undefined' ? window.btoa : (str) => ((str instanceof Buffer) ? str : new Buffer(str.toString(), 'binary')).toString('base64');
// let atob = typeof window !== 'undefined' ? window.atob : (str) => new Buffer(str, 'base64').toString('binary');
//
// function base64ToArrayBuffer(base64) {
//     var binary_string = atob(base64);
//     var len           = binary_string.length;
//     var bytes         = new Uint8Array(len);
//     for (var i = 0; i < len; i++) {
//         bytes[i] = binary_string.charCodeAt(i);
//     }
//     return bytes.buffer;
// }
//
// function arrayBufferToBase64(buffer) {
//     var binary = '';
//     var bytes  = new Uint8Array(buffer);
//     var len    = bytes.byteLength;
//     for (var i = 0; i < len; i++) {
//         binary += String.fromCharCode(bytes[i]);
//     }
//     return btoa(binary);
// }

module.exports = function (ws, message) {
    if (typeof manager[message.type] === 'function') {
        return manager[message.type](ws, message);
    }
    manager.error405(ws, message);
};