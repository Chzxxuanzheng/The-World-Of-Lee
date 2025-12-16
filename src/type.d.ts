declare module '*.css'
declare module '*.sass'

declare module 'virtual:pages-info' {
	export interface PageInfo {
		[key: string]: unknown
		url: string
		rawUrl: string
		title: string
	}
	const data: PageInfo[]
	export default data
}

declare module '*.md' {
	const component: import('vue').Component
	export default component
}

declare module '*.yml' {
	const data: {
		name: string
		url: string
		desc: string
		avatar: string
	}[] = []
	export default data
}