<template>
	<template v-if="!hasInit">
		<div class="loading">
			Loading...
		</div>
	</template>
	<template v-else>
		On This Page
		<nav>
			<div v-for="(info, key) in renderData"
				:key="key"
				:class="{highlight: info.highlight}"
				class="line">
				<span>{{ info.prefix }}</span>
				<span @click="jump(`#${info.href.replace('#', '').slice(2)}`)">{{ info.content }}</span>
			</div>
		</nav>
	</template>
</template>

<script setup lang="ts">
import type { PageData } from '@/function/pageController'
import { runtime } from '@/function/state'
import { shallowRef, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const indexInfos = shallowRef<IndexInfo[]>([])
const renderData = shallowRef<RenderInfo[]>([])
const hasInit = shallowRef(false)

const router = useRouter()

function jump(href: string) {
	router.push(href).catch(()=>{})
	if (runtime.phoneMode) {
		runtime.outlineOpen = false
	}
}

let root: HTMLElement
let lastUrl = ''
const { page } = defineProps<{
	page: PageData | undefined
}>()

interface RenderInfo {
	prefix: string,
	content: string,
	href: string,
	highlight: boolean,
}

interface IndexInfo {
	title: string
	el: HTMLElement
	level: number
	children: IndexInfo[]
	father: IndexInfo | undefined
}

interface RenderIndexInfo {
	prefix: string,
	content: string,
	href: string,
	pos: number,
}

function clear() {
	indexInfos.value = []
	renderData.value = []
	hasInit.value = false
	delete runtime.pageOutline[lastUrl]
	lastUrl = page?.url || ''
}

function init() {
	if (!page) return
	runtime.pageOutline[page.url] = {
		setRoot,
		refresh,
	}
}

watchEffect(()=>{
	clear()
	init()
})

function setRoot(el: HTMLElement) {
	root = el
	initIndexInfos()
	hasInit.value = true
	refresh()
}

/**
 * 刷新标题信息
 */
function initIndexInfos() {
	const re = [] as IndexInfo[]
	const els = root.querySelectorAll('h1, h2, h3, h4, h5, h6')
	
	let nowNode: IndexInfo | undefined
	for (const el of els) {
		const level = Number(el.tagName[1])
		const info: IndexInfo = {
			title: el.textContent || '',
			el: el as HTMLElement,
			level,
			children: [],
			father: undefined,
		}
		if (!nowNode) {
			re.push(info)
			nowNode = info
			continue
		}
		if (level > nowNode.level) {
			// 子节点
			info.father = nowNode
			nowNode.children.push(info)
			nowNode = info
		} else if (level === nowNode.level) {
			// 同级节点
			if (nowNode.father) {
				info.father = nowNode.father
				nowNode.father.children.push(info)
			} else {
				re.push(info)
			}
			nowNode = info
		} else {
			// 父节点或更上层节点
			while (nowNode && Number(nowNode.el.tagName[1]) >= level) {
				nowNode = nowNode.father
			}
			if (nowNode) {
				info.father = nowNode
				nowNode.children.push(info)
			} else {
				re.push(info)
			}
			nowNode = info
		}
	}

	indexInfos.value = re
}

const MIN_LEVEL = 2
const MAX_LEVEL = 3

function refresh() {
	if (!hasInit.value) return
	const re = [] as RenderIndexInfo[]
	for (const info of indexInfos.value) {
		const out = renderSingleIndex(info)
		re.push(...out)
	}

	renderData.value = renderHighlight(re)
}

function renderHighlight(info: RenderIndexInfo[]): RenderInfo[] {
	const out = [] as RenderInfo[]
	let hasHighlight = false
	for (let i = 0; i < info.length; i++) {
		const data = info[i]!

		if (hasHighlight) {
			out.push({...data, highlight: false})
			continue
		}

		const prev = info.at(i - 1)
		const next = info.at(i + 1)
		if (
			// 自身在视野内，上一个在视野外
			((data.pos >= 0 && !prev) ||
			(data.pos >= 100 && prev!.pos < 100)) || 
			// 自身在视野外，下一个不在开头
			((data.pos <= 100 && !next) ||
			(data.pos <= 100 && next!.pos > 100))
		)
			hasHighlight = true
		out.push({
			...data,
			highlight: hasHighlight,
		})
	}

	return out
}

function renderSingleIndex(info: IndexInfo): RenderIndexInfo[] {
	// 过大过小过滤
	if (info.level > MAX_LEVEL) return []
	if (info.level < MIN_LEVEL) {
		const re = [] as RenderIndexInfo[]
		for (const child of info.children) {
			re.push(...renderSingleIndex(child))
		}
		return re
	}

	// 位置检测
	const rect = info.el.getBoundingClientRect()


	// 正常渲染
	const re = [] as RenderIndexInfo[]
	re.push({
		content: info.title,
		href: `#${info.el.id}`,
		pos: rect.top,
		prefix: '',
	})
	// 渲染子节点
	let subData = [] as RenderIndexInfo[]
	for (const child of info.children) {
		const out = renderSingleIndex(child)
		subData = subData.concat(out)
	}
	for (let id = 0; id < subData.length; id++) {
		const header = id === subData.length - 1 ? '└' : '├'
		subData[id]!.prefix = ' ' + header + subData[id]!.prefix
	}
	re.push(...subData)
	return re
}
</script>


<style lang="sass" scoped>
@use '@/assets/color'
nav
	display: flex
	flex-direction: column

.line
	display: flex
	padding: 0 1ch
	position: relative
	& > span:nth-child(1)
		
		white-space: pre
	& > span:nth-child(2)
		color: color.get-color-main-r(0.8)
		transition: color 0.3s
		text-decoration: none
		display: block
		overflow: hidden
		text-overflow: ellipsis
		white-space: nowrap
		&:hover
			color: color.get-color-main-r(1)

	&.highlight
		background-color: color.get-color-main(0.2)
		&::before
			content: ''
			position: absolute
			left: 0
			top: 0
			width: 1ch
			height: 100%
			background-color: color.get-color-main-r(0.8)
			pointer-events: none

.loading
	width: 100%
	height: 100%
.loading::before
	animation: loading-animation 0.5s infinite
	content: '|'
	display: inline-block

@keyframes loading-animation
	0%
		content: '|'
	25%
		content: '/'
	50%
		content: '-'
	75%
		content: '\\'
	100%
		content: '|'
</style>