import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/Register.css";

function Register() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [usernameError, setUsernameError] = useState("");

    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");

    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const [role, setRole] = useState("user");

    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setUsernameError("");
        setEmailError("");
        setPasswordError("");
        setError("");
        setSuccess("");

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        let isValid = true;

        if (username.trim() === "") {
            setUsernameError("Username is required");
            isValid = false;
        }

        if (!emailRegex.test(email)) {
            setEmailError("Invalid email format");
            isValid = false;
        }

        if (!passwordRegex.test(password)) {
            setPasswordError(
                "Password needs 8+ characters, 1 uppercase, 1 lowercase, 1 number and 1 special character."
            );
            isValid = false;
        }

        if (!isValid) return;

        setIsLoading(true);
        try {
            const res = await api.post("/auth/register", {
                username: username.trim(),
                email: email.trim(),
                password,
                role
            });

            setSuccess(res.data.message || "Registration successful! Redirecting to login...");

            setTimeout(() => {
                navigate("/");
            }, 1200);
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
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
                    <h2>Create an Account</h2>
                    <p>Join as a Listener or an Artist to share & stream music</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label>Username</label>
                        <input
                            type="text"
                            placeholder="Choose a unique username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                        />
                        {usernameError && <p className="field-error">{usernameError}</p>}
                    </div>

                    <div className="auth-field">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                        {emailError && <p className="field-error">{emailError}</p>}
                    </div>

                    <div className="auth-field">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Create a strong password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                        {passwordError && <p className="field-error">{passwordError}</p>}
                    </div>

                    <div className="auth-field">
                        <label>Account Role</label>
                        <div className="role-selector">
                            <button
                                type="button"
                                className={`role-btn ${role === 'user' ? 'active' : ''}`}
                                onClick={() => setRole('user')}
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                                Listener
                            </button>
                            <button
                                type="button"
                                className={`role-btn ${role === 'artist' ? 'active' : ''}`}
                                onClick={() => setRole('artist')}
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                                </svg>
                                Artist
                            </button>
                        </div>
                    </div>

                    {error && <div className="auth-error-banner">{error}</div>}
                    {success && <div className="auth-success-banner">{success}</div>}

                    <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                        {isLoading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account?</p>
                    <Link to="/" className="auth-switch-link">Sign In</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;