// jshint esversion: 6, node: true
"use strict";

// TODO: eliminar los registros creados durante las pruebas

const expect = require('chai').expect;

describe('workers', () => {
    it('should return and object', () => {
        let workers = require('../../src/api/workers');
        expect(workers).to.be.an('object');
    });
    it('should list all', (done) => {
        let workers = require('../../src/api/workers');
        workers.lst().then((result) => {
            expect(result).to.be.an('array');
            done();
        });
    });
    it('should get one', (done) => {
        let workers = require('../../src/api/workers');
        workers.get(1).then((result) => {
            expect(result).to.be.an('object');
            done();
        });
    });
    it('should add one', (done) => {
        let workers = require('../../src/api/workers');
        workers.add({
            ip  : '127.0.0.1',
            type: 'server',
            info: {}

        }).then(async (result) => {
            expect(result).to.be.an('number');
            let r = await workers.get(result);
            expect(r.ip).to.be.equal('127.0.0.1');
            expect(r.type).to.be.equal('server');
            done();
        }).catch(done);
    });
    it('should update one', (done) => {
        let workers = require('../../src/api/workers');
        workers.add({
            ip  : '127.0.0.1',
            type: 'web',
            info: {}

        }).then(async (result) => {
            expect(result).to.be.an('number');
            let n = await workers.edt(result, {type: 'server'});
            expect(n).to.be.equal(1);
            let r = await workers.get(result);
            expect(r.type).to.be.equal('server');
            done();
        }).catch(done);
    });
    it('should delete one', (done) => {
        let workers = require('../../src/api/workers');
        workers.add({
            ip  : '127.0.0.1',
            type: 'web',
            info: {'cpu': 2}
        }).then(async (result) => {
            expect(result).to.be.an('number');
            let n = await workers.del(result);
            expect(n).to.be.equal(1);
            let r = await workers.get(result);
            expect(r).to.be.deep.equal({});
            done();
        }).catch(done);
    });

});