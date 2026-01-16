/**
 * Web Params Player - URL参数音乐播放器
 * 
 * URL 参数格式:
 * ?title=歌曲名&artist=歌手&cover=封面URL&audio=音频URL&detail=详情页URL(可选)
 */

(function () {
    'use strict';

    // DOM Elements
    const elements = {
        playerContainer: document.getElementById('player-container'),
        docContainer: document.getElementById('doc-container'),

        // Background
        bgLayer: document.getElementById('bg-layer'),

        // Cover
        coverImg: document.getElementById('cover-img'),

        // Song Info
        songTitle: document.getElementById('song-title'),
        songArtist: document.getElementById('song-artist'),

        // Progress
        progressBar: document.getElementById('progress-bar'),
        progressFill: document.getElementById('progress-fill'),
        progressThumb: document.getElementById('progress-thumb'),
        currentTime: document.getElementById('current-time'),
        totalTime: document.getElementById('total-time'),

        // Controls
        playBtn: document.getElementById('play-btn'),
        playIcon: document.getElementById('play-icon'),

        // Detail
        detailSection: document.getElementById('detail-section'),
        detailLink: document.getElementById('detail-link'),

        // Audio
        audio: document.getElementById('audio-player')
    };

    // State
    let isDragging = false;

    // API配置
    const API_BASE = 'https://api.ygking.top';

    /**
     * 解析 URL 参数（带解码处理）
     */
    function getParams() {
        const params = new URLSearchParams(window.location.search);
        const rawSearch = window.location.search;

        // 安全解码函数，处理可能的双重编码
        const safeDecode = (value) => {
            if (!value) return value;
            try {
                // 尝试解码，如果已经是解码后的则直接返回
                const decoded = decodeURIComponent(value);
                // 检查是否还需要再解码一次（双重编码的情况）
                if (decoded !== value && decoded.includes('%')) {
                    try {
                        return decodeURIComponent(decoded);
                    } catch {
                        return decoded;
                    }
                }
                return decoded;
            } catch {
                return value;
            }
        };

        // 从原始 URL 中提取完整的参数值（处理包含 & 的 URL）
        const extractFullParam = (paramName, nextParams = []) => {
            const regex = new RegExp(`[?&]${paramName}=([^]*?)(?:&(?:${nextParams.join('|')})=|$)`);
            const match = rawSearch.match(regex);
            if (match && match[1]) {
                try {
                    return decodeURIComponent(match[1]);
                } catch {
                    return match[1];
                }
            }
            return params.get(paramName);
        };

        // audio 参数后面可能跟着 detail 参数
        const audioUrl = extractFullParam('audio', ['detail']);
        // detail 是最后一个参数
        const detailUrl = extractFullParam('detail', []);

        // 使用代理加载音频（解决防盗链 403 问题）
        // 已禁用代理，直接使用原始URL测试
        const proxyAudioUrl = (url) => {
            return url; // 直接返回原始URL，不走代理
            /*
            if (!url) return url;
            // 检查是否需要代理（外部 URL）
            const isExternal = url.startsWith('http://') || url.startsWith('https://');
            if (isExternal) {
                return `/proxy?url=${encodeURIComponent(url)}`;
            }
            return url;
            */
        };

        return {
            title: safeDecode(params.get('title')),
            artist: safeDecode(params.get('artist')),
            cover: params.get('cover'),
            audio: proxyAudioUrl(audioUrl),
            detail: detailUrl
        };
    }

    /**
     * 验证必需参数
     */
    function validateParams(params) {
        const required = ['title', 'artist', 'cover', 'audio'];
        const missing = required.filter(key => !params[key]);

        if (missing.length > 0) {
            return {
                valid: false,
                message: `缺少必需参数: ${missing.join(', ')}`
            };
        }
        return { valid: true };
    }

    /**
     * 显示文档页面
     */
    function showDocs() {
        elements.playerContainer.style.display = 'none';
        elements.docContainer.style.display = 'flex';
    }

    /**
     * 从图片提取主色调
     */
    function extractDominantColor(img) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = 50; // 缩小尺寸提高性能
            canvas.width = size;
            canvas.height = size;

            ctx.drawImage(img, 0, 0, size, size);
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;

            // 收集颜色样本
            let r = 0, g = 0, b = 0, count = 0;

            for (let i = 0; i < data.length; i += 16) { // 每4个像素采样一次
                const pr = data[i];
                const pg = data[i + 1];
                const pb = data[i + 2];

                // 跳过太暗或太亮的颜色
                const brightness = (pr + pg + pb) / 3;
                if (brightness < 30 || brightness > 220) continue;

                // 跳过灰色（饱和度太低）
                const max = Math.max(pr, pg, pb);
                const min = Math.min(pr, pg, pb);
                const saturation = max > 0 ? (max - min) / max : 0;
                if (saturation < 0.2) continue;

                r += pr;
                g += pg;
                b += pb;
                count++;
            }

            if (count > 0) {
                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);
                return `rgb(${r}, ${g}, ${b})`;
            }
        } catch (e) {
            console.warn('颜色提取失败:', e);
        }
        return null;
    }

    /**
     * 应用主题色
     */
    function applyThemeColor(color) {
        if (!color) return;
        document.documentElement.style.setProperty('--accent', color);
        // 计算hover颜色（稍微亮一点）
        elements.playBtn.style.background = color;
        elements.playBtn.style.boxShadow = `0 8px 25px ${color}66`;
    }

    /**
     * 初始化播放器
     */
    function initPlayer(params) {
        // 设置页面标题
        document.title = `${params.title} - ${params.artist}`;

        // 设置歌曲信息
        elements.songTitle.textContent = params.title;
        elements.songArtist.textContent = params.artist;

        elements.coverImg.onload = () => {
            elements.coverImg.classList.add('loaded');
            // 设置背景
            elements.bgLayer.style.backgroundImage = `url(${params.cover})`;

            // 创建一个隐藏的图片用于提取颜色（使用 CORS 代理）
            const proxyImg = new Image();
            proxyImg.crossOrigin = 'anonymous';
            // 使用 wsrv.nl 作为图片代理，它支持 CORS
            proxyImg.src = `https://wsrv.nl/?url=${encodeURIComponent(params.cover)}&output=jpg`;

            proxyImg.onload = () => {
                const color = extractDominantColor(proxyImg);
                if (color) {
                    applyThemeColor(color);
                }
            };

            proxyImg.onerror = () => {
                console.warn('颜色提取失败: 代理图片加载失败');
            };
        };

        elements.coverImg.onerror = () => {
            console.warn('封面加载失败');
            // 即便封面加载失败，也可以尝试用默认颜色或之前的逻辑，这里暂不处理
        };

        // 直接加载原图到显示元素（不需要 crossOrigin，避免 CORS 错误导致图片不显示）
        elements.coverImg.removeAttribute('crossOrigin');
        elements.coverImg.src = params.cover;

        // 设置音频
        elements.audio.src = params.audio;

        // 设置详情链接
        if (params.detail) {
            elements.detailSection.style.display = 'block';
            elements.detailLink.href = params.detail;
        }

        // 绑定事件
        bindEvents();

        // 设置 Media Session API（浏览器媒体控制）
        setupMediaSession(params);
    }

    /**
     * 设置 Media Session API
     * 将歌曲信息传递给浏览器媒体控制中心
     */
    function setupMediaSession(params) {
        if (!('mediaSession' in navigator)) {
            console.warn('Media Session API 不受支持');
            return;
        }

        // 设置媒体元数据
        navigator.mediaSession.metadata = new MediaMetadata({
            title: params.title,
            artist: params.artist,
            album: params.title, // 使用歌曲名作为专辑名
            artwork: [
                { src: params.cover, sizes: '96x96', type: 'image/jpeg' },
                { src: params.cover, sizes: '128x128', type: 'image/jpeg' },
                { src: params.cover, sizes: '192x192', type: 'image/jpeg' },
                { src: params.cover, sizes: '256x256', type: 'image/jpeg' },
                { src: params.cover, sizes: '384x384', type: 'image/jpeg' },
                { src: params.cover, sizes: '512x512', type: 'image/jpeg' }
            ]
        });

        // 设置播放/暂停控制
        navigator.mediaSession.setActionHandler('play', () => {
            elements.audio.play();
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            elements.audio.pause();
        });

        // 设置上一曲/下一曲（单曲播放器，禁用）
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);

        // 设置进度跳转
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime !== undefined && elements.audio.duration) {
                elements.audio.currentTime = details.seekTime;
            }
        });

        // 设置快进/快退
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            const skipTime = details.seekOffset || 5;
            elements.audio.currentTime = Math.max(0, elements.audio.currentTime - skipTime);
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
            const skipTime = details.seekOffset || 5;
            elements.audio.currentTime = Math.min(elements.audio.duration || 0, elements.audio.currentTime + skipTime);
        });

        // 监听播放进度，更新 position state
        elements.audio.addEventListener('timeupdate', updatePositionState);
        elements.audio.addEventListener('durationchange', updatePositionState);

        console.log('Media Session API 已设置');
    }

    /**
     * 更新媒体播放位置状态
     */
    function updatePositionState() {
        if (!('mediaSession' in navigator) || !elements.audio.duration) return;

        try {
            navigator.mediaSession.setPositionState({
                duration: elements.audio.duration,
                playbackRate: elements.audio.playbackRate,
                position: elements.audio.currentTime
            });
        } catch (e) {
            // 忽略错误，某些浏览器可能不支持
        }
    }

    /**
     * 格式化时间 (秒 -> m:ss)
     */
    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 更新进度条
     */
    function updateProgress() {
        if (isDragging) return;

        const { currentTime, duration } = elements.audio;
        if (duration > 0) {
            const percent = (currentTime / duration) * 100;
            elements.progressFill.style.width = `${percent}%`;
            elements.progressThumb.style.left = `${percent}%`;
            elements.currentTime.textContent = formatTime(currentTime);
        }
    }

    /**
     * 跳转到指定位置
     */
    function seekTo(e) {
        const rect = elements.progressBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

        if (elements.audio.duration) {
            elements.audio.currentTime = percent * elements.audio.duration;
            elements.progressFill.style.width = `${percent * 100}%`;
            elements.progressThumb.style.left = `${percent * 100}%`;
        }
    }

    /**
     * 切换播放/暂停
     */
    function togglePlay() {
        if (elements.audio.paused) {
            elements.audio.play().catch(err => {
                console.error('播放失败:', err);
            });
        } else {
            elements.audio.pause();
        }
    }

    /**
     * 更新播放按钮图标
     */
    function updatePlayButton() {
        if (elements.audio.paused) {
            elements.playIcon.classList.remove('fa-pause');
            elements.playIcon.classList.add('fa-play');
        } else {
            elements.playIcon.classList.remove('fa-play');
            elements.playIcon.classList.add('fa-pause');
        }
    }

    /**
     * 绑定事件
     */
    function bindEvents() {
        // 播放按钮
        elements.playBtn.addEventListener('click', togglePlay);

        // 音频事件
        elements.audio.addEventListener('play', updatePlayButton);
        elements.audio.addEventListener('pause', updatePlayButton);
        elements.audio.addEventListener('timeupdate', updateProgress);
        elements.audio.addEventListener('loadedmetadata', () => {
            elements.totalTime.textContent = formatTime(elements.audio.duration);
        });
        elements.audio.addEventListener('ended', () => {
            elements.audio.currentTime = 0;
            updatePlayButton();
        });

        // 进度条点击
        elements.progressBar.addEventListener('click', seekTo);

        // 进度条拖拽
        elements.progressBar.addEventListener('mousedown', (e) => {
            isDragging = true;
            seekTo(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                seekTo(e);
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // 触摸支持
        elements.progressBar.addEventListener('touchstart', (e) => {
            isDragging = true;
            const touch = e.touches[0];
            seekTo({ clientX: touch.clientX });
        });

        elements.progressBar.addEventListener('touchmove', (e) => {
            if (isDragging) {
                const touch = e.touches[0];
                seekTo({ clientX: touch.clientX });
            }
        });

        elements.progressBar.addEventListener('touchend', () => {
            isDragging = false;
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                togglePlay();
            } else if (e.code === 'ArrowLeft') {
                elements.audio.currentTime = Math.max(0, elements.audio.currentTime - 5);
            } else if (e.code === 'ArrowRight') {
                elements.audio.currentTime = Math.min(elements.audio.duration, elements.audio.currentTime + 5);
            }
        });
    }

    /**
     * 搜索歌曲
     */
    async function searchSong(name) {
        const url = `${API_BASE}/api/search?keyword=${encodeURIComponent(name)}&type=song&num=1`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`搜索失败: ${response.status}`);
        }

        const data = await response.json();

        if (data.code !== 0 || !data.data?.list?.length) {
            throw new Error('未找到歌曲');
        }

        return data.data.list[0];
    }

    /**
     * 获取歌曲播放URL
     */
    async function getSongUrl(mid) {
        const url = `${API_BASE}/api/song/url?mid=${encodeURIComponent(mid)}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`获取播放URL失败: ${response.status}`);
        }

        const data = await response.json();

        if (data.code !== 0 || !data.data) {
            throw new Error('无法获取播放URL');
        }

        // API 返回格式: { data: { "歌曲mid": "播放url" } }
        const audioUrl = data.data[mid] || Object.values(data.data)[0];
        if (!audioUrl) {
            throw new Error('无法获取播放URL');
        }

        return audioUrl;
    }

    /**
     * 获取封面URL
     */
    async function getCoverUrl(mid) {
        const url = `${API_BASE}/api/song/cover?mid=${encodeURIComponent(mid)}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`获取封面失败: ${response.status}`);
        }

        const data = await response.json();

        if (data.code !== 0 || !data.data?.url) {
            throw new Error('无法获取封面URL');
        }

        return data.data.url;
    }

    /**
     * 通过歌曲名搜索并跳转到播放器
     */
    async function searchAndRedirect(name) {
        try {
            // 显示加载状态
            elements.songTitle.textContent = '搜索中...';
            elements.songArtist.textContent = name;
            elements.playerContainer.style.display = 'flex';
            elements.docContainer.style.display = 'none';

            // 1. 搜索歌曲
            const song = await searchSong(name);
            const mid = song.mid;
            const title = song.name || song.title || name;

            // 获取歌手名（处理多个歌手的情况）
            let artist = '未知歌手';
            if (song.singer && Array.isArray(song.singer) && song.singer.length > 0) {
                artist = song.singer.map(s => s.name).join(' / ');
            } else if (song.singer_name) {
                artist = song.singer_name;
            }

            // 更新显示
            elements.songTitle.textContent = title;
            elements.songArtist.textContent = artist;

            // 2. 并行获取封面和音频URL
            const [coverUrl, audioUrl] = await Promise.all([
                getCoverUrl(mid),
                getSongUrl(mid)
            ]);

            // 3. 构建完整的播放器URL并跳转
            const playerUrl = new URL(window.location.origin + window.location.pathname);
            playerUrl.searchParams.set('title', title);
            playerUrl.searchParams.set('artist', artist);
            playerUrl.searchParams.set('cover', coverUrl);
            playerUrl.searchParams.set('audio', audioUrl);

            // 使用 replace 跳转，避免返回时再次触发搜索
            window.location.replace(playerUrl.toString());

        } catch (error) {
            console.error('搜索处理失败:', error);
            elements.songTitle.textContent = '搜索失败';
            elements.songArtist.textContent = error.message;
        }
    }

    /**
     * 初始化
     */
    function init() {
        const urlParams = new URLSearchParams(window.location.search);
        const nameParam = urlParams.get('name');

        // 如果有 name 参数，执行搜索并跳转
        if (nameParam) {
            searchAndRedirect(nameParam);
            return;
        }

        // 正常流程：解析完整参数
        const params = getParams();
        const validation = validateParams(params);

        if (!validation.valid) {
            showDocs();
            return;
        }

        initPlayer(params);
    }

    // 启动
    init();
})();
