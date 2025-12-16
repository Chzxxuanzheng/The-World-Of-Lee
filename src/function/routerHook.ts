import { type RouteLocationNormalized } from 'vue-router'
import PageController from './pageController.ts'

/**
 * 页面风格检测
 * @param to 
 * @returns 
 */
function pageCheck(to: RouteLocationNormalized) {
	if (import.meta.env.SSR) return
	const pageName = [
		'home',
		'article',
		'edu',
		'links',
		'about',
		'unknown',
	]
	for (const name of pageName) {
		document.body.classList.remove(name)
	}
	for (const name of pageName) {
		if (to.path.startsWith(`/${name}`)) {
			document.body.classList.add(name)
			return
		}
	}

	if (to.fullPath === '/' || to.fullPath === '/index.html') {
		document.body.classList.add('home')
		return
	}
	document.body.classList.add('unknown')
}

function updatePageController(to: RouteLocationNormalized) {
	PageController.currentPath = to.path
}

export default [pageCheck, updatePageController]