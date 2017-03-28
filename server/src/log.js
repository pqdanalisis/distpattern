// jshint esversion: 6, node: true
"use strict";

// Logging
const DESA = process.env.DESA;
global.warning = (...arg) => DESA ? console.info((new Date()).toISOString(), '- DISTPATTERN -', ...arg) : void(0);
global.log     = (...arg) => console.log((new Date()).toISOString(), '- DISTPATTERN -', ...arg);
global.error   = (...arg) => console.error((new Date()).toISOString(), '- DISTPATTERN - Error -', ...arg);

module.exports = {warning, log, error};
