<template>
	<div class="app">
		<TopBar />
		<div class="main-page" :style="{
			top: atHome ? 0 : '-100dvh'
		}"
			@click="onClick"
			@wheel="onScroll">
			<Sign />
			<WindowManager />
		</div>
	</div>
	<Background />
</template>

<script setup lang="ts">
import Sign from '@/components/Sign.vue'
import Background from '@/components/Background.vue'
import WindowManager from '@/components/WindowManager.vue'
import TopBar from '@/components/TopBar.vue'
import { usePageName } from '@/function/state'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageController from './function/pageController'
import { useHead } from '@unhead/vue'
const page = PageController.useCurrentPage()
const router = useRouter()
const pageName = usePageName()
const atHome = computed(()=>pageName.value==='home')
function onClick() {
	if (!atHome.value) return
	void router.push(PageController.currentPath)
}
function onScroll() {
	if (!atHome.value) return
	void router.push(PageController.currentPath)
}
const titleName = computed(()=>{
	if (atHome.value) {
		return '里世界'
	} else {
		return `${page.value?.title || 'Unknown'} | 里世界`
	}
})
useHead({
	title: ()=>titleName.value,
})

onMounted(()=>{
	window.addEventListener('click', (e: MouseEvent)=>{
		if (e.button !== 0) return
		if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return

		const target = e.target as HTMLElement | null
		if (!target) return
		if (target.tagName !== 'A') return
		const href = (target as HTMLAnchorElement).getAttribute('href')
		if (!href) return
		if (href.startsWith('#')) return
		if (href.startsWith('http')) {
			e.preventDefault()
			window.open(href, '_blank')
		} else {
			e.preventDefault()
			void router.push(href)
		}
	})
})
</script>

<style lang="sass" scoped>
.app
	position: absolute
	width: 100vw
	height: 100dvh
	top: 0
	left: 0
	overflow: hidden

.main-page
	position: absolute
	width: 100vw
	height: 200dvh
	transition: top 0.5s ease
</style>