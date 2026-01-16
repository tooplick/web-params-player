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
        errorContainer: document.getElementById('error-container'),
        errorMessage: document.getElementById('error-message'),

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

    /**
     * 解析 URL 参数
     */
    function getParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            title: params.get('title'),
            artist: params.get('artist'),
            cover: params.get('cover'),
            audio: params.get('audio'),
            detail: params.get('detail')
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
     * 显示错误
     */
    function showError(message) {
        elements.playerContainer.style.display = 'none';
        elements.errorContainer.style.display = 'flex';
        elements.errorMessage.textContent = message;
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

        // 设置封面
        elements.coverImg.src = params.cover;
        elements.coverImg.onload = () => {
            elements.coverImg.classList.add('loaded');
            // 设置背景
            elements.bgLayer.style.backgroundImage = `url(${params.cover})`;
        };
        elements.coverImg.onerror = () => {
            console.warn('封面加载失败');
        };

        // 设置音频
        elements.audio.src = params.audio;

        // 设置详情链接
        if (params.detail) {
            elements.detailSection.style.display = 'block';
            elements.detailLink.href = params.detail;
        }

        // 绑定事件
        bindEvents();
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
     * 初始化
     */
    function init() {
        const params = getParams();
        const validation = validateParams(params);

        if (!validation.valid) {
            showError(validation.message);
            return;
        }

        initPlayer(params);
    }

    // 启动
    init();
})();
