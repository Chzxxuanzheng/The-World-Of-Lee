import { type Plugin } from 'vite'
import MarkdownIt from 'markdown-it'
import container from 'markdown-it-container'
import anchor from 'markdown-it-anchor'
import { HTMLElement, HTMLSpanElement, parseHTML } from 'linkedom'
import { codeToHtml } from 'shiki'
import {
	transformerNotationDiff,
	transformerNotationHighlight,
	transformerNotationFocus,
	transformerNotationErrorLevel,
	transformerMetaWordHighlight,
} from '@shikijs/transformers'

import { transformerColorizedBrackets } from '@shikijs/colorized-brackets'

import fs from 'node:fs'
import matter from 'gray-matter'
import type Token from 'markdown-it/lib/token.mjs'

const languageAliases: Record<string, string> = {
	'js': 'JavaScript',
	'ts': 'TypeScript',
	'py': 'Python',
	'rs': 'Rust',
	'cpp': 'C++',
	'c': 'C',
	'cs': 'C#',
	'java': 'Java',
	'go': 'Go',
	'rb': 'Ruby',
	'swift': 'Swift',
	'kt': 'Kotlin',
	'sh': 'Shell',
	'md': 'Markdown',
	'html': 'HTML',
	'css': 'CSS',
}

const fullNames = Object.values(languageAliases)
for (const name of fullNames) {
	languageAliases[name.toLowerCase()] = name
}

function getLang(info: string): string {
	// 匹配开头的语言名称,直到遇到 { 或 : 或字符串结束
	const match = new RegExp(/^([a-zA-Z0-9]+)/).exec(info)
	if (!match)
		// eslint-disable-next-line no-console
		console.warn(`无法识别的语言: ${info}`)
	const lang = (match ? match[1] : 'txt')
	return languageAliases[lang.toLowerCase()] ?? lang
}

function getLineNumbersOption(info: string): { needLineNumbers: boolean; startLine: number } {
	const lineNumbersMatch = /line-numbers(?:=(\d+))?/.exec(info)
	if (lineNumbersMatch) {
		return {
			needLineNumbers: true,
			startLine: lineNumbersMatch[1] ? Number.parseInt(lineNumbersMatch[1], 10) : 1,
		}
	}
	return {
		needLineNumbers: false,
		startLine: 1,
	}
}

function getName(info: string): string {
	const name = /{name:([^}]+)}/.exec(info)
	return name ? name[1] : getLang(info)
}

function parserLineNumbers(html: string, info: HighlightInfo): [string, number] {
	const { document } = parseHTML(html)
	const pre: HTMLElement = document.children[0] as HTMLElement
	const code: HTMLElement = pre.children[0] as HTMLElement
	const baseLineNumber = info.startLine
	let lineCount = 0
	let removeCount = 0
	for (const line of code.children.slice(0, -1) as HTMLSpanElement[]) {
		let lineNumber = baseLineNumber + lineCount
		if (line.classList.has('remove')) removeCount ++
		if (line.classList.has('add')) {
			lineCount --
			lineNumber -= removeCount
			removeCount --
			if (removeCount < 0) removeCount = 0
		}
		lineCount ++ 

		if (info.needLineNumbers) {
			const lineNumberSpan = document.createElement('span') as HTMLSpanElement
			lineNumberSpan.className = 'line-number'
			lineNumberSpan.textContent = lineNumber.toString()
			line.insertBefore(lineNumberSpan, line.firstChild)
		}
	}
	// eslint-disable-next-line @typescript-eslint/no-base-to-string
	return [pre.toString(), lineCount]
}

function createCustomBlock(md: MarkdownIt, tagName: string, defaultName: string): void {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	md.use(container as any, tagName, {
		validate: (params: string) => {
			return new RegExp(`^${tagName}\\s*(.*)$`).exec(params.trim())
		},

		render: (tokens: Token[], idx: number) => {
			const m = new RegExp(`^${tagName}\\s*(.*)$`).exec(tokens[idx].info.trim())

			if (tokens[idx].nesting === 1) {
				const name = md.utils.escapeHtml(m?.[1] || defaultName)
				return `<div class="${tagName} custom-block"><p class="custom-block-title">${name}</p>\n`
			} else {
				return '</div>\n'
			}
		},
	})
}

interface CodeBaseInfo {
	lang: string
	name: string
}

interface HighlightInfo extends CodeBaseInfo {
	content: Promise<string>
	needLineNumbers: boolean
	startLine: number
	groupId: number
}

