import fs from 'node:fs'
import path from 'node:path'

// 递归扫描目录获取所有 md 文件
export function scanMdFiles(dir: string, baseDir: string = dir): string[] {
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
