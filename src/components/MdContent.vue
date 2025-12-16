<template>
	<div>
		<suspense>
			<MdContentInner v-if="page" :page="page"
				@scroll-to="(el)=>emit('scrollTo', el)"
				@ready="emit('ready')" />
			<div v-else class="loading">
				Loading...
			</div>
			<template #fallback>
				<div class="loading">
					Loading...
				</div>
			</template>
		</suspense>
	</div>
</template>
<script setup lang="ts">
import MdContentInner from '@/components/MdContentInner.vue'
import type { PageData } from '@/function/pageController'

const emit = defineEmits<{
	scrollTo: [el: HTMLElement]
	ready: []
}>()

const { page } = defineProps<{page: PageData | undefined}>()
</script>
<style lang="sass" scoped>
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