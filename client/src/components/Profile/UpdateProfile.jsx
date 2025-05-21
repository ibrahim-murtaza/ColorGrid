import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Layout/Navbar';
import '../../../../design/css/update-profile.css';

const UpdateProfile = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        profilePic: ''
    });
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [validation, setValidation] = useState({
        username: '',
        password: '',
        profilePic: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
            return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFormData({
            username: parsedUser.username,
            password: '',
            profilePic: parsedUser.profile_picture || ''
        });
    }, [navigate]);

    const validateForm = () => {
        let isValid = true;
        const newValidation = {
            username: '',
            password: '',
            profilePic: ''
        };

        if (formData.username.trim().length < 3) {
            newValidation.username = 'Username must be at least 3 characters';
            isValid = false;
        }

        if (formData.password && formData.password.length < 6) {
            newValidation.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        const validateUrl = (url) => {
            if (!url) return true;

            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        };

        if (formData.profilePic && !validateUrl(formData.profilePic)) {
            newValidation.profilePic = 'Please enter a valid URL';
            isValid = false;
        }

        setValidation(newValidation);
        return isValid;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (validation[e.target.name]) {
            setValidation({ ...validation, [e.target.name]: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const updateData = {
                userId: user.id,
                username: formData.username,
                profilePic: formData.profilePic
            };

            if (formData.password) {
                updateData.password = formData.password;
            }

            const response = await axios.put('http://localhost:8000/api/users/update', updateData);

            localStorage.setItem('user', JSON.stringify(response.data.user));

            setMessage({
                text: 'Profile updated successfully!',
                type: 'success'
            });

            setUser(response.data.user);

            setFormData({
                ...formData,
                password: ''
            });
        } catch (err) {
            console.error('Error updating profile:', err);
            setMessage({
                text: err.response?.data?.message || 'Failed to update profile. Please try again.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <>
            <Navbar
                username={user?.username}
                coins={user?.coins}
                profilePic={user?.profile_picture}
                onLogout={handleLogout}
            />
            <main className="update-container">
                <h1 className="update-title">Update Profile</h1>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form className="update-form" onSubmit={handleSubmit}>
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    {validation.username && <div className="validation-error">{validation.username}</div>}

                    <label htmlFor="password">New Password (leave blank to keep current)</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    {validation.password && <div className="validation-error">{validation.password}</div>}

                    <label htmlFor="profilePic">Profile Picture URL</label>
                    <input
                        id="profilePic"
                        name="profilePic"
                        type="text"
                        value={formData.profilePic}
                        onChange={handleChange}
                    />
                    {validation.profilePic && <div className="validation-error">{validation.profilePic}</div>}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </main>
        </>
    );
};

export default UpdateProfile;