# Web Params Player

一个轻量级的网页音乐播放器，通过 URL 参数传入歌曲信息，部署到 Cloudflare Pages。

## 功能特性

- 🎵 通过 URL 参数传入歌曲信息
- 🖼️ 专辑封面展示（带模糊背景效果）
- ▶️ 音频播放控制（播放/暂停）
- 📊 进度条交互（点击/拖拽跳转）
- 🔗 可选的歌曲详情页跳转
- ⌨️ 键盘快捷键支持
- 📱 响应式设计

## URL 参数

| 参数 | 说明 | 是否必填 |
|------|------|----------|
| `title` | 歌曲名称 | ✅ 必填 |
| `artist` | 歌手名称 | ✅ 必填 |
| `cover` | 封面图片URL (需URL编码) | ✅ 必填 |
| `audio` | 音频文件URL (需URL编码) | ✅ 必填 |
| `detail` | 歌曲详情页URL (需URL编码) | ⚪ 可选 |

## 使用示例

```
https://player.ygking.top/?title=晴天&artist=周杰伦&cover=https%3A%2F%2Fexample.com%2Fcover.jpg&audio=https%3A%2F%2Fexample.com%2Faudio.mp3
```

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

然后访问: `http://localhost:3000/?title=测试&artist=歌手&cover=封面URL&audio=音频URL`

## License

MIT