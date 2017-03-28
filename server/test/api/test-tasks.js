// jshint esversion: 6, node: true
"use strict";

// TODO: eliminar los registros creados durante las pruebas

const path       = require('path');
const expect     = require('chai').expect;
const algorithms = require('../../src/api/algorithms');
const datafiles  = require('../../src/api/datafiles');
const datasets   = require('../../src/api/datasets');
const jobs       = require('../../src/api/jobs');

describe('tasks API', () => {
    let algorithmId;
    let algorithmName = 'echo';
    let inputset, resultset;
    let jobsCreated  = {};
    let tasksCreated = [];
    before(async () => {
        algorithmId = await algorithms.add({
            name        : algorithmName,
            inputformat : 'json',
            outputformat: 'json',
            source      : 'function(a, b, c) { b(100); c(a); }'
        });
        inputset    = await datasets.add({
            name  : 'echo-input',
            format: 'json'
        });
        resultset   = await datasets.add({
            name  : 'echo-output',
            format: 'json'
        });
        await datafiles.add(inputset.folder, 'test1.json', path.join(__dirname, '../files/integer-1m.json'), true);
        await datafiles.add(inputset.folder, 'test2.json', path.join(__dirname, '../files/integer-2m.json'), true);
        jobsCreated    = {
            name     : 'echo-job',
            inputset : inputset.id,
            resultset: resultset.id,
            algorithm: algorithmId
        };
        jobsCreated.id = await jobs.add(jobsCreated);
    });
    after(async () => {
        let tasks = require('../../src/api/tasks');
        for (let t of tasksCreated) {
            await tasks.del(t);
        }
        await jobs.del(jobsCreated.id);
        await algorithms.del(algorithmId);
        await datafiles.del(inputset.folder, 'test1.json');
        await datafiles.del(inputset.folder, 'test2.json');
        await datasets.del(inputset.id);
        await datasets.del(resultset.id);
    });
    it('should return and object', () => {
        let tasks = require('../../src/api/tasks');
        expect(tasks).to.be.an('object');
    });
    it('should list all', (done) => {
        let tasks = require('../../src/api/tasks');
        tasks.lst().then((result) => {
            expect(result).to.be.an('array');
            done();
        });
    });
    it('should get one', (done) => {
        let tasks = require('../../src/api/tasks');
        tasks.get(1).then((result) => {
            expect(result).to.be.an('object');
            done();
        });
    });
    it('should add one', (done) => {
        let tasks = require('../../src/api/tasks');
        tasks.add({
            name      : 'test1-task001',
            jobid     : jobsCreated.id,
            job       : jobsCreated.name,
            algorithm : algorithmName,
            inputfile : inputset.folder + '/test1.json',
            resultfile: resultset.folder + '/test1.json'
        }).then(async (result) => {
            tasksCreated.push(result);
            expect(result).to.be.an('number');
            let r = await tasks.get(result);
            expect(r.name).to.be.equal('test1-task001');
            expect(r.job).to.be.equal(jobsCreated.name);
            expect(r.inputfile).to.be.a('string');
            expect(r.inputfile).to.be.equal(inputset.folder + '/test1.json');
            expect(r.resultfile).to.be.a('string');
            expect(r.resultfile).to.be.equal(resultset.folder + '/test1.json');
            expect(r.status).to.be.equal('pending');
            expect(r.progress).to.be.equal('0.00');
            done();
        }).catch(done);
    });
    it('should update one', (done) => {
        let tasks = require('../../src/api/tasks');
        tasks.add({
            name      : 'test1-task002',
            jobid     : jobsCreated.id,
            job       : jobsCreated.name,
            algorithm : algorithmName,
            inputfile : inputset.folder + '/test2.json',
            resultfile: resultset.folder + '/test2.json'
        }).then(async (result) => {
            tasksCreated.push(result);
            expect(result).to.be.an('number');
            let n = await tasks.edt(result, 1, {name: 'test1-task002', 'status': 2, 'progress': 21.5});
            expect(n).to.be.equal(1);
            let r = await tasks.get(result);
            expect(r.name).to.be.equal('test1-task002');
            expect(r.status).to.be.equal('run');
            expect(parseFloat(r.progress)).to.be.equal(21.5);
            done();
        }).catch(done);
    });
    it('should delete one', (done) => {
        let tasks = require('../../src/api/tasks');
        tasks.add({
            name      : 'test1-task002',
            jobid     : jobsCreated.id,
            job       : jobsCreated.name,
            algorithm : algorithmName,
            inputfile : inputset.folder + '/test2.json',
            resultfile: resultset.folder + '/test2.json'
        }).then(async (result) => {
            expect(result).to.be.an('number');
            let n = await tasks.del(result);
            expect(n).to.be.equal(1);
            let r = await tasks.get(result);
            expect(r).to.be.deep.equal({});
            done();
        }).catch(done);
    });
    it('should query tasks', (done) => {
        let tasks = require('../../src/api/tasks');
        tasks.add({
            name      : 'test1-task001',
            jobid     : jobsCreated.id,
            job       : jobsCreated.name,
            algorithm : algorithmName,
            inputfile : inputset.folder + '/test1.json',
            resultfile: resultset.folder + '/test1.json'
        }).then(async (result) => {
            tasksCreated.push(result);
            expect(result).to.be.an('number');
            let newTasks = await tasks.query({jobid: jobsCreated.id});
            expect(newTasks[0]).to.be.an('object');
            done();
        }).catch(done);
    });
});
