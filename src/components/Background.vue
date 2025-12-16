<template>
	<div ref="blob-container" class="blobs">
		<div v-for="i in range(BALL_NUM)" v-once ref="blob"
			:key="i"
			:style="{
				'--percent': `${(i / BALL_NUM) * 100}%`
			}" class="blob" />
	</div>
</template>

<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import { ranChoice, random, useEventListener, useFrame } from '../function/utils'

const blobsContainer = useTemplateRef('blob-container')
const blobs = useTemplateRef('blob')
const MIN_SPEED = 0.5
const MAX_SPEED = 2
const CHANGE_RATE = 0.01
const MAX_SIZE = 1
const MIN_SIZE = 0.1
const MAX_SIZE_CHANGE_RATE = 0.001
const BALL_NUM = 14


function range(num: number): number[] {
	const re: number[] = []
	for(let i = 0;i < num;i++){
		re.push(i)
	}
	return re
}

class BlobController {
	private vx: number
	private vy: number
	private x: number
	private y: number
	private size: number
	private sizeChangeRate: number
	private el: HTMLDivElement
	constructor(el: HTMLDivElement) {
		this.el = el
		const bg = blobsContainer.value
		if (!bg) throw new Error('Blobs container element not found')
		const rect = bg.getBoundingClientRect()
		this.x = random(rect.width)
		this.y = random(rect.height)
		this.vx = random(MIN_SPEED, MAX_SPEED) * ranChoice([1, -1])
		this.vy = random(MIN_SPEED, MAX_SPEED) * ranChoice([1, -1])
		this.sizeChangeRate = random(MAX_SIZE_CHANGE_RATE) * ranChoice([1, -1])
		this.size = random(MIN_SIZE, MAX_SIZE)

		this.draw()
	}

	update(frame: number) {
		const bg = blobsContainer.value
		if (!bg) return
		const rect = bg.getBoundingClientRect()
		// 速度变动
		const changeX = random(MIN_SPEED, MAX_SPEED) * CHANGE_RATE * ranChoice([1, -1])
		const changeY = random(MIN_SPEED, MAX_SPEED) * CHANGE_RATE * ranChoice([1, -1])
		let sizeChange = 0
		if (frame % 10 === 0)
			sizeChange = random(MAX_SIZE_CHANGE_RATE) * ranChoice([1, -1])
		this.vx += changeX
		this.vy += changeY
		this.sizeChangeRate += sizeChange
		if (this.vx > MAX_SPEED) this.vx = MAX_SPEED
		if (this.vx < -MAX_SPEED) this.vx = -MAX_SPEED
		if (this.vy > MAX_SPEED) this.vy = MAX_SPEED
		if (this.vy < -MAX_SPEED) this.vy = -MAX_SPEED
		if (this.sizeChangeRate > MAX_SIZE_CHANGE_RATE) this.sizeChangeRate = MAX_SIZE_CHANGE_RATE
		if (this.sizeChangeRate < -MAX_SIZE_CHANGE_RATE) this.sizeChangeRate = -MAX_SIZE_CHANGE_RATE
		// 位置变动
		this.x += this.vx
		this.y += this.vy
		// 大小变动
		this.size += this.sizeChangeRate
		// 碰撞检测
		if (this.x >= rect.width) {
			this.x = rect.width
			this.vx *= -1
		}
		if (this.y >= rect.height) {
			this.y = rect.height
			this.vy *= -1
		}
		if (this.x <= 0) {
			this.x = 0
			this.vx *= -1
		}
		if (this.y <= 0) {
			this.y = 0
			this.vy *= -1
		}
		// 大小限制
		if (this.size > MAX_SIZE) {
			this.sizeChangeRate *= -1
			this.size = MAX_SIZE
		}
		if (this.size < MIN_SIZE) {
			this.sizeChangeRate *= -1
			this.size = MIN_SIZE
		}
		this.draw()
	}

	private draw() {
		this.el.style.left = `${this.x}px`
		this.el.style.top = `${this.y}px`
		this.el.style.transform = `translate(-50%, -50%) scale(${this.size})`
	}
}

let blobsControllers: BlobController[]|undefined = undefined
let frames = 0
useFrame(()=>{
	frames ++
	if (!blobsControllers) {
		initBlobs()
	}else {
		for (const controller of blobsControllers) {
			controller.update(frames)
		}
	}
})
function initBlobs() {
	blobsControllers = blobs.value!.map(
		(blobEl) => new BlobController(blobEl),
	)
}

onMounted(()=>{
	useEventListener(window, 'click', (event: MouseEvent) => {
		const dom = document.createElement('div')
		dom.style.position = 'absolute'
		const rect = blobsContainer.value!.getBoundingClientRect()
		dom.style.left = `${event.clientX - rect.left}px`
		dom.style.top = `${event.clientY - rect.top}px`
		dom.style.width = '0px'
		dom.style.height = '0px'
		dom.style.border = `${random(30, 70)}px solid color-mix(in srgb, var(--bg-main-1), var(--bg-main-2) ${random(0, 100)}%)`
		dom.style.borderRadius = '50%'
		dom.style.transform = 'translate(-50%, -50%)'
		dom.style.transition = `all ${random(1, 3)}s ease-out`
		blobsContainer.value!.appendChild(dom)
		setTimeout(() => {
			dom.style.width = '2000px'
			dom.style.height = '2000px'
			dom.style.opacity = '0'
		}, 1)
		setTimeout(() => {
			dom.remove()
		}, 2000)
	})
})
</script>

<style scoped lang="sass">
.blobs
	position: absolute
	z-index: -1
	top: 0
	left: 0
	width: 100%
	height: 100%
	filter: blur(140px)
	pointer-events: none

.blob
	width: max(240px, min(50vw, 50dvh))
	transform: translate(-50%, -50%)
	aspect-ratio: 1
	border-radius: 50%
	position: absolute
	background: color-mix(in srgb, var(--bg-main-1), var(--bg-main-2) var(--percent))
</style>