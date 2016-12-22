var NodeESModuleLoader = require('../');

var loader = new NodeESModuleLoader('.');

loader.import('./src/node-es-module-loader.js').then(function(m) {
  console.log('Failed');
})
.catch(function (err) {
  if (err.toString().indexOf('require is not defined') !== -1)
    console.log('Ok');
  else
    console.log('Failed');
});
