#!/usr/bin/env node
var LoaderNodeBabel = require('../dist/node-es-module-loader.js');
var path = require('path');

var filename = process.argv[2];

if (!filename)
  throw new Error('No filename argument provided');

global.loader = new LoaderNodeBabel();

loader.import(path.resolve(filename))
.catch(function(err) {
  setTimeout(function() {
    throw err;
  });
});
