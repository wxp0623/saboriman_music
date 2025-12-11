import LiquidGlass from '../ui/LiquidGlass.jsx';
import { usePlayer } from '../../contexts/PlayerContext.jsx';

export default ({ musics, onLike, onEdit, onDelete }) => {
    const { playMusic, playMusicList } = usePlayer();

    const handlePlay = (music) => {
        playMusic(music);
    };

    const handlePlayAll = () => {
        playMusicList(musics, 0);
    };

    // 环境配置
    const apiBaseUrl = 'http://localhost:8180';

    // 获取完整的图片 URL
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        return `${apiBaseUrl}${path}`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {musics.map((music) => (
                <LiquidGlass key={music.id}>
                    <div className="cursor-pointer rounded-lg shadow-lg music-card overflow-hidden">
                        <div className="aspect-square from-purple-400 to-pink-400 flex items-center justify-center relative">
                            {music.coverUrl ? (
                                <img
                                    src={getImageUrl(music.coverUrl)}
                                    alt={music.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <i className="fas fa-music text-4xl text-white"></i>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                                <button
                                    onClick={() => handlePlay(music)}
                                    className="bg-white text-purple-600 rounded-full p-3 hover:scale-110 transition-transform"
                                >
                                    <i className="fas fa-play text-xl"></i>
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-white truncate text-lg">
                                {music.title || '未知标题'}
                            </h3>
                            <p className="text-gray-200 text-sm truncate">
                                <i className="fas fa-user mr-1"></i>
                                {music.artist || '未知艺术家'}
                            </p>
                            <p className="text-gray-300 text-xs truncate">
                                <i className="fas fa-compact-disc mr-1"></i>
                                {music.album || '未知专辑'}
                            </p>

                            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-600">
                                <div className="flex space-x-3 text-sm text-gray-300">
                                    <span title="播放次数">
                                        <i className="fas fa-play mr-1"></i>
                                        {music.playCount || 0}
                                    </span>
                                    <span title="点赞数">
                                        <i className="fas fa-heart mr-1"></i>
                                        {music.likeCount || 0}
                                    </span>
                                </div>
                                <div className="flex space-x-2">
                                    {onLike && (
                                        <button
                                            onClick={() => onLike(music.id)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                            title="点赞"
                                        >
                                            <i className="fas fa-heart"></i>
                                        </button>
                                    )}
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(music)}
                                            className="text-blue-400 hover:text-blue-300 transition-colors"
                                            title="编辑"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(music)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                            title="删除"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </LiquidGlass>
            ))}
        </div>
    );
};