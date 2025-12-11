# Saboriman Music Frontend

这是Saboriman音乐管理系统的前端界面，使用React构建，提供现代化的用户体验。

## 功能特性

### 🎯 核心功能
- **仪表盘**: 系统概览和快速操作
- **用户管理**: 用户的增删改查，支持搜索和分页
- **音乐管理**: 音乐的上传、编辑、播放和点赞
- **播放列表**: 创建和管理播放列表
- **数据库管理**: 查看数据表状态和执行迁移

### 🎨 界面特性
- **响应式设计**: 适配各种屏幕尺寸
- **现代化UI**: 使用Tailwind CSS和渐变效果
- **交互动画**: 平滑的悬停效果和过渡动画
- **图标支持**: Font Awesome图标库
- **优雅加载**: 自定义加载动画

### 🛠 技术栈
- **React 18**: 通过CDN引入，无需本地构建
- **Tailwind CSS**: 实用优先的CSS框架
- **Font Awesome**: 丰富的图标库
- **Babel Standalone**: 浏览器内JSX转换
- **原生JavaScript**: 无额外依赖

## 快速开始

### 方法1: 直接打开HTML文件
```bash
# 在浏览器中直接打开
open frontend/index.html
# 或双击 index.html 文件
```

### 方法2: 使用Python内置服务器
```bash
cd frontend
python3 -m http.server 3000
# 然后访问 http://localhost:3000
```

### 方法3: 使用Node.js (如果已安装)
```bash
cd frontend
npx serve -s . -l 3000
# 然后访问 http://localhost:3000
```

### 方法4: 使用Go提供静态文件服务
在后端main.go中添加静态文件服务：
```go
// 添加静态文件服务
app.Static("/", "./frontend")
```

然后访问 `http://localhost:8180` 即可看到前端界面。

## 项目结构

```
frontend/
├── index.html          # 主页面文件
├── package.json        # 项目配置文件
├── README.md          # 前端说明文档
└── assets/            # 静态资源目录 (可选)
    ├── images/        # 图片文件
    ├── icons/         # 图标文件
    └── fonts/         # 字体文件
```

## API 集成

前端通过以下API与后端通信：

### 基础配置
```javascript
const api = {
    baseURL: 'http://localhost:8180/api',
    // API方法...
}
```

### 支持的API端点
- **用户管理**: `/api/users`
- **音乐管理**: `/api/musics`  
- **播放列表**: `/api/playlists`
- **数据库管理**: `/api/database`

## 功能说明

### 1. 仪表盘 (Dashboard)
- 显示系统统计信息
- 快速操作按钮
- 数据可视化

### 2. 用户管理
- ✅ 用户列表展示 (分页、搜索)
- ✅ 添加新用户
- ✅ 编辑用户信息
- ✅ 删除用户
- ✅ 用户状态管理

### 3. 音乐管理
- ✅ 音乐列表展示 (卡片式布局)
- ✅ 音乐上传 (表单)
- ✅ 播放次数和点赞统计
- 🚧 音乐播放器 (开发中)
- 🚧 音乐编辑 (开发中)

### 4. 播放列表管理
- 🚧 播放列表列表 (开发中)
- 🚧 创建播放列表 (开发中)
- 🚧 添加/删除音乐 (开发中)

### 5. 数据库管理
- ✅ 查看数据表状态
- ✅ 执行数据库迁移
- ✅ 表创建状态监控

## 自定义配置

### 修改API地址
```javascript
// 在 index.html 中找到以下配置
const api = {
    baseURL: 'http://localhost:8180/api', // 修改为你的API地址
    // ...
}
```

### 修改主题颜色
```css
/* 在 <style> 标签中修改 */
.gradient-bg {
    background: linear-gradient(135deg, #your-color1 0%, #your-color2 100%);
}

.btn-primary {
    background: linear-gradient(45deg, #your-color1, #your-color2);
}
```

### 添加新功能
1. 在相应的组件中添加新的功能
2. 更新API服务方法
3. 添加新的路由/页面

## 浏览器兼容性

支持现代浏览器:
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 开发指南

### 添加新组件
```javascript
const NewComponent = () => {
    const [state, setState] = useState(initialState);
    
    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
                新组件标题
            </h2>
            {/* 组件内容 */}
        </div>
    );
};
```

### 添加API方法
```javascript
// 在api对象中添加
newAPI: {
    list: () => api.request('/new-endpoint'),
    create: (data) => api.request('/new-endpoint', { 
        method: 'POST', 
        body: JSON.stringify(data) 
    }),
    // 其他方法...
}
```

### 样式定制
使用Tailwind CSS类名进行样式定制：
```html
<div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
    <!-- 内容 -->
</div>
```

## 部署说明

### 1. 静态文件部署
将整个frontend目录上传到任何静态文件服务器即可。

### 2. 与后端集成部署
```go
// 在Go后端中添加静态文件服务
app.Static("/", "./frontend")
```

### 3. CDN优化
可以将CSS和JS库替换为更快的CDN：
- React: https://unpkg.com/react@18/umd/react.production.min.js
- Tailwind: https://cdn.tailwindcss.com
- Font Awesome: https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css

## 故障排除

### 常见问题

1. **CORS错误**
   - 确保后端设置了正确的CORS策略
   - 检查API地址是否正确

2. **API请求失败**
   - 检查后端服务是否运行在8180端口
   - 确认API端点路径正确

3. **页面样式错误**
   - 检查CDN链接是否可访问
   - 确认网络连接正常

4. **功能不工作**
   - 打开浏览器开发者工具查看控制台错误
   - 检查Network标签页的API请求状态

### 调试方法
```javascript
// 在浏览器控制台中测试API
api.users.list({page: 1, page_size: 10})
    .then(console.log)
    .catch(console.error);
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目主页: https://github.com/saboriman/music
- 问题反馈: https://github.com/saboriman/music/issues
- 邮箱: support@saboriman.com

---

**注意**: 这是一个示例项目，用于学习和演示目的。在生产环境中使用时，请确保遵循安全最佳实践。

https://liquid-glass.io/code/react#installation