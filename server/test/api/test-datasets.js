// jshint esversion: 6, node: true
"use strict";

// TODO: eliminar los registros creados durante las pruebas

const expect                = require('chai').expect;

describe('datasets API', () => {
    it('should return and object', () => {
        let datasets = require('../../src/api/datasets');
        expect(datasets).to.be.an('object');
    });
    it('should list all', (done) => {
        let datasets = require('../../src/api/datasets');
        datasets.lst().then((result) => {
            expect(result).to.be.an('array');
            done();
        });
    });
    it('should get one', (done) => {
        let datasets = require('../../src/api/datasets');
        datasets.get(1).then((result) => {
            expect(result).to.be.an('object');
            done();
        });
    });
    it('should add one', (done) => {
        let datasets = require('../../src/api/datasets');
        datasets.add({
            name: 'test1',
            format: 'csv'
        }).then(async (result) => {
            expect(result.id).to.be.an('number');
            expect(result.folder).to.be.an('string');
            let r = await datasets.get(result.id);
            expect(r.name).to.be.equal('test1');
            expect(r.description).to.be.equal(null);
            expect(r.format).to.be.equal('csv');
            expect(r.folder).to.be.a('string');
            done();

        }).catch(done);
    });
    it('should update one', (done) => {
        let datasets = require('../../src/api/datasets');
        datasets.add({
            name: 'test2',
            format: 'csv'
        }).then(async (result) => {
            expect(result.id).to.be.an('number');
            expect(result.folder).to.be.an('string');
            let n = await datasets.edt(result.id, {name: 'test2b', 'description': 'Hola'});
            expect(n).to.be.equal(1);
            let r = await datasets.get(result.id);
            expect(r.name).to.be.equal('test2b');
            expect(r.description).to.be.equal('Hola');
            expect(r.format).to.be.equal('csv');
            done();
        }).catch(done);
    });
    it('should delete one', (done) => {
        let datasets = require('../../src/api/datasets');
        datasets.add({
            name: 'test3',
            format: 'csv'
        }).then(async (result) => {
            expect(result.id).to.be.an('number');
            expect(result.folder).to.be.an('string');
            let n = await datasets.del(result.id);
            expect(n).to.be.equal(1);
            let r = await datasets.get(result);
            expect(r).to.be.deep.equal({});
            done();
        }).catch(done);
    });

    it('should get by query', (done) => {
        let datasets = require('../../src/api/datasets');
        datasets.add({
            name: 'multiple',
            format: 'json'
        }).then(async (dsRecord) => {
            let ds = await datasets.query({name: 'multiple'});
            expect(ds).to.be.an('array');
            expect(ds[0].datafiles).to.be.an('array');
            done();

        }).catch(done);
    });
});
