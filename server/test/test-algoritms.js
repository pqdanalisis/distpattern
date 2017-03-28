// jshint esversion: 6, node: true
"use strict";

require('../src/index');
const Server    = require('../srv/server');
const expect    = require('chai').expect;
const WebSocket = require('ws');

describe('algoritms websocket', function () {
    it('should connect to server', async() => {
        let srv = await Server('ws://localhost:8082');
        expect(srv).to.be.an.object;
    });
    it('should create a new algorithm', async() => {
        let srv    = await Server('ws://localhost:8082');
        let data   = {
            name        : "echo",
            description : "Devuelve los mismos valores que se le envían",
            version     : "0.0.1",
            inputformat : "json",
            outputformat: "json",
            source      : "function run(values, process, ended) { process(100); ended(values); }"
        };
        let result = await srv.send({
            channel: 'algorithms',
            type: 'post',
            data
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('algorithms');
        expect(result.type).to.be.equal('confirm');
        expect(result.data.id).to.be.a('number');
    });
    it('should get all algorithms', async() => {
        let srv    = await Server('ws://localhost:8082');
        let result = await srv.send({
            channel: 'algorithms',
            type: 'get'
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('algorithms');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.a('array');
    });
    it('should get an algorithms', async() => {
        let srv    = await Server('ws://localhost:8082');
        let result = await srv.send({
            channel: 'algorithms',
            type: 'get'
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('algorithms');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.a('array');
        result = await srv.send({
            channel: 'algorithms',
            type: 'get',
            data: {
                id: result.data[0].id
            }
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('algorithms');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.a('object');
    });
    it('should update an algorithms', async() => {
        let srv    = await Server('ws://localhost:8082');
        let data   = {
            name        : "echo",
            description : "Devuelve los mismos valores que se le envían",
            version     : "0.0.1",
            inputformat : "json",
            outputformat: "json",
            source      : "function run(values, process, ended) { ended(values); }"
        };
        let result = await srv.send({
            channel: 'algorithms',
            type: 'post',
            data
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('algorithms');
        expect(result.type).to.be.equal('confirm');
        expect(result.data.id).to.be.a('number');
        let id = result.data.id;
        result = await srv.send({
            channel: 'algorithms',
            type: 'put',
            data: {
                id,
                record: {
                    version: '0.0.2',
                    source: "function run(values, process, ended) { process(100); ended(values); }"
                }
            }
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('algorithms');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.a('number');
        expect(result.data).to.be.equal(1);
    });

    it('should delete an algorithms', async() => {
        let srv    = await Server('ws://localhost:8082');
        let data   = {
            name        : "DELETE TEST",
            description : "Devuelve los mismos valores que se le envían",
            version     : "0.0.1",
            inputformat : "json",
            outputformat: "json",
            source      : "function run(values, process, ended) { ended(values); }"
        };
        let result = await srv.send({
            channel: 'algorithms',
            type: 'post',
            data
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('algorithms');
        expect(result.type).to.be.equal('confirm');
        expect(result.data.id).to.be.a('number');
        let id = result.data.id;
        result = await srv.send({
            channel: 'algorithms',
            type: 'delete',
            data: {
                id
            }
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('algorithms');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.a('number');
        expect(result.data).to.be.equal(1);
        result = await srv.send({
            channel: 'algorithms',
            type: 'get',
            data: {
                id: id
            }
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('algorithms');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.a('object');
        expect(result.data).to.be.deep.equal({});
    });

});