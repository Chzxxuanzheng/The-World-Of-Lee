import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { pagesInfoPlugin } from './plugin/pagesInfo'
import md from './plugin/mdBuilder'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		md(),
		vue({
			include: [/\.vue$/, /\.md$/],
		}),
		pagesInfoPlugin(),
	],
	resolve: {
		alias: {
			'@': '/src',
			'#': '/blog',
		},
	},
})
