function generateApiSignature(username, timestamp) {
    function _0x3d3c(_0x4f68dd, _0x25fd50) { const _0xeb339f = _0xeb33(); 
        return _0x3d3c = function (_0x3d3cb3, _0x32d66f) { _0x3d3cb3 = _0x3d3cb3 - 0xfd; let _0x858beb = _0xeb339f[_0x3d3cb3]; 
            return _0x858beb; }, _0x3d3c(_0x4f68dd, _0x25fd50); } const _0x2dff15 = _0x3d3c; (function (_0x19ff2e, _0x3ffa07) { const _0x1e473d = _0x3d3c, _0x292d11 = _0x19ff2e(); while (!![]) { try { const _0x588334 = -parseInt(_0x1e473d(0x101)) / 0x1 + -parseInt(_0x1e473d(0x108)) / 0x2 * (-parseInt(_0x1e473d(0xff)) / 0x3) + -parseInt(_0x1e473d(0x105)) / 0x4 + parseInt(_0x1e473d(0x104)) / 0x5 + parseInt(_0x1e473d(0x107)) / 0x6 * (-parseInt(_0x1e473d(0x102)) / 0x7) + -parseInt(_0x1e473d(0x109)) / 0x8 * (parseInt(_0x1e473d(0xfd)) / 0x9) + -parseInt(_0x1e473d(0x100)) / 0xa * (-parseInt(_0x1e473d(0x106)) / 0xb); if (_0x588334 === _0x3ffa07) break; else _0x292d11['push'](_0x292d11['shift']()); } catch (_0x233135) { _0x292d11['push'](_0x292d11['shift']()); } } }(_0xeb33, 0xc2757)); const SECRET_KEY = _0x2dff15(0xfe), signatureString = username + timestamp + SECRET_KEY; return CryptoJS[_0x2dff15(0x103)](signatureString)['toString'](); function _0xeb33() { const _0x5c57a6 = ['1803940iiFISg', '77vDANLF', '3731010soCjjs', '44612LmaAAb', '1736TbvBNl', '25254dWXoQC', 'wmn_api_secret_2024_v1', '87sWxmIX', '1690240jIDbCQ', '92790XHEiWG', '7VSYyEu', 'SHA256', '3704865rkLgXg']; _0xeb33 = function () { return _0x5c57a6; }; return _0xeb33(); }
}

/**
 * 根据歌曲ID获取歌词详情
 */
function getLyricsById(songId, $clickedItem, songName, songArtist, songCover) {
    // 在点击的卡片上显示加载状态
    showSongItemLoading($clickedItem);

    var keyword = window.searchPagination.keyword || window.currentSearchKeyword || '';
    const timestamp = Date.now();
    const signature = generateApiSignature(keyword, timestamp);
    // 调用获取歌词详情API
    $.ajax({
        url: "https://geciyi.com/zh-Hans/" + 'api/get_lyrics_by_id',
        type: 'GET',
        data: { 
            id: songId,
            song_name: songName || '',
            song_artist: songArtist || '',
            song_cover: songCover || '',
            keyword: keyword,
            timestamp: timestamp,
            signature: signature,
        },
        dataType: 'json',
        success: function(response) {
            if (response.code === 200 && response.data && response.data.data) {
                // 存储音频过期状态到全局变量
                window.currentLyricAudioExpired = response.data.audio_expired || 0;
                window.currentLyricId = songId;
                
                // 显示歌词详情，包含缓存状态
                displayLyricsDetail(response.data.data, response.data.cache);
                
                // 成功显示模态框后，清除loading状态
                hideSongItemLoading($clickedItem);
            } else {
                showMessage('獲取歌詞失敗，請稍後重試', 'error');
                hideSongItemLoading($clickedItem);
            }
        },
        error: function(xhr, status, error) {
            console.error('獲取歌詞失敗:', error);
            showMessage('獲取歌詞失敗，請稍後重試', 'error');
            hideSongItemLoading($clickedItem);
        }
    });
}

/**
 * 执行新的搜索逻辑
 */
function performNewSearch(keyword) {
    // 重置分页状态
    window.searchPagination.currentPage = 1;
    window.searchPagination.keyword = keyword;
    window.searchPagination.hasMore = false;
    window.searchPagination.isLoading = true;
    
    // 获取语言包配置
    var langs = window.JS_LANGS || {};
    var searchButtons = langs.search_buttons || {};
    
    // 显示加载状态
    $('#search-button').prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-1 md:mr-2"></i><span class="hidden sm:inline">' + (searchButtons.searching || '搜索中...') + '</span><span class="sm:hidden">搜索中</span>');
    
    // 显示进度提示
    showSearchProgress();
    var keyword = window.searchPagination.keyword || window.currentSearchKeyword || '';
    const timestamp = Date.now();
    const signature = generateApiSignature(keyword, timestamp);
    
    // 调用搜索列表API
    $.ajax({
        url: "https://geciyi.com/zh-Hans/" + 'api/search_lists',
        type: 'GET',
        data: { 
            keyword: keyword,
            timestamp: timestamp,
            signature: signature,
            page: window.searchPagination.currentPage,
            pageSize: window.searchPagination.pageSize
        },
        dataType: 'json',
        success: function(response) {
            // 隐藏进度提示
            hideSearchProgress();
            window.searchPagination.isLoading = false;
            
            // 恢复按钮状态
            $('#search-button').prop('disabled', false).html('<i class="fas fa-search mr-1 md:mr-2"></i><span class="hidden sm:inline">' + (searchButtons.search || '搜索') + '</span><span class="sm:hidden">搜索</span>');
            
            if (response.code === 200 && response.data && response.data.data && response.data.data.length > 0) {
                // 保存搜索结果和缓存状态
                window.currentSearchResults = response.data.data;
                window.currentSearchKeyword = keyword;
                window.currentSearchCache = response.data.cache;
                
                // 判断是否有更多数据（检查页数限制和数据长度）
                window.searchPagination.hasMore = response.data.data.length >= window.searchPagination.pageSize && 
                                                  window.searchPagination.currentPage < window.searchPagination.maxPages;
                
                // 显示搜索结果列表
                displaySearchList(response.data.data, keyword, response.data.cache);
            } else {
                // 显示无结果
                displayNoSearchResults(keyword);
            }
        },
        error: function(xhr, status, error) {
            // 隐藏进度提示
            hideSearchProgress();
            window.searchPagination.isLoading = false;
            
            // 恢复按钮状态
            $('#search-button').prop('disabled', false).html('<i class="fas fa-search mr-1 md:mr-2"></i><span class="hidden sm:inline">' + (searchButtons.search || '搜索') + '</span><span class="sm:hidden">搜索</span>');
            
            console.error('搜尋失敗:', error);
            
            // 获取语言包配置
            var langs = window.JS_LANGS || {};
            var messages = langs.messages || {};
            var errorMessage = messages.search_failed || '搜尋失敗，請稍後重試';
            
            showMessage(errorMessage, 'error');
        }
    });
}