async function parseFrontMatter(content: string): Promise<string> {
	const highlightMap = new Map<string, HighlightInfo>()
	const codeGroupInfoMap = new Map<string, CodeBaseInfo[]>()
	let codeInfo: CodeBaseInfo[]
	let codeBlockFlag = false
	// 创建 markdown-it 实例
	const md: MarkdownIt = new MarkdownIt({
		html: true,
		linkify: true,
		typographer: true,
		breaks: false,
		langPrefix: 'language-',
		highlight: (str: string, info: string) => {
			// 使用 shiki 进行代码高亮
			if(codeBlockFlag) codeInfo.push({
				lang: getLang(info),
				name: getName(info),
			})
			const id = crypto.randomUUID()
			const promise = codeToHtml(str, {
				lang: getLang(info).toLowerCase(),
				themes: {
					light: 'min-light',
					dark: 'min-dark',
				},
				defaultColor: false,
				transformers: [
					transformerNotationDiff(), 
					transformerNotationHighlight(),
					transformerNotationFocus(),
					transformerNotationErrorLevel(),
					transformerMetaWordHighlight(),
					transformerColorizedBrackets(),
				],
			}).catch(e=>{
				// eslint-disable-next-line no-console
				console.error(e)
				return md.utils.escapeHtml(str)
			})
			highlightMap.set(id, {
				content: promise,
				lang: getLang(info),
				name: getName(info),
				...getLineNumbersOption(info),
				groupId: codeBlockFlag ? codeInfo.length : 0,
			})
			return `<!-- highlight-id=${id} -->`
		},
	})

	// 覆盖默认的 fence 渲染规则，避免生成 <pre><code> 包裹
	md.renderer.rules.fence = (tokens, idx, options, _env, _self) => {
		const token = tokens[idx]
		const info = token.info ? md.utils.unescapeAll(token.info).trim() : ''
		const content = token.content

		return options.highlight!(content, info, '') || md.utils.escapeHtml(content)
	}

	// 添加锚点插件
	md.use(anchor, {
		permalink: anchor.permalink.linkInsideHeader({
			symbol: '',
			placement: 'before',
			renderHref: (slug: string) => {
				return '#' + slug.slice(2)
			},
		}),
		slugify: (s: string) => 'h-' + s.replaceAll(' ', '-')
			.replaceAll(':', '：'),
	})

	// 自定义容器
	createCustomBlock(md, 'info', '补充')
	createCustomBlock(md, 'tip', '提示')
	createCustomBlock(md, 'warning', '注意')
	createCustomBlock(md, 'danger', '警告')
	createCustomBlock(md, 'details', '查看详情')

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	md.use(container as any, 'details', {
		validate: (params: string) => {
			return /^details\s*(.*)$/.exec(params.trim())
		},

		render: (tokens: Token[], idx: number) => {
			const m = /^details\s*(.*)$/.exec(tokens[idx].info.trim())

			if (tokens[idx].nesting === 1) {
				const name = md.utils.escapeHtml(m?.[1] ?? 'details')
				return `<details class="details custom-block"><summary>${name}</summary>\n`
			} else {
				return '</details>\n'
			}
		},
	})

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	md.use(container as any, 'code-group', {
		validate: (params: string) => {
			return /^code-group\s*(.*)$/.exec(params.trim())
		},

		render: (tokens: Token[], idx: number) => {
			if (tokens[idx].nesting === 1) {
				const id = crypto.randomUUID()
				codeGroupInfoMap.set(id, [])
				codeInfo = codeGroupInfoMap.get(id)!
				codeBlockFlag = true
				return `<div class="custom-block normally"><!-- code-group-id=${id} -->\n`
			} else {
				codeBlockFlag = false
				return '</code-group></div>\n'
			}
		},
	})

	let html = md.render(content)

	// 处理高亮代码块占位符
	for (const [id, info] of highlightMap) {
		const re = parserLineNumbers(await info.content, info)
		let code = re[0]
		const lineCount = re[1]
		code = `<code-block :info='${JSON.stringify({
			...info,
			lineCount,
		})}'>${code}</code-block>`
		if (info.groupId)
			code = `<template #code-${info.groupId}>${code}</template>`
		else
			code = `<div class="custom-block normally">${code}</div>`
		html = html.replace(`<!-- highlight-id=${id} -->`, code)
	}

	// 处理代码组占位符
	for (const [id, groupInfo] of codeGroupInfoMap) {
		html = html.replace(`<!-- code-group-id=${id} -->`, `<code-group :code-infos='${JSON.stringify(groupInfo)}'>`)
	}

	return html
}

export default function mdBuilderPlugin(): Plugin {
	return {
		name: 'vite-plugin-md-builder',
		async transform(_code, id) {
			// 只处理 .md 文件
			if (!id.endsWith('.md')) {
				return null
			}

			// 读取文件内容
			const fileContent = fs.readFileSync(id, 'utf-8')
            
			// 解析 front matter
			const { content } = matter(fileContent)
            

			// 将 Markdown 转换为 HTML
			const html = await parseFrontMatter(content)
            
			return {
				code: `
<template>
  <div class="markdown-content">
    ${html}
  </div>
</template>
				`,
				map: null,
			}

		},
		handleHotUpdate({ file, server }) {
			// 监听 .md 文件的变化
			if (file.endsWith('.md')) {
				// 触发模块重新加载
				const module = server.moduleGraph.getModuleById(file)
				if (module) {
					server.moduleGraph.invalidateModule(module)
				}
				// 通知客户端更新
				server.ws.send({
					type: 'full-reload',
					path: '*',
				})
			}
		},
	}
}