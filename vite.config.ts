import { defineConfig } from 'vite'
import { pagesInfoPlugin } from './plugin/pagesInfo'
import md from './plugin/mdBuilder'
import yaml from '@modyfi/vite-plugin-yaml'
import vue from '@vitejs/plugin-vue'
import { rss } from './plugin/rss'


// https://vite.dev/config/
export default defineConfig({
	plugins: [
		// sass(),
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
})