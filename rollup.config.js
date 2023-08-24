import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
    input: 'src/index.ts',
    plugins: [
        typescript({
            outDir: 'dist',
            declaration: true,
            declarationDir: 'dist/types',
        }),
        resolve({
            preferBuiltins: true,

        }),
        commonjs(),
        json(),
    ],
    watch: {
        include: 'src/**',
    },
    output: [
        {
            dir: 'dist',
            format: 'esm',
            sourcemap: true,
        },
    ],
    external: [
        'xmlbuilder',
        'typeorm'
    ],
};
