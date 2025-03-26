# c30-proxy
# Node.js 代理服务器

该项目实现了一个 Node.js 代理服务器，支持以下功能：
- HTTP 请求：所有 HTTP 请求均转发到环境变量 `TARGET_URL` 指定的目标地址。
- HTTPS 请求：支持 CONNECT 隧道，按客户端发起的 CONNECT 请求内容建立 TCP 隧道。

## 使用说明

1. 在服务器上安装 Node.js（推荐 v12 及以上）。

2. 克隆或上传该项目代码到服务器。

3. 在项目目录下安装依赖（本示例不依赖第三方包，可跳过）：
   ```bash
   npm install
