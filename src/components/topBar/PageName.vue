<template>
	<Transition name="page-name" mode="out-in">
		<span :key="1" class="page-name">{{ name }}</span>
	</Transition>
</template>
<script setup lang="ts">
import PageController from '@/function/pageController'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const name = computed(()=>{
	if (route.path === '/') {
		return 'Welcome To The World Of Lee'
	}
	return page.value.description
})

const page = PageController.useCurrentPage()
</script>
<style lang="sass" scoped>
.page-name
	flex: 1
	overflow: hidden
	text-overflow: ellipsis
	display: inline-block
	transition: all 0.3s ease
.page-name-enter-from,
.page-name-leave-to
	opacity: 0
	transform: scale(400%)
</style>