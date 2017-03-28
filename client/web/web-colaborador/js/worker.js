importScripts('server.js');
importScripts('runtask.js');
importScripts('config.js');

if (typeof Server !== 'function') throw new Error('"Server()" function is not load');
if (typeof runtask !== 'function') throw new Error('"runtask()" function is not load');


let message = (msg) => postMessage(msg);

message('starting');
Server(`ws://${config.server || 'localhost:8082'}`)
    .then((server) => {
        server.on('open', () => {
            message('connected');
            server.send({
                channel: 'workertask',
                type   : 'welcome',
                data   : {
                    type: 'browser',
                    name: config.name,
                    info: getInfo()
                }
            })
                .then((result) => {
                    // TODO: Save name?
                    config.name = result.data.name;
                    message('welcomed (' + config.name + ')');

                    server.on('message', (task) => {
                        if (task.channel === 'workertask' && task.type === 'task') {
                            // run task
                            message('Preparing tasks...');
                            runtask(server, task.data, message)
                                .then((id) => {
                                    message(task.data.name, '- finish');
                                    return server.send({
                                        channel: 'workertask',
                                        type   : 'finish',
                                        data   : {
                                            id
                                        }
                                    });
                                })
                                .then(() => {
                                    return ready();
                                })
                                .catch(err => {
                                    console.error(err);
                                });
                        }
                    });
                    function ready() {
                        message('Waiting tasks...<br/>(' + config.name + ')');
                        return server.send({
                            channel: 'workertask',
                            type   : 'ready',
                            data   : {
                                id: result.data.id
                            }
                        });
                    }
                    ready();
                });
        });
    })
    .catch((err) => {
        error(err.message);
        process.exit(1);
    });


function getInfo() {
    return {
        useragent: navigator.userAgent,
        vendor   : navigator.vendor,
        platform : navigator.platform
    }
}

// onmessage = function (oEvent) {
//     switch (oEvent.data){
//         case 'connect': connectWebSocket((value)=>postMessage({type:"connect",value}));
//                         break;
//         case 'run':    giveMeTheTask((value)=> postMessage({type:"progress"   ,value}));
//                         break;
//     }
// };
// let server;
// function connectWebSocket(response) {
//     Server('ws://distpattern.com/s/')
//         .then(function (srv) {
//             server = srv;
//             server.on('message', function (msg) {
//                 response("goodConnection"+ msg)
//             });
//         })
//         .catch(function (err) {
//             console.error(err);
//         });
// }
//
// function giveMeTheTask(response) {
//     server.send({
//         channel: "workertask",
//         type   : "get",
//         data   : {
//             time: (new Date()).valueOf()
//         }
//     }).then(function (msg) {
//         evalData(msg,response);
//     }).catch(function (err) {
//
//     });
// }
//
// function evalData(msg,response) {
//     console.log(msg,response);
//     let server = "http://distpattern.com/";
//     readTextFile(server + msg.data.file,(source)=>{
//
//         "use strict";
//         let data = JSON.parse(source);
//         let algotithm = msg.data.source;
//         response(returnFuncion(algotithm)(data,(value)=> postMessage({type:"progress"   ,value}), () => {}));
//     });
// }
//
// function returnFuncion(code) {
//     return eval('(() => { return ' + code + '})()');
// }
//
// function Server(connectString) {
//     const MAX_RETRY = 5;
//     return new Promise(function (resolve, reject) {
//         let retry            = 0;
//         let onMessage        = [];
//         let msgPending       = [];
//         let msgId            = 0;
//         let srv          = {
//             on  : function (msg, cb) {
//                 if (msg === 'message') {
//                     onMessage.push(cb);
//                 }
//             },
//             fire: function (msg, ...arg) {
//                 if (msg === 'message') {
//                     onMessage.forEach((cb) => {
//                         cb(...arg);
//                     });
//                 }
//             },
//             off : function (msg, cb) {
//                 if (msg === 'message') {
//                     delete onMessage[onMessage.indexOf(cb)]
//                 }
//             },
//             send: function (msg, direct) {
//                 srv.ws.send(JSON.stringify(Object.assign({id: ++msgId}, msg)));
//                 if (direct) {
//                     return Promise.resolve({});
//                 }
//                 return new Promise(function (resolve, reject) {
//                     msgPending[msgId] = {resolve, reject}
//                 });
//             }
//         };
//         srv.ws           = new WebSocket(connectString);
//         srv.ws.onerror   = function (event) {
//             if (retry < MAX_RETRY) {
//                 return setTimeout(function () {
//                     connect(server, clientkey)
//                 }, 100 * ++retry);
//             }
//             reject(event);
//         };
//         srv.ws.onopen    = function () {
//             retry = 0;
//             resolve(srv);
//         };
//         srv.ws.onmessage = function (event) {
//             let msg = JSON.parse(event.data);
//             if (msg.replyTo) {
//                 if (msg.ok) {
//                     return msgPending[msg.replyTo] && msgPending[msg.replyTo].resolve(msg);
//                 }
//                 return msgPending[msg.replyTo].reject(msg);
//             }
//             srv.fire('message', msg);
//         };
//     });
// }
//
// function readTextFile(file,result)
// {
//     var rawFile = new XMLHttpRequest();
//     rawFile.open("GET", file, false);
//     rawFile.onreadystatechange = function ()
//     {
//         if(rawFile.readyState === 4)
//         {
//             if(rawFile.status === 200 || rawFile.status == 0)
//             {
//                 var allText = rawFile.responseText;
//                 result(allText);
//             }
//         }
//     };
//     rawFile.send(null);
// }