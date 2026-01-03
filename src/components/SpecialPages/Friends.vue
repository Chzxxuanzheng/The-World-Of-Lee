<template>
	<nav class="friends">
		<a v-for="friend in friends" :key="friend.url" class="friend-card"
			:href="friend.url" target="_blank">
			<img :src="friend.avatar" :alt="friend.name">
			<div>
				<h3>{{ friend.name }}</h3>
				<hr v-if="friend.desc">
				<p v-if="friend.desc">
					{{ friend.desc }}
				</p>
			</div>
		</a>
	</nav>
	
	<div class="space" />

	<h3>添加友情链接</h3>
	欢迎和我交换友链，我会很高兴的～

	<h4>小要求</h4>
	<ul>
		<li>拒绝涉及国家政治等敏感内容，或以成人内容为主，以及涉嫌赌毒内容的网站！</li>
		<li>必须可以提供https协议的连接，http协议的连接不接受</li>
		<li>需要有一个清晰度还可以且能稳定加载的头像</li>
	</ul>

	<h4>添加方式</h4>
	提交 <a href="https://github.com/Chzxxuanzheng/The-World-Of-Lee/pulls" target="_blank">Pull Request</a> 至 <a href="https://github.com/Chzxxuanzheng/The-World-Of-Lee/blob/master/friends.yml" target="_blank">friends.yml</a>。也可以在下方评论发出请求。

	<h4>我的信息</h4>
	<div class="custom-block normally">
		<CodeBlock :info="{
			lang: 'yaml',
			name: 'friends.yml',
			needLineNumbers: false,
			startLine: 0,
			needWrap: false,
			lineCount: 4,
		}">
			<pre class="shiki shiki-themes min-light min-dark" style="--shiki-light: #24292eff; --shiki-dark: #b392f0; --shiki-light-bg: #ffffff; --shiki-dark-bg: #1f1f1f;"><code><span class="line"><span style="--shiki-light: #24292EFF; --shiki-dark: #B392F0;">- </span><span style="--shiki-light: #D32F2F; --shiki-dark: #F8F8F8;">name</span><span style="--shiki-light: #D32F2F; --shiki-dark: #F97583;">:</span><span style="--shiki-light: #22863A; --shiki-dark: #FFAB70;"> 里世界</span></span><span class="line"><span style="--shiki-light: #D32F2F; --shiki-dark: #F8F8F8;">  url</span><span style="--shiki-light: #D32F2F; --shiki-dark: #F97583;">:</span><span style="--shiki-light: #22863A; --shiki-dark: #FFAB70;"> https://leenet.xyz</span></span><span class="line"><span style="--shiki-light: #D32F2F; --shiki-dark: #F8F8F8;">  desc</span><span style="--shiki-light: #D32F2F; --shiki-dark: #F97583;">:</span><span style="--shiki-light: #22863A; --shiki-dark: #FFAB70;"> Welcome To The World Of Lee</span></span><span class="line"><span style="--shiki-light: #D32F2F; --shiki-dark: #F8F8F8;">  avatar</span><span style="--shiki-light: #D32F2F; --shiki-dark: #F97583;">:</span><span style="--shiki-light: #22863A; --shiki-dark: #FFAB70;"> https://leenet.xyz/avatar.png</span></span><span class="line" /></code></pre>
		</CodeBlock>
	</div>
</template>

<script setup lang="ts">
import CodeBlock from '../CodeBlock.vue'
import friends from '/friends.yml'
</script>

<style lang="sass" scoped>
@use '@/assets/color'

.friends
	margin: 1ch
	display: flex
	width: 100%
	flex-direction: column

nav
	overflow: hidden

.friend-card
	display: flex
	align-items: center
	width: calc( 100% - 4ch )
	height: 7ch
	padding-left: 2ch
	padding-right: 1ch
	position: relative
	overflow: hidden
	text-decoration: none

	& > img
		width: 6ch
		height: 6ch
		margin-right: 1ch

	& > div
		flex: 1
		margin: auto 0
		overflow: hidden
		flex-direction: column
	& > div > h3
		font-size: 2.5ch
		white-space: pre
		overflow: hidden
		text-overflow: ellipsis
		margin: 0
	& > div > hr
		margin: 0.1ch 0
	& > div > p
		font-size: 1.5ch
		white-space: pre
		overflow: hidden
		text-overflow: ellipsis
		margin: 0

	&:hover
		cursor: pointer
		background-color: color.get-color-main(0.2)
		&::before
			content: ''
			position: absolute
			left: 0
			top: 0
			width: 1.25ch
			height: 100%
			background-color: color.get-color-main-r(0.8)
			pointer-events: none

.space
	height: 4ch
</style>