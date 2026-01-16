/**
 * Audio Proxy Function
 * 代理音频请求，绕过防盗链
 */

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // 获取要代理的音频 URL
    const audioUrl = url.searchParams.get('url');

    if (!audioUrl) {
        return new Response('Missing url parameter', { status: 400 });
    }

    try {
        // 解码 URL
        const decodedUrl = decodeURIComponent(audioUrl);

        // 发起请求，不携带 Referer
        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            },
            redirect: 'follow',
        });

        if (!response.ok) {
            return new Response(`Upstream error: ${response.status}`, {
                status: response.status
            });
        }

        // 获取内容类型
        const contentType = response.headers.get('Content-Type') || 'audio/mpeg';
        const contentLength = response.headers.get('Content-Length');

        // 构建响应头
        const headers = new Headers({
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Cache-Control': 'public, max-age=3600',
        });

        if (contentLength) {
            headers.set('Content-Length', contentLength);
        }

        // 支持 Range 请求（用于音频 seek）
        const range = request.headers.get('Range');
        if (range) {
            headers.set('Accept-Ranges', 'bytes');
            const contentRange = response.headers.get('Content-Range');
            if (contentRange) {
                headers.set('Content-Range', contentRange);
            }
        }

        return new Response(response.body, {
            status: response.status,
            headers,
        });

    } catch (error) {
        console.error('Proxy error:', error);
        return new Response(`Proxy error: ${error.message}`, { status: 500 });
    }
}
