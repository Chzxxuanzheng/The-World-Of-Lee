<template>
	<div class="page-warper">
		<div class="page">
			<slot />
		</div>
	</div>
</template>

<style lang="sass" scoped>
@use '@/assets/color'

.page-warper
	position: absolute
	top: 4ch
	left: var(--x)
	width: calc( var(--page-width) - 20px )
	height: calc( 100% - 20px - 4ch )
	padding: 10px
	display: flex
	overflow: hidden
	transition: width 0.3s ease, left 0.3s ease, transform 30s ease
	.page
		display: flex
		flex-direction: column
		flex: 1
		border-radius: 8px
		padding: 10px
		background-color: color.get-color-1(0.5)
		border: 2px solid color.get-color-2()
		box-shadow: 0 0 20px color.get-color-3(0.5)
		overflow: hidden
		.page-content
			flex: 1
			overflow: auto
</style>