const esbuild = require('esbuild');

esbuild
    .build({
        entryPoints: ['index.js'],
        outdir: 'dist',
        bundle: true,
        sourcemap: true,
        minify: false,
        splitting: false,
        format: 'esm',
        target: ['esnext']
    })
    .catch(() => process.exit(1));
