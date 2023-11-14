import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			runtime: 'nodejs18.x',
			maxDuration: 20000
		}),
		alias: {
			$misc: 'src/misc'
		},
		serviceWorker: {
			register: false
		}
	},
	preprocess: [
		vitePreprocess({
			postcss: true
		})
	]
};

export default config;
