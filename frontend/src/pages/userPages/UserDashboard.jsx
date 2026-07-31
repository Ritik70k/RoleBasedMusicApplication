import axios from "axios";
import "../../styles/UserDashboard.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const musicImages = [
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=600&q=80",
];

const formatTime = (time) => {
    if (!Number.isFinite(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
};

const UserDashboard = () => {
    const [musics, setMusics] = useState([]);
    const [activeMusic, setActiveMusic] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [search, setSearch] = useState("");
    const audioRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchMusic() {
            try {
                const res = await axios.get("http://localhost:3000/api/music", {
                    withCredentials: true,
                });
                setMusics(res.data.musics);
            } catch (err) {
                console.error("Music fetch error:", err.response?.data || err.message);
            }
        }

        fetchMusic();
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

    const playRelativeTrack = (direction) => {
        if (!musics.length) return;

        const activeIndex = musics.findIndex((music) => music._id === activeMusic?._id);
        const nextIndex = activeIndex === -1
            ? 0
            : (activeIndex + direction + musics.length) % musics.length;

        setCurrentTime(0);
        setDuration(0);
        setActiveMusic(musics[nextIndex]);
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
        `${music.title} ${music.artist?.username || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );
    const featuredMusics = filteredMusics.slice(0, 4);
    const remainingMusics = filteredMusics.slice(4);
    const getMusicImage = (music) => {
        const musicIndex = musics.findIndex((item) => item._id === music._id);
        return musicImages[(musicIndex + musicImages.length) % musicImages.length];
    };

    return (
        <div className="user-dashboard">
            <audio
                ref={audioRef}
                src={activeMusic?.uri}
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                onEnded={() => playRelativeTrack(1)}
            />

            <header className="dashboard-header">
                <h1>Rhythm</h1>
                <div className="header-actions">
                    <div className="header-links">
                        <span>Home</span>
                        <span>Library</span>
                        <span>Profile</span>
                    </div>
                    <button className="logout-button" onClick={handleLogout}>Log out</button>
                </div>
            </header>

            <main className="dashboard-content">
                <section className="welcome-banner">
                    <div className="welcome-text">
                        <p>YOUR MUSIC, YOUR VIBE</p>
                        <h2>Feel every beat.</h2>
                        <span>Discover songs that match your mood.</span>
                        <button onClick={() => musics[0] && toggleMusic(musics[0])}>Start Listening</button>
                    </div>
                    <img
                        src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80"
                        alt="Live music concert"
                    />
                </section>

                <section className="music-section">
                    <div className="section-heading">
                        <div>
                            <p>MADE FOR YOU</p>
                            <h2>Popular right now</h2>
                        </div>
                        <input
                            type="text"
                            placeholder="Search music..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <div className="music-grid" aria-label="Featured music list">
                        {featuredMusics.map((music) => {
                            const isActive = activeMusic?._id === music._id;

                            return (
                                <article className={`music-card ${isActive ? "active" : ""}`} key={music._id}>
                                    <img src={getMusicImage(music)} alt={`${music.title} cover`} />
                                    <div className="music-details">
                                        <h3>{music.title}</h3>
                                        <p>{music.artist?.username || "Unknown artist"}</p>
                                    </div>
                                    <button
                                        className="card-play-button"
                                        onClick={() => toggleMusic(music)}
                                        aria-label={`${isActive && isPlaying ? "Pause" : "Play"} ${music.title}`}
                                    >
                                        {isActive && isPlaying ? "❚❚" : "▶"}
                                    </button>
                                </article>
                            );
                        })}
                    </div>

                    {remainingMusics.length > 0 && (
                        <div className="more-songs">
                            <h3>More songs</h3>
                            <div className="track-list" aria-label="More music list">
                                {remainingMusics.map((music, index) => {
                                    const isActive = activeMusic?._id === music._id;

                                    return (
                                        <article className={`track-row ${isActive ? "active" : ""}`} key={music._id}>
                                            <span className="track-number">{String(index + 5).padStart(2, "0")}</span>
                                            <img src={getMusicImage(music)} alt="" />
                                            <div className="track-info">
                                                <h3>{music.title}</h3>
                                                <p>{music.artist?.username || "Unknown artist"}</p>
                                            </div>
                                            <button
                                                className="list-play-button"
                                                onClick={() => toggleMusic(music)}
                                                aria-label={`${isActive && isPlaying ? "Pause" : "Play"} ${music.title}`}
                                            >
                                                {isActive && isPlaying ? "❚❚" : "▶"}
                                            </button>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </section>
            </main>

            {activeMusic && (
                <section className="music-player" aria-label="Music player">
                    <div className="now-playing">
                        <img
                            src={getMusicImage(activeMusic)}
                            alt=""
                        />
                        <div>
                            <strong>{activeMusic.title}</strong>
                            <span>{activeMusic.artist?.username || "Unknown artist"}</span>
                        </div>
                    </div>

                    <div className="player-controls">
                        <div className="player-buttons">
                            <button className="player-icon-button" onClick={() => playRelativeTrack(-1)} aria-label="Previous song">◀</button>
                            <button className="player-play-button" onClick={() => toggleMusic(activeMusic)} aria-label={isPlaying ? "Pause" : "Play"}>
                                {isPlaying ? "❚❚" : "▶"}
                            </button>
                            <button className="player-icon-button" onClick={() => playRelativeTrack(1)} aria-label="Next song">▶</button>
                        </div>
                        <div className="progress-area">
                            <span>{formatTime(currentTime)}</span>
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={Math.min(currentTime, duration || 0)}
                                onChange={changeProgress}
                                aria-label="Song progress"
                            />
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default UserDashboard;
