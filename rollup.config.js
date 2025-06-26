import typescript from 'rollup-plugin-typescript2';
import ts from 'typescript';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      typescript({
        typescript: ts,
        clean: true
      })
    ],
    external: []
  }
]; 