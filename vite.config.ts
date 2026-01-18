import { defineConfig } from 'vite'
import { pagesInfoPlugin } from './plugin/pagesInfo'
import md from './plugin/mdBuilder'
import yaml from '@modyfi/vite-plugin-yaml'
import vue from '@vitejs/plugin-vue'
import { rss } from './plugin/rss'

const env = process.env

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		yaml(),
		md(),
		vue({
			include: [/\.vue$/, /\.md$/],
		}),
		pagesInfoPlugin(),
		rss(),
	],
	resolve: {
		alias: {
			'@': '/src',
			'#': '/blog',
		},
	},
	base: env.VITE_CDN_BASE || './',
})