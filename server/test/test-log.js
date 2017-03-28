// jshint esversion: 6, node: true
"use strict";

const path                  = require('path');
const expect                = require('chai').expect;
const {warning, log, error} = require('../src/log');

describe('log', function() {
   it('shoud return three functions', function() {
       expect(warning).to.be.a('function');
       expect(log).to.be.a('function');
       expect(error).to.be.a('function');
       warning('test warning');
       log('test log');
       error('test error');
   });
    it('shoudn\'t write an info message without DESA enviroment variable', function(done) {
        const D = process.env.DESA;
        process.env.DESA = '';
        delete require.cache[require.resolve('../src/log')];
        const {warning} = require('../src/log');
        const i = console.info;
        console.info = function(...arg) {
            done('error');
        };
        setTimeout(function() {
            process.env.DESA = D;
            console.info = i;
            done();
        }, 500);
        warning('test warning');
    });
    it('shoud write an info message with DESA enviroment variable', function(done) {
        const D = process.env.DESA;
        process.env.DESA = 'TRUE';
        delete require.cache[require.resolve('../src/log')];
        const {warning} = require('../src/log');
        const i = console.info;
        console.info = function(...arg) {
            expect(new Date(arg[0])).to.be.a('date');
            expect(arg[1]).to.be.equal('- DISTPATTERN -');
            expect(arg[2]).to.be.equal('test warning');
            console.info = i;
            done();
        };
        warning('test warning');
    });
    it('shoud write a log message', function(done) {
        const l = console.log;
        console.log = function(...arg) {
            expect(new Date(arg[0])).to.be.a('date');
            expect(arg[1]).to.be.equal('- DISTPATTERN -');
            expect(arg[2]).to.be.equal('test log');
            console.log = l;
            done();
        };
        log('test log');
    });
    it('shoud write a error message', function(done) {
        const e = console.error;
        console.error = function(...arg) {
            expect(new Date(arg[0])).to.be.a('date');
            expect(arg[1]).to.be.equal('- DISTPATTERN - Error -');
            expect(arg[2]).to.be.equal('test error');
            console.error = e;
            done();
        };
        error('test error');
    });
});