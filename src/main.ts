import '@/assets/style.sass'
import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import routerHooks from '@/function/routerHook.ts'
import CodeBlock from './components/CodeBlock.vue'
import CodeGroup from './components/CodeGroup.vue'

const allPages = import.meta.glob('/blog/**/*.md')

export const createApp = ViteSSG(
	App,
	{
		routes: [
			{ path: '/', component: App },
			...Object.keys(allPages).map((path) => {
				path = path.slice('/blog'.length, -3)
				return { path, component: App }
			}),
			// 添加通配符路由捕获所有未匹配的路径
			{ path: '/:pathMatch(.*)*', component: App },
		],
	},
	({ app, router }) => {
		app.component('CodeBlock', CodeBlock)
		app.component('CodeGroup', CodeGroup)
		for (const hook of routerHooks) {
			router.afterEach(hook)
		}
	},
)