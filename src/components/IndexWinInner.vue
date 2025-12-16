<template>
	<component :is="renderFunc"
		v-if="index"
		v-bind="index.args ?? {}" />
	<span v-else>Error</span>
</template>

<script setup lang="ts">
import PageController, { type IndexData } from '@/function/pageController'

const { index } = defineProps<{
	index: IndexData
}>()

const renderFunc = await PageController.getRenderFunc(index)
</script>