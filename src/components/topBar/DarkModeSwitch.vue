<template>
	<div class="wrapper">
		<Transition name="dark-switch" mode="out-in"
			@click="switchMode">
			<span v-if="mode === 'light'" key="light" title="日间模式"></span>
			<span v-else-if="mode === 'dark'" key="dark" title="夜间模式"></span>
			<span v-else key="auto" title="跟随系统">󰃡</span>
		</Transition>
	</div>
</template>

<script setup lang="ts">
import { shallowRef, watchEffect } from 'vue'
import { useLocalStorage } from '../../function/utils.ts'
import { getDocument, getWindow, runtime } from '../../function/state.ts'

const mode = useLocalStorage<'light' | 'dark' | 'auto'>('dark-mode', 'auto')

const media = getWindow()?.matchMedia('(prefers-color-scheme: dark)')
const _defaultMode = media?.matches ? 'dark' : 'light'
const defaultMode = shallowRef<'light' | 'dark'>(_defaultMode)
media?.addEventListener('change', (e) => {
	defaultMode.value = e.matches ? 'dark' : 'light'
})

function switchMode() {
	switch (mode.value) {
		case 'light':
			mode.value = 'dark'
			break
		case 'dark':
			mode.value = 'auto'
			break
		case 'auto':
			mode.value = 'light'
			break
	}
}

watchEffect(()=>{
	let appliedMode: 'light' | 'dark'
	if (mode.value === 'auto') {
		appliedMode = defaultMode.value
	} else {
		appliedMode = mode.value
	}
	getDocument()?.body.classList.remove('light', 'dark')
	getDocument()?.body.classList.add(appliedMode)
	runtime.colorMode = appliedMode
})
</script>

<style lang="sass" scoped>
.dark-switch-enter-active,
.dark-switch-leave-active
	transition: opacity 0.3s, transform 0.3s
.dark-switch-enter-from
	opacity: 0
	transform: translateY(-100%)
.dark-switch-leave-to
	opacity: 0
	transform: translateY(100%)

.wrapper
	display: flex
	align-items: center
	justify-content: center
	text-align: center
	width: 20px
	height: 20px
span
	user-select: none
	cursor: pointer
</style>