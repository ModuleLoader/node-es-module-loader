import RegisterLoader from 'es-module-loader/core/register-loader.js';
import { InternalModuleNamespace as ModuleNamespace } from 'es-module-loader/core/loader-polyfill.js';

import { isNode, baseURI, pathToFileUrl, fileUrlToPath } from 'es-module-loader/core/common.js';
import { resolveUrlToParentIfNotPlain } from 'es-module-loader/core/resolve.js';
import { nodeFetch } from 'es-module-loader/core/fetch.js';

var babel = require('babel-core');
var path = require('path');
var Module = require('module');

function NodeESModuleLoader(baseKey) {
  if (!isNode)
    throw new Error('Node module loader can only be used in Node');

  baseKey = resolveUrlToParentIfNotPlain(baseKey || process.cwd(), baseURI) || baseKey;
  RegisterLoader.call(this, baseKey);

  var loader = this;
  
  // ensure System.register is available
  global.System = global.System || {};
  global.System.register = function() {
    loader.register.apply(loader, arguments);
  };
}
NodeESModuleLoader.prototype = Object.create(RegisterLoader.prototype);

var processCwdRequireContext = new Module(process.cwd());
processCwdRequireContext.paths = Module._nodeModulePaths(process.cwd());

// normalize is never given a relative name like "./x", that part is already handled
NodeESModuleLoader.prototype.normalize = function(key, parent, metadata) {
  var resolved = Module._resolveFilename(key.substr(0, 5) === 'file:' ? fileUrlToPath(key) : key, processCwdRequireContext, true);

  // core modules are returned as plain non-absolute paths
  return path.isAbsolute(resolved) ? pathToFileUrl(resolved) : resolved;
};

// instantiate just needs to run System.register
// so we fetch the source, convert into the Babel System module format, then evaluate it
NodeESModuleLoader.prototype.instantiate = function(key, metadata) {
  var loader = this;

  // first, try to load the module as CommonJS
  var nodeModule = tryNodeLoad(key.substr(0, 5) === 'file:' ? fileUrlToPath(key) : key);

  if (nodeModule)
    return Promise.resolve(new ModuleNamespace({
      default: nodeModule
    }));

  // otherwise, load as ES with Babel converting into System.register
  return new Promise(function(resolve, reject) {
    nodeFetch(key, undefined, function(source) {

      // transform source with Babel
      var output = babel.transform(source, {
        compact: false,
        filename: key + '!transpiled',
        sourceFileName: key,
        moduleIds: false,
        sourceMaps: 'inline',
        plugins: [require('babel-plugin-transform-es2015-modules-systemjs')]
      });

      // evaluate without require, exports and module variables
      // we leave module in for now to allow module.require access
      eval('var require,exports;' + output.code + '\n//# sourceURL=' + key + '!transpiled');
      loader.processRegisterContext(key);
      
      resolve();
    }, reject);
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