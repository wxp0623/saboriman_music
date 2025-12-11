import React, { useState, useEffect } from 'react';
import LiquidGlass from '../ui/LiquidGlass.jsx';
import api from '../../services/api.js';
import { useNavigate } from 'react-router-dom';
import AlbumList from "./AlbumList.jsx";

const AlbumManagement = () => {


    return (
        <div className="p-6">
            {/* 页面标题和操作栏 */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">专辑管理</h1>
                    <p className="text-gray-400">管理所有音乐专辑</p>
                </div>
            </div>
            <AlbumList></AlbumList>
        </div>
    );
};

export default AlbumManagement;