import path from 'node:path'
import { rssPlugin } from 'vite-plugin-rss'
import { scanMdFiles } from './utils'
import fs from 'node:fs'
import matter from 'gray-matter'

function transformDate(date: string): Date {
	const [y, m, d] = date.split('/').map(Number)
	return new Date(y, m - 1, d)
}

export function rss(): ReturnType<typeof rssPlugin> {
	const rootDir = path.resolve(__dirname, '../blog/article')
	const mdFiles = scanMdFiles(rootDir)
	const articles = mdFiles.map(filePath => {
		const content = fs.readFileSync(filePath, 'utf-8')
		const { data: frontmatter } = matter(content) as unknown as { data: {
			description: string,
			title: string,
			pubDate: string
		} }
		const relativePath = path.relative(rootDir, filePath)
		const urlPath = relativePath
		const url = '/' + urlPath
			.replace(/\.md$/, '')
			.split('/')
			.map(encodeURIComponent)
			.join('/')
		const rawUrl = '/' + urlPath
		const data = {
			url: url,
			rawUrl,
			...frontmatter,
		}

		return data
	})
	return rssPlugin({
		mode: 'define',
		channel: {
			title: '里世界',
			link: 'https://leenet.xyz',
			description: 'Welcome To The World Of Lee',
			language: 'zh-CN',
			copyright: 'Mr.Lee',
		},
		items: articles.map(article => ({
			title: article.title,
			link: `https://leenet.xyz/article${article.url}`,
			description: article.description || '',
			pubDate: transformDate(article.pubDate),
			guid: `https://leenet.xyz/article${article.url}`,
			author: 'Mr.Lee',
		})),
	})
}