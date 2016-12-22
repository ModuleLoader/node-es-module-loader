import RegisterLoader from 'es-module-loader/core/register-loader.js';
import { ModuleNamespace } from 'es-module-loader/core/loader-polyfill.js';

import { isNode, baseURI, pathToFileUrl, fileUrlToPath } from 'es-module-loader/core/common.js';
import { resolveIfNotPlain } from 'es-module-loader/core/resolve.js';

var babel = require('babel-core');
var modulesRegister = require('babel-plugin-transform-es2015-modules-systemjs');
var importSyntax = require('babel-plugin-syntax-dynamic-import');
var path = require('path');
var Module = require('module');
var fs = require('fs');

var sourceMapSources = global.nodeEsModuleLoaderSourceMapSources = global.nodeEsModuleLoaderSourceMapSources || {};

require('source-map-support').install({
  retrieveSourceMap: function(source) {
    if (!sourceMapSources[source])
      return null;

    return {
      url: source.replace('!transpiled', ''),
      map: sourceMapSources[source]
    };
  }
});

function NodeESModuleLoader(baseKey, rcPath) {
  if (!isNode)
    throw new Error('Node module loader can only be used in Node');

  if (baseKey)
    this.baseKey = resolveIfNotPlain(baseKey, baseURI) || resolveIfNotPlain('./' + baseKey, baseURI);
  else
    this.baseKey = baseURI;

  if (this.baseKey[this.baseKey.length - 1] !== '/')
    this.baseKey += '/';

  if (rcPath) {
    if (typeof rcPath !== 'string')
      throw new TypeError('Second argument to Node loader must be a valid file path to the babelrc file.');
    this.rcPath = rcPath;
  }

  RegisterLoader.call(this);

  var loader = this;

  // ensure System.register is available
  global.System = global.System || {};
  global.System.register = function() {
    loader.register.apply(loader, arguments);
  };
}
NodeESModuleLoader.prototype = Object.create(RegisterLoader.prototype);

// normalize is never given a relative name like "./x", that part is already handled
NodeESModuleLoader.prototype[RegisterLoader.resolve] = function(key, parent) {
  parent = parent || this.baseKey;
  key = RegisterLoader.prototype[RegisterLoader.resolve].call(this, key, parent) || key;

  return Promise.resolve()
  .then(function() {
    var parentPath = fileUrlToPath(parent);
    var requireContext = new Module(parentPath);
    requireContext.paths = Module._nodeModulePaths(parentPath);
    var resolved = Module._resolveFilename(key.substr(0, 5) === 'file:' ? fileUrlToPath(key) : key, requireContext, true);

    // core modules are returned as plain non-absolute paths
    return path.isAbsolute(resolved) ? pathToFileUrl(resolved) : resolved;
  });
};

// instantiate just needs to run System.register
// so we fetch the source, convert into the Babel System module format, then evaluate it
NodeESModuleLoader.prototype[RegisterLoader.instantiate] = function(key, processAnonRegister) {
  var loader = this;

  // first, try to load the module as CommonJS
  var nodeModule = tryNodeLoad(key.substr(0, 5) === 'file:' ? fileUrlToPath(key) : key);

  if (nodeModule)
    return Promise.resolve(new ModuleNamespace({
      default: nodeModule
    }));

  // otherwise, load as ES with Babel converting into System.register
  return new Promise(function(resolve, reject) {
    fs.readFile(fileUrlToPath(key), function(err, source) {
      if (err)
        return reject(err);

      // transform source with Babel
      var output = babel.transform(source, {
        compact: false,
        filename: key + '!transpiled',
        sourceFileName: key,
        moduleIds: false,
        sourceMaps: 'both',
        plugins: [importSyntax, modulesRegister],
        extends: loader.rcPath
      });

      // evaluate without require, exports and module variables
      var path = fileUrlToPath(key) + '!transpiled';
      output.map.sources = output.map.sources.map(fileUrlToPath);
      sourceMapSources[path] = output.map;
      (0,eval)(output.code + '\n//# sourceURL=' + path);
      processAnonRegister();

      resolve();
    });
  });
};

function tryNodeLoad(path) {
  try {
    return require(path);
  }
  catch(e) {
    if (e instanceof SyntaxError &&
        (e.message.indexOf('Unexpected token export') !== -1 ||
        e.message.indexOf('Unexpected token import') !== -1 ||
        e.message.indexOf('Unexpected reserved word') !== -1))
      return;
    throw e;
  }
}

export default NodeESModuleLoader;
