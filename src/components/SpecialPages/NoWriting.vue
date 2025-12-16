<template>
	<span class="writing">
		前方施工，车辆绕行
	</span>
</template>

<script setup lang="ts">

</script>

<style lang="sass" scoped>
.writing::before
	display: inline-block
	animation: writing 1s steps(8) infinite
	content: '⣾'

@keyframes writing
	0%
		content: '⣾'
	12.5%
		content: '⣽'
	25%
		content: '⣻'
	37.5%
		content: '⢿'
	50%
		content: '⡿'
	62.5%
		content: '⣟'
	75%
		content: '⣯'
	87.5%
		content: '⣷'
	100%
		content: '⣾'
</style>