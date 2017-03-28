// jshint esversion: 6, node: true
"use strict";

require('console.table');
const fs      = require('fs');
const path    = require('path');
const program = require('commander');
const Server  = require('../srv/server');
const forms   = require('./forms');

program
    .version('1.0.1')
    .usage('[options] [inputFile]')
    .option('-l, --list     <entity>', 'list all elements')
    .option('-a, --add      <entity>', 'add new element')
    .option('-s, --show     <entity> <id>', 'show an element')
    .option('-d, --delete   <entity> <id>', 'delete an element')
    .option('-e, --edit     <entity> <id>', 'edit an element')
    .option('-w, --workers', 'show workers activity')
    .option('-t, --tasks', 'show tasks activity')
    .option('-r, --run      <jobId>', 'run a job by id')
    .option('-c, --cancel   <jobId>', 'cancel a job by id')
    .option('-u, --user     <usr>', 'user (pending)')
    .option('-p, --password <pwd>', 'password (pending)')
    .option('-S, --server   <address>', 'Distpattern server address')
    .on('--help', function () {
        console.log('  <entity> must be: algorithm, dataset, job, worker or user');
        console.log('');
        console.log('  the <inputFile> must be a JSON file with all input data');
    })
    .parse(process.argv);

let entityId;
let inputFile;
if (program.edit || program.show || program.delete) {
    if (typeof program.args[0] !== 'string') {
        program.help();
    }
    entityId  = program.args[0];
    inputFile = typeof program.args[1] === 'string' ? program.args[1] : undefined;
} else {
    inputFile = typeof program.args[0] === 'string' ? program.args[0] : undefined;
}

function entityCheck(entity) {
    if (!/(algorithm|dataset|job|worker|user)/.test(entity)) {
        program.help();
    }
    return entity + 's';
}

