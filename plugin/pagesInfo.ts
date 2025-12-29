import { type Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import { scanMdFiles } from './utils'

interface ReadingTimeInfo {
	minutes: number
	words: number
}

/**
 * 估算阅读时间
 * 规则：
 * 1. 中文按字符计 (400字/分钟)
 * 2. 英文(含代码)按单词计 (275词/分钟)
 * 3. 图片按递减时间计 (12s, 11s...3s)
 */
function getReadingTime(content: string): ReadingTimeInfo {
	let charCountCN = 0
	let wordCountEN = 0
	let imageCount = 0

	const md: MarkdownIt = new MarkdownIt()
	const tokens = md.parse(content, {})

	for (const token of tokens) {
		// 统计图片
		if (token.type === 'image') {
			imageCount++
		}

		// 获取需要统计的文本内容
		let content = ''
        
		// 1. 行内文本 (包含折叠块内的文本)
		if (token.type === 'inline' && token.children) {
			for (const child of token.children) {
				if (child.type === 'text' || child.type === 'code_inline') {
					content += child.content
				}
			}
		} 
		// 2. 代码块 (fence) 和缩进代码块 (code_block)
		else if (token.type === 'fence' || token.type === 'code_block') {
			content += token.content
		}

		if (content) {
			// 移除空白字符用于统计中文
			const cleanContent = content.trim()
            
			// 匹配中文字符 (CJK)
			const cnMatches = cleanContent.match(/[\u4e00-\u9fa5]/g)
			charCountCN += cnMatches ? cnMatches.length : 0

			// 移除中文字符，统计剩下的英文单词 (以非单词字符分割)
			const enText = cleanContent.replaceAll(/[\u4e00-\u9fa5]/g, ' ')
			const enMatches = enText.match(/[a-zA-Z0-9_\u0392-\u03c9\u0400-\u04FF]+/g)
			wordCountEN += enMatches ? enMatches.length : 0
		}
	}

	// 计算时间 (单位: 分钟)
	const timeCN = charCountCN / 400
	const timeEN = wordCountEN / 275

	// 图片时间计算 (Medium 算法)
	let timeImageSeconds = 0
	for (let i = 0; i < imageCount; i++) {
		if (i < 10) {
			timeImageSeconds += 12 - i
		} else {
			timeImageSeconds += 3
		}
	}
	const timeImage = timeImageSeconds / 60

	return {
		minutes: Math.ceil(timeCN + timeEN + timeImage),
		words: charCountCN + wordCountEN,
	}
}

export function pagesInfoPlugin(): Plugin {
	const virtualModuleId = 'virtual:pages-info'
	const resolvedVirtualModuleId = '\0' + virtualModuleId

	return {
		name: 'vite-plugin-pages-info',

		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId
			}
		},

		load(id) {
			if (id === resolvedVirtualModuleId) {
				// 扫描根目录
				const rootDir = path.resolve(__dirname, '../blog')
				const mdFiles = scanMdFiles(rootDir)

				const articles = mdFiles.map(filePath => {
					const content = fs.readFileSync(filePath, 'utf-8')
					const { data: frontmatter } = matter(content)
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
						title: frontmatter.title || path.basename(filePath, '.md'),
						...frontmatter,
						...getReadingTime(content),
					}

					return data
				})

				return `export default ${JSON.stringify(articles, null, 2)}`
			}
		},

		// 支持 HMR
		handleHotUpdate({ file, server }) {
			if (file.endsWith('.md')) {
				const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
				if (mod) {
					server.moduleGraph.invalidateModule(mod)
					server.ws.send({ type: 'full-reload' })
				}
			}
		},
	}
}