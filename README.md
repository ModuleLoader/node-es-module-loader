NodeJS ES Module Loader
===

Loads ES modules and WebAssembly with CJS interop in Node, roughly according to https://github.com/nodejs/node-eps/blob/master/002-es6-modules.md.

_WASM support is currently only provided for Node 8 nightly._

Follows the NodeJS resolution algorithm, loading modules first as CJS and then falling back to ES on import or export syntax failures.
This effectively provides the "export {}" assumption to load an ES module.

This does mean a double-parse, over the mjs approach currently being taken by Node.

Built with the ES Module Loader polyfill 1.0 branch at https://github.com/ModuleLoader/es-module-loader.

### Installation

```
npm install -g node-es-module-loader
```

### Usage

Execute an ES module file:

```
node-esml module.js
```

For example, where `module.js` contains:

```javascript
import fs from 'fs';
import {fn} from './local-es-module.js';
import {wasmFn} from './local-wasm-binary.wasm';
```

Note that only the default import form for CommonJS modules is supported.

Also supports dynamic loading via the dynamic import syntax:

```javascript
export function lazyLoad(path) {
  return import(path);
}
```

Source maps for errors are fully supported through the [source-map-support project](https://github.com/evanw/node-source-map-support).

Source maps also work in Node 6 with the `node --inspect` flag via:

```
node --inspect node_modules/.bin/node-esml module.js
```

### Programmatic Usage

```javascript
var NodeESModuleLoader = require('node-es-module-loader');

var loader = new NodeESModuleLoader(/* optional basePath */);

loader.import('x').then(function(m) {
  // ...
});
```

## Caveats

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
