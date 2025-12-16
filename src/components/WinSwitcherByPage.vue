<template>
	<Transition :name="pageChangeAnimationName">
		<Win :key="key">
			<slot :page="page" />
		</Win>
	</Transition>
</template>

<script setup lang="ts">
import PageController, { type PageData } from '@/function/pageController'
import { shallowRef, watch, watchEffect } from 'vue'
import Win from './Win.vue'
import { useRoute } from 'vue-router'

const page = defineModel<PageData | undefined>()

const pageChangeAnimationName = shallowRef('none')
const key = shallowRef(0)
const route = useRoute()

if (PageController.getCurrentPage()) pageChangeAnimationName.value = 'page-up'

watchEffect(async ()=>{
	void route.path
	await new Promise(resolve=>setTimeout(resolve, 300))
	let pageAnimation = 'none'
	if (PageController.getCurrentPage()) pageAnimation = 'page-up'
	if (pageAnimation !== pageChangeAnimationName.value) {
		pageChangeAnimationName.value = pageAnimation
	}
})

let lastIsIndex = false
watch(() => route.path, ()=>{
	const newPage = PageController.getPage(route.path)
	if (newPage.type === 'index') {
		lastIsIndex = true
		return
	}

	if (newPage.url === page.value?.url) return
	if (!lastIsIndex) key.value ++
	lastIsIndex = false
	page.value = newPage
}, {immediate: true})
</script>