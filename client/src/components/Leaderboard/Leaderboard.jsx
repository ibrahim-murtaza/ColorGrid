import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Layout/Navbar';
import '../../../../design/css/leaderboard.css';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
            return;
        }

        setUser(JSON.parse(userData));
        fetchLeaderboard();
    }, [navigate]);

    const fetchLeaderboard = async (search = '') => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:8000/api/games/leaderboard${search ? `?search=${search}` : ''}`);
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
            setError('Failed to load leaderboard. Please try again later.');
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchLeaderboard(searchTerm);
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
            <main className="board-container">
                <h1 className="board-title">Leaderboard</h1>

                <form onSubmit={handleSearch}>
                    <input
                        id="searchInput"
                        type="text"
                        placeholder="Search by username…"
                        className="search-box"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>

                {loading ? (
                    <p>Loading leaderboard...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : users.length === 0 ? (
                    <p>No users found.</p>
                ) : (
                    <table className="board-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Wins</th>
                                <th>Losses</th>
                                <th>Draws</th>
                                <th>Coins</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td>{user.username}</td>
                                    <td>{user.wins}</td>
                                    <td>{user.losses}</td>
                                    <td>{user.draws}</td>
                                    <td>{user.coins}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </main>
        </>
    );
};

export default Leaderboard;