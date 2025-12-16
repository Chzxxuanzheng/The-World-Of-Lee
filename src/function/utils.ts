import { onUnmounted, type ShallowRef, shallowRef, watchEffect } from 'vue'

/**
 * 每帧执行一次
 * @param func 
 */
export function useFrame(func: ()=>void) {
	let on = true
	const main = ()=>{
		func()
		if (!on) return
		requestAnimationFrame(main)
	}
	main()
	onUnmounted(()=>on=false)
}

/**
 * 自带卸载检测的 setTimeout
 * @returns 
 */
export function useSafeTimeout(): typeof setTimeout {
	let on = true
	const out = (...args: Parameters<typeof setTimeout>): ReturnType<typeof setTimeout> => {
		const handler = args[0]
		const func = () => {
			if (!on) return
			if(typeof handler === 'function') handler()
			else throw new Error('useSafeTimeout 不支持字符串形式的代码')
		}
		args[0] = func
		// eslint-disable-next-line @typescript-eslint/no-implied-eval
		return setTimeout(...args)
	}
	onUnmounted(()=>on=false)
	return out as typeof setTimeout
}

/**
 * 自带卸载检测的 setInterval
 * @param args 
 * @returns 
 */
export function useInterval(...args: Parameters<typeof setInterval>): ReturnType<typeof setInterval> {
	// eslint-disable-next-line @typescript-eslint/no-implied-eval
	const id = setInterval(...args)
	onUnmounted(()=>clearInterval(id))
	return id
}

const storageCache = new Map<string, {
	content: ShallowRef<unknown>
	defaultValue: unknown
}>()
/**
 * 本地存储的响应式封装
 * @param key 键值
 * @param defaultValue 默认值
 * @returns 
 */
export function useLocalStorage<T>(key: string, defaultValue: T): ShallowRef<T> {
	if (import.meta.env.SSR) {
		return shallowRef<T>(defaultValue)
	}
	
	if (storageCache.has(key)) {
		const cache = storageCache.get(key)!
		if (cache.defaultValue !== defaultValue)
			throw new Error(`useLocalStorage key="${key}" defaultValue 不匹配`)
		return cache.content as ShallowRef<T>
	}

	const item = localStorage.getItem(key)
	let value: T = defaultValue
	if (item !== null) {
		try {
			value = JSON.parse(item).value as T
		} catch {
			value = defaultValue
		}
	}
	const re = shallowRef<T>(value)
	watchEffect(()=>{
		localStorage.setItem(key, JSON.stringify({ value: re.value }))
	})
	storageCache.set(key, {
		content: re,
		defaultValue,
	})
	return re
}

type EventMatcher = HTMLElement | Document | Window
export function useEventListener<K extends keyof HTMLElementEventMap>(
	target: EventMatcher,
	event: K,
	listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
) {
	target.addEventListener(event, listener as EventListener)
	const remove = (el: EventMatcher)=>{
		el.removeEventListener(event, listener as EventListener)
	}
	onUnmounted(()=>{
		remove(target)
	})
}

/**
 * 随机数
 * @param max 最大值
 */
export function random(max: number): number
/**
 * 随机数
 * @param min 最小值
 * @param max 最大值
 */
export function random(min: number, max: number): number
export function random(arg1: number, arg2?: number): number {
	if (arg2 === undefined) return random(0, arg1)
	return Math.random() * (arg2 - arg1) + arg1
}

/**
 * 随机选择数组中的一个元素
 * @param arr 数组
 */
export function ranChoice<T>(arr: T[]): T {
	return arr[Math.floor(random(arr.length))]!
}

export function createId(url: string): string {
	return url.replaceAll('/', '-').replaceAll('%', '_')
}

let chCache: number | undefined
/**
 * 获取 1ch 的像素宽度
 * @returns 
 */
export function getCh(): number {
	if (chCache) return chCache
	if (import.meta.env.SSR) return 16
	const div = document.createElement('div')
	div.style.width = '1ch'
	div.style.position = 'absolute'
	div.style.visibility = 'hidden'
	document.body.appendChild(div)
	const width = div.getBoundingClientRect().width
	div.remove()
	chCache = width
	return width
}