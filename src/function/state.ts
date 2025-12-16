import { computed, type ComputedRef, shallowReactive, shallowRef, type ShallowRef } from 'vue'
import { useRoute } from 'vue-router'

export type PageName = 'home' | 'article' | 'edu' | 'links' | 'about' | '404'
export function usePageName(): ComputedRef<PageName> {
	const route = useRoute()
	return computed<PageName>(() => {
		if (route.path === '/' || route.path === '/home') return 'home'
		if (route.path.startsWith('/article')) return 'article'
		if (route.path.startsWith('/edu')) return 'edu'
		if (route.path.startsWith('/links')) return 'links'
		if (route.path.startsWith('/about')) return 'about'
		return '404'
	})
}

let windowSizeCache: {vw: ShallowRef<number>, vh: ShallowRef<number>} | undefined
export function useWindowSize(): {vw: ShallowRef<number>, vh: ShallowRef<number>} {
	if (windowSizeCache) return windowSizeCache
	if (import.meta.env.SSR) {
		const vw = shallowRef(1920 / 100)
		const vh = shallowRef(1080 / 100)
		return {vw, vh}
	}
	const vw = shallowRef(window.innerWidth / 100)
	const vh = shallowRef(window.innerHeight / 100)
	windowSizeCache = {vw, vh}
	window.addEventListener('resize', () => {
		vw.value = window.innerWidth / 100
		vh.value = window.innerHeight / 100
	})
	return {vw, vh}
}

const { vw } = useWindowSize()
export const isPhoneMode = computed(()=>{
	return vw.value * 100 < 900
})

export const runtime = shallowReactive({
	outlineOpen: !isPhoneMode.value,
	indexOpen: !isPhoneMode.value,
	pageOutline: {} as Record<string, {
		setRoot: (el: HTMLElement)=>void
		refresh: ()=>void
	}>,
	get phoneMode() {
		return isPhoneMode.value
	},
})

export function getWindow(): Window | undefined {
	if (import.meta.env.SSR) return undefined
	return window
}

export function getDocument(): Document | undefined {
	if (import.meta.env.SSR) return undefined
	return document
}