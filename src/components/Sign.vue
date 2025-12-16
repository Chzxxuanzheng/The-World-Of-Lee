<template>
	<h1 class="title" :style="{'--font-size': `${fontSize}px`}">
		<TransitionGroup name="title">
			<span v-for="charInfo in showTextInfo" :key="charInfo.pos"
				:style="{'--pos': charInfo.pos}">
				{{ charInfo.chr }}
			</span>
		</TransitionGroup>
	</h1>
</template>

<script setup lang="ts">
import { useWindowSize } from '@/function/state'
import { useSafeTimeout } from '@/function/utils'
import { reactive } from 'vue'

interface ShowTextInfo {
	chr: string,
	pos: number
}

const showTextInfo = reactive<ShowTextInfo[]>([])

const safeTimeout = useSafeTimeout()

const TitleAnimator = {
	/**
	 * 每个字出现的间隔
	 */
	WORD_APPEAR_SLEEP: 100,
	/**
	 * 每个字消失的间隔
	 */
	WORD_DISAPPEAR_SLEEP: 100,
	/**
	 * 每句话停留的时间
	 */
	TITLE_STAY_TIME: 3000,
	/**
	 * 新句子开始前的停顿
	 */
	NEW_TITLE_SLEEP: 1000,

	titleList: [] as string[],
	index: 0,
	titleId: 0,
	fontId: 0,
	nowTitle: '',
	nowTitleLength: 0,
	nowLength: 0,

	start() {
		this.index = 0
		this.nowTitle = this.titleList[this.titleId]!
		this.nowTitleLength = this.getLength(this.nowTitle)
		this.nowLength = 0
		this.next()
	},

	next() {
		if (this.index < this.nowTitle.length) {
			while (true) {
				this.addWord()
				if (this.nowTitle[this.index - 1] !== ' ') break
			}
			safeTimeout(this.next.bind(this), this.WORD_APPEAR_SLEEP)
		} else {
			safeTimeout(this.clear.bind(this), this.TITLE_STAY_TIME)
		}
	},

	clear() {
		if (this.index > 0) {
			while (true) {
				this.rmWord()
				if (this.nowTitle[this.index] !== ' ') break
			}
			safeTimeout(this.clear.bind(this), this.WORD_DISAPPEAR_SLEEP)
		} else {
			this.nextTitle()
		}
	},

	nextTitle() {
		this.titleId = (this.titleId + 1) % this.titleList.length
		this.nowTitle = this.titleList[this.titleId]!
		this.nowTitleLength = this.getLength(this.nowTitle)
		this.nowLength = 0
		this.index = 0
		safeTimeout(this.next.bind(this), this.NEW_TITLE_SLEEP)
	},

	addWord() {
		showTextInfo.push({
			chr: this.nowTitle[this.index]!,
			pos: this.nowLength - this.nowTitleLength / 2,
		})
		this.nowLength += this.getLength(this.nowTitle[this.index]!)
		this.index++
	},

	rmWord() {
		this.index--
		showTextInfo.shift()
	},

	getLength(str: string) {
		const isFullWidth = (code: number) => {
			return (
				code >= 0x1100 &&
				(
					code <= 0x115f ||
					code === 0x2329 || code === 0x232a ||
					(code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) ||
					(code >= 0xac00 && code <= 0xd7a3) ||
					(code >= 0xf900 && code <= 0xfaff) ||
					(code >= 0xfe10 && code <= 0xfe19) ||
					(code >= 0xfe30 && code <= 0xfe6f) ||
					(code >= 0xff00 && code <= 0xff60) ||
					(code >= 0xffe0 && code <= 0xffe6) ||
					(code >= 0x1b000 && code <= 0x1b001) ||
					(code >= 0x1f200 && code <= 0x1f251) ||
					(code >= 0x20000 && code <= 0x3fffd)
				)
			)
		}

		let len = 0
		for (const ch of str) {
			const code = ch.codePointAt(0) ?? 0
			len += isFullWidth(code) ? 2 : 1
		}
		return len
	},
}

TitleAnimator.titleList.push('前进，前进，不择手段的前进！')
TitleAnimator.titleList.push('狂风暴雨来阻挡，阻挡难耐少年郎')
TitleAnimator.titleList.push('一群人可以走的更远，一个人可以走的更快')
TitleAnimator.start()

// 确定文字大小
const { vw } = useWindowSize()
const maxLangTitle = TitleAnimator.titleList.reduce((a, b) => {
	return TitleAnimator.getLength(a) > TitleAnimator.getLength(b) ? a : b
})[0]!.length / 2

const fontSize = vw.value / maxLangTitle

</script>

<style lang="sass" scoped>
.title
	position: absolute
	transform: translate(-50%)
	top: 40dvh
	left: 50%
	pointer-events: none
	font-size: calc( var(--font-size) * 2  )
	span
		white-space: pre
		position: absolute
		display: inline-block
		left: calc(var(--pos) * var(--font-size))
		transition: opacity 0.3s ease, transform 0.2s ease
	&-enter-from
		opacity: 0
		transform: translate(-2ch, -5ch)
	&-leave-to
		opacity: 0
		transform: translate(2ch, 5ch)
</style>