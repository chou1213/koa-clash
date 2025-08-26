# Koa Clash 订阅服务器

基于 Koa 框架的 Clash 订阅链接服务器，用于生成和提供 Clash 配置文件。

## 功能特性

- 生成标准的 Clash 配置文件
- 支持多种代理协议 (Shadowsocks, VMess, Trojan)
- 自动分组和负载均衡
- 健康检查端点
- YAML 格式输出
- **随机路由安全机制** - 为每个配置文件生成随机路由，增强安全性

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置代理节点

在 `config/` 文件夹中创建 YAML 配置文件，每个文件包含一组代理配置：

```yaml
proxies:
  - name: "Example Server"
    type: ss
    server: example.com
    port: 443
    cipher: aes-256-gcm
    password: your_password

proxy-groups:
  - name: "Auto"
    type: url-test
    proxies:
      - "Example Server"
    url: 'http://www.gstatic.com/generate_204'
    interval: 300

rules:
  - DOMAIN-SUFFIX,google.com,Auto
  - MATCH,DIRECT
```

- 支持 `.yml` 和 `.yaml` 格式文件
- 每个配置文件会自动分配随机路由，确保安全性

### 启动服务器

```bash
# 生产环境
npm start

# 开发环境
npm run dev
```

服务器将在端口 7180 上运行。

启动时，控制台会显示每个配置文件对应的随机路由：
```
Mapped example1.yml -> /9a773b209dc606cc
Mapped example2.yml -> /84f065ef92a935fd
```

## API 端点

- `GET /clash` - 获取原有的 Clash 配置文件, 读取根目录confiy.yml文件
- `GET /health` - 健康检查
- `GET /{随机路由}` - 获取对应配置文件的内容（安全路由）

## 随机路由安全机制

**核心特性：**
- 每个 `config/` 文件夹中的 `.yml`/`.yaml` 文件会自动分配一个 16 位随机十六进制路由
- 路由名称与原文件名完全不同，增强安全性
- 每次服务器重启都会重新生成新的随机路由
- 支持多个配置文件同时运行

**使用方法：**
1. 在 `config/` 文件夹中放置你的 YAML 配置文件
2. 启动服务器后，查看控制台输出的路由映射
3. 在 Clash 客户端中使用对应的随机路由链接：
```
http://localhost:7180/9a773b209dc606cc
http://localhost:7180/84f065ef92a935fd
```

**安全优势：**
- 隐藏真实文件名，防止配置文件被恶意扫描
- 随机路由难以被猜测，提高访问安全性
- 服务器重启后路由自动更新，进一步增强安全性

## 支持的代理类型

- Shadowsocks (ss)
- VMess
- VLESS (支持 XTLS Reality)
- Trojan
- 更多类型可以根据需要添加

## 技术实现

**随机路由生成器：**
- 使用 Node.js `crypto.randomBytes(8).toString('hex')` 生成 16 位随机字符串
- 确保每次启动时都生成不同的路由映射
- 自动扫描 `config/` 目录下的所有 `.yml` 和 `.yaml` 文件

**安全特性：**
- 路由与文件名完全解耦，无法通过文件名推测路由
- 支持动态路由映射，提高系统安全性
- 保留原有的 `/clash` 端点以保持向后兼容

## 配置文件说明

每个 YAML 配置文件应包含：
- `mixed-port`: 混合端口配置
- `external-controller`: API 控制接口
- `proxies`: 代理服务器列表
- `proxy-groups`: 代理分组 (可选)
- `rules`: 分流规则
- `tun`: TUN 模式配置 (可选)