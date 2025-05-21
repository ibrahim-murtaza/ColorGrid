import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import '../../../../design/css/login.css';

const Login = ({ setIsLoggedIn }) => {
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await axios.post("http://localhost:8000/api/users/login", formData);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            setIsLoggedIn(true);
            navigate("/home");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid username or password. Please try again.");
        }
    };

    return (
        <main className="auth-container">
            <h1 className="auth-title">Login</h1>

            {error && <div className="error-message">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
                <label htmlFor="username">Username</label>
                <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                <button type="submit" className="btn btn-primary">Log In</button>
            </form>

            <p className="auth-footer">
                Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
        </main>
    );
};

export default Login;