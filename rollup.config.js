import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

import { createHtml } from "./config/plugins/create-html";
import { replaceSwResourceList } from "./config/plugins/replace-service-worker-resources";
import { replaceServiceWorkerUrl } from "./config/plugins/replace-service-worker-url";

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let server;
	
	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

export default {
	input: {
		main: 'src/main.ts',
		sw: 'src/service-worker.ts'
	},
	output: {
		sourcemap: true,
		format: 'es',
		name: 'app',
		dir: 'build',
		entryFileNames: '[name].[hash].js',
		chunkFileNames: '[name].[hash].js',
		assetFileNames: '[name].[hash][extname]',
	},
	plugins: [
		svelte({
			// enable run-time checks when not in production
			dev: !production,
			// we'll extract any component CSS out into
			// a separate file - better for performance
			css: css => {
				css.write(css.filename);
			},
			preprocess: sveltePreprocess(),
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),
		typescript({ sourceMap: !production }),
		createHtml(),
		copy({
			targets:[
				{ src: 'public/global.css', dest: 'build/' },
				{ src: 'public/manifest.json', dest: 'build/' }
			]
		}),
		replaceSwResourceList(),
		replaceServiceWorkerUrl(),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser(),
	],
	watch: {
		clearScreen: false
	}
};
