<template>
	<div class="wins">
		<IndexWin :style="{'--page-width': `${indexWidth}vw`, '--x': `${indexX}vw`}" />
		<MainWin :style="{'--page-width': `${mainPageWidth}vw`, '--x': `${mainPageX}vw`}" />
		<OutlineWin :style="{'--page-width': `${outlineWidth}vw`, '--x': `${outlineX}vw`}" />
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MainWin from '@/components/MainWin.vue'
import OutlineWin from '@/components/OutlineWin.vue'
import IndexWin from '@/components/IndexWin.vue'
import { runtime, useWindowSize } from '@/function/state.ts'
import PageController from '@/function/pageController'
import { getCh } from '@/function/utils'

const currentPage = PageController.useCurrentPage()
const currentIndex = PageController.useCurrentIndex()

const { vw } = useWindowSize()

const chToVw = computed(()=>{
	const ch = getCh()
	return ch / vw.value
})

const openIndex = computed(()=>{
	if (currentPage.value.type === 'index') return true
	if (!currentIndex.value) return false
	return runtime.indexOpen
})

const openOutline = computed(()=>{
	if (currentPage.value.noOutline) return false
	return runtime.outlineOpen
})

const indexWidth = computed(()=>{
	if (currentPage.value.type === 'index') return 100
	if (runtime.phoneMode) {
		return 100 - chToVw.value * 11.5
	}
	return 20
})

const outlineWidth = computed(()=>{
	if (runtime.phoneMode) return 100 - chToVw.value * 11.5
	return 20
})

const mainPageWidth = computed(()=>{
	if (runtime.phoneMode) return 100
	let width = 100
	if (openOutline.value) width -= 20
	if (openIndex.value) width -= 20
	return width
})

const indexX = computed(()=>{
	if (openIndex.value) return 0
	if (runtime.phoneMode && openOutline.value) {
		return -indexWidth.value - mainPageWidth.value + chToVw.value * 11.5
	}
	return -indexWidth.value
})

const mainPageX = computed(()=>{
	return indexX.value + indexWidth.value
})

const outlineX = computed(()=>{
	return mainPageX.value + mainPageWidth.value
})
</script>

<style lang="sass" scoped>
.wins
	position: absolute
	width: 100vw
	height: 100dvh
	overflow: hidden
	bottom: 0
</style>