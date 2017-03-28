// jshint esversion: 6, node: true
"use strict";

// Logging
const DESA = process.env.DESA;
global.warning = (...arg) => DESA ? console.info((new Date()).toISOString(), '- DISTRIBUTEDJS -', ...arg) : void(0);
global.log     = (...arg) => console.log((new Date()).toISOString(), '- DISTRIBUTEDJS -', ...arg);
global.error   = (...arg) => console.error((new Date()).toISOString(), '- DISTRIBUTEDJS - Error -', ...arg);

module.exports = {warning, log, error};
