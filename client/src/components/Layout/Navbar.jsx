import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Navbar.css';

const Navbar = ({ username, coins, profilePic, onLogout }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    return (
        <header className="navbar">
            <Link to="/home" className="nav-logo"> 🎨 ColorGrid</Link>
            <div className="nav-right">
                <span className="coins">💰 <span id="coinBalance">{coins}</span></span>
                <div className="profile-dropdown" onClick={() => setShowDropdown(!showDropdown)}>
                    <img src={profilePic || "https://th.bing.com/th/id/OIP.eMLmzmhAqRMxUZad3zXE5QHaHa"} alt="{username}" className="profile-pic" />
                    <span className="username">{username}</span>
                    {showDropdown && (
                        <div className={`dropdown-menu ${!showDropdown ? 'hidden' : ''}`}>
                            <Link to="/update-profile">Update Profile</Link>
                            <a href="#" onClick={handleLogout}>Logout</a>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
};

export default Navbar;