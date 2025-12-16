<template>
	<div class="tabs">
		<template v-for="(info, index) in codeInfos" :key="index">
			<label :class="{selected: (index + 1) === id}"
				:data-title="info.lang"
				@click="id=index + 1">
				{{ info.lang }}
			</label>
		</template>
	</div>
	<div>
		<slot :name="`code-${id}`" />
	</div>
</template>
<script setup lang="ts">
import { shallowRef } from 'vue'
const id = shallowRef<number>(1)

const { codeInfos } = defineProps<{
	codeInfos: {
		lang: string
		name: string
	}[]
}>()
</script>

<style lang="sass" scoped>
@use '@/assets/color'
@use '@/assets/icon'
@use 'sass:map'

.tabs
	label
		position: relative
		display: inline-block
		padding: 0 1ch
		border-left: 2px solid color.get-color-3()
		cursor: pointer
		transition: background-color 0.3s, border-left-color 0.3s
		&:hover
			background-color: color.get-color-2(0.3)
		&::after
			content: '✖'
			margin-left: 10px
		&:last-child
			border-right: 2px solid color.get-color-3()

	@each $lang, $data in icon.$code-language-icons
		label[data-title$='.#{map.get($data, ext)}']
			padding: 0 1ch
			&::before
				margin-right: 1ch
				content: map.get($data, icon)
				color: map.get($data, color)

	label.selected
		border-left: 2px solid color.get-color-main-r()
		background-color: color.get-color-2(0.5)
		color: color.get-color-main-r()
</style>