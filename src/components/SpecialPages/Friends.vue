<template>
	<nav class="friends">
		<div v-for="friend in friends" :key="friend.url" class="friend-card"
			@click="jumpTo(friend.url)">
			<img :src="friend.avatar" :alt="friend.name">
			<div>
				<h3>{{ friend.name }}</h3>
				<hr v-if="friend.desc">
				<p v-if="friend.desc">
					{{ friend.desc }}
				</p>
			</div>
		</div>
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
	window.open(url, '_blank')
}
</script>

<style lang="sass" scoped>
.friends
	margin: 1ch
	display: flex
	width: 100%
	flex-direction: column

.friend-card
	display: flex
	align-items: center
	width: 100%
	height: 7ch

	& > img
		width: 7ch
		height: 7ch
		margin-right: 1ch

	& > div
		flex: 1
		margin: auto 0
	& > div > h3
		font-size: 2.5ch
		margin: 0
	& > div > p
		font-size: 1.5ch
		margin: 0

.space
	height: 4ch
</style>