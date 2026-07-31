import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
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

    async function handleSubmit(e) {
        e.preventDefault();

        setUsernameError("");
        setEmailError("");
        setPasswordError("");
        setError("");
        setSuccess("");

        const emailRegex =
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        // \d single slash hona chahiye
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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
                "Password needs 8+ characters, uppercase, lowercase, number and special character."
            );
            isValid = false;
        }

        if (!isValid) return;

        try {
            const res = await axios.post(
                "http://localhost:3000/api/auth/register",
                { username, email, password, role },
                { withCredentials: true }
            );

            setSuccess(res.data.message);

            setTimeout(() => {
                navigate("/");
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || "Server error");
        }
    }

    return (
        <div className="container">
            <h2>Register Form</h2>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    {usernameError && <p className="error">{usernameError}</p>}
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {emailError && <p className="error">{emailError}</p>}
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {passwordError && <p className="error">{passwordError}</p>}
                </div>
                <div className="form-group">
                    <label>Role</label>

                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="user">User</option>
                        <option value="artist">Artist</option>
                    </select>
                </div>

                <button type="submit">Register</button>
            </form>

            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}

            <div className="login-section">
                <p>Already have an account?</p>
                <Link to="/" className="login-btn">
                    Login
                </Link>
            </div>
        </div>
    );
}

export default Register;