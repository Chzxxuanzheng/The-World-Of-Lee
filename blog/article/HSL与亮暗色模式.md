---
title: HSL与亮暗色模式
pubDate: 2026/01/04
description: 通过HSL调色来设计网页吧
abstract: 众所周知，不同人有不同的亮暗色喜好，网站需要同时兼容这两套主题。通过RGB来设计网页颜色需要同时设计两种颜色，因此翻车的网站也不再少数，这时候就需要HSL来登场了。
tags: ['web']
---

## HSL的优势

传统RGB配色并没有办法简单低成本的得到对应的暗色，网站如果想要设计暗色模式，开发者必须重新挑选颜色。

而HSL在这里却有着无可比拟的优势，HSL即色相、饱和度、亮度（英语：Hue, Saturation, Lightness）。它专门有一个变量控制亮度，这意味着仅通过`100%-L`就可以反转颜色。
当你完成亮色主题时，仅仅反转需要一个相反的亮度就可以拿到暗色模式对应的颜色。同时暗色模式不同颜色的亮度差值与亮色模式一致，不会出现颜色不突出，标题看不到等问题。
本博客就是通过HSL进行亮暗色配色的。

## 该调色方案的劣势

该调色方案抽离了亮度这一属性，不再使用。使用该调色方案，意味着诸如`粉红色`，`深红色`等本身就包含亮度信息的颜色是无法做到的。

比如你在暗色主题下，设计了一款用暗色做背景，粉色做字体颜色，想要营造出一种浪漫的氛围。但是你翻转到亮色模式，粉色就会反转成瘆人的深红色。
~~（小声嘀咕：这深红色也不瘆人啊？闭嘴，你这个拆台的）~~

<div style="display: flex;">
  <span style="padding: 2ch;display: block;color: hsl(0,100%,80%);background-color: hsl(200, 20%, 20%);">我喜欢你♥～</span>
  <span style="padding: 2ch;display: block;color: hsl(0,100%,20%);background-color: hsl(200, 20%, 80%);">我喜欢你♥～</span>
</div>

亮度高的红色是粉色，亮度低的红色是深红色。
如果你坚持在亮色模式使用粉色，那么粉色自身太亮，在亮色背景下难以阅读。

<div style="display: flex;">
  <span style="padding: 2ch;display: block;color: hsl(0,100%,80%);background-color: hsl(200, 20%, 20%);">我喜欢你♥～</span>
  <span style="padding: 2ch;display: block;color: hsl(0,100%,80%);background-color: hsl(200, 20%, 80%);">我喜欢你♥～</span>
</div>

如果要考虑同时兼容亮暗色模式，在设计网站时应该避免采用这些包含亮度的颜色。

## 个人实现亮暗色模式的一些技巧

**干货讲完了，剩下的对于有web开发经验的人来说不用看了。**

我是不建议各位直接使用css的，除非你可以接受`color: hsla(var(--color-red), 100%, var(--color-l), 1)`这样长得要死的写法。
首先你应该要找一个支持函数的css扩展语言。本人在css这边了解不多，不做推荐，演示示例用sass

### 声明你的配色

```sass
body
    // 通用属性
    --color-red: 0
    // 非通用属性
    --color-l: 80%

body.dark
    --color-l: 80%
```

我们直接在body上声明亮度，到时候只用直接改body的class，就能做到切换亮暗色主题

### 编写颜色函数

```sass
@function get-color-red($alpha: 1)
	@return hsla(var(--color-red), 100%, var(--color-l), $alpha)

body
    color
    --color-red: 0
    --color-l: 80%

body.dark
    --color-l: 80%
```

如果你不需要透明度参数，可以移除`$alpha`，使用HSL，有了函数，你就可以把`color: hsla(var(--color-red), 100%, var(--color-l), 1)`一长串简化为`get-color-red`。
不论在可读性还是可维护性上都不错。

### 实现切换亮暗色模式的js

我们可以通过下面的代码来切换亮暗色模式

```js
document.body.classList.remove('dark')
document.body.classList.add('dark')
```

可以通过下面的代码来判断用户当前的亮暗色模式，来适配当前系统亮暗色模式

```js
const media = window.matchMedia('(prefers-color-scheme: dark)')
const _defaultMode = media?.matches ? 'dark' : 'light'
const defaultMode = shallowRef<'light' | 'dark'>(_defaultMode)
media?.addEventListener('change', (e) => {
	defaultMode.value = e.matches ? 'dark' : 'light'
})
```
