import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../../styles/ArtistDashboard.css";

const defaultCovers = [
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80",
];

const formatTime = (time) => {
    if (!Number.isFinite(time) || time < 0) return "0:00";
    return `${Math.floor(time / 60)}:${Math.floor(time % 60).toString().padStart(2, "0")}`;
};

const ArtistDashboard = () => {
    const [musics, setMusics] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [activeMusic, setActiveMusic] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [search, setSearch] = useState("");

    // Form states
    const [musicTitle, setMusicTitle] = useState("");
    const [musicFile, setMusicFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    const [albumTitle, setAlbumTitle] = useState("");
    const [selectedMusicIds, setSelectedMusicIds] = useState([]);

    const [uploadStatus, setUploadStatus] = useState({ type: "", message: "" });
    const [albumStatus, setAlbumStatus] = useState({ type: "", message: "" });
    const [isUploading, setIsUploading] = useState(false);
    const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);

    const audioRef = useRef(null);
    const navigate = useNavigate();

    const loadDashboard = async () => {
        try {
            const [musicResponse, albumResponse] = await Promise.all([
                api.get("/music"),
                api.get("/music/albums"),
            ]);
            setMusics(musicResponse.data.musics || []);
            setAlbums(albumResponse.data.albums || []);
        } catch (err) {
            console.error("Artist dashboard error:", err);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    useEffect(() => {
        if (!activeMusic || !audioRef.current) return;

        audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
                setIsPlaying(false);
                console.error("Audio play error:", err.message);
            });
    }, [activeMusic]);

    const handleThumbnailSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
            setUploadStatus({ type: "error", message: "Invalid image format. Use JPG, PNG or WEBP." });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadStatus({ type: "error", message: "Thumbnail size must be under 5MB." });
            return;
        }

        setUploadStatus({ type: "", message: "" });
        setThumbnailFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setThumbnailPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removeThumbnail = () => {
        setThumbnailFile(null);
        setThumbnailPreview(null);
    };

    const handleAudioSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 25 * 1024 * 1024) {
            setUploadStatus({ type: "error", message: "Audio file size must be under 25MB." });
            return;
        }

        setUploadStatus({ type: "", message: "" });
        setMusicFile(file);
    };

    const handleUpload = async (event) => {
        event.preventDefault();
        if (!musicTitle.trim()) {
            setUploadStatus({ type: "error", message: "Song title is required." });
            return;
        }
        if (!musicFile) {
            setUploadStatus({ type: "error", message: "Please select an audio file." });
            return;
        }

        setIsUploading(true);
        setUploadStatus({ type: "info", message: "Uploading audio and cover image to ImageKit..." });

        try {
            const formData = new FormData();
            formData.append("title", musicTitle.trim());
            formData.append("music", musicFile);
            if (thumbnailFile) {
                formData.append("thumbnail", thumbnailFile);
            }

            await api.post("/music/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setMusicTitle("");
            setMusicFile(null);
            setThumbnailFile(null);
            setThumbnailPreview(null);
            event.target.reset();

            setUploadStatus({ type: "success", message: "Track published successfully!" });
            await loadDashboard();
        } catch (err) {
            setUploadStatus({
                type: "error",
                message: err.response?.data?.message || "Music upload failed. Please try again."
            });
        } finally {
            setIsUploading(false);
        }
    };

    const toggleAlbumMusic = (musicId) => {
        setSelectedMusicIds((currentIds) =>
            currentIds.includes(musicId)
                ? currentIds.filter((id) => id !== musicId)
                : [...currentIds, musicId]
        );
    };

    const handleCreateAlbum = async (event) => {
        event.preventDefault();
        if (!albumTitle.trim() || selectedMusicIds.length === 0) {
            setAlbumStatus({ type: "error", message: "Enter an album title and pick at least one track." });
            return;
        }

        setIsCreatingAlbum(true);
        setAlbumStatus({ type: "info", message: "Creating album..." });
        try {
            await api.post("/music/album", {
                title: albumTitle.trim(),
                musics: selectedMusicIds,
            });
            setAlbumTitle("");
            setSelectedMusicIds([]);
            setAlbumStatus({ type: "success", message: "Album created successfully!" });
            await loadDashboard();
        } catch (err) {
            setAlbumStatus({
                type: "error",
                message: err.response?.data?.message || "Failed to create album."
            });
        } finally {
            setIsCreatingAlbum(false);
        }
    };

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

    const changeTrack = (direction) => {
        if (!musics.length) return;
        const currentIndex = musics.findIndex((m) => m._id === activeMusic?._id);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + direction + musics.length) % musics.length;
        setCurrentTime(0);
        setDuration(0);
        setActiveMusic(musics[nextIndex]);
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

    const getCover = (music, idx = 0) => {
        if (music?.thumbnail) return music.thumbnail;
        const pos = musics.findIndex(m => m._id === music?._id);
        const fallbackIdx = pos >= 0 ? pos : idx;
        return defaultCovers[fallbackIdx % defaultCovers.length];
    };

    const filteredMusics = musics.filter((m) =>
        `${m.title} ${m.artist?.username || ""}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="artist-app-layout">
            <audio
                ref={audioRef}
                src={activeMusic?.uri}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onEnded={() => changeTrack(1)}
            />

            {/* Header */}
            <header className="artist-top-header">
                <div className="artist-brand">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                    <span>Rhythm <strong>Studio</strong></span>
                </div>

                <div className="artist-header-right">
                    <div className="artist-badge">Artist Portal</div>
                    <button className="artist-logout-btn" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                        </svg>
                        Sign Out
                    </button>
                </div>
            </header>

            <main className="artist-main-scroll">
                {/* Hero Stat Banner */}
                <section className="artist-hero-banner">
                    <div className="hero-text">
                        <span className="studio-pill">Catalogue Management</span>
                        <h2>Studio Overview</h2>
                        <p>Upload new songs with cover images and manage album releases.</p>
                    </div>

                    <div className="studio-stats-grid">
                        <div className="stat-card">
                            <span className="stat-number">{musics.length}</span>
                            <span className="stat-label">Published Tracks</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{albums.length}</span>
                            <span className="stat-label">Albums Created</span>
                        </div>
                    </div>
                </section>

                {/* Forms Grid */}
                <section className="creator-forms-grid">
                    {/* Release Song Form */}
                    <form className="studio-card-form" onSubmit={handleUpload}>
                        <div className="form-card-header">
                            <div className="step-tag">01</div>
                            <div>
                                <h3>Publish Track</h3>
                                <p>Upload audio file and custom cover image</p>
                            </div>
                        </div>

                        <div className="form-field">
                            <label>Song Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Midnight Horizon"
                                value={musicTitle}
                                onChange={(e) => setMusicTitle(e.target.value)}
                            />
                        </div>

                        <div className="form-field">
                            <label>Audio File (.mp3, .wav, .aac)</label>
                            <label className="file-dropzone">
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleAudioSelect}
                                />
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                                </svg>
                                <span>{musicFile ? musicFile.name : "Select Audio File"}</span>
                            </label>
                        </div>

                        {/* Thumbnail Upload */}
                        <div className="form-field">
                            <label>Cover Image (Optional)</label>
                            {thumbnailPreview ? (
                                <div className="thumbnail-preview-box">
                                    <img src={thumbnailPreview} alt="Cover preview" />
                                    <div className="preview-overlay">
                                        <button type="button" className="remove-thumb-btn" onClick={removeThumbnail}>
                                            Remove Image
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="file-dropzone image-dropzone">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleThumbnailSelect}
                                    />
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                    </svg>
                                    <span>Upload Artwork (JPG, PNG, WEBP)</span>
                                </label>
                            )}
                        </div>

                        {uploadStatus.message && (
                            <div className={`status-alert ${uploadStatus.type}`}>
                                {uploadStatus.message}
                            </div>
                        )}

                        <button type="submit" className="submit-btn" disabled={isUploading}>
                            {isUploading ? "Uploading..." : "Publish Track"}
                        </button>
                    </form>

                    {/* Create Album Form */}
                    <form className="studio-card-form" onSubmit={handleCreateAlbum}>
                        <div className="form-card-header">
                            <div className="step-tag">02</div>
                            <div>
                                <h3>Create Album</h3>
                                <p>Group published tracks into an album</p>
                            </div>
                        </div>

                        <div className="form-field">
                            <label>Album Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Neon EP"
                                value={albumTitle}
                                onChange={(e) => setAlbumTitle(e.target.value)}
                            />
                        </div>

                        <div className="form-field">
                            <label>Select Tracks ({selectedMusicIds.length} chosen)</label>
                            <div className="song-checkbox-list">
                                {musics.length === 0 ? (
                                    <p className="no-songs-hint">Upload at least one song first to create an album.</p>
                                ) : (
                                    musics.map((m) => (
                                        <label key={m._id} className="song-checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedMusicIds.includes(m._id)}
                                                onChange={() => toggleAlbumMusic(m._id)}
                                            />
                                            <span className="song-title-text">{m.title}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        {albumStatus.message && (
                            <div className={`status-alert ${albumStatus.type}`}>
                                {albumStatus.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="submit-btn secondary"
                            disabled={isCreatingAlbum || musics.length === 0}
                        >
                            {isCreatingAlbum ? "Creating..." : "Create Album"}
                        </button>
                    </form>
                </section>

                {/* Published Catalog */}
                <section className="catalog-section">
                    <div className="catalog-header">
                        <h2>Published Music ({musics.length})</h2>
                        <input
                            type="text"
                            placeholder="Search catalog..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="catalog-search-input"
                        />
                    </div>

                    {filteredMusics.length === 0 ? (
                        <div className="empty-catalog-box">
                            <p>No tracks found in your catalog.</p>
                        </div>
                    ) : (
                        <div className="artist-music-grid">
                            {filteredMusics.map((music, idx) => {
                                const isActive = activeMusic?._id === music._id;

                                return (
                                    <div className={`artist-music-card ${isActive ? 'active' : ''}`} key={music._id}>
                                        <div className="artist-thumb-box">
                                            <img src={getCover(music, idx)} alt={music.title} />
                                            <button
                                                className={`artist-play-btn ${isActive && isPlaying ? 'playing' : ''}`}
                                                onClick={() => toggleMusic(music)}
                                            >
                                                {isActive && isPlaying ? (
                                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                                ) : (
                                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                                )}
                                            </button>
                                        </div>

                                        <div className="artist-card-details">
                                            <h4>{music.title}</h4>
                                            <p>{music.artist?.username || "Artist"}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Albums Catalogue */}
                {albums.length > 0 && (
                    <section className="catalog-section">
                        <div className="catalog-header">
                            <h2>Albums ({albums.length})</h2>
                        </div>
                        <div className="artist-album-grid">
                            {albums.map((album, idx) => (
                                <div className="artist-album-card" key={album._id}>
                                    <div className="album-cover-wrap">
                                        <img src={defaultCovers[(idx + 1) % defaultCovers.length]} alt="" />
                                        <span className="track-count-tag">{album.musics?.length || 0} Tracks</span>
                                    </div>
                                    <div className="album-details">
                                        <h4>{album.title}</h4>
                                        <p>{album.artist?.username || "Artist"} · Album</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Audio Player Bar */}
            {activeMusic && (
                <footer className="artist-player-bar">
                    <div className="player-meta">
                        <img src={getCover(activeMusic)} alt="" className="player-thumb-img" />
                        <div>
                            <strong>{activeMusic.title}</strong>
                            <span>{activeMusic.artist?.username || "Artist"}</span>
                        </div>
                    </div>

                    <div className="player-controls-center">
                        <div className="btn-group">
                            <button onClick={() => changeTrack(-1)}>
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                            </button>
                            <button className="play-toggle" onClick={() => toggleMusic(activeMusic)}>
                                {isPlaying ? (
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                )}
                            </button>
                            <button onClick={() => changeTrack(1)}>
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                            </button>
                        </div>
                        <div className="progress-row">
                            <span>{formatTime(currentTime)}</span>
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={Math.min(currentTime, duration || 0)}
                                onChange={changeProgress}
                            />
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default ArtistDashboard;
