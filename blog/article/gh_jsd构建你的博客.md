---
title: GitHub Pages+Jsdelivr 让你的静态网站用上CDN
pubDate: 2026/1/19
description: serverless太爽了
abstract: 最近突然发现Jsdelivr不仅可以直接读取GitHub仓库的静态资源，还有国内镜像源，这就有得玩了。结合GitHub Pages，我们可以实现一个完全免费的静态网站CDN加速服务。
tags: ['web']
---

## Jsdelivr

`Jsdelivr`是一个免费的CDN加速服务，支持`GitHub`、`npm`、`WordPress`等多种平台的静态资源加速分发，境外速度非常快。但国内被封了。不过问题不大有镜像源。

`Jsdelivr`有一个特殊的地方是，它可以直接访问`GitHub`仓库的静态资源，这点就很方便了，你把你的网页上传到你的仓库里，就啥都不用管了，无需注册额外账号啥的。
它的访问格式是这样的：

```txt
https://cdn.jsdelivr.net/gh/用户名/仓库名@分支名/路径
```

如，我的博客项目地址是`Chzxxuanzheng/The-World-Of-Lee`，在`master`分支的`public/avatar.png`目录下是我的头像，那么我就可以通过下面的地址访问到这个头像：[https://cdn.jsdelivr.net/gh/Chzxxuanzheng/The-World-Of-Lee@master/public/avatar.png](https://cdn.jsdelivr.net/gh/Chzxxuanzheng/The-World-Of-Lee@master/public/avatar.png)。

好了，使用`Jsdelivr`的方法说过了，下面说镜像源的问题。起初我也不知道`Jsdelivr`是有镜像源的。后来是看了[AirTouch的博客](https://www.xsl.im/cn-mirror/)都博客才知道的。

该博客共列举了四个镜像源：

| 地址                                                   | 介绍                            |
|--------------------------------------------------------|---------------------------------|
| [cdn.iocdn.cc](https://cdn.iocdn.cc)                   | 括彩云国内CDN提供支持           |
| [s4.zstatic.net](https://s4.zstatic.net)               | 多个云服务融合国内CDN提供支持   |
| [cdn.jsdmirror.com](https://cdn.jsdmirror.com)         | 多个云服务融合国内CDN提供支持   |
| [jsdelivr.topthink.com](https://jsdelivr.topthink.com) | 阿里云CDN提供支持（无主页链接） |

我的博客采用的是`cdn.jsdmirror.com`镜像源。你可以把上面的`cdn.jsdelivr.net`替换成`cdn.jsdmirror.com`即可。上述的例子改成：[https://cdn.jsdmirror.com/gh/Chzxxuanzheng/The-World-Of-Lee@master/public/avatar.png](https://cdn.jsdmirror.com/gh/Chzxxuanzheng/The-World-Of-Lee@master/public/avatar.png)。

## GitHub Pages 构建

`GitHub Pages`这东西大家都不陌生了，现在`GitHub Pages`已经可以做到`actions`跑完自动创建`pages`了，没有任何残留。但是`Jsdelivr`需要访问仓库的静态资源，无残留就不太符合我们的要求了。所以我们采用`JamesIves/github-pages-deploy-action@v4`这个`action`来实现自动化部署。使用方法如下

```yaml
steps:
    uses: JamesIves/github-pages-deploy-action@v4
    with:
        branch: 分支名称
        folder: 构建产物目录
```

我们可以通过将构建产物上传到`pages`分支，然后再在`GitHub Pages`设置里将来源设置为来自`pages`分支即可。这时候就可以通过`Jsdelivr`访问到我们的静态资源了。如，我的头像编译后在`avatar.png`，那么我就可以通过下面的地址访问到这个头像：[https://cdn.jsdmirror.com/gh/Chzxxuanzheng/The-World-Of-Lee@pages/avatar.png](https://cdn.jsdmirror.com/gh/Chzxxuanzheng/The-World-Of-Lee@pages/avatar.png)。

## Vite 相关设置

vite有个`base`选项，可以设置资源的基础路径。编译结束后，所有路径都会以该路径开头。所以我们可以通过设置`base`来实现让资源路径指向`Jsdelivr`的连接。在`vite.config.ts`里这样设置：

```ts
import { defineConfig } from 'vite'

const env = process.env

// https://vite.dev/config/
export default defineConfig({
    base: env.VITE_CDN_BASE || './',
})
```

这样做编译时，我们只需要设置环境变量`VITE_CDN_BASE`为`https://cdn.jsdmirror.com/gh/用户名/仓库名@分支名/路径/`即可。

## 结尾

通过上面的设置，我们就可以实现一个完全免费的静态网站CDN加速服务了。`GitHub Pages`负责构建和托管静态网站，`Jsdelivr`负责加速分发静态资源。唯一美中不足的是用户要先去`GitHub`拿到`HTML`才能享受到`Jsdelivr`的加速服务。而且`GitHub`本身就被半墙了，在国内体验并不好。

## 附录：完整CI配置文件

```yaml {name:build-page.yml}
name: 编译部署

on:
    push:
        branches:
            - master

    # 这个选项可以使你手动在 Action tab 页面触发工作流
    workflow_dispatch:

permissions:
    contents: write
    pages: write
    id-token: write

jobs:
    build:
        runs-on: ubuntu-latest
        steps:
            - name: 设置 Nodejs
              uses: actions/setup-node@v4
              with:
                  node-version: 20.x

            - name: 拉取分支
              uses: actions/checkout@v4

            - name: 缓存依赖
              uses: actions/cache@v4
              with:
                  # 缓存 yarn/npm/pnpm 以及 node_modules，适配 Yarn v1/v2+ 和 pnpm
                  path: |
                      ~/.cache/yarn
                      .yarn/cache
                      ~/.npm
                      node_modules
                      yarn.lock
                  key: page

            - name: 更新依赖
              run: yarn

            - name: 设置环境变量
              run: |
                  echo VITE_CDN_BASE=https://cdn.jsdmirror.com/gh/chzxxuanzheng/The-World-Of-Lee@pages/ >> $GITHUB_ENV

            - name: 构建
              run: yarn build

            - name: 配置 Pages 环境
              uses: actions/configure-pages@v5

            - name: 上传构建产物
              uses: actions/upload-pages-artifact@v3
              with:
                  path: "./dist"

            - name: 部署到 GitHub Pages
              id: deployment
              uses: JamesIves/github-pages-deploy-action@v4
              with:
                  branch: pages
                  folder: dist
```
