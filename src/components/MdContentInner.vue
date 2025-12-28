<template>
	<div class="content">
		<template v-if="!page.noTitle">
			<div class="title-head">
				<span class="back-icon" @click="goBack"></span>
				<div class="title">
					<h1>{{ page.title }}</h1>
					<div class="head-time">
						<span v-if="page.pubDate">
							<span class="icon">󰢧</span>
							<span>{{ page.pubDate }}</span>
						</span>
						<span v-if="page.minutes">
							<span class="icon"></span>
							<span>{{ page.minutes }}min</span>
						</span>
						<template v-for="(tag, index) in page.tags" :key="index">
							<span>	
								<span class="icon"></span>
								<span>{{ tag }}</span>
							</span>
						</template>
					</div>
				</div>
			</div>
			<hr>
		</template>
		<span v-if="page.abstract">{{ page.abstract }}</span>
		<div ref="md">
			<component :is="renderFunc" />
		</div>
		<Comments v-if="!(page['noComments'] === true)" />
	</div>
</template>

<script setup lang="ts">
import PageController, { type PageData } from '@/function/pageController.ts'
import { onMounted, useTemplateRef, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Comments from './Comments.vue'


const emit = defineEmits<{
	scrollTo: [el: HTMLElement]
	ready: []
}>()

const { page } = defineProps<{page: PageData}>()

if (!page) await fail()

const router = useRouter()
const route = useRoute()
const md = useTemplateRef('md')
let _r!: () => void
const initPromise = new Promise<void>(r=>_r = r)

watchEffect(async ()=>{
	// 移除旧的选中class
	const hash = route.hash.replace('#', '')
	await initPromise
	const root = md.value
	if (!root) return
	const oldSelected = root.querySelector('.selected-title')
	if (oldSelected) oldSelected.classList.remove('selected-title')
	// 添加新的选中class
	if (!hash) return
	const target = root.querySelector(`#h-${hash}`)
	if (!target) return
	target.classList.add('selected-title')
	emit('scrollTo', target as HTMLElement)
}, {flush: 'post'})

const renderFunc = await PageController.getRenderFunc(page)
if (!renderFunc) await fail()
_r()

async function goBack() {
	const path = route.path
	const backPath = path.split('/').slice(0, -1).join('/') || '/'
	// 404保底
	if (page.type === '404' && backPath === '/') {
		await router.push('/article')
		return
	}
	await router.push(backPath)
}

async function fail() {
	// Prevent Vue warning about missing component
	await new Promise(_r=>{})
}

onMounted(()=>emit('ready'))
</script>

<style lang="sass" scoped>
@use '@/assets/color'
@use '@/assets/utils'
@use '@/assets/icon'
@use "sass:map"

.title-head
	display: flex
	position: relative
	h1
		margin: 0
	& > .back-icon
		position: absolute
		color: color.get-color-3-r(0.5)
		opacity: 0.7
		font-size: 5ch
		top: 50%
		left: -1ch
		transition: opacity 0.3s
		transform: translateY(-50%)
		&:hover
			opacity: 1
		@media (max-width: 600px)
			display: none

.head-time
	display: flex
	.icon
		margin-right: 1ch
		margin-left: 2ch
		color: color.get-color-main-r()

body div.content
	padding: 2rem
	@media (max-width: 600px)
		padding: 1rem
	:deep(:is(h1, h2, h3, h4, h5, h6))
		position: relative
		color: color.get-color-main-r()
		scroll-margin-top: 10ch
		.header-anchor
			position: absolute
			left: -1ch
			text-decoration: none
			color: color.get-color-main-r()
			opacity: 0
			transition: opacity 0.5s
			&::before
				content: ''
			&:hover
				opacity: 1 !important
		&:hover
			.header-anchor
				opacity: 0.3
		&.selected-title
			.header-anchor
				opacity: 1

	:deep(a)
		color: color.get-color-main-r(0.8)
		transition: color 0.3s, border-bottom-color 0.3s
		&:hover
			color: color.get-color-main-r(1)

	:deep(p)
		&::before
			content: '  '
			white-space: pre
		& code
			margin: 0 2px
			font-size: 0.8rem
			padding: 0 4px
			border-radius: 4px
			border: 1px solid color.get-color-main-r(1)
			background-color: color.get-color-1(0.5) 

	:deep(.custom-block)
		border-radius: 8px
		padding: 10px
		border: 1px solid
		margin: 20px 0
		position: relative
		&::before
			position: absolute
			top: 0
			right: 0.5ch
			transform: translate(-50%, 0)
			font-size: 6ch
			z-index: -1

		&.normally
			border-color: color.get-color-1()
			background-color: color.get-color-3(0.1)
			box-shadow: inset 0 0 8px color.get-color-2()

		&.note,
		&.info
			border-color: color.get-color-white(0.5)
			background-color: color.get-color-white(0.1)
			box-shadow: inset 0 0 8px color.get-color-white(0.3)

		&.tip
			border-color: color.get-color-blue(0.5)
			background-color: color.get-color-blue(0.1)
			box-shadow: inset 0 0 8px color.get-color-blue(0.3)
			&::before
				content: '󰋼'
				color: color.get-color-blue(0.8)

		&.warning
			border-color: color.get-color-yellow(0.5)
			background-color: color.get-color-yellow(0.1)
			box-shadow: inset 0 0 8px color.get-color-yellow(0.3)
			&::before
				content: ''
				color: color.get-color-yellow(0.8)

		&.caution,
		&.danger
			border-color: color.get-color-red(0.5)
			background-color: color.get-color-red(0.1)
			box-shadow: inset 0 0 8px color.get-color-red(0.3)
			&::before
				content: ''
				color: color.get-color-red(0.8)

		&.details
			border-color: color.get-color-1(0.9)
			background-color: color.get-color-1(0.4)
			box-shadow: inset 0 0 8px color.get-color-1(0.6)

	:deep(th)
		color: color.get-color-main-r()
		font-weight: bold

	:deep(ul)
		padding: 0 2ch

	:deep(li)
		&::marker
			content: '- '
			color: color.get-color-main-r(0.8)
</style>

<style lang="sass">
</style>