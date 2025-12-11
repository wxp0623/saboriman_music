import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Loading, EmptyState } from '../common/Loading.jsx';

const PlaylistManagement = () => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const fetchPlaylists = async () => {
        setLoading(true);
        try {
            const response = await api.playlists.list({ page: 1, page_size: 20 });
            if (response.data) {
                setPlaylists(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch playlists:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlay = async (playlistId) => {
        try {
            await api.playlists.play(playlistId);
        } catch (error) {
            console.error('Failed to play playlist:', error);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">播放列表管理</h2>
                    <p className="text-gray-600 mt-1">管理所有播放列表</p>
                </div>
                <button className="btn-primary">
                    <i className="fas fa-plus mr-2"></i>创建播放列表
                </button>
            </div>

            {playlists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {playlists.map((playlist) => (
                        <div key={playlist.id} className="bg-white rounded-lg shadow-lg music-card p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800">
                                        {playlist.name || '未命名播放列表'}
                                    </h3>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {playlist.description || '暂无描述'}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handlePlay(playlist.id)}
                                    className="text-purple-600 hover:text-purple-800"
                                >
                                    <i className="fas fa-play text-xl"></i>
                                </button>
                            </div>
                            
                            <div className="text-sm text-gray-500 mb-4">
                                <span>
                                    <i className="fas fa-music mr-1"></i>
                                    {playlist.music_count || 0} 首歌曲
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t">
                                <span className="text-xs text-gray-400">
                                    {playlist.created_at ? new Date(playlist.created_at).toLocaleDateString() : ''}
                                </span>
                                <div className="flex space-x-2">
                                    <button className="text-blue-600 hover:text-blue-800">
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button className="text-red-600 hover:text-red-800">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon="fas fa-list-music"
                    message="暂无播放列表"
                    action={
                        <button className="btn-primary mt-4">
                            <i className="fas fa-plus mr-2"></i>创建第一个播放列表
                        </button>
                    }
                />
            )}
        </div>
    );
};

export default PlaylistManagement;
