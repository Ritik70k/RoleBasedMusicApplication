import { useState } from "react";
import "../styles/LoginForm.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";


function LoginForm() {

    const [loginInput, setLoginInput] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    async function handleSubmit(e) {

        e.preventDefault();

        setError("");
        try {

            const res = await axios.post(
                "http://localhost:3000/api/auth/login",
                { username: loginInput, email: loginInput, password },
                { withCredentials: true }
            );

            //User data from backend
            const user = res.data.user;


            if (user.role === "artist") {

                navigate("/artist/dashboard");

            }
            else if (user.role === "user") {

                navigate("/user/dashboard");

            }

        }
        catch (err) {
            if (err.response) {

                setError(err.response.data.message);

            }
            else {
                setError("Something went wrong");
            }
        }
    }



    return (

        <div className="login-container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label> Username or Email</label>
                    <input
                        type="text"
                        placeholder="Enter username or email"
                        value={loginInput}
                        onChange={(e) =>
                            setLoginInput(e.target.value)
                        }
                    />
                </div>
                <div className="form-group"><label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />
                </div>
                {error && <p className="error">{error}</p>}
                <button type="submit">Login</button>
            </form>
            <div className="register-link">
                <p>Don't have an account?</p>
                <Link to="/register">Register</Link>
            </div>
        </div>

    );

}

export default LoginForm;