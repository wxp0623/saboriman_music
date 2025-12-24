import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_DEV_BASE_URL ?? "";
const API_URL = API_BASE_URL + "/api";

// Loading 状态管理
let loadingCount = 0;
let loadingElement = null;
let showTimer = null;

const showLoading = () => {
    loadingCount++;
    if (loadingCount === 1) {
        // 延迟 300ms 显示，避免快速请求闪烁
        showTimer = setTimeout(() => {
            // 创建 Loading 遮罩
            loadingElement = document.createElement('div');
            loadingElement.className = 'fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50';
            loadingElement.style.opacity = '0';
            loadingElement.style.transition = 'opacity 0.2s ease-out';
            loadingElement.innerHTML = `
                <div class="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center" style="transform: scale(0.9); opacity: 0; transition: all 0.3s ease-out;">
                    <div class="loading-spinner"></div>
                    <span class="mt-4 text-gray-700 font-medium">加载中...</span>
                </div>
            `; 
            document.body.appendChild(loadingElement);
            
            // 触发渐入动画
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    loadingElement.style.opacity = '1';
                    const card = loadingElement.querySelector('div');
                    card.style.transform = 'scale(1)';
                    card.style.opacity = '1';
                });
            });
        }, 300);
    }
};

const hideLoading = () => {
    loadingCount = Math.max(0, loadingCount - 1);
    if (loadingCount === 0) {
        // 清除延迟显示的定时器
        if (showTimer) {
            clearTimeout(showTimer);
            showTimer = null;
        }
        
        // 如果 Loading 已经显示，执行渐出动画
        if (loadingElement) {
            loadingElement.style.opacity = '0';
            const card = loadingElement.querySelector('div');
            if (card) {
                card.style.transform = 'scale(0.9)';
                card.style.opacity = '0';
            }
            
            // 动画结束后移除元素
            setTimeout(() => {
                if (loadingElement && loadingElement.parentNode) {
                    document.body.removeChild(loadingElement);
                }
                loadingElement = null;
            }, 200);
        }
    }
};

// 创建 axios 实例
const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${localStorage.getItem('token') || ''}`,
    },
});

// 请求拦截器 - 添加 token 和显示 Loading
apiClient.interceptors.request.use(
    (config) => {
        // 显示 Loading（除非配置中明确禁用）
        if (config.showLoading !== false) {
            showLoading();
        }
        console.log("API_URL:", API_URL);
        
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        hideLoading();
        return Promise.reject(error);
    }
);

// 响应拦截器 - 统一处理错误和隐藏 Loading
apiClient.interceptors.response.use(
    (response) => {
        hideLoading();
        return response.data;
    },
    (error) => {
        hideLoading();
        
        if (error.response) {
            // 处理 401 未授权
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
            return Promise.reject({
                message: error.response.data?.message || '请求失败',
                status: error.response.status,
            });
        }
        return Promise.reject({
            message: '网络错误，请检查连接',
        });
    }
);

const api = {
    // 认证相关
    auth: {
        login: (data) => apiClient.post('/auth/login', data),
        register: (data) => apiClient.post('/auth/register', data),
        logout: () => apiClient.post('/users/logout', {}, { showLoading: false }), // 登出不显示 Loading
        getCurrentUser: () => apiClient.get('/users/me', { showLoading: false }),
        changePassword: (data) => apiClient.put('/users/me/password', data),
    },

    // 音乐相关
    musics: {
        list: (params) => apiClient.get('/musics', { params }),
        get: (id) => apiClient.get(`/musics/${id}`),
        create: (data) => apiClient.post('/musics', data),
        update: (id, data) => apiClient.put(`/musics/${id}`, data),
        delete: (id) => apiClient.delete(`/musics/${id}`),
        play: (id) => apiClient.post(`/musics/${id}/play`, {}, { showLoading: false }), // 播放不显示 Loading
        like: (id) => apiClient.post(`/musics/${id}/like`, {}, { showLoading: false }), // 点赞不显示 Loading
        scan: () => apiClient.post('/musics/scan'),
        getLyrics: (id, engine) => apiClient.get(`/musics/${id}/lyrics?engine=${engine}`, { showLoading: false }), // 获取歌词不显示 Loading
    },

    lyrics: {
        saveLyrics: (id, data) => apiClient.post(`/lyrics/${id}/lyrics`, {lyrics: data}),
        saveTranslationLyrics: (id, data) => apiClient.post(`/lyrics/${id}/tlyrics`, {lyrics: data}),
    },

    // 专辑相关
    albums: {
        list: (params) => apiClient.get('/albums', { params }),
        get: (id) => apiClient.get(`/albums/${id}`),
        create: (data) => apiClient.post('/albums', data),
        update: (id, data) => apiClient.put(`/albums/${id}`, data),
        delete: (id) => apiClient.delete(`/albums/${id}`),
        getMusics: (id) => apiClient.get(`/albums/${id}/musics`),
    },

    // 播放列表相关
    playlists: {
        list: (params) => apiClient.get('/playlists', { params }),
        get: (id) => apiClient.get(`/playlists/${id}`),
        create: (data) => apiClient.post('/playlists', data),
        update: (id, data) => apiClient.put(`/playlists/${id}`, data),
        delete: (id) => apiClient.delete(`/playlists/${id}`),
        addMusic: (id, data) => apiClient.post(`/playlists/${id}/musics`, data),
        removeMusic: (id, data) => apiClient.delete(`/playlists/${id}/musics`, { data }),
        play: (id) => apiClient.post(`/playlists/${id}/play`, {}, { showLoading: false }),
        favorite: (data) => apiClient.post(`/playlists/favorite`, data, { showLoading: false }), // 喜爱切换不显示 Loading
    },

    // 用户相关
    users: {
        list: (params) => apiClient.get('/users', { params }),
        get: (id) => apiClient.get(`/users/${id}`),
        create: (data) => apiClient.post('/users', data),
        update: (id, data) => apiClient.put(`/users/${id}`, data),
        delete: (id) => apiClient.delete(`/users/${id}`),
    },
};

export default api;
