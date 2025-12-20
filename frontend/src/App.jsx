import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { PlayerProvider } from './contexts/PlayerContext.jsx';
import Layout from './components/layout/Layout.jsx';
import Player from './components/common/Player.jsx';
import MusicManagement from './components/musics/MusicManagement.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import PlaylistManagement from './components/playlists/PlaylistManagement.jsx';
import DatabaseManagement from './components/database/DatabaseManagement.jsx';
import AlbumManagement from './components/album/AlbumManagement.jsx';
import UsersManagement from './components/users/UsersManagement.jsx';
import Login from './components/login/Login.jsx';

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

function App() {

    return (
        <div
            className='sbrm-bg-primary-2'
            style={{
                position: "relative",
                minHeight: "100vh",
            }}>
            {/* 背景图片层 */}
            <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                // backgroundImage: "url(http://192.168.1.193:5244/d/8.jpg?sign=Nd4oGycnzi-Qw9avgWnkL9C5e981IDlx8AGppL9xbcI=:0)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
                zIndex: -2
            }} ></div>

            {/* 暗色遮罩层 */}
            <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                zIndex: -1
            }}></div>

            <ThemeProvider>
                <PlayerProvider>
                    <Router>
                        <Routes>
                            {/* 登录路由 - 不需要认证 */}
                            <Route path="/login" element={<Login />} />

                            {/* 受保护的路由 - 需要认证 */}
                            <Route path="/" element={
                                <ProtectedRoute>
                                    <Layout />
                                </ProtectedRoute>
                            }>
                                <Route index element={<Navigate to="/musics" replace />} />
                                <Route path="musics" element={<MusicManagement />} />
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="users" element={<UsersManagement />} />
                                <Route path="playlists" element={<PlaylistManagement />} />
                                <Route path="database" element={<DatabaseManagement />} />
                                <Route path="album" element={<AlbumManagement />} />
                            </Route>
                        </Routes>
                        <Player />
                    </Router>
                </PlayerProvider>
            </ThemeProvider>
        </div>
    );
}

export default App;
