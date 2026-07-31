import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/ArtistDashboard.css";

const coverImages = [
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
];

const formatTime = (time) => {
    if (!Number.isFinite(time)) return "0:00";
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
    const [musicTitle, setMusicTitle] = useState("");
    const [musicFile, setMusicFile] = useState(null);
    const [albumTitle, setAlbumTitle] = useState("");
    const [selectedMusicIds, setSelectedMusicIds] = useState([]);
    const [uploadStatus, setUploadStatus] = useState("");
    const [albumStatus, setAlbumStatus] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
    const audioRef = useRef(null);
    const navigate = useNavigate();

    const loadDashboard = async () => {
        try {
            const config = { withCredentials: true };
            const [musicResponse, albumResponse] = await Promise.all([
                axios.get("http://localhost:3000/api/music", config),
                axios.get("http://localhost:3000/api/music/albums", config),
            ]);
            setMusics(musicResponse.data.musics);
            setAlbums(albumResponse.data.albums);
        } catch (err) {
            console.error("Artist dashboard fetch error:", err.response?.data || err.message);
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
                console.error("Music could not play:", err.message);
            });
    }, [activeMusic]);

    const getCover = (music) => {
        const index = musics.findIndex((item) => item._id === music?._id);
        return coverImages[(index + coverImages.length) % coverImages.length];
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
        const currentIndex = musics.findIndex((music) => music._id === activeMusic?._id);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + direction + musics.length) % musics.length;
        setCurrentTime(0);
        setDuration(0);
        setActiveMusic(musics[nextIndex]);
    };

    const handleUpload = async (event) => {
        event.preventDefault();
        if (!musicTitle.trim() || !musicFile) {
            setUploadStatus("Select a title and a music file.");
            return;
        }

        setIsUploading(true);
        setUploadStatus("");
        try {
            const formData = new FormData();
            formData.append("title", musicTitle.trim());
            formData.append("music", musicFile);

            await axios.post("http://localhost:3000/api/music/upload", formData, {
                withCredentials: true,
            });
            setMusicTitle("");
            setMusicFile(null);
            event.target.reset();
            setUploadStatus("Music successfully uploaded.");
            await loadDashboard();
        } catch (err) {
            setUploadStatus(err.response?.data?.message || "Music upload failed.");
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
            setAlbumStatus("Choose a title and select at least one song.");
            return;
        }

        setIsCreatingAlbum(true);
        setAlbumStatus("");
        try {
            await axios.post("http://localhost:3000/api/music/album", {
                title: albumTitle.trim(),
                musics: selectedMusicIds,
            }, { withCredentials: true });
            setAlbumTitle("");
            setSelectedMusicIds([]);
            setAlbumStatus("Album successfully created.");
            await loadDashboard();
        } catch (err) {
            setAlbumStatus(err.response?.data?.message || "Failed to create album.");
        } finally {
            setIsCreatingAlbum(false);
        }
    };

    const changeProgress = (event) => {
        const nextTime = Number(event.target.value);
        audioRef.current.currentTime = nextTime;
        setCurrentTime(nextTime);
    };

    const handleLogout = async () => {
        try {
            await axios.post("http://localhost:3000/api/auth/logout", {}, {
                withCredentials: true,
            });
        } finally {
            navigate("/", { replace: true });
        }
    };

    const filteredMusics = musics.filter((music) =>
        `${music.title} ${music.artist?.username || ""}`.toLowerCase().includes(search.toLowerCase())
    );
    const featuredMusics = filteredMusics.slice(0, 4);
    const remainingMusics = filteredMusics.slice(4);

    return (
        <div className="artist-dashboard">
            <audio
                ref={audioRef}
                src={activeMusic?.uri}
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                onEnded={() => changeTrack(1)}
            />

            <header className="artist-header">
                <h1>Rhythm <span>Studio</span></h1>
                <div className="artist-header-actions">
                    <nav><span>Dashboard</span><span>My music</span><span>Albums</span></nav>
                    <button className="artist-logout" onClick={handleLogout}>Log out</button>
                </div>
            </header>

            <main className="artist-content">
                <section className="artist-hero">
                    <div>
                        <p>ARTIST STUDIO</p>
                        <h2>Share your sound<br />with the world.</h2>
                        <span>Upload songs, build albums and keep your releases organised in one place.</span>
                    </div>
                    <div className="hero-stat"><strong>{musics.length}</strong><span>songs available</span><strong>{albums.length}</strong><span>albums available</span></div>
                </section>

                <section className="creator-tools">
                    <form className="studio-form" onSubmit={handleUpload}>
                        <div className="form-heading"><span>01</span><div><p>NEW RELEASE</p><h2>Upload music</h2></div></div>
                        <label>Song title<input value={musicTitle} onChange={(event) => setMusicTitle(event.target.value)} placeholder="e.g. Midnight Echoes" /></label>
                        <label className="file-input">Audio file<input type="file" accept="audio/*" onChange={(event) => setMusicFile(event.target.files[0] || null)} /><span>{musicFile ? musicFile.name : "Choose an audio file"}</span></label>
                        <button type="submit" disabled={isUploading}>{isUploading ? "Uploading..." : "Upload song"}</button>
                        {uploadStatus && <p className="form-status">{uploadStatus}</p>}
                    </form>

                    <form className="studio-form" onSubmit={handleCreateAlbum}>
                        <div className="form-heading"><span>02</span><div><p>YOUR CATALOGUE</p><h2>Create album</h2></div></div>
                        <label>Album title<input value={albumTitle} onChange={(event) => setAlbumTitle(event.target.value)} placeholder="e.g. After Hours" /></label>
                        <div className="song-picker">
                            <span>Select songs ({selectedMusicIds.length})</span>
                            {musics.length ? musics.map((music) => <label className="song-option" key={music._id}><input type="checkbox" checked={selectedMusicIds.includes(music._id)} onChange={() => toggleAlbumMusic(music._id)} /><span>{music.title}</span></label>) : <small>Upload a song first to create an album.</small>}
                        </div>
                        <button type="submit" disabled={isCreatingAlbum || !musics.length}>{isCreatingAlbum ? "Creating..." : "Create album"}</button>
                        {albumStatus && <p className="form-status">{albumStatus}</p>}
                    </form>
                </section>

                <section className="artist-music-section">
                    <div className="artist-section-heading"><div><p>DISCOVER MUSIC</p><h2>All music</h2></div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search music or artist..." /></div>
                    {musics.length === 0 ? <p className="empty-state">Abhi tak koi song upload nahi hua.</p> : <>
                        <div className="artist-music-grid">
                            {featuredMusics.map((music) => {
                                const active = activeMusic?._id === music._id;
                                return <article className={`artist-music-card ${active ? "active" : ""}`} key={music._id}><img src={getCover(music)} alt={`${music.title} cover`} /><div><h3>{music.title}</h3><p>{music.artist?.username || "Unknown artist"}</p></div><button onClick={() => toggleMusic(music)} aria-label={`Play ${music.title}`}>{active && isPlaying ? "❚❚" : "▶"}</button></article>;
                            })}
                        </div>
                        {remainingMusics.length > 0 && <div className="artist-track-list"><h3>More music</h3>{remainingMusics.map((music, index) => { const active = activeMusic?._id === music._id; return <article className={`artist-track-row ${active ? "active" : ""}`} key={music._id}><span>{String(index + 5).padStart(2, "0")}</span><img src={getCover(music)} alt="" /><div><h3>{music.title}</h3><p>{music.artist?.username || "Unknown artist"}</p></div><button onClick={() => toggleMusic(music)}>{active && isPlaying ? "❚❚" : "▶"}</button></article>; })}</div>}
                    </>}
                </section>

                <section className="albums-section"><div className="artist-section-heading"><div><p>COLLECTIONS</p><h2>All albums</h2></div></div>{albums.length === 0 ? <p className="empty-state">Abhi tak koi album create nahi hua.</p> : <div className="album-grid">{albums.map((album, index) => <article className="album-card" key={album._id}><img src={coverImages[index % coverImages.length]} alt="" /><div><h3>{album.title}</h3><p>{album.artist?.username || "Unknown artist"} · Album</p></div></article>)}</div>}</section>
            </main>

            {activeMusic && <section className="artist-player"><div className="artist-now-playing"><img src={getCover(activeMusic)} alt="" /><div><strong>{activeMusic.title}</strong><span>{activeMusic.artist?.username || "Unknown artist"}</span></div></div><div className="artist-player-controls"><div className="artist-player-buttons"><button onClick={() => changeTrack(-1)} aria-label="Previous song">◀</button><button className="artist-main-play" onClick={() => toggleMusic(activeMusic)} aria-label={isPlaying ? "Pause" : "Play"}>{isPlaying ? "❚❚" : "▶"}</button><button onClick={() => changeTrack(1)} aria-label="Next song">▶</button></div><div className="artist-progress"><span>{formatTime(currentTime)}</span><input type="range" min="0" max={duration || 0} value={Math.min(currentTime, duration || 0)} onChange={changeProgress} /><span>{formatTime(duration)}</span></div></div></section>}
        </div>
    );
};

export default ArtistDashboard;
