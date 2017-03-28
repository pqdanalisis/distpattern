// jshint esversion: 6, node: true

(function (root) {
    "use strict";

    const CLOSE_NORMAL   = 1000;
    const CLOSE_ABNORMAL = 1006;
    const TRY_AGAIN      = 1013;
    const MAX_RETRY      = 600; // (600 * 500) === 5 minutes
    let retry            = 0;
    let ws;

    if (typeof process !== 'undefined') {
        ws = require('ws');
    } else {
        ws = WebSocket;
    }

    function Server(connectString) {
        return new Promise(function (resolve, reject) {
            let eventHandler = {
                message: [],
                open   : [],
                close  : []
            };
            let msgPending   = {};
            let msgId        = 0;
            let srv          = {
                on      : function (msg, cb) {
                    eventHandler[msg] && eventHandler[msg].push(cb);
                    if (msg === 'open' && srv.ws.readyState === srv.ws.OPEN) {
                        cb();
                    } else if (msg === 'close' && srv.ws.readyState === srv.ws.CLOSED) {
                        cb();
                    }
                },
                fire    : function (msg, ...arg) {
                    eventHandler[msg] && eventHandler[msg].forEach(function (cb) {
                        cb(...arg);
                    });
                },
                off     : function (msg, cb) {
                    eventHandler[msg] && delete eventHandler[msg][eventHandler[msg].indexOf(cb)];
                },
                send    : function (msg, direct) {
                    try {
                        srv.ws.send(JSON.stringify(Object.assign(msg, {id: ++msgId})));
                        if (direct) {
                            return Promise.resolve({});
                        }
                        return new Promise(function (resolve, reject) {
                            msgPending[msgId] = {resolve, reject}
                        });
                    } catch (err) {
                        return Promise.reject(err);
                    }
                },
                sendFile: function (msg, file, progress) {
                    return new Promise(function (resolve, reject) {
                        // let fslice = new FileSlicer(typeof file === 'string' ? stringToArrayBuffer(file) : file);
                        // msg.size   = fslice.buffer.byteLength;
                        let fslice = new FileSlicer(file);
                        msg.size   = fslice.buffer.length;
                        srv.send(msg).then(function (result) {
                            if (result.type === 'startupload') {
                                (function chunk() {
                                    if (fslice.currentSlice > fslice.slices) {
                                        return console.error('next');   // TODO: check
                                    }
                                    msg.action  = "uploadchunk";
                                    // msg.chunk   = arrayBufferToBase64(fslice.getNextSlice());
                                    msg.chunk   = fslice.getNextSlice();
                                    msg.partial = result.partial;
                                    srv.send(msg).then(function (result) {
                                        // progress && fslice.currentSlice % 10 == 0 && progress(Math.round(fslice.totalChunkSize / fslice.buffer.byteLength * 10000) / 100);
                                        progress && fslice.currentSlice % 10 == 0 && progress(Math.round(fslice.totalChunkSize / fslice.buffer.length * 10000) / 100);
                                        if (result.type === 'nextupload') {
                                            chunk();
                                        } else {
                                            progress && progress(100);
                                            resolve(result);
                                        }
                                    });
                                })();
                            }
                        });
                    });
                }
            };

            let retry = 0;
            (function connect() {
                srv.ws           = new ws(connectString);
                srv.ws.onerror   = function (event) {
                };
                srv.ws.onopen    = function () {
                    retry = 0;
                    resolve(srv);
                    srv.fire('open');
                };
                srv.ws.onclose   = function (event) {
                    if (event.code === CLOSE_ABNORMAL &&
                        retry++ < MAX_RETRY) {
                        console.error('Connection closed');
                        return setTimeout(function () {
                            connect();
                        }, 500);
                    }
                    srv.fire('close');
                };
                srv.ws.onmessage = function (event) {
                    let msg = JSON.parse(event.data);
                    if (msg.replyTo) {
                        if (msgPending[msg.replyTo]) {
                            if (msg.ok) {
                                msgPending[msg.replyTo].resolve(msg);
                            } else {
                                msgPending[msg.replyTo].reject(msg);
                            }
                            delete msgPending[msg.replyTo];
                        }
                        return;
                    }
                    srv.fire('message', msg);
                };
            })();
        });
    }

    function FileSlicer(str) {
        this.buffer         = str;
        this.sliceSize      = 64 * 1024;
        this.slices         = Math.ceil(this.buffer.length / this.sliceSize);
        this.currentSlice   = 0;
        this.lastChunkSize  = 0;
        this.totalChunkSize = 0;
        this.getNextSlice   = function () {
            var start = this.currentSlice * this.sliceSize;
            var end   = Math.min((this.currentSlice + 1) * this.sliceSize, this.buffer.length);
            this.currentSlice++;
            this.lastChunkSize = end - start;
            this.totalChunkSize += this.lastChunkSize;
            return this.buffer.slice(start, end);
        }
    }


    // function FileSlicer(buffer) {
    //     this.buffer            = new Uint8Array(buffer);
    //     this.sliceSize      = 32 * 1024;
    //     this.slices         = Math.ceil(this.buffer.length / this.sliceSize);
    //     this.currentSlice   = 0;
    //     this.lastChunkSize  = 0;
    //     this.totalChunkSize = 0;
    //     this.getNextSlice   = function () {
    //         var start = this.currentSlice * this.sliceSize;
    //         var end   = Math.min((this.currentSlice + 1) * this.sliceSize, this.buffer.length);
    //         this.currentSlice++;
    //         this.lastChunkSize = end - start;
    //         this.totalChunkSize += this.lastChunkSize;
    //         return this.buffer.slice(start, end);
    //     }
    // }
    //
    //
    // function stringToArrayBuffer(str) {
    //     let buffer = new ArrayBuffer(str.length); // 2 bytes for each char
    //     let bufferView = new Uint8Array(buffer);
    //     for (let i=0; i < str.length; i++) {
    //         bufferView[i] = str.charCodeAt(i);
    //     }
    //     return buffer;
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
    //
    // let btoa = typeof window !== 'undefined' ? window.btoa : typeof self !== 'undefined' ? self.btoa : (str) => ((str instanceof Buffer) ? str : new Buffer(str.toString(), 'binary')).toString('base64');
    // let atob = typeof window !== 'undefined' ? window.atob : typeof self !== 'undefined' ? self.atob : (str) => new Buffer(str, 'base64').toString('binary');
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


    // Export for node and browser
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = Server;
        }
        exports.Server = Server;
    } else {
        root.Server = Server;
    }

})(this);
