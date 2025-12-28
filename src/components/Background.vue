<template>
	<div class="bg" :class="{load: loadFinish}">
		<img src="https://cdn.seovx.com/d/?mom=302" alt=""
			@load="loadFinish = true">
	</div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'

const loadFinish = shallowRef(false)
</script>

<style scoped lang="sass">
.bg
	z-index: -10
	position: absolute
	top: 0
	left: 0
	width: 100vw
	height: 100vh
	& > img
		width: 100%
		height: 100%
		object-fit: cover
		opacity: 0
		transition: opacity .5s ease-in-out
	&.load > img
		opacity: 0.3
</style>