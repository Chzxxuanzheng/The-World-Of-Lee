<template>
	<Giscus
		repo="Chzxxuanzheng/The-World-Of-Lee"
		repo-id="R_kgDOQpKVJA"
		category="giscus"
		category-id="DIC_kwDOQpKVJM4C0EpB"
		mapping="pathname"
		strict="0"
		reactions-enabled="1"
		emit-metadata="1"
		input-position="top"
		lang="zh-CN"
		:theme="themeDataUrl"
		crossorigin="anonymous" />
</template>

<script setup lang="ts">
import Giscus from '@giscus/vue'
import lightTheme from '@/assets/comment-light.sass?inline'
import darkTheme from '@/assets/comment-dark.sass?inline'
import { computed } from 'vue'
import { runtime } from '@/function/state'

const themeDataUrl = computed(()=>{
	if (runtime.colorMode === 'dark')
		return `data:text/css;charset=utf-8,${encodeURIComponent(darkTheme)}`
	else 
		return `data:text/css;charset=utf-8,${encodeURIComponent(lightTheme)}`
})
</script>