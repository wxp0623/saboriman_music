import axios from 'axios';
import CryptoJS from 'crypto-js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

// 搜索歌词
export const searchLyrics = async (keyword) => {
    try {
        const timestamp = Date.now();
        const signature = generateApiSignature(keyword, timestamp);
    
        const response = await axios.get(`${API_BASE_URL}/lyrics/search`, {
            params: {
                    keyword: keyword,
                    timestamp: timestamp,
                    signature: signature,
                    page: 1,
                    pageSize: 12
                }
        });

        if (response.data.msg === 'search_success') {
            return response.data.data.data;
        } else {
            throw new Error(response.data.message || '搜索歌词失败');
        }
    } catch (error) {
        console.error('搜索歌词错误:', error);
        throw new Error(error.response?.data?.message || error.message || '网络错误，搜索歌词失败');
    }
};

// 根据ID获取歌词
export const getLyricsById = async (songId, keyword) => {
    try {
        const timestamp = Date.now();
        const signature = generateApiSignature(keyword, timestamp);

        const response = await axios.get(`${API_BASE_URL}/lyrics/get`, {
            params: {
                id: songId,
                keyword: keyword,
                timestamp: timestamp,
                signature: signature,
            }
        });

        if (response.data.msg === 'search_success') {
            return response.data.data.data;
        } else {
            throw new Error('获取歌词失败，请稍后重试');
        }
    } catch (error) {
        console.error('获取歌词错误:', error);
        throw new Error(error.response?.data?.message || '获取歌词失败，请稍后重试');
    }
};

function generateApiSignature(username, timestamp) {
    function _0x3d3c(_0x4f68dd, _0x25fd50) {
        const _0xeb339f = _0xeb33();
        return _0x3d3c = function (_0x3d3cb3, _0x32d66f) {
            _0x3d3cb3 = _0x3d3cb3 - 0xfd; 
            let _0x858beb = _0xeb339f[_0x3d3cb3];
            return _0x858beb;
        }, _0x3d3c(_0x4f68dd, _0x25fd50);
    } 
    const _0x2dff15 = _0x3d3c; 
    (function (_0x19ff2e, _0x3ffa07) { 
        const _0x1e473d = _0x3d3c, _0x292d11 = _0x19ff2e(); 
        while (!![]) { 
            try { 
                const _0x588334 = -parseInt(_0x1e473d(0x101)) / 0x1 + -parseInt(_0x1e473d(0x108)) / 0x2 * (-parseInt(_0x1e473d(0xff)) / 0x3) + -parseInt(_0x1e473d(0x105)) / 0x4 + parseInt(_0x1e473d(0x104)) / 0x5 + parseInt(_0x1e473d(0x107)) / 0x6 * (-parseInt(_0x1e473d(0x102)) / 0x7) + -parseInt(_0x1e473d(0x109)) / 0x8 * (parseInt(_0x1e473d(0xfd)) / 0x9) + -parseInt(_0x1e473d(0x100)) / 0xa * (-parseInt(_0x1e473d(0x106)) / 0xb); 
                if (_0x588334 === _0x3ffa07) break; 
                else _0x292d11['push'](_0x292d11['shift']()); 
            } catch (_0x233135) { 
                _0x292d11['push'](_0x292d11['shift']()); 
            } 
        } 
    }(_0xeb33, 0xc2757)); 
    const SECRET_KEY = _0x2dff15(0xfe), signatureString = username + timestamp + SECRET_KEY; 
    return CryptoJS[_0x2dff15(0x103)](signatureString)['toString'](); 
    
    function _0xeb33() { 
        const _0x5c57a6 = ['1803940iiFISg', '77vDANLF', '3731010soCjjs', '44612LmaAAb', '1736TbvBNl', '25254dWXoQC', 'wmn_api_secret_2024_v1', '87sWxmIX', '1690240jIDbCQ', '92790XHEiWG', '7VSYyEu', 'SHA256', '3704865rkLgXg']; 
        _0xeb33 = function () { 
            return _0x5c57a6; 
        }; 
        return _0xeb33(); 
    }
}