<template>
	<nav class="friends">
		<a v-for="friend in friends" :key="friend.url" class="friend-card"
			href=""
			@click.prevent="jumpTo(friend.url)">
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
	提交 <a href="https://github.com/Chzxxuanzheng/The-World-Of-Lee/pulls" target="_blank">Pull Request</a> 至 <a href="https://github.com/Chzxxuanzheng/The-World-Of-Lee/blob/master/friends.yml" target="_blank">friends.yml</a>

	<h4>我的信息</h4>
	<ul>
		<li><b>站点名称:</b>里世界</li>
		<li><b>站点url:</b>https://leenet.xyz</li>
		<li><b>描述:</b>Welcome To The World Of Lee</li>
		<li><b>头像URL:</b>https://leenet.xyz/avatar.png</li>
	</ul>
</template>

<script setup lang="ts">
import friends from '/friends.yml'

function jumpTo(url: string) {
	window.open(url)
}
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
	width: 100%
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