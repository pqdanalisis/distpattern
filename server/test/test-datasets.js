// jshint esversion: 6, node: true
"use strict";

require('../src/index');
const Server    = require('../srv/server');
const expect    = require('chai').expect;
const WebSocket = require('ws');

describe('datasets websocket', function () {
    it('should connect to server', async() => {
        let srv = await Server('ws://localhost:8082');
        expect(srv).to.be.an('object');
    });
    it('should create a new dataset', async() => {
        let srv    = await Server('ws://localhost:8082');
        let data   = {
            name        : "datos de prueba",
            description : "Son sólo datos de prueba",
            format : "csv"
        };
        let result = await srv.send({
            channel: 'datasets',
            type: 'post',
            data
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('datasets');
        expect(result.type).to.be.equal('confirm');
        expect(result.data.id).to.be.a('number');
        expect(result.data.folder).to.be.a('string');
    });
    it('should get all datasets', async() => {
        let srv    = await Server('ws://localhost:8082');
        let result = await srv.send({
            channel: 'datasets',
            type: 'get'
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('datasets');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.a('array');
    });
    it('should get an datasets', async() => {
        let srv    = await Server('ws://localhost:8082');
        let result = await srv.send({
            channel: 'datasets',
            type: 'get'
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('datasets');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.a('array');
        result = await srv.send({
            channel: 'datasets',
            type: 'get',
            data: {
                id: result.data[0].id
            }
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('datasets');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.a('object');
    });
    it('should update an datasets', async() => {
        let srv    = await Server('ws://localhost:8082');
        let data   = {
            name        : "datos de prueba",
            description : "Son sólo datos de prueba",
            format : "csv"
        };
        let result = await srv.send({
            channel: 'datasets',
            type: 'post',
            data
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('datasets');
        expect(result.type).to.be.equal('confirm');
        expect(result.data.id).to.be.a('number');
        let id = result.data.id;
        result = await srv.send({
            channel: 'datasets',
            type: 'put',
            data: {
                id,
                record: {
                    format: 'json'
                }
            }
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('datasets');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.a('number');
        expect(result.data).to.be.equal(1);
        result = await srv.send({
            channel: 'datasets',
            type: 'get',
            data: {
                id: id
            }
        });
        expect(result.data.format).to.be.equal('json');
    });

    it('should delete an datasets', async() => {
        let srv    = await Server('ws://localhost:8082');
        let data   = {
            name        : "DELETE de prueba",
            description : "Son sólo datos de prueba",
            format : "csv"
        };
        let result = await srv.send({
            channel: 'datasets',
            type: 'post',
            data
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('datasets');
        expect(result.type).to.be.equal('confirm');
        expect(result.data.id).to.be.a('number');
        let id = result.data.id;
        result = await srv.send({
            channel: 'datasets',
            type: 'delete',
            data: {
                id
            }
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('datasets');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.a('number');
        expect(result.data).to.be.equal(1);
        result = await srv.send({
            channel: 'datasets',
            type: 'get',
            data: {
                id: id
            }
        });
        expect(result.ok).to.be.equal(true);
        expect(result.channel).to.be.equal('datasets');
        expect(result.type).to.be.equal('result');
        expect(result.data).to.be.an('object');
        expect(result.data).to.be.deep.equal({});
    });

});