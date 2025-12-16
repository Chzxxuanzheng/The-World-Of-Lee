<template>
	<span class="time" @click="changeMode">
		<TransitionGroup name="time">
			<span v-for="(char, index) in time.split('')" :key="char + index"
				:style="{'--pos': index}">
				{{ char }}
			</span>
		</TransitionGroup>
		{{ '  :  ' }}
	</span>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import { useLocalStorage, useSafeTimeout } from '@/function/utils'

const time = shallowRef('')

const timeMode = useLocalStorage<'12h' | '24h'>('time-mode', '24h')
let timeoutId: number

const safeTimeout = useSafeTimeout()
function changeMode() {
	if (timeMode.value === '24h') {
		timeMode.value = '12h'
	} else {
		timeMode.value = '24h'
	}
	clearTimeout(timeoutId)
	updateTime()
}

function createTimeString(): string {
	const now = new Date()
	let hours = now.getHours()
	const minutes = now.getMinutes()
	if (timeMode.value === '12h') {
		hours = hours % 12
		if (hours === 0) hours = 12
	}
	const hoursStr = hours.toString().padStart(2, '0')
	const minutesStr = minutes.toString().padStart(2, '0')
	return `${hoursStr}:${minutesStr}`
}

function updateTime() {
	time.value = createTimeString()
	const now = Date.now()
	const msToNext = 1000 - (now % 1000)
	timeoutId = safeTimeout(updateTime, msToNext)
}
updateTime()
</script>
<style lang="sass" scoped>
.time
	cursor: pointer
	font-size: 16px
	white-space: pre
	position: relative
	color: rgba(0,0,0,0)
	span
		color: var(--font-color)
		position: absolute
		left: calc(var(--pos) * 1ch + 4px)
		transition: transform 0.3s ease, opacity 0.3s ease
	&-enter-from
		transform: translateY(-100%)
		opacity: 0
	&-leave-to
		transform: translateY(100%)
		opacity: 0
</style>