NodeJS ES Module Loader
===

Loads ES modules with CJS interop in Node according to https://github.com/nodejs/node-eps/blob/master/002-es6-modules.md.

Follows the NodeJS resolution algorithm, loading modules first as CJS and then falling back to ES on import or export syntax failures.
This effectively provides the "export {}" assumption to load an ES module.

Built with the ES Module Loader polyfill 1.0 branch at https://github.com/ModuleLoader/es-module-loader.

Caveats:
- Does not currently support the "module" package.json proposal described in the second paragraph at 
  https://github.com/nodejs/node-eps/blob/master/002-es6-modules.md#51-determining-if-source-is-an-es-module
- Does not allow any loading of ES modules from within CommonJS itself
- Does not implement global require filtering described in 
  https://github.com/nodejs/node-eps/blob/master/002-es6-modules.md#521-removal-of-non-local-dependencies
- Does not provide CJS exports as named exports, skipping the algorithm defined in
  https://github.com/nodejs/node-eps/blob/master/002-es6-modules.md#311-dynamicmodulecreateo
  this may change, pending Node implementation intentions 

Alternative Babel options can be set with a local .babelrc file.

LICENSE
---

MIT