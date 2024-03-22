const path = require('path')
const rollup = require('rollup')
const babel = require('@rollup/plugin-babel')
const terser = require('@rollup/plugin-terser')
const resolve = require('@rollup/plugin-node-resolve')

function joinRoot(...paths) {
  return path.join(__dirname, ...paths)
}

const extensions = ['.ts', '.js']

/** @type {rollup.RollupOptions[]} */
module.exports = [
  // UMD build
  {
    input: './src/index.ts',
    output: [
      {
        format: 'umd',
        name: 'ef',
        file: joinRoot('dist/umd/index.js'),
        sourcemap: true,
      },
      {
        format: 'umd',
        name: 'ef',
        file: joinRoot('dist/umd/index.min.js'),
        sourcemap: true,
        plugins: [
          terser()
        ]
      }
    ],
    plugins: [
      resolve({ extensions }),
      babel({
        extensions,
        babelHelpers: 'bundled'
      })
    ]
  },

  // ESM and CommonJS build
  {
    input: './src/index.ts',
    output: [
      {
        dir: joinRoot('dist/lib'),
        format: 'commonjs',
        preserveModules: true
      },
      {
        dir: joinRoot('dist/es'),
        format: 'es',
        preserveModules: true
      },
    ],
    plugins: [
      resolve({ extensions }),
      babel({
        extensions,
        babelHelpers: 'bundled'
      })
    ]
  }
]
