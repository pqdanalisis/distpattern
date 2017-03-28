// jshint esversion: 6, node: true, mocha: true
"use strict";

// TODO: eliminar los registros creados durante las pruebas

const expect                = require('chai').expect;

describe('algorithms API', () => {
    it('should return and object', () => {
        let algorithms = require('../../src/api/algorithms');
        expect(algorithms).to.be.an('object');
    });
    it('should list all', (done) => {
        let algorithms = require('../../src/api/algorithms');
        algorithms.lst().then((result) => {
            expect(result).to.be.an('array');
            done();
        });
    });
    it('should get one', (done) => {
        let algorithms = require('../../src/api/algorithms');
        algorithms.get(1).then((result) => {
            expect(result).to.be.an('object');
            done();
        });
    });
    it('should add one', (done) => {
        let algorithms = require('../../src/api/algorithms');
        algorithms.add({
            name: 'test1',
            inputformat: 'none',
            outputformat: 'none',
            source: 'console.log("hello")'
        }).then(async (result) => {
            expect(result).to.be.an('number');
            let r = await algorithms.get(result);
            expect(r.name).to.be.equal('test1');
            expect(r.description).to.be.equal(null);
            expect(r.inputformat).to.be.equal('none');
            expect(r.outputformat).to.be.equal('none');
            expect(r.source).to.be.equal('console.log("hello")');
            done();
        }).catch(done);
    });
    it('should update one', (done) => {
        let algorithms = require('../../src/api/algorithms');
        algorithms.add({
            name: 'test2',
            inputformat: 'none',
            outputformat: 'none',
            source: 'console.log("hello")'
        }).then(async (result) => {
            expect(result).to.be.an('number');
            let n = await algorithms.edt(result, {name: 'test2b', 'description': 'Hola'});
            expect(n).to.be.equal(1);
            let r = await algorithms.get(result);
            expect(r.name).to.be.equal('test2b');
            expect(r.description).to.be.equal('Hola');
            expect(r.source).to.be.equal('console.log("hello")');
            done();
        }).catch(done);
    });
    it('should delete one', (done) => {
        let algorithms = require('../../src/api/algorithms');
        algorithms.add({
            name: 'test2',
            inputformat: 'none',
            outputformat: 'none',
            source: 'console.log("hello")'
        }).then(async (result) => {
            expect(result).to.be.an('number');
            let n = await algorithms.del(result);
            expect(n).to.be.equal(1);
            let r = await algorithms.get(result);
            expect(r).to.be.deep.equal({});
            done();
        }).catch(done);
    });

});
