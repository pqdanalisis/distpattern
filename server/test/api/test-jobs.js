// jshint esversion: 6, node: true
"use strict";

// TODO: eliminar los registros creados durante las pruebas

const expect = require('chai').expect;
const algorithms = require('../../src/api/algorithms');
const datasets = require('../../src/api/datasets');

describe('jobs API', () => {
    let algorithmId;
    let inputsetId, resultsetId;
    let jobsCreated = [];
    before(async () => {
        algorithmId = await algorithms.add({
            name: 'echo',
            inputformat: 'json',
            outputformat: 'json',
            source: 'function(a, b, c) { b(100); c(a); }'
        });
        inputsetId = (await datasets.add({
            name: 'echo-input',
            format: 'json'
        })).id;
        resultsetId = (await datasets.add({
            name: 'echo-output',
            format: 'json'
        })).id;
    });
    after(async () => {
        let jobs = require('../../src/api/jobs');
        for (let j of jobsCreated) {
            await jobs.del(j);
        }
        await algorithms.del(algorithmId);
        await datasets.del(inputsetId);
        await datasets.del(resultsetId);
    });
    it('should return and object', () => {
        let jobs = require('../../src/api/jobs');
        expect(jobs).to.be.an('object');
    });
    it('should add one', async () => {
        let jobs = require('../../src/api/jobs');
        let result = await jobs.add({
            name     : 'echo-job',
            inputset  : inputsetId,
            resultset: resultsetId,
            algorithm: algorithmId
        });
        expect(result).to.be.an('number');
        jobsCreated.push(result);
        let r = await jobs.get(result);
        expect(r.name).to.be.equal('echo-job');
        expect(r.inputset).to.be.equal(inputsetId);
        expect(r.resultset).to.be.equal(resultsetId);
        expect(r.algorithm).to.be.equal(algorithmId);
        expect(r.progress).to.be.equal('0.00');
    });
    it('should list all', async() => {
        let jobs = require('../../src/api/jobs');
        let result = await jobs.add({
            name     : 'echo-job1',
            inputset  : inputsetId,
            resultset: resultsetId,
            algorithm: algorithmId
        });
        expect(result).to.be.an('number');
        jobsCreated.push(result);
        result = await jobs.add({
            name     : 'echo-job2',
            inputset  : inputsetId,
            resultset: resultsetId,
            algorithm: algorithmId
        });
        expect(result).to.be.an('number');
        jobsCreated.push(result);
        result = await jobs.lst();
        expect(result).to.be.an('array');
        expect(result).to.be.an('array');
    });
    it('should get one', async () => {
        let jobs = require('../../src/api/jobs');
        let result = await jobs.add({
            name     : 'echo-job1',
            inputset  : inputsetId,
            resultset: resultsetId,
            algorithm: algorithmId
        });
        expect(result).to.be.an('number');
        jobsCreated.push(result);
        result = await jobs.get(result);
        expect(result).to.be.an('object');
    });
    it('should update one', async () => {
        let jobs = require('../../src/api/jobs');
        let result = await jobs.add({
            name     : 'echo-job1',
            inputset  : inputsetId,
            resultset: resultsetId,
            algorithm: algorithmId
        });
        expect(result).to.be.an('number');
        jobsCreated.push(result);
        let n = await jobs.edt(result, {name: 'tree-map-b', 'status': 2, 'progress': 21.5});
        expect(n).to.be.equal(1);
        let r = await jobs.get(result);
        expect(r.name).to.be.equal('tree-map-b');
        expect(r.status).to.be.equal(2);
        expect(parseFloat(r.progress)).to.be.equal(21.5);
    });
    it('should delete one', async () => {
        let jobs = require('../../src/api/jobs');
        let result = await jobs.add({
            name     : 'echo-job1',
            inputset  : inputsetId,
            resultset: resultsetId,
            algorithm: algorithmId
        });
        expect(result).to.be.an('number');
        jobsCreated.push(result);
        let n = await jobs.del(result);
        expect(n).to.be.equal(1);
        let r = await jobs.get(result);
        expect(r).to.be.deep.equal({});
    });
});
