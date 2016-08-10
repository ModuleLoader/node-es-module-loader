import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'src/node-es-module-loader.js',
  format: 'umd',
  moduleName: 'NodeESModuleLoader',
  dest: 'dist/node-es-module-loader.js',

  plugins: [
    nodeResolve({
      module: false,
      jsnext: false,
    })
  ],

  // skip rollup warnings (specifically the eval warning)
  onwarn: function() {}
};