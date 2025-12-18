---
title: 在Web中使用NerdFont
pubDate: 2025/12/18
description: 用nerd来替换掉你的fa图标
abstract: 众所周知，fa图标在web开发中被广泛使用，但该图标集部分图标有着vip要求，而且使用需要特殊的组件...但今天我发现了在tui中广泛使用的NerdFont图标集，也可以在web使用。
tags: ['web']
---

## 前言

虽然fa free也为我们提供了大量的免费图标，为Web UI付出了不可忽视的贡献。但有些图标确实需要付费才能使用，且价格也不是小项目可以承担的。我部署的第一个nodejs项目遇到的问题就是他用了付费图标库依赖，我无法安装。

NerdFont图标集在tui中被广泛使用，被NVim，各种shell美化工具使用。它的图标集也非常丰富，尤其是在编程相关的方面，相对于fa free只强不弱。同时我也没在它的网站上找到什么付费才能用的图标。

本博客的图标就是用NerdFont图标集实现的，效果也非常好。

## 使用方法

众所周知，NerdFont图标集是以字体的形式存在的，所以我们只需要把它作为web字体引入即可。直接去官网下载的字体光压缩包都动着大几M，是不可能拿来做web的。

偶然见，我发现了[nerdfont-webfonts](https://github.com/mshaugh/nerdfont-webfonts)这个项目，它为web使用做了优化，直接引入css即可。本博客使用的JetBrains Mono Nerd Font字体也才950k，可谓是消了很多。

现在[字体列表](https://mshaugh.github.io/nerdfont-webfonts/fonts.html)里找到你要的字体，找到它的css名称，直接在html里`https://cdn.jsdelivr.net/gh/mshaugh/nerdfont-webfonts@v3.3.0/build/{css名}`即可。
比如我用的是 `JetBrainsMono` ，对应的css名是 `jetbrainsmono.css` ，按下方插入css即可将字体引入。

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mshaugh/nerdfont-webfonts@v3.3.0/build/jetbrainsmono.css">
```

然后在css里使用该字体即可。

```css
body {
family: "JetBrainsMonoNL NF", monospace;
}
```

::: tip
你可以打开上面的css看下它都定义了字体名。
:::

## 一些使用心得

NerdFont只是字体，你只要把图标的unicode码放塞在文字里就可以用。

```vue {name:NerdFontIcon.vue}
<span> Web</span>
```
```vue {name:FontAwesomeIcon.vue}
<span>
  <font-awesome-icon :icon="['fas', 'tag']" />
  Web
</span>
```

可以直接以文字的方式表示。这不仅可以直接在ide里预览，可读性比fa更好，同时对于不方便传递组件的场景非常有用。

::: warning
NerdFont图标集更偏向于编程领域，对于生活类图标可能没有fa那么丰富。

NerdFont只是字体，在某些情况下css表现和svg略有不同。
:::