// jshint esversion: 6, node: true
"use strict";

let path = require('path');
require('../src/index');
const algorithms = require('../src/api/algorithms');
const datasets   = require('../src/api/datasets');
const datafiles  = require('../src/api/datafiles');
const tasks      = require('../src/api/tasks');
const Server     = require('../srv/server');
const expect     = require('chai').expect;
const WebSocket  = require('ws');

describe('jobs websocket', function () {
    let algorithmId;
    let inputset, resultsetId;
    let jobsCreated = [];
    before(async() => {
        algorithmId = await algorithms.add({
            name        : 'echo',
            inputformat : 'json',
            outputformat: 'json',
            source      : 'function(a, b, c) { b(100); c(a); }'
        });
        inputset    = (await datasets.add({
            name  : 'echo-input',
            format: 'json'
        }));
        await datafiles.add(inputset.folder, 'test1.json', path.join(__dirname, './files/integer-1m.json'), true);
        await datafiles.add(inputset.folder, 'test2.json', path.join(__dirname, './files/integer-2m.json'), true);
        resultsetId = (await datasets.add({
            name  : 'echo-output',
            format: 'json'
        })).id;
    });
    after(async() => {
        let jobs = require('../src/api/jobs');
        for (let j of jobsCreated) {
            for (let t of await tasks.query({job: j})) {
                await tasks.del(t.id);
            }
            await jobs.del(j);
        }
        await algorithms.del(algorithmId);
        await datasets.del(inputset.id);
        await datasets.del(resultsetId);
    });
    it('should connect to server', async() => {
        let srv = await Server('ws://localhost:8082');
        expect(srv).to.be.an('object');
    });
    it('should create a new dataset', async() => {
        let srv    = await Server('ws://localhost:8082');
        let data   = {
            name     : 'echo-job',
            inputset : inputset.id,
            resultset: resultsetId,
            algorithm: algorithmId
        };
        let result = await srv.send({
            channel: 'jobs',
            type   : 'post',
            data
        });
        expect(result.ok).to.be.equal(true);
        jobsCreated.push(result.data);
        expect(result.channel).to.be.equal('jobs');
        expect(result.type).to.be.equal('confirm');
        expect(result.data).to.be.a('number');
    });
    it('should get all jobs', async() => {
        let srv    = await Server('ws://localhost:8082');
        let data   = {
            name     : 'echo-job',
            inputset : inputset.id,
            resultset: resultsetId,
            algorithm: algorithmId
        };
        let result = await srv.send({
            channel: 'jobs',
            type   : 'post',
            data
        });
        expect(result.ok).to.be.equal(true);
        jobsCreated.push(result.data);
        result = await srv.send({
            channel: 'jobs',
            type   : 'get'
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('jobs');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.a('array');
    });
    it('should get an jobs', async() => {
        let srv    = await Server('ws://localhost:8082');
        let data   = {
            name     : 'echo-job',
            inputset : inputset.id,
            resultset: resultsetId,
            algorithm: algorithmId
        };
        let result = await srv.send({
            channel: 'jobs',
            type   : 'post',
            data
        });
        expect(result.ok).to.be.equal(true);
        jobsCreated.push(result.data);
        result = await srv.send({
            channel: 'jobs',
            type   : 'get',
            data   : {
                id: result.data
            }
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('jobs');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.a('object');
    });
    it('should update an jobs', async() => {
        let srv    = await Server('ws://localhost:8082');
        let data   = {
            name     : 'echo-job',
            inputset : inputset.id,
            resultset: resultsetId,
            algorithm: algorithmId
        };
        let result = await srv.send({
            channel: 'jobs',
            type   : 'post',
            data
        });
        expect(result.ok).to.be.equal(true);
        jobsCreated.push(result.data);
        let id = result.data;
        result = await srv.send({
            channel: 'jobs',
            type   : 'put',
            data   : {
                id,
                record: {
                    description: 'Great job'
                }
            }
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('jobs');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.a('number');
        expect(result.data).to.be.equal(1);
        result = await srv.send({
            channel: 'jobs',
            type   : 'get',
            data   : {
                id
            }
        });
        expect(result.data.description).to.be.equal('Great job');
    });
    it('should delete an jobs', async() => {
        let srv    = await Server('ws://localhost:8082');
        let data   = {
            name     : 'echo-job',
            inputset : inputset.id,
            resultset: resultsetId,
            algorithm: algorithmId
        };
        let result = await srv.send({
            channel: 'jobs',
            type   : 'post',
            data
        });
        expect(result.ok).to.be.equal(true);
        jobsCreated.push(result.data);
        let id = result.data;
        result = await srv.send({
            channel: 'jobs',
            type   : 'delete',
            data   : {
                id
            }
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('jobs');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.a('number');
        expect(result.data).to.be.equal(1);
        result = await srv.send({
            channel: 'jobs',
            type   : 'get',
            data   : {
                id
            }
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('jobs');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.an('object');
        expect(result.data).to.be.deep.equal({});
    });
});