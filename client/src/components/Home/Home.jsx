import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Layout/Navbar';
import '../../../../design/css/home.css';

const Home = ({ handleLogout }) => {
    const [user, setUser] = useState({
        username: '',
        password: '',
        profile_picture: ''
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    return (
        <>
            <Navbar username={user.username} coins={user.coins} profilePic={user.profile_picture} onLogout={handleLogout} />
            <main className="home-container">
                <h1 className="home-title">Main Dashboard</h1>
                <div className="home-buttons">
                    <Link to="/newgame/waiting" className="btn btn-primary">Play</Link>
                    <Link to="/leaderboard" className="btn btn-secondary">Leaderboard</Link>
                    <Link to="/history" className="btn btn-secondary">History</Link>
                </div>
            </main>
        </>
    );
};

export default Home;