<template>
	<Transition name="page-name" mode="out-in">
		<span :key="1" class="page-name">{{ page.description }}</span>
	</Transition>
</template>
<script setup lang="ts">
import PageController from '@/function/pageController'

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