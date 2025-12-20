import LiquidGlass from '../ui/LiquidGlass.jsx';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { getFullUrl } from '../../services/fileUtil.js';

export default ({ musics, onLike, onEdit, onDelete }) => {
    const { playMusic, playMusicList } = usePlayer();

    const handlePlay = (music) => {
        playMusic(music);
    };

    const handlePlayAll = () => {
        playMusicList(musics, 0);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {musics.map((music) => (
                <LiquidGlass key={music.id}>
                    <div className="cursor-pointer sbrm-rounded-lg sbrm-shadow-lg music-card overflow-hidden group">
                        {/* 封面区域 */}
                        <div className="aspect-square sbrm-bg-gradient flex items-center justify-center relative overflow-hidden">
                            {music.coverUrl ? (
                                <img
                                    src={getFullUrl(music.coverUrl)}
                                    alt={music.title}
                                    className="w-full h-full object-cover group-hover:scale-110 sbrm-transition-all duration-500"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <i className="fas fa-music text-4xl sbrm-text-on-accent"></i>
                            )}
                            
                            {/* 悬停播放按钮 */}
                            <div className="absolute inset-0 sbrm-bg-overlay opacity-0 group-hover:opacity-100 sbrm-transition-all duration-300 flex items-center justify-center">
                                <button
                                    onClick={() => handlePlay(music)}
                                    className="sbrm-bg-primary sbrm-text-accent-primary sbrm-rounded-full p-4 hover:scale-110 sbrm-transition-all sbrm-shadow-xl"
                                >
                                    <i className="fas fa-play text-xl ml-0.5"></i>
                                </button>
                            </div>
                        </div>

                        {/* 信息区域 */}
                        <div className="p-4">
                            {/* 标题 */}
                            <h3 className="font-semibold sbrm-text-primary truncate text-lg mb-2">
                                {music.title || '未知标题'}
                            </h3>

                            {/* 艺术家 */}
                            <p className="sbrm-text-primary-1 text-sm truncate mb-1">
                                <i className="fas fa-user mr-2 sbrm-text-tertiary"></i>
                                {music.artist || '未知艺术家'}
                            </p>

                            {/* 专辑 */}
                            <p className="sbrm-text-primary-2 text-xs truncate">
                                <i className="fas fa-compact-disc mr-2 sbrm-text-tertiary"></i>
                                {music.album || '未知专辑'}
                            </p>

                            {/* 统计和操作 */}
                            <div className="flex justify-between items-center mt-4 pt-3 sbrm-border-t sbrm-border-divider">
                                {/* 统计信息 */}
                                <div className="flex space-x-3 text-sm sbrm-text-secondary">
                                    <span title="播放次数" className="flex items-center gap-1">
                                        <i className="fas fa-play text-xs"></i>
                                        {music.playCount || 0}
                                    </span>
                                    <span title="点赞数" className="flex items-center gap-1">
                                        <i className="fas fa-heart text-xs"></i>
                                        {music.likeCount || 0}
                                    </span>
                                </div>

                                {/* 操作按钮 */}
                                <div className="flex space-x-2">
                                    {onLike && (
                                        <button
                                            onClick={() => onLike(music.id)}
                                            className="sbrm-text-primary-1 hover:sbrm-text-error sbrm-transition p-1"
                                            title="点赞"
                                        >
                                            <i className="fas fa-heart"></i>
                                        </button>
                                    )}
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(music)}
                                            className="sbrm-text-primary-1 hover:sbrm-text-accent-primary sbrm-transition p-1"
                                            title="编辑"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(music)}
                                            className="sbrm-text-primary-1 hover:sbrm-text-error sbrm-transition p-1"
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