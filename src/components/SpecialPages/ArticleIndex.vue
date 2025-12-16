<template>
	<div class="tabs">
		<template v-for="(tag, index) in tags" :key="index">
			<label :class="{open: openTags.includes(tag)}"
				@click="switchTag(tag)">
				{{ tag }}
			</label>
		</template>
	</div>
	<div v-for="(article, id) in showData" :key="article.title">
		<span class="article-title"
			:class="{selected: (!currentPage && currentSelected === id)
				|| (currentPage && currentPage.url === article.url)
			}"
			@click="jumpToArticle(article.url)"
			@mouseover="selectTarget = id">
			<h2>{{ article.title }}</h2>
			<hr>
			<div class="description">
				<span>
					{{ article.abstract }}
				</span>
				<div class="info">
					<span class="time">
						<span class="icon">󰢧</span>
						<span>{{ article.pubDate }}</span>
					</span>
					<template v-for="(tag, index) in article.tags" :key="index">
						<span class="tag">	
							<span class="icon"></span>
							<span>{{ tag }}</span>
						</span>
					</template>
				</div>
			</div>
		</span>
	</div>
</template>

<script setup lang="ts">
import PageController from '@/function/pageController.ts'
import { runtime } from '@/function/state'
import { useFrame } from '@/function/utils.ts'
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const page = PageController.useCurrentPage()

function jumpToArticle(url: string) {
	router.push(url).catch(()=>{})
	if (runtime.phoneMode && page.value.type === 'index') {
		runtime.indexOpen = false
	}
}

function switchTag(tag: string) {
	const index = openTags.value.indexOf(tag)
	if (index === -1) {
		openTags.value = [...openTags.value, tag]
	} else {
		openTags.value = openTags.value.filter(t => t !== tag)
	}
}

const currentPage = computed(()=>{
	void route.path
	return PageController.getCurrentPage()
})

interface ArticleIndexInfo {
	title: string
	description: string
	pubDate: string
	url: string
	abstract: string
	tags?: string[]
}

const allData = shallowRef<ArticleIndexInfo[]>([])
const openTags = shallowRef<string[]>([])
const tags = shallowRef<string[]>([])
const showData = computed(()=>{
	if (openTags.value.length === 0) return []
	return allData.value.filter(article=>{
		for (const tag of article.tags!) {
			if (openTags.value.includes(tag)) {
				return true
			}
		}
		return false
	})
})

for (const info of (Object.values(PageController.getPageInfoMap()['article']!) as ArticleIndexInfo[])) {
	allData.value.push(info)
	if (!info.tags) info.tags = ['未分类']

	for (const tag of info.tags) {
		if (!tags.value.includes(tag)) {
			tags.value.push(tag)
			openTags.value.push(tag)
		}
	}
}

allData.value = allData.value.sort((a, b)=>{
	return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
})

const currentSelected = shallowRef<number>(0)
const selectTarget = shallowRef<number>(0)

useFrame(()=>{
	if (currentPage.value) return
	if (currentSelected.value < selectTarget.value) {
		currentSelected.value++
	} else if (currentSelected.value > selectTarget.value) {
		currentSelected.value--
	}
})
</script>

<style lang="sass" scoped>
@use '@/assets/color'

.article-title
	text-decoration: none
	display: block
	position: relative
	padding-left: 1.25ch
	& > h2
		color: color.get-color-main-r(0.8)
		margin: 0
		white-space: pre
		overflow: hidden
		text-overflow: ellipsis
	& > h2:hover > a
		opacity: 1 !important
	& > .description
		color: color.get-color-1-r(0.8)
		white-space: pre
		overflow: hidden
		display: flex
		flex-direction: column
		& > span:nth-child(1)
			margin-left: 1ch
			overflow: hidden
			text-overflow: ellipsis
		& .time
			margin:
				left: 10px
				right: 20px
		& .tag
			margin-left: 15px
			display: inline-block
		.icon
			margin-right: 1ch
		hr
			border: dashed 2px
			border-top: none

.selected
	background-color: color.get-color-main(0.2)
	& > h2
		color: color.get-color-main-r()
	& > .description
		color: color.get-color-1-r()
	&::before
		content: ''
		position: absolute
		left: 0
		top: 0
		width: 1.25ch
		height: 100%
		background-color: color.get-color-main-r(0.8)
		pointer-events: none

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
			content: '+'
			margin-left: 10px
		&::before
			padding: 0 1ch
			margin-right: 1ch
			content: ''

	label.open
		border-left: 2px solid color.get-color-main-r()
		background-color: color.get-color-2(0.5)
		color: color.get-color-main-r()
		&::after
			content: '✖'
</style>