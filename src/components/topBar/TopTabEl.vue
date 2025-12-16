<template>
	<div ref="main" class="main"
		@mouseenter="onMouseEnter"
		@mouseleave="onMouseLeave"
		@mousemove="onMouseMove"
		@click="onClick">
		<slot />
		<div ref="enter-ball" class="enter-ball" />
	</div>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'

const main = useTemplateRef('main')
const enterBall = useTemplateRef('enter-ball')


function onClick(event: MouseEvent) {
	const rect = main.value!.getBoundingClientRect()
	const r = Math.max(rect.width, rect.height)
	const pos = getMousePos(event)
	const dom = document.createElement('div')
	dom.className = 'click-ball'
	main.value!.appendChild(dom)
	dom.style.top = `${pos.y}px`
	dom.style.left = `${pos.x}px`
	setTimeout(()=>{
		dom.style.width = `${r * 2}px`
		dom.style.height = `${r * 2}px`
		dom.style.opacity = '0'
	}, 1)
	setTimeout(()=>{
		dom.remove()
	}, 1000)
}

function onMouseEnter(e: MouseEvent) {
	followMouse(e)
	const rect = main.value!.getBoundingClientRect()
	const r = Math.max(rect.width, rect.height)
	enterBall.value!.style.width = `${r * 2}px`
	enterBall.value!.style.height = `${r * 2}px`
	enterBall.value!.style.opacity = '0.1'
	enterBall.value!.style.transition = 'width 1s ease, height 1s ease, opacity 1s ease, left 0.1s ease, top 0.1s ease'
}

function onMouseLeave(e: MouseEvent) {
	followMouse(e)
	enterBall.value!.style.width = ''
	enterBall.value!.style.height = ''
	enterBall.value!.style.opacity = ''
	enterBall.value!.style.transition = 'width 0.3s ease, height 0.3s ease'
}

function onMouseMove(e: MouseEvent) {
	followMouse(e)
}

function followMouse(e: MouseEvent) {
	const pos = getMousePos(e)
	enterBall.value!.style.top = `${pos.y}px`
	enterBall.value!.style.left = `${pos.x}px`
}

function getMousePos(e: MouseEvent): { x: number, y: number } {
	const rect = main.value!.getBoundingClientRect()
	return {
		x: e.clientX - rect.left,
		y: e.clientY - rect.top,
	}
}
</script>
<style lang="sass" scoped>
@use "@/assets/color"

.main
	height: 20px
	padding: 4px 8px
	border-radius: 20px
	position: relative
	margin: 0 5px
	background-color: color.get-color-1(0.5)
	border: 2px solid color.get-color-2()
	box-shadow: 0 0 20px color.get-color-3(0.5)
	overflow: hidden
	display: flex
	align-items: center
	justify-content: center
	:deep(div.click-ball),
	div.enter-ball
		position: absolute
		width: 0px
		height: 0px
		transform: translate(-50%, -50%)
		opacity: 0.3
		pointer-events: none
		border-radius: 50%
		z-index: 10
	:deep(div.click-ball)
		background-color: color.get-color-2-r(0.3)
		transition: width 1s ease, height 1s ease, opacity 1s ease
	div.enter-ball
		background-color: color.get-color-3-r(0.1)
</style>