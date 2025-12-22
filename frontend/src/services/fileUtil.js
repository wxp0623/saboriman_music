export const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // 开发环境：使用 VITE_DEV_BASE_URL
    if (import.meta.env.DEV && import.meta.env.VITE_DEV_BASE_URL) {
        console.log("🔧 开发环境 API Base URL:", import.meta.env.VITE_DEV_BASE_URL);
        return `${import.meta.env.VITE_DEV_BASE_URL}${path}`;
    }

    // 生产环境：使用相对路径（前端和后端同源）
    // 因为前端作为静态资源由后端服务
    console.log("🚀 生产环境，使用相对路径");
    console.log(`返回路径: ${path}`);
    
    return path;
};