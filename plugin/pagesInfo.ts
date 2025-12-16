import { type Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

// 递归扫描目录获取所有 md 文件
function scanMdFiles(dir: string, baseDir: string = dir): string[] {
	const files: string[] = []
	const entries = fs.readdirSync(dir, { withFileTypes: true })

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name)
		if (entry.isDirectory()) {
			// 排除 node_modules 和 .vitepress 等目录
			if (!['node_modules', '.vitepress', '.git', 'dist'].includes(entry.name)) {
				files.push(...scanMdFiles(fullPath, baseDir))
			}
		} else if (entry.isFile() && entry.name.endsWith('.md')) {
			files.push(fullPath)
		}
	}

	return files
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