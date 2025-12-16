---
title: 使用Docker部署Llbt踩坑记录
pubDate: 2025/12/09
description: 记录下使用Docker多开部署Llbt的经历
abstract: 长时间不搞docker了，很多东西都忘了，再加上本来就不擅长docker，导致安装Llbt的经历挺坎坷的。同时这次也是一次多开的安装经历，协议端多开的需求应该很少吧？这方面也没有多少文章，希望这篇文章对用这方面需求的人，能有些帮助。
tags: ['docker', 'bot']
---
## 故事背景

由于最近嘿铲哥作妖，lgr的官签没了。作为2年的lgr老用户，没能力搞签名，也不得不考虑迁移了。正巧最近Llbt也支持milky了，于是决定于迁移到Llbt。Llbt作为新兴webhook，和打开就能跑的传统协议端不一样，需要完整的QQ环境才能运行。相对于自己折腾环境，使用docker部署是最优解。我需要同时把我的大号和Bot号挂上去，官方的部署脚本照抄是不行了

## 坑1: Docker使用代理

和运行什么指令，你的命令就是你运行的指令执行的不一样，docker指令只是一个前端，它是把指令转交给docker守护进程执行的，这点非常的反直觉。正因如此，你设置在shell里的环境变量什么用都没有。

~~由于我长时间没有折腾docker，外加本来docker就不太会的缘故......就把它给忘了。导致我换了半天节点，都没有任何用。~~

在 `xxx.service.d` 文件夹里创建的配置文件都会被打补丁似的插入到 `xxx.serice` 中。我在 `/etc/systemd/system/docker.service.d` 处创建 `http-proxy.conf` 文件，写入了一下内容。成功把镜像给拉下来

```ini
[Service]
Environment="HTTP_PROXY=http://127.0.0.1:20170"
Environment="HTTPS_PROXY=http://127.0.0.1:20170"
```

## 坑2: 使用非特权LXC运行Docker

听说容器技术很流行，本着迈出自己舒适圈的原则，我也是把服务器从虚拟机换成了LXC，刚夸赞完LXC在PVE上终端好看，就翻车了

```console
Error response from daemon: failed to create task for container: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: error during container init: open sysctl net.ipv4.ip_unprivileged_port_start file: reopen fd 8: permission denied: unknown
```

作为非特权容器，LXC是不能创建nat路由的，自然也就报错了。经过参考[这篇博客](https://www.cnblogs.com/airoot/p/18722987)。

先采用备份，再读取的办法，将容器非特权容器回复成了特权容器。

接着在LXC的配置文件中添加了如下的配置(**注意：要移除注释**)，成功启动了

```ini
lxc.apparmor.profile: unconfined # 表示容器内的进程将不受任何 AppArmor 限制
lxc.mount.auto: cgroup:rw
lxc.mount.auto: proc:rw
lxc.mount.auto: sys:rw
lxc.cap.drop:  # 用于指定容器内进程的能力限制，允许进程执行一些特定的操作，例如修改系统时间、挂载文件系统等
lxc.cgroup.devices.allow: a
```

## 坑3: pmhq与Llbt通信

起初，我听从AI的说法，直接把官方的docker-compose给重复两遍，卷和网关也重复两遍，加上后缀在名字上进行区分，来进行多开。

但很快事实就给我了一巴掌:

```log
PMHQ WebSocket 连接错误，可能 QQ 未启动 正在等待 QQ 启动进行重连...
```

Llbt是依赖于pmhq来操作QQ的，而Llbt和pmhq是打包在两个不同的容器中的，我的pmhq已经完成了扫码登陆，但是Llbt还是连接不到pmhq。看样子是我吓胡乱改改出问题了。

我把Bot的pmhq删除了后缀，成功启动了，看来是后缀的问题。经过一番研究和对比，发现 `container_name` 必须为pmhq才行。但两个 `container_name` 一样必定报错，拿去找ai，得知会导致 `通常应用并不需要 Docker 的 container_name；它需要的是在网络上可访问的主机名或 DNS 名` 。我去Llbt项目搜索了一下，果真如此

```sh:line-numbers=54
port="13000"
host="pmhq"
if [ -n "$pmhq_port" ]; then
  port="$pmhq_port"
fi
if [ -n "$pmhq_host" ]; then
  host="$pmhq_host"
fi
```

可以看到它会指定host为pmhq，正如ai所言，就是确定主机名。于是，我把 `container_name` 移除，加上了 `hostname: pmhq`，成功运行。

## 后记

放弃lgr系这个陪伴了我2年，从小白一步一步成长起来的协议端，属实有些伤感。但属实也是迫不得已。只能说嘿铲害人不浅，搞嘿铲的注定也不会有好下场！

~~不得不说，新icon的小萝莉真好看，比之前的符合我审美。萝莉赛高！萝莉控大胜利！~~

### 附：Docker Compose文件

::: warning
不要使用官方给的镜像源！写这篇文章时，镜像源已经132天没有更新了！
:::

```yaml
services:
  pmhq_bot:
    image: 自己找
    restart: always
    hostname: pmhq
    privileged: true
    environment:
      - ENABLE_HEADLESS=false
      - AUTO_LOGIN_QQ=
    networks:
      - app_network_bot
    volumes:
      - qq_volume_bot:/root/.config/QQ
      - llob_data_bot:/app/llonebot/data

  llbt_bot:
    image: 自己找
    restart: always
    container_name: llbt_bot
    ports:
      - "3001:3001"   # llbt API/服务端口 (宿主机3001)
      - "3080:3080"   # webui (宿主机3080)
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      - ENABLE_SATORI=
      - SATORI_PORT=
      - SATORI_TOKEN=
      - ENABLE_WEBUI=true
      - WEBUI_PORT=3080
      - WEBUI_TOKEN=你觉得我会傻乎乎的把密码泄露出去吗？
    networks:
      - app_network_bot
    volumes:
      - qq_volume_bot:/root/.config/QQ
      - llob_data_bot:/app/llonebot/data
    depends_on:
      - pmhq_bot

  pmhq_me:
    image: 自己找
    restart: always
    hostname: pmhq
    privileged: true
    environment:
      - ENABLE_HEADLESS=false
      - AUTO_LOGIN_QQ=
    networks:
      - app_network_me
    volumes:
      - qq_volume_me:/root/.config/QQ
      - llob_data_me:/app/llonebot/data

  llbt_me:
    image: 自己找
    restart: always
    container_name: llbt_me
    ports:
      - "3002:3001"   # 与 A 区分的宿主机端口
      - "3081:3080"   # 与 A 区分的 webui 端口
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      - ENABLE_SATORI=
      - SATORI_PORT=
      - SATORI_TOKEN=
      - ENABLE_WEBUI=true
      - WEBUI_PORT=3080
      - WEBUI_TOKEN=你觉得我会傻乎乎的把密码泄露出去吗？
    networks:
      - app_network_me
    volumes:
      - qq_volume_me:/root/.config/QQ
      - llob_data_me:/app/llonebot/data
    depends_on:
      - pmhq_me

volumes:
  qq_volume_bot:
  llob_data_bot:
  qq_volume_me:
  llob_data_me:

networks:
  app_network_bot:
    driver: bridge
  app_network_me:
    driver: bridge
```
