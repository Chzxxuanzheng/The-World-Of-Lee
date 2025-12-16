<template>
	<Win>
		<Suspense>
			<IndexWinInner v-if="index" :index="index" />
			<span v-else>Error</span>
			<template #fallback>
				<div class="loading">
					Loading...
				</div>
			</template>
		</Suspense>
	</Win>
</template>

<script setup lang="ts">
import PageController from '@/function/pageController'
import Win from './Win.vue'
import IndexWinInner from './IndexWinInner.vue'

const index = PageController.useCurrentIndex()
</script>