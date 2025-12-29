<template>
	<header :class="{phone: runtime.phoneMode}">
		<TopTabEl>
			里世界
		</TopTabEl>
		<TopTabEl>
			<Time />
		</TopTabEl>
		<TopTabEl class="left-button">
			<DarkModeSwitch />
		</TopTabEl>
		<div class="space" />
		<TopTabEl class="page-name">
			<PageName />
		</TopTabEl>
		<div class="space" />
		<!-- tab栏 -->
		<TopTabEl class="tabs">
			<Tabs />
		</TopTabEl>
		<TopTabEl class="right-button">
			<a href="/feed.xml" target="_blank" title="RSS"></a>
		</TopTabEl>
	</header>
</template>

<script setup lang="ts">
import Time from '@/components/topBar/Time.vue'
import TopTabEl from '@/components/topBar/TopTabEl.vue'
import PageName from '@/components/topBar/PageName.vue'
import Tabs from '@/components/topBar/Tabs.vue'
import DarkModeSwitch from '@/components/topBar/DarkModeSwitch.vue'
import { runtime } from '@/function/state.ts'
</script>

<style lang="sass" scoped>
header
	z-index: 10
	display: flex
	align-items: center
	background-color: var(--vp-c-bg-base)
	box-shadow: var(--vp-c-shadow)
	font-size: 18px
	font-weight: bold
	position: relative
	margin: 5px
	a
		display: inline-block
		color: unset
		text-decoration: none
	div
		&.space
			margin: auto
			opacity: 0
	div.page-name
		padding: 0 10px
		display: flex
		max-width: calc(100vw - 500px)
		position: absolute
		top: 50%
		left: 50%
		transform: translate(-50%, -50%)
		white-space: nowrap
		width: max-content
		overflow: hidden
	&.phone > div
		display: none
		&.left-button, &.right-button, &.tabs
			display: inline-block
		&.tabs
			margin: auto
</style>