(async() => {
    let server = await Server(`ws://${program.server || 'localhost:8082'}`);
    console.log('');

    if (program.list) {
        let entity = entityCheck(program.list);
        let result = await server.send({
            channel: entity,
            type   : 'get'
        }).catch((err) => {
            console.log("Error listing %d", entity);
            console.error(err.data.error);
            process.exit(1);
        });
        console.log('Show all %j', entity);
        console.table(result.data);
        process.exit(0);

    } else if (program.show) {
        let entity = entityCheck(program.show);
        let result = await server.send({
            channel: entity,
            type   : 'get',
            data   : {
                id: entityId
            }
        }).catch((err) => {
            console.log("Error showing %s with id %d", entity, entityId);
            console.error(err.data.error);
            process.exit(1);
        });
        console.log('Show %j with id %d', entity, entityId);
        console.log(JSON.stringify(result.data, null, 4));
        process.exit(0);

    } else if (program.add) {
        let entity = entityCheck(program.add);
        console.log("Add %j", program.add);
        let data;
        if (entity === 'jobs') {
            let algorithms = await server.send({
                channel: 'algorithms',
                type   : 'get'
            }).catch((err) => {
                console.error("Error adding %s", program.add);
                console.error(err.data.error);
                process.exit(1);
            });
            let datasets   = await server.send({
                channel: 'datasets',
                type   : 'get'
            }).catch((err) => {
                console.error("Error adding %s", program.add);
                console.error(err.data.error);
                process.exit(1);
            });
            data           = await forms.job(
                algorithms.data.map((i) => i.id + ' - ' + i.name),
                datasets.data.map((i) => i.id + ' - ' + i.name)
            );
            data.algorithm = parseInt(data.algorithm.substring(0, data.algorithm.indexOf('-')), 10);
            data.inputset  = parseInt(data.inputset.substring(0, data.inputset.indexOf('-')), 10);
            data.resultset = parseInt(data.resultset.substring(0, data.resultset.indexOf('-')), 10);
        } else {
            data = await forms[program.add]();
        }
        let result = await server.send({
            channel: entity,
            type   : 'post',
            data
        }).catch((err) => {
            console.error("Error adding %s", program.add);
            console.error(err.data.error);
            process.exit(1);
        });
        console.log("Ok, %s has been added", program.add);
        if (data.datafiles) {
            for (let df of data.datafiles) {
                await server.sendFile({
                        channel: "datafiles",
                        type   : "post",
                        folder : result.data.folder,
                        name   : df.fileName,
                    },
                    df.fileContent,
                    function (pro) {
                        // TODO: que aparezca en la misma línea
                        console.log(df.fileName, pro + '%');
                    }
                );
            }
            console.log("Ok, %d files has been added", data.datafiles.length);
        }
        process.exit(0);

    } else if (program.edit) {
        let entity = entityCheck(program.edit);
        let currentValues = await server.send({
            channel: entity,
            type   : 'get',
            data   : {
                id: entityId
            }
        }).catch((err) => {
            console.log("Error editing %s with id %d", entity, entityId);
            console.error(err.data.error);
            process.exit(1);
        });
        let data;
        if (entity === 'jobs') {
            let algorithms = await server.send({
                channel: 'algorithms',
                type   : 'get'
            }).catch((err) => {
                console.error("Error adding %s", program.add);
                console.error(err.data.error);
                process.exit(1);
            });
            let datasets   = await server.send({
                channel: 'datasets',
                type   : 'get'
            }).catch((err) => {
                console.error("Error adding %s", program.add);
                console.error(err.data.error);
                process.exit(1);
            });
            data           = await forms.job(
                algorithms.data.map((i) => i.id + ' - ' + i.name),
                datasets.data.map((i) => i.id + ' - ' + i.name),
                currentValues.data
            );
            data.algorithm = parseInt(data.algorithm.substring(0, data.algorithm.indexOf('-')), 10);
            data.inputset  = parseInt(data.inputset.substring(0, data.inputset.indexOf('-')), 10);
            data.resultset = parseInt(data.resultset.substring(0, data.resultset.indexOf('-')), 10);
        } else {
            data   = await forms[program.edit](currentValues.data);
        }
        await server.send({
            channel: entity,
            type   : 'put',
            data   : {
                id    : entityId,
                record: data
            }
        }).catch((err) => {
            console.log("Error editing %s with id %d", entity, entityId);
            console.error(err);
            process.exit(1);
        });
        console.log("Ok, %s has been edited", program.add);
        if (data.datafiles4deleted) {
            for (let df of data.datafiles4deleted) {
                await server.send({
                    channel: "datafiles",
                    type   : "delete",
                    data   : {
                        folder: currentValues.data.folder,
                        name  : path.basename(df)
                    }
                });
            }
            console.log("Ok, %d files has been added", data.datafiles4deleted.length);
        }
        if (data.datafiles) {
            for (let df of data.datafiles) {
                await server.sendFile({
                        channel: "datafiles",
                        type   : "post",
                        folder : currentValues.data.folder,
                        name   : df.fileName,
                    },
                    df.fileContent,
                    function (pro) {
                        // TODO: que aparezca en la misma línea
                        console.log(df.fileName, pro + '%');
                    }
                );
            }
            console.log("Ok, %s width %d has been edited", program.edit, entityId);
        }
        process.exit(0);

    } else if (program.delete) {
        if (!await forms.question(`Are you sure to delete the ${program.delete} with id ${entityId}?`)) {
            process.exit(0);
        }
        let entity = entityCheck(program.delete);
        let result = await server.send({
            channel: entity,
            type   : 'delete',
            data   : {
                id: entityId
            }
        }).catch((err) => {
            console.error("Error deleting %s with %d", entity, entityId);
            console.error(err.data.error);
            process.exit(1);
        });
        if (result.data) {
            console.log('Ok, %s with id %d has been deleted', entity, entityId);
        } else {
            console.log('Error, %s with id %d has not been deleted', entity, entityId);
        }
        process.exit(0);

    } else if (program.workers) {
        let wk = await server.send({
            channel: 'workers',
            type   : 'get'
        }).catch((err) => {
            console.log("Error listing workers");
            console.error(err.data.error);
            process.exit(1);
        });
        console.log('Show all workers');
        console.table(wk.data);
        server.on('message', function(msg) {
            if (msg.channel === 'workers') {
                switch (msg.type) {
                    case 'add':
                        wk.data.push(msg.data);
                        break;
                    case 'edt':
                        wk.data = wk.data.map((d) => {
                            return d.id === msg.data.id ? msg.data : d;
                        });
                        break;
                    case 'del':
                        wk.data = wk.data.filter((d) => {
                            return d.id !== msg.data.id;
                        });
                        break;
                }
                console.log('Show all workers');
                console.table(wk.data);
            }
        });
        let result = await server.send({
            channel: "workers",
            type   : "sub"
        }).catch((err) => {
            console.log("Error subscribing to workers");
            console.error(err.data.error);
            process.exit(1);
        });

    } else if (program.tasks) {
        let tk = await server.send({
            channel: 'tasks',
            type   : 'get'
        }).catch((err) => {
            console.log("Error listing tasks");
            console.error(err.data.error);
            process.exit(1);
        });
        console.log('Show all tasks');
        console.table(tk.data);
        server.on('message', function(msg) {
            if (msg.channel === 'tasks') {
                switch (msg.type) {
                    case 'add':
                        tk.data.push(msg.data);
                        break;
                    case 'edt':
                        tk.data = tk.data.map((d) => {
                            return d.id === msg.data.id ? msg.data : d;
                        });
                        break;
                    case 'del':
                        tk.data = tk.data.filter((d) => {
                            return d.id !== msg.data.id;
                        });
                        break;
                }
                console.log('Show all tasks');
                console.table(tk.data);
            }
        });
        let result = await server.send({
            channel: "tasks",
            type   : "sub"
        }).catch((err) => {
            console.log("Error subscribing to tasks");
            console.error(err.data.error);
            process.exit(1);
        });

    } else if (program.run) {
        if (!await forms.question(`Are you sure to start the job with id ${program.run}?`)) {
            process.exit(0);
        }
        let result = await server.send({
            channel: 'jobs',
            type   : 'start',
            data   : {
                id: program.run
            }
        }).catch((err) => {
            console.error("Error starting the job with %d", program.run);
            console.error(err);
            process.exit(1);
        });
        console.log('Ok, job with id %d has been started', program.run);
        console.log('Tasks:');
        console.log(result.data.tasks);
        process.exit(0);

    } else if (program.cancel) {
        if (!await forms.question(`Are you sure to stop the job with id ${program.cancel}?`)) {
            process.exit(0);
        }
        let result = await server.send({
            channel: 'jobs',
            type   : 'stop',
            data   : {
                id: program.cancel
            }
        }).catch((err) => {
            console.error("Error starting the job with %d", program.run);
            console.error(err.data.error);
            process.exit(1);
        });
        console.log('Ok, job with id %d has been started', program.run);
        console.log(result.data);
        process.exit(0);

    } else {
        program.help();
        process.exit(0);
    }
})().catch((err) => {
    console.error('ERROR', err);
    process.exit(1);
});
