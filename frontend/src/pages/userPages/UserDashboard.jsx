import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../../styles/UserDashboard.css";

const defaultCovers = [
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80",
];

const formatTime = (time) => {
    if (!Number.isFinite(time) || time < 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
};

const UserDashboard = () => {
    const [musics, setMusics] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [recentlyPlayed, setRecentlyPlayed] = useState([]);
    const [activeTab, setActiveTab] = useState("discover"); // discover, favorites, recent, albumDetail
    const [selectedAlbum, setSelectedAlbum] = useState(null);

    const [activeMusic, setActiveMusic] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isMuted, setIsMuted] = useState(false);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const audioRef = useRef(null);
    const navigate = useNavigate();

    // Fetch initial data
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            setError("");
            try {
                const [musicRes, albumRes, favRes, recentRes] = await Promise.all([
                    api.get("/music"),
                    api.get("/music/albums"),
                    api.get("/music/favorites"),
                    api.get("/music/recent")
                ]);

                setMusics(musicRes.data.musics || []);
                setAlbums(albumRes.data.albums || []);
                setFavorites(favRes.data.favorites?.map(m => m._id || m) || []);
                setRecentlyPlayed(recentRes.data.recentlyPlayed || []);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError("Failed to load music library. Please try again.");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Handle audio playback
    useEffect(() => {
        if (!activeMusic || !audioRef.current) return;

        audioRef.current.play()
            .then(() => {
                setIsPlaying(true);
                api.post(`/music/recent/${activeMusic._id}`).catch(() => {});
            })
            .catch((err) => {
                setIsPlaying(false);
                console.error("Playback error:", err.message);
            });
    }, [activeMusic]);

    // Handle volume change
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    const toggleMusic = (music) => {
        if (activeMusic?._id !== music._id) {
            setCurrentTime(0);
            setDuration(0);
            setActiveMusic(music);
            return;
        }

        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const toggleFavorite = async (e, musicId) => {
        e.stopPropagation();
        try {
            const res = await api.post(`/music/favorite/${musicId}`);
            if (res.data.isFavorite) {
                setFavorites(prev => [...prev, musicId]);
            } else {
                setFavorites(prev => prev.filter(id => id !== musicId));
            }
        } catch (err) {
            console.error("Favorite error:", err);
        }
    };

    const playRelativeTrack = (direction) => {
        const currentList = getActiveSongList();
        if (!currentList.length) return;

        const activeIndex = currentList.findIndex((m) => m._id === activeMusic?._id);
        const nextIndex = activeIndex === -1
            ? 0
            : (activeIndex + direction + currentList.length) % currentList.length;

        setCurrentTime(0);
        setDuration(0);
        setActiveMusic(currentList[nextIndex]);
    };

    const changeProgress = (event) => {
        const nextTime = Number(event.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = nextTime;
            setCurrentTime(nextTime);
        }
    };

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout", {});
        } finally {
            navigate("/", { replace: true });
        }
    };

    const getMusicImage = (music, index = 0) => {
        if (music?.thumbnail) return music.thumbnail;
        const pos = musics.findIndex(m => m._id === music?._id);
        const fallbackIdx = pos >= 0 ? pos : index;
        return defaultCovers[fallbackIdx % defaultCovers.length];
    };

    const isFavorite = (musicId) => favorites.includes(musicId);

    const filterSongs = (songList) => {
        if (!search.trim()) return songList;
        const q = search.toLowerCase();
        return songList.filter(m =>
            (m.title || "").toLowerCase().includes(q) ||
            (m.artist?.username || "").toLowerCase().includes(q)
        );
    };

    const getActiveSongList = () => {
        if (activeTab === "favorites") {
            return musics.filter(m => favorites.includes(m._id));
        }
        if (activeTab === "recent") {
            return recentlyPlayed;
        }
        if (activeTab === "albumDetail" && selectedAlbum) {
            return selectedAlbum.musics || [];
        }
        return musics;
    };

    const filteredMusics = filterSongs(getActiveSongList());

    const openAlbumDetails = async (album) => {
        try {
            const res = await api.get(`/music/albums/${album._id}`);
            setSelectedAlbum(res.data.album);
            setActiveTab("albumDetail");
        } catch (err) {
            console.error("Fetch album error:", err);
        }
    };

    return (
        <div className="user-app-layout">
            <audio
                ref={audioRef}
                src={activeMusic?.uri}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onEnded={() => playRelativeTrack(1)}
            />

            {/* Sidebar Navigation */}
            <aside className="app-sidebar">
                <div className="sidebar-brand">
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                    <span>Rhythm</span>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'discover' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('discover'); setSelectedAlbum(null); }}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                        Discover
                    </button>

                    <button
                        className={`nav-item ${activeTab === 'favorites' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('favorites'); setSelectedAlbum(null); }}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        Liked Songs ({favorites.length})
                    </button>

                    <button
                        className={`nav-item ${activeTab === 'recent' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('recent'); setSelectedAlbum(null); }}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                        </svg>
                        Recently Played
                    </button>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="app-main-content">
                <header className="main-header">
                    <div className="search-bar-container">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search music..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <button className="user-logout-btn" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                        </svg>
                        Sign Out
                    </button>
                </header>

                <div className="content-scroll-view">
                    {error && <div className="error-banner">{error}</div>}

                    {loading ? (
                        <div className="loading-spinner-container">
                            <div className="spinner"></div>
                            <p>Loading library...</p>
                        </div>
                    ) : (
                        <>
                            {/* Hero Discovery Banner */}
                            {activeTab === 'discover' && !search && (
                                <section className="hero-banner">
                                    <div className="hero-text">
                                        <span className="hero-badge">Featured Selection</span>
                                        <h2>Discover something new.</h2>
                                        <p>Listen to curated releases from independent artists worldwide.</p>
                                        <button className="hero-play-btn" onClick={() => musics[0] && toggleMusic(musics[0])}>
                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                <path d="M8 5v14l11-7z"/>
                                            </svg>
                                            Play Featured Track
                                        </button>
                                    </div>
                                    <div className="hero-image-wrap">
                                        <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80" alt="Featured" />
                                    </div>
                                </section>
                            )}

                            {/* Section Header */}
                            <div className="section-header-title">
                                {activeTab === 'discover' && <h2>{search ? `Search Results (${filteredMusics.length})` : "Featured Music"}</h2>}
                                {activeTab === 'favorites' && <h2>Liked Songs ({filteredMusics.length})</h2>}
                                {activeTab === 'recent' && <h2>Recently Played</h2>}
                                {activeTab === 'albumDetail' && (
                                    <div className="album-breadcrumb">
                                        <button className="back-btn" onClick={() => setActiveTab('discover')}>← Back to Discover</button>
                                        <h2>{selectedAlbum?.title} <span>by {selectedAlbum?.artist?.username || "Artist"}</span></h2>
                                    </div>
                                )}
                            </div>

                            {/* Music Cards Grid */}
                            {filteredMusics.length === 0 ? (
                                <div className="empty-state-card">
                                    <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                                    </svg>
                                    <p>No songs found in this section.</p>
                                </div>
                            ) : (
                                <div className="music-grid-view">
                                    {filteredMusics.map((music, idx) => {
                                        const isActive = activeMusic?._id === music._id;
                                        const liked = isFavorite(music._id);

                                        return (
                                            <div className={`music-card-item ${isActive ? 'active' : ''}`} key={music._id || idx}>
                                                <div className="card-thumb-wrap">
                                                    <img src={getMusicImage(music, idx)} alt={music.title} />
                                                    <button
                                                        className={`card-play-overlay ${isActive && isPlaying ? 'playing' : ''}`}
                                                        onClick={() => toggleMusic(music)}
                                                        aria-label="Play song"
                                                    >
                                                        {isActive && isPlaying ? (
                                                            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                                        ) : (
                                                            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                                        )}
                                                    </button>
                                                    <button
                                                        className={`card-fav-btn ${liked ? 'liked' : ''}`}
                                                        onClick={(e) => toggleFavorite(e, music._id)}
                                                        aria-label="Favorite"
                                                    >
                                                        <svg viewBox="0 0 24 24" width="16" height="16" fill={liked ? "#16B8A6" : "none"} stroke={liked ? "#16B8A6" : "currentColor"} strokeWidth="2">
                                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                                        </svg>
                                                    </button>
                                                </div>

                                                <div className="card-info">
                                                    <h3 className="song-name" title={music.title}>{music.title}</h3>
                                                    <p className="artist-name">{music.artist?.username || "Artist"}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Albums Grid Section */}
                            {activeTab === 'discover' && !search && albums.length > 0 && (
                                <section className="albums-section-wrap">
                                    <div className="section-header-title">
                                        <h2>Albums</h2>
                                    </div>
                                    <div className="albums-grid">
                                        {albums.map((album, idx) => (
                                            <div className="album-card-item" key={album._id || idx} onClick={() => openAlbumDetails(album)}>
                                                <div className="album-thumb-wrap">
                                                    <img src={defaultCovers[(idx + 2) % defaultCovers.length]} alt={album.title} />
                                                    <div className="album-badge">{album.musics?.length || 0} Tracks</div>
                                                </div>
                                                <div className="album-info">
                                                    <h3>{album.title}</h3>
                                                    <p>{album.artist?.username || "Artist"}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Audio Player Bar */}
            {activeMusic && (
                <footer className="player-bar-container">
                    <div className="player-track-meta">
                        <img src={getMusicImage(activeMusic)} alt="" className="player-thumb" />
                        <div className="player-track-details">
                            <span className="player-title">{activeMusic.title}</span>
                            <span className="player-artist">{activeMusic.artist?.username || "Artist"}</span>
                        </div>
                        <button
                            className={`player-fav-btn ${isFavorite(activeMusic._id) ? 'liked' : ''}`}
                            onClick={(e) => toggleFavorite(e, activeMusic._id)}
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill={isFavorite(activeMusic._id) ? "#16B8A6" : "none"} stroke={isFavorite(activeMusic._id) ? "#16B8A6" : "currentColor"} strokeWidth="2">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                        </button>
                    </div>

                    <div className="player-center-controls">
                        <div className="player-btn-group">
                            <button className="ctrl-btn" onClick={() => playRelativeTrack(-1)} aria-label="Previous">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                            </button>
                            <button className="play-toggle-btn" onClick={() => toggleMusic(activeMusic)} aria-label={isPlaying ? "Pause" : "Play"}>
                                {isPlaying ? (
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                )}
                            </button>
                            <button className="ctrl-btn" onClick={() => playRelativeTrack(1)} aria-label="Next">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                            </button>
                        </div>

                        <div className="player-progress-bar">
                            <span className="time-stamp">{formatTime(currentTime)}</span>
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={Math.min(currentTime, duration || 0)}
                                onChange={changeProgress}
                                className="timeline-slider"
                            />
                            <span className="time-stamp">{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="player-right-actions">
                        <button className="volume-icon-btn" onClick={() => setIsMuted(!isMuted)}>
                            {isMuted || volume === 0 ? (
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                            )}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                                setVolume(Number(e.target.value));
                                setIsMuted(false);
                            }}
                            className="volume-slider"
                        />
                    </div>
                </footer>
            )}
        </div>
    );
};

export default UserDashboard;
