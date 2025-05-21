import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Layout/Navbar';
import '../../../../design/css/history-detail.css';

const HistoryDetail = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
            return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
    }, [navigate]);

    useEffect(() => {
        setGame(null);
        setLoading(true);
        setError('');

        if (!user) return;

        let isMounted = true;

        const fetchGameDetails = async () => {
            try {
                console.log(`Fetching game details for game ${gameId} as user ${user.id}`);
                const response = await axios.get(`http://localhost:8000/api/games/details/${gameId}`);
                console.log("Game details received:", response.data);

                if (isMounted) {
                    setGame(response.data);
                    setLoading(false);
                }
            }
            catch (err) {
                console.error('Error fetching game details:', err);
                if (isMounted) {
                    setError('Failed to load game details. Please try again later.');
                    setLoading(false);
                }
            }
        };

        fetchGameDetails();

        return () => {
            isMounted = false;
        };
    }, [gameId, user]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const checkForfeit = () => {
        if (!game || !user) return { isUserForfeiter: false, didOpponentForfeit: false };

        if (!game.forfeiter && !game.forfeiter_id) {
            console.log("Forfeiter ID is undefined, cannot determine who forfeited");

            const isUserWinner = game.winner === user.id ||
                (game.player1.id === user.id && game.result === "player1_won") ||
                (game.player2.id === user.id && game.result === "player2_won");

            return {
                isUserForfeiter: !isUserWinner && game.forfeit,
                didOpponentForfeit: isUserWinner && game.forfeit
            };
        }

        const forfeiterId = game.forfeiter || game.forfeiter_id;
        const isUserForfeiter = forfeiterId === user.id;

        return {
            isUserForfeiter,
            didOpponentForfeit: game.forfeit && !isUserForfeiter
        };
    };

    const getUserResult = () => {
        if (!game || !user) {
            return '';
        }

        const isPlayer1 = game.player1.id === user.id;

        if (game.result === 'draw') {
            return 'Draw';
        }
        else if (game.winner && ((isPlayer1 && game.result === "player1_won") || (!isPlayer1 && game.result === "player2_won"))) {
            return 'Won!';
        }
        else {
            return 'Lost!';
        }
    };

    const getCellColor = (value) => {
        if (value === 1) return game?.player1?.color || 'red';
        if (value === 2) return game?.player2?.color || 'blue';
        return 'rgba(255, 255, 255, 0.1)';
    };

    const resultClass = () => {
        const result = getUserResult();
        if (result === 'Won!') {
            return 'won';
        }
        if (result === 'Lost!') {
            return 'lost';
        }
        return 'draw';
    }

    const { isUserForfeiter, didOpponentForfeit } = checkForfeit();

    return (
        <>
            <Navbar
                username={user?.username}
                coins={user?.coins}
                profilePic={user?.profile_picture}
                onLogout={handleLogout}
            />
            <main className="snapshot-container">
                {loading ? (
                    <div className="loading-container">
                        <h1>Loading game details...</h1>
                        <p className="loading-message">Please wait while we fetch the game data...</p>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <p className="error-message">{error}</p>
                        <button
                            className="btn btn-secondary"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </button>
                    </div>
                ) : game ? (
                    <>
                        <h1 className="snapshot-title">
                            Game #{gameId.substring(0, 5)} Result:
                            <span className={`result ${resultClass()}`}> {getUserResult()}</span>
                        </h1>

                        <div className="players-header">
                            <div className="player">
                                <img
                                    src={game.player1.profilePic || "https://th.bing.com/th/id/OIP.eMLmzmhAqRMxUZad3zXE5QHaHa"}
                                    alt={game.player1.username}
                                    style={{ width: '80px', height: '80px', borderRadius: '50%' }}
                                />
                                <span>{game.player1.username}</span>
                            </div>
                            <span className="vs">VS</span>
                            <div className="player">
                                <img
                                    src={game.player2.profilePic || "https://th.bing.com/th/id/OIP.eMLmzmhAqRMxUZad3zXE5QHaHa"}
                                    alt={game.player2.username}
                                    style={{ width: '80px', height: '80px', borderRadius: '50%' }}
                                />
                                <span>{game.player2.username}</span>
                            </div>
                        </div>

                        <div className="grid">
                            {game.grid.map((row, rowIndex) => (
                                row.map((cell, colIndex) => (
                                    <div
                                        key={`${rowIndex}-${colIndex}`}
                                        className="cell"
                                        style={{ backgroundColor: getCellColor(cell) }}
                                    />
                                ))
                            ))}
                        </div>

                        <div className="game-actions">
                            {game && game.forfeit && (
                                <p className="forfeit-info">
                                    {isUserForfeiter
                                        ? 'You forfeited this game'
                                        : 'Opponent forfeited this game'}
                                </p>
                            )}

                            <Link to="/history" className="btn btn-secondary">Back to History</Link>
                        </div>
                    </>
                ) : (
                    <h1>Game not found</h1>
                )}
            </main>
        </>
    );
};

export default HistoryDetail;