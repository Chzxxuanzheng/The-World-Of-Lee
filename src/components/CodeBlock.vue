<template>
	<div class="vim-header">
		<div class="decorate">
			<span>可视</span>
			<div />
		</div>
		<div class="decorate unnecessary">
			<span> main</span>
			<div />
		</div>
		<div class="decorate unnecessary">
			<span>里世界</span>
			<div />
		</div>
		<div class="decorate title">
			<span :data-lang="info.lang.toLowerCase()">{{ info.name }}</span>
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
			<span>{{ info.lineCount }}行</span>
			<div />
		</div>
		<div class="decorate-r">
			<button @click="copy">
				{{ copyName }}
			</button>
			<div />
		</div>
	</div>
	<div ref="main" class="code-body">
		<slot />
	</div>
</template>

<script setup lang="ts">
import { shallowRef, useTemplateRef } from 'vue'

const { info } = defineProps<{info: {
	lang: string
	name: string
	needLineNumbers: boolean
	startLine: number
	needWrap: boolean
	lineCount: number
}}>()

const copyName = shallowRef(' 复制 ')

const main = useTemplateRef('main')

async function copy() {
	const clipboard = navigator.clipboard
	if (!clipboard) return
	const codeEl = main.value!.querySelector('code')
	if (!codeEl) return
	let text = ''
	for (const line of codeEl.childNodes || []) {
		if (line.nodeName !== 'SPAN') continue
		for (const node of line.childNodes) {
			text += node.textContent
		}
		text += '\n'
	}
	await clipboard.writeText(text)
	copyName.value = '已复制'
	setTimeout(()=>{
		copyName.value = ' 复制 '
	}, 1000)
}
</script>

<style lang="sass" scoped>
@use '@/assets/icon'
@use '@/assets/color'
@use "sass:map"


// 高亮
body div.code-body
	:deep(code) span
		color: var(--shiki-light)

body.dark div.code-body
	:deep(code) span
		color: var(--shiki-dark)

body div.code-body
	font-size: 0.9rem
	line-height: 1
	padding: 1ch 0 0 0
	display: flex
	overflow-y: hidden
	overflow-x: auto
	padding-bottom: 10px // 给滚动条留位置
	:deep(pre)
		margin: 0
		flex: 1
		margin-left: 2ch
	:deep(code)
		display: flex
		flex-direction: column
	// 强调
	:deep(pre.has-focused) > code > span
		opacity: 0.3
		transition: opacity 0.3s
		&.focused
			filter: none
			opacity: 1
			background-color: color.get-color-3-r(0.1)
	:deep(pre.has-focused) > code:hover > span
		opacity: 1
	// 高亮
	:deep(pre) > code > span
		width: 100%
		&.highlighted
			background-color: color.get-color-3-r(0.1)
		&.error
			position: relative
			background-color: color.get-color-red(0.2) !important
			&::before
				content: ''
				color: color.get-color-red-r()
				position: absolute
				left: -2ch
		&.warning
			position: relative
			background-color: color.get-color-yellow(0.2) !important
			&::before
				content: ''
				color: color.get-color-yellow-r()
				position: absolute
				left: -2ch
		&.add
			position: relative
			background-color: color.get-color-green(0.2) !important
			&::before
				content: ''
				color: color.get-color-green-r()
				position: absolute
				left: -2ch
		&.remove
			position: relative
			background-color: color.get-color-red(0.2) !important
			&::before
				content: ''
				color: color.get-color-red-r()
				position: absolute
				left: -2ch

	// 行号
	:deep(code) span.line-number
		display: inline-block
		user-select: none
		width: 4ch
		text-align: right
		margin-left: -2ch 
		margin-right: 2ch 
		color: color.get-color-3-r(0.5)

.vim-header
	font-size: 1.4ch

.vim-header > .decorate:nth-child(4) > span
	position: relative
	display: block
	@each $lang, $data in icon.$code-language-icons
		&[data-lang="#{$lang}"]::before
			margin-right: 1ch 
			content: '#{map.get($data, icon)}'
			color: map.get($data, color)

.vim-header > .decorate-r:last-child > button
	width: 4.5ch
</style>