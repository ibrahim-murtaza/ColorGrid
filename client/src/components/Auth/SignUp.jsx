import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import '../../../../design/css/signup.css';

const SignUp = ({ setIsLoggedIn }) => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        profilePic: ""
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
    
        console.log('Submitting form data:', formData);
    
        try {
            const response = await axios.post("http://localhost:8000/api/users/register", formData);
            console.log('Server response:', response.data);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            setIsLoggedIn(true);
            navigate("/home");
        } catch (err) {
            console.error('Error details:', err);
            setError(err.response?.data?.message || "Registration failed. Please try again.")
        }
    };

    return (
        <main className="auth-container">
            <h1 className="auth-title">Sign Up</h1>

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

                <label htmlFor="profilePic">Profile Picture URL (optional)</label>
                <input
                    id="profilePic"
                    name="profilePic"
                    type="text"
                    value={formData.profilePic}
                    onChange={handleChange}
                />

                <button type="submit" className="btn btn-primary">Create Account</button>
            </form>

            <p className="auth-footer">
                Already have an account? <Link to="/login">Log In</Link>
            </p>
        </main>
    );
};

export default SignUp;