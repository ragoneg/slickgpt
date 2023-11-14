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
		injectRegister: 'auto',
		strategies: 'generateSW',
		srcDir: 'src',
		scope: '/',
		base: '/',
		selfDestroying: process.env.SELF_DESTROYING_SW === 'true',
		manifest: {
			short_name: 'GPT PWA',
			name: 'GPT PWA',
			start_url: '/',
			scope: '/',
			display: 'standalone',
			theme_color: "#ffffff",
			background_color: "#ffffff",
			icons: [
				{
					src: '/pwa-192x192.png',
					sizes: '192x192',
					type: 'image/png',
				},
				{
					src: '/pwa-512x512.png',
					sizes: '512x512',
					type: 'image/png',
				},
				{
					src: '/pwa-512x512.png',
					sizes: '512x512',
					type: 'image/png',
					purpose: 'any maskable',
				},
			],
		},
		injectManifest: {
			globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}']
		},
		// injectManifest: {
		// 	injectionPoint: undefined
		// },
		workbox: {
			globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}'],
			cleanupOutdatedCaches: true,
			sourcemap: true
		},
		devOptions: {
			enabled: false,
			type: 'module'
		},
		kit: {

		}
	})]
});
