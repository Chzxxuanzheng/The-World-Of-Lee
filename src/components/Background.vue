<template>
	<div class="bg" :class="{load: loadFinish}">
		<canvas ref="canvas" />
	</div>
</template>

<script setup lang="ts">
import { Ripples } from '@/function/ripples'
import { ranChoice, useEventListener } from '@/function/utils'
import { onMounted, shallowRef, useTemplateRef } from 'vue'

let imgList: string[] | undefined

const canvas = useTemplateRef('canvas')

const BLACK_LIST = ['蕾米', '芙兰']

/**
 * 获取随机图片名称
 */
async function getImgName(): Promise<string> {
	if (!imgList) {
		const data: string = await (await fetch('https://animewife.dpdns.org/list.txt')).text()
		imgList = data
			.split('\n')
			.map(item => item.trim())
			.filter(item => 
				item.length > 0 && !BLACK_LIST.some(blackItem => item.includes(blackItem)))
	}
	return ranChoice(imgList)
}

let ripples!: Ripples

async function loadImg() {
	const name = await getImgName()
	const url = `https://cdn.jsdelivr.net/gh/monbed/wife@main/${name}`
	ripples = new Ripples(canvas.value as HTMLCanvasElement, url)
	ripples.onload = () => {
		loadFinish.value = true
	}
}

const loadFinish = shallowRef(false)
onMounted(async()=>{
	const isPhone = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
	await loadImg()
	if (isPhone) return
	useEventListener(window, 'click', (e: MouseEvent)=>{
		ripples.addRipple(e.clientX, e.clientY, 0.01)
	})
})
</script>

<style scoped lang="sass">
.bg
	z-index: -10
	position: absolute
	top: 0
	left: 0
	width: 100vw
	height: 100vh
	& > canvas
		width: 100%
		height: 100%
		object-fit: cover
		opacity: 0
		transition: opacity .5s ease-in-out
	&.load > canvas
		opacity: 0.3
</style>