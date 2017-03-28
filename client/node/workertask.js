// jshint esversion: 6, node: true
"use strict";

// Enviroment
const config     = require('./config.json');
process.env.DESA = config.desa ? 'true' : '';

// Log
require('./log');

// Uncaught exception
process.on('uncaughtException', function (err) {
    error('Caught exception:', err, err.stack);
    process.exit(1);
});

// Modules
const Server  = require('../srv/server');
const runtask = require('./runtask');

(async() => {
    log('starting');
    let server = await Server(`ws://${config.server || 'localhost:8082'}`)
        .catch((err) => {
            error(err.message);
            process.exit(1);
        });
    server.on('open', async() => {
        log('connected');
        let result = await server.send({
            channel: 'workertask',
            type   : 'welcome',
            data   : {
                type: 'server',
                name: config.name,
                info: getInfo()
            }
        }).catch((err) => {
            error(err.message);
            process.exit(1);
        });
        log('welcomed');
        if (config.name !== result.data.name) {
            config.name = result.data.name;
            require('fs').writeFileSync('./config.json', JSON.stringify(config, null, 4));
        }
        server.on('message', (task) => {
            if (task.channel === 'workertask' && task.type === 'task') {
                // run task
                runtask(server, task.data, log)
                    .then(async (id) => {
                        log(task.data.name, '- finish');
                        await server.send({
                            channel: 'workertask',
                            type   : 'finish',
                            data   : {
                                id
                            }
                        });
                        ready();
                    })
                    .catch(err => {
                        error(err);
                    });
            }
        });
        async function ready() {
            await server.send({
                channel: 'workertask',
                type   : 'ready',
                data   : {
                    id: result.data.id
                }
            }).catch((err) => {
                error(err.message);
                process.exit(1);
            });
        }
        ready();
    });
})();

function getInfo() {
    const os = require('os');
    return {
        hostname: os.hostname(),
        arch    : os.arch(),
        cpus    : os.cpus(),
        freemem : os.freemem(),
        totalmem: os.totalmem(),
        platform: os.platform(),
        release : os.release()
    }
}