// jshint esversion: 6, node: true
"use strict";


const fs     = require('fs');
const path   = require('path');
const expect = require('chai').expect;
const config = require('../../src/config.json');

describe('datafiles API', () => {
    let datasetFolder;
    before((done) => {
        let datasets = require('../../src/api/datasets');
        datasets.add({
            name  : 'test1',
            format: 'csv'
        }).then((result) => {
            datasetFolder = result.folder;
            done();
        }).catch(done);
    });
    afterEach((done) => {
        let folder = path.join(__dirname, config.rootFolder, datasetFolder);
        if (fs.existsSync(folder)) {
            fs.readdirSync(folder).forEach((file) => fs.unlinkSync(path.join(folder, file)));
        }
        done();
    });
    after((done) => {
        let folder = path.join(__dirname, config.rootFolder, datasetFolder);
        if (fs.existsSync(folder)) {
            fs.readdirSync(folder).forEach((file) => fs.unlinkSync(path.join(folder, file)));
            fs.rmdirSync(folder);
        }
        done();
    });
    it('should return and object', () => {
        let datafiles = require('../../src/api/datafiles');
        expect(datafiles).to.be.an('object');
    });
    it('should add one', (done) => {
        let datafiles = require('../../src/api/datafiles');
        datafiles.add(datasetFolder, 'test1.json', path.join(__dirname, '../files/integer-1m.json'), true).then((result) => {
            expect(result).to.be.equal(true);
            done();
        }).catch(done);
    });
    it('should add duplicated', (done) => {
        let datafiles = require('../../src/api/datafiles');
        datafiles.add(datasetFolder, 'test1.json', path.join(__dirname, '../files/integer-1m.json'), true).then((result) => {
            datafiles.add(datasetFolder, 'test1.json', path.join(__dirname, '../files/integer-3m.json'), true).then((result) => {
                expect(result).to.be.equal(true);
                done();
            }).catch(done);
        }).catch(done);
    });
    it('should get all', (done) => {
        let datafiles = require('../../src/api/datafiles');
        datafiles.add(datasetFolder, 'test10.json', path.join(__dirname, '../files/integer-1m.json'), true).then((result) => {
            expect(result).to.be.equal(true);
            datafiles.add(datasetFolder, 'test20.json', path.join(__dirname, '../files/integer-2m.json'), true).then((result) => {
                expect(result).to.be.equal(true);
                datafiles.lst(datasetFolder).then((result) => {
                    expect(result).to.be.an('array');
                    expect(result.length).to.be.equal(2);
                    expect(result[0]).to.be.equal('test10.json');
                    expect(result[1]).to.be.equal('test20.json');
                    done();
                });
            });
        }).catch((err) => {
            console.error(err);
            done(err)
        });
    });
    it('should get reference', (done) => {
        let datafiles = require('../../src/api/datafiles');
        datafiles.add(datasetFolder, 'test10.json', path.join(__dirname, '../files/integer-1m.json'), true).then((result) => {
            expect(result).to.be.equal(true);
            datafiles.add(datasetFolder, 'test20.json', path.join(__dirname, '../files/integer-2m.json'), true).then((result) => {
                expect(result).to.be.equal(true);
                datafiles.lst(datasetFolder).then((result) => {
                    expect(result).to.be.an('array');
                    expect(result.length).to.be.equal(2);
                    expect(result[0]).to.be.equal('test10.json');
                    expect(result[1]).to.be.equal('test20.json');
                    datafiles.get(datasetFolder, result[0]).then((req) => {
                        expect(req).to.be.equal(config.urlFiles + datasetFolder + '/' + result[0]);
                        done();
                    });
                });
            });
        }).catch((err) => {
            console.error(err);
            done(err)
        });
    });
    it('should delete file', (done) => {
        let datafiles = require('../../src/api/datafiles');
        datafiles.add(datasetFolder, 'test10.json', path.join(__dirname, '../files/integer-1m.json'), true).then((result) => {
            expect(result).to.be.equal(true);
            datafiles.add(datasetFolder, 'test20.json', path.join(__dirname, '../files/integer-2m.json'), true).then((result) => {
                expect(result).to.be.equal(true);
                datafiles.del(datasetFolder, 'test10.json').then((result) => {
                    datafiles.lst(datasetFolder).then((result) => {
                        expect(result).to.be.an('array');
                        expect(result.length).to.be.equal(1);
                        expect(result[0]).to.be.equal('test20.json');
                        done();
                    });
                });
            });
        }).catch((err) => {
            console.error(err);
            done(err)
        });
    });
    it('should not delete non exist file', (done) => {
        let datafiles = require('../../src/api/datafiles');
        datafiles.del(datasetFolder, 'wrong.json').then((result) => {
            expect(result).to.be.equal(false);
            done();
        }).catch((err) => {
            console.error(err);
            done(err)
        });
    });
    it('should remove all', (done) => {
        let datafiles = require('../../src/api/datafiles');
        datafiles.add(datasetFolder, 'test10.json', path.join(__dirname, '../files/integer-1m.json'), true).then((result) => {
            expect(result).to.be.equal(true);
            datafiles.add(datasetFolder, 'test20.json', path.join(__dirname, '../files/integer-2m.json'), true).then((result) => {
                expect(result).to.be.equal(true);
                datafiles.remove(datasetFolder).then((result) => {
                    datafiles.lst(datasetFolder).then((result) => {
                        expect(result).to.be.an('array');
                        expect(result.length).to.be.equal(0);
                        done();
                    });
                });
            });
        }).catch((err) => {
            console.error(err);
            done(err)
        });
    });
});
