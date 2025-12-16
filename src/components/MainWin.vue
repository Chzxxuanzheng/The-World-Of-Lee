<template>
	<WinSwitcherByPage v-model="page">
		<div class="main-page-content">
			<div ref="main" class="main">
				<MdContent :key="page?.url"
					:page="page"
					@scroll-to="scroll"
					@ready="initOutline" />
			</div>
			<div class="vim-header">
				<div class="decorate">
					<button v-if="currentIndex" @click="runtime.indexOpen=!runtime.indexOpen">
						{{ runtime.indexOpen ? '关闭章节' : '打开章节' }}
					</button>
					<span v-else> main</span>
					<div />
				</div>
				<div class="decorate">
					<span>可视</span>
					<div />
				</div>
				<div class="decorate unnecessary">
					<span>{{ pageTitle }}</span>
					<div />
				</div>
				<div v-if="selfTitle" class="decorate title unnecessary">
					<span>{{ selfTitle }}</span>
					<div />
				</div>

				<div class="space" />

				<div class="decorate-r unnecessary">
					<span>UTF-8</span>
					<div />
				</div>
				<div class="decorate-r unnecessary">
					<span>LF</span>
					<div />
				</div>
				<div class="decorate-r unnecessary">
					<span></span>
					<div />
				</div>
				<div class="decorate-r">
					<span>{{ showScrollInfo }}</span>
					<div />
				</div>
				<div class="decorate-r">
					<span v-if="page?.noOutline"> Md</span>
					<button v-else @click="runtime.outlineOpen=!runtime.outlineOpen">
						{{ runtime.outlineOpen ? '关闭目录' : '打开目录' }}
					</button>
					<div />
				</div>
			</div>
		</div>
	</WinSwitcherByPage>
</template>

<script setup lang="ts">
import { computed, shallowRef, useTemplateRef, watchEffect } from 'vue'
import MdContent from '@/components/MdContent.vue'
import { runtime, usePageName } from '@/function/state.ts'
import PageController, { type PageData } from '@/function/pageController.ts'
import { useRoute } from 'vue-router'
import WinSwitcherByPage from './WinSwitcherByPage.vue'

const page =shallowRef<PageData | undefined>()
const currentIndex = PageController.useCurrentIndex()

const route = useRoute()

const pageName = usePageName()

const pageTitle = computed(()=>{
	switch (pageName.value) {
		case 'home':
			return '里世界'
		case 'article':
			return '杂谈'
		case 'edu':
			return '基础教程'
		case 'links':
			return '友链'
		case 'about':
			return '关于'
		default:
			return '高考作文网'
	}
})

const selfTitle = computed(()=>{
	let path = route.path
	if (path.endsWith('/'))
		path = path.slice(0, -1)
	if (path.split('/').length < 3) return undefined
	return page.value?.title ?? '404'
})

const showScrollInfo = computed(()=>{
	if (scrollProcess.value === 0) return 'Top'
	if (scrollProcess.value === 1) return 'Bot'
	const percent = Math.ceil(scrollProcess.value * 100) + '%'
	if (percent === 'NaN%') return 'Top'
	if (percent === '100%') return 'Bot'
	if (percent === '0%') return 'Top'
	if (percent.length < 3) return ' ' + percent
	return percent
})

function initOutline() {
	const mdContentEl = main.value
	if (!mdContentEl) return
	const outline = runtime.pageOutline[page.value?.url || '']
	if (!outline) return
	outline.setRoot(mdContentEl)
}

const scrollProcess = shallowRef(0)

const main = useTemplateRef('main')

function scroll(el: HTMLElement) {
	const mainEl = main.value
	if (!mainEl) return
	const top = el.offsetTop
	mainEl.scrollTo({top: top - 50, behavior: 'smooth'})
}

watchEffect(()=>{
	const mainEl = main.value
	if (!mainEl) return
	mainEl.addEventListener('wheel', ()=>{
		onScroll()
	})
	mainEl.addEventListener('scroll', ()=>{
		onScroll()
	})
})

function onScroll() {
	const mainEl = main.value
	if (!mainEl) return
	const scrollTop = mainEl.scrollTop
	const scrollHeight = mainEl.scrollHeight - mainEl.clientHeight
	if (scrollHeight === 0) {
		scrollProcess.value = 1
	} else {
		scrollProcess.value = scrollTop / scrollHeight
	}
	const outline = runtime.pageOutline[page.value?.url || '']
	if (!outline) return
	setTimeout(()=>{
		outline.refresh()
	}, 100)
}
</script>

<style lang="sass" scoped>
.main-page-content
	width: 100%
	height: 100%
	display: flex
	flex-direction: column
.main
	overflow-y: auto
	overflow-x: hidden 
	margin-bottom: auto


.vim-header
	margin: 20px 0
	white-space: pre
</style>