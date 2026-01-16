# Web Params Player

一个轻量级的网页音乐播放器，通过 URL 参数传入歌曲信息，部署到 Cloudflare Pages。

## 功能特性

- 🎵 通过 URL 参数传入歌曲信息
- 🔍 **歌曲名搜索模式**：只需传入歌曲名，自动搜索并播放
- 🖼️ 专辑封面展示（带模糊背景效果）
- ▶️ 音频播放控制（播放/暂停）
- 📊 进度条交互（点击/拖拽跳转）
- 🔗 可选的歌曲详情页跳转
- ⌨️ 键盘快捷键支持
- 📱 响应式设计
- 🎛️ 浏览器媒体控制（Media Session API）

## URL 参数

### 方式一：歌曲名搜索（推荐）

只需传入歌曲名，自动搜索并获取封面和音频：

| 参数 | 说明 | 是否必填 |
|------|------|----------|
| `name` | 歌曲名称 | ✅ 必填 |

**示例：**
```
https://player.ygking.top/?name=晴天
```

### 方式二：完整参数

传入完整的歌曲信息：

| 参数 | 说明 | 是否必填 |
|------|------|----------|
| `title` | 歌曲名称 | ✅ 必填 |
| `artist` | 歌手名称 | ✅ 必填 |
| `cover` | 封面图片URL (需URL编码) | ✅ 必填 |
| `audio` | 音频文件URL (需URL编码) | ✅ 必填 |
| `detail` | 歌曲详情页URL (需URL编码) | ⚪ 可选 |

**示例：**
```
https://player.ygking.top/?title=晴天&artist=周杰伦&cover=封面URL&audio=音频URL
```

## 工作流程

### 歌曲名搜索模式

当使用 `?name=歌名` 访问时：

1. 调用 `api.ygking.top` 搜索歌曲（num=1）
2. 获取第一条搜索结果的 mid
3. 并行获取封面 URL 和音频播放 URL
4. 自动跳转到完整参数的播放页面

## 键盘快捷键

- `Space` - 播放/暂停
- `←` - 后退 5 秒
- `→` - 前进 5 秒

## 部署到 Cloudflare Pages

1. Fork 或克隆此仓库
2. 在 Cloudflare Dashboard 中创建 Pages 项目
3. 连接 GitHub 仓库
4. 构建设置留空（纯静态项目）
5. 部署完成后绑定自定义域名

## 本地开发

```bash
npx serve .
```

然后访问: 
- 搜索模式: `http://localhost:3000/?name=晴天`
- 完整参数: `http://localhost:3000/?title=测试&artist=歌手&cover=封面URL&audio=音频URL`

## API 依赖

歌曲名搜索模式依赖 `api.ygking.top` 提供的接口：

- `/api/search` - 搜索歌曲
- `/api/song/url` - 获取播放链接
- `/api/song/cover` - 获取封面

## License

MIT