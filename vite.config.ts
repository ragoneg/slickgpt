import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit'

export default defineConfig({
	define: {
		__DATE__2: `'${new Date().toISOString()}'`,
		__RELOAD_SW__: false,
		// 'process.env.NODE_ENV': process.env.NODE_ENV === 'production' ? '"production"' : '"development"',
	},
	plugins: [sveltekit(), SvelteKitPWA({
		registerType: "autoUpdate",
		strategies: 'generateSW',
		srcDir: 'src',
		injectManifest: {
			globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}']
		},
		workbox: {
			globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}'],
			cleanupOutdatedCaches: true,
			sourcemap: true
		},
		devOptions: {
			enabled: true,
			type: 'module'
		},
		kit: {

		}
	})]
});
