import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Layout/Navbar';
import '../../../../design/css/history.css';

const History = () => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
            return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        const fetchGames = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:8000/api/games/history/${parsedUser.id}`);
                setGames(response.data);
                setLoading(false);
            }

            catch (err) {
                console.error('Error fetching game history:', err);
                setError('Failed to load game history. Please try again later.');
                setLoading(false);
            }
        };

        fetchGames();
    }, [navigate]);

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
            <div className="navbar-spacer"></div>
            <main className="history-container">
                <h1 className="history-title">Your Game History</h1>
                {loading ? (
                    <p>Loading game history...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : games.length === 0 ? (
                    <p>You haven't played any games yet.</p>
                ) : (
                    <ul className="history-list">
                        {games.map((game) => (
                            <li key={game.id}>
                                <Link to={`/history/${game.id}`}>
                                    Game # {game.id.substring(0, 5)} - {game.opponent} - {game.result}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </>
    );
};

export default History;