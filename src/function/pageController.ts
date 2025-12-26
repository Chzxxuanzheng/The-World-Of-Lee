import pagesInfo, { type PageInfo } from 'virtual:pages-info'
import { type Component, computed, type ComputedRef, shallowRef } from 'vue'

interface PageInfoMap {
	[dict: string]: PageInfo | PageInfoMap
}

export interface MdPageData extends PageInfo {
	type: 'page'
}

export interface IndexData {
	[key: string]: unknown
	type: 'index'
	url: string
	title: string
	description: string
	component: () => Promise<{default: Component}>
	args?: object
}

export interface SpPageData {
	[key: string]: unknown
	component: () => Promise<{default: Component}>
	url: string
	title: string
	description: string
	type: 'page'
	noOutline?: boolean
	noComments?: boolean
}

export interface NotFoundData {
	[key: string]: unknown
	type: '404'
	title: string
	description: string
	component: () => Promise<{default: Component}>
	url: string
	noOutline: true
	noComments: true
}

export type SpAbsPageData = IndexData | SpPageData

export type ExistPageData = MdPageData | SpPageData

export type PageData = ExistPageData | NotFoundData

export type AbsPageData = ExistPageData | IndexData | NotFoundData

const pagesInfoMap: PageInfoMap = {}

function addPageToMap(...args: [...string[], PageInfo]) {
	const page = args.pop() as PageInfo
	const name = args.pop() as string
	let currentMap: PageInfoMap = pagesInfoMap
	for (const segment of args as string[]) {
		if (!(segment in currentMap)) {
			currentMap[segment] = {}
		}
		currentMap = currentMap[segment] as PageInfoMap
	}
	currentMap[name] = page
}

for (const page of pagesInfo) {
	const segments = page.url.split('/').slice(1) // 去掉开头的空字符串
	const name = segments.pop()!
	addPageToMap(...segments, name, page)
}

export interface ArticlePageData extends MdPageData {
	pubDate: string
	description: string
	abstract: string
}

const renderFuncMap = import.meta.glob('/blog/**/*.md', {import: 'default'})

const specialPageMap: Record<string, SpAbsPageData> = {
	'/article': {
		type: 'index',
		component: () => import('@/components/SpecialPages/ArticleIndex.vue'),
		title: '杂谈',
		description: '记录一些杂七杂八的东西',
		url: '/article',
	},
	'/edu': {
		type: 'page',
		component: () => import('@/components/SpecialPages/NoWriting.vue'),
		title: '教程',
		description: '一些编程相关的教程',
		url: '/edu',
		noOutline: true,
		noComments: true,
	},
	'/links': {
		type: 'page',
		component: () => import('@/components/SpecialPages/Friends.vue'),
		title: '友链',
		description: '友情链接',
		url: '/links',
		noOutline: true,
	},
	'/about': {
		type: 'page',
		component: () => import('#/About.md'),
		title: '关于',
		description: '有什么想要了解的吗？',
		url: '/about',
	},
}

function clearPath(fullPath: string): string {
	let path = fullPath.split('?')[0]?.split('#')[0] || '/'
	if (path.endsWith('/') && path.length > 1) {
		path = path.slice(0, -1)
	}
	return path
}

function getParentPath(fullPath: string): string {
	const path = clearPath(fullPath)
	const segments = path.split('/').filter((s) => s.length > 0)
	segments.pop()
	return '/' + segments.join('/')
}

function notFound(url: string): NotFoundData {
	return {
		type: '404',
		url,
		title: '高考作文网',
		component: () => import('#/404.md'),
		description: '仅需114514元，助力语文高考！海量试题，名师解析！',
		noOutline: true,
		noComments: true,
	}
}

export type PathType = 'index' | 'page' | '404'

const PageController = {
	_currentPath: shallowRef('/article'),
	/**
	 * 获取页面信息映射表
	 * @returns 
	 */
	getPageInfoMap: (): PageInfoMap => pagesInfoMap,

	/**
	 * 获取制定路径页面信息
	 * @param fullPath 当前路径，传非完整路径，fullPath是为了兼任带查询参数和hash的路径 
	 * @returns 
	 */
	getPage(fullPath: string): AbsPageData {
		// 提取路径部分，去掉查询参数和hash
		const path = clearPath(fullPath)
		
		// 先判断特殊页面
		const specialPage = specialPageMap[path]
		if (specialPage) return specialPage

		// 再判断普通页面
		const segments: string[] = path.split('/').filter((s) => s.length > 0)
		let nowData = pagesInfoMap as PageInfo | PageInfoMap | undefined
		for (const segment of segments) {
			if (typeof nowData!['title'] === 'string')
				throw new Error(`the page(${nowData!['title']}) has the same name with path`)
			nowData = (nowData as PageInfoMap)[segment]
			if (!nowData) return notFound(path)
		}
		if (typeof nowData!['title'] !== 'string') return notFound(path)
		return { type: 'page', ...(nowData as PageInfo) }
	},

	/**
	 * 获取当前页面信息
	 * @returns 
	 */
	getCurrentPage(): AbsPageData {
		return this.getPage(this.currentPath)
	},

	useCurrentPage(): ComputedRef<AbsPageData> {
		const pageData = computed(()=>this.getPage(this.currentPath))
		return pageData
	},

	/**
	 * 获取文章页面信息
	 * @param name 
	 * @returns 
	 */
	getArticle(name: string): ArticlePageData | NotFoundData {
		return this.getPage(`/article/${name}`) as ArticlePageData
	},

	/**
	 * 获取渲染函数
	 * @param info 
	 */
	async getRenderFunc(info: AbsPageData): Promise<Component> {
		if (info['component']) return (await (info as SpAbsPageData).component()).default
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const module: any = (await renderFuncMap[`/blog${(info as MdPageData).rawUrl}`]!())
		if (import.meta.env.SSR) return module.ssrRender
		return module.render
	},

	/**
	 * 获取目录页面信息
	 * @param fullPath 当前路径，传非完整路径，fullPath是为了兼任带查询参数和hash的路径
	 * @returns 
	 */
	getIndex(fullPath: string): IndexData | undefined {
		let path = clearPath(fullPath)
		while (path !== '/') {
			const page = this.getPage(path)
			if (page.type === 'index') {
				return page
			}
			path = getParentPath(path)
		}
		return undefined
	},

	/**
	 * 获取当前目录页面信息
	 * @returns 
	 */
	getCurrentIndex(): IndexData | undefined {
		return this.getIndex(this.currentPath)
	},

	useCurrentIndex(): ComputedRef<IndexData | undefined> {
		const pageData = computed(()=>this.getIndex(this.currentPath))
		return pageData
	},

	get currentPath() {
		return this._currentPath.value
	},
	set currentPath(path: string) {
		const page = this.getCurrentPage()
		if (page.type === '404' && path === '/') {
			this._currentPath.value = '/article'
		}
		if (path === '/') return
		if (path === '') return
		this._currentPath.value = path
	},
}

export default PageController