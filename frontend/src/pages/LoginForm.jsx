import { useState } from "react";
import "../styles/LoginForm.css";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

function LoginForm() {
    const [loginInput, setLoginInput] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        if (!loginInput.trim() || !password) {
            setError("Please enter your username/email and password.");
            return;
        }

        setError("");
        setIsLoading(true);
        try {
            const res = await api.post("/auth/login", {
                username: loginInput.trim(),
                email: loginInput.trim(),
                password
            });

            const user = res.data.user;

            if (user.role === "artist") {
                navigate("/artist/dashboard");
            } else if (user.role === "user") {
                navigate("/user/dashboard");
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else if (err.message === "Network Error") {
                setError("Unable to connect to server. Please check your network.");
            } else {
                setError("Login failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                        <span>Rhythm</span>
                    </div>
                    <h2>Welcome back</h2>
                    <p>Enter your credentials to access your music workspace</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label>Username or Email</label>
                        <input
                            type="text"
                            placeholder="e.g. alex_music or alex@example.com"
                            value={loginInput}
                            onChange={(e) => setLoginInput(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="auth-field">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    {error && <div className="auth-error-banner">{error}</div>}

                    <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account?</p>
                    <Link to="/register" className="auth-switch-link">Create account</Link>
                </div>
            </div>
        </div>
    );
}

export default LoginForm;