<template>
	<nav class="tabs">
		<div v-for="name in Object.keys(pageNameSvg)" :key="name"
			class="svg"
			:style="{'--color': `var(--bg-color-${name})`}"
			:class="{selected: name === currentPage}"
			:title="pageNameSvg[name]!.name">
			<span @mouseenter="onHover($event, name)"
				@click="gotoPage(name)">{{ pageNameSvg[name]!.icon }}</span>
		</div>
	</nav>
</template>

<script setup lang="ts">
import { animate } from 'animejs'
import { usePageName } from '../../function/state.ts'
import { useRouter } from 'vue-router'

const router = useRouter()

const pageNameSvg: {
	[name: string]: { icon: string; name: string }
} = {
	home: {
		icon: '',
		name: '主页',
	},
	article: {
		icon: '',
		name: '杂记',
	},
	edu: {
		icon: '󱛊',
		name: '基础教程',
	},
	links: {
		icon: '',
		name: '友链',
	},
	about: {
		icon: '',
		name: '关于我',
	},
}

const currentPage = usePageName()

async function gotoPage(name: string) {
	let path = '/'
	if (name === 'article') path = '/article/'
	else if (name === 'edu') path = '/edu/'
	else if (name === 'links') path = '/links/'
	else if (name === 'about') path = '/about/'
	await router.push(path)
}

const locks = new Set<string>()
function onHover(event: MouseEvent, lock: string) {
	if (locks.has(lock)) return
	locks.add(lock)
	setTimeout(()=>{
		locks.delete(lock)
	}, 1000)
	const createTimeline = (startRote: number, times: number) => {
		const step = startRote / times
		const timeline: {to: number, duration: number}[] = []
		for (let i = 0; i < times; i++) {
			let rote: number
			if (i % 2 === 0) rote = step * i
			else rote = -step * i
			timeline.push({to: rote, duration: 150})
		}
		timeline[0]!.duration = 75
		timeline[timeline.length - 1]!.duration = 75
		return timeline.reverse()
	}
	animate(event.currentTarget!, {
		rotate: createTimeline(180, 5),
		easing: 'easeInOutSine',
	})
}
</script>

<style lang="sass" scoped>
@use "@/assets/color"

.tabs
	position: relative
	z-index: 2
	display: flex

.svg
	margin: 0 4px
	display: flex
	align-items: center
	justify-content: center
	height: 16px
	width: 16px
	padding: 2px 0
	border-radius: 10px
	background: transparent
	transition: background 0.3s ease, all 0.3s ease

	&.selected
		width: 60px
		margin: 0 8px
		background: color.get-color(var(--color))

	span
		display: block
		cursor: pointer
		font-size: 18px
		transition: all 0.3s ease
</style>