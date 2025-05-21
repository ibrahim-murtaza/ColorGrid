import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Layout/Navbar';
import io from 'socket.io-client';
import '../../../../design/css/waiting.css';

const Waiting = () => {
    const [socket, setSocket] = useState(null);
    const [matchmaking, setMatchmaking] = useState(true);
    const [matchFound, setMatchFound] = useState(false);
    const [opponent, setOpponent] = useState(null);
    const [statusMessage, setStatusMessage] = useState('Matchmaking in progress');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));

        if (!userData) {
            navigate('/login');
            return;
        }

        const newSocket = io('http://localhost:8000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket connected with ID:', newSocket.id);
            
            newSocket.emit('find_match', {
                id: userData.id,
                username: userData.username,
                profile_picture: userData.profile_picture
            });
        });

        newSocket.on('matchmaking_status', (data) => {
            console.log('Matchmaking status:', data);
            setStatusMessage(data.message);
        });

        newSocket.on('start_game', (gameData) => {
            console.log('Match Found:', gameData);
            setMatchmaking(false);
            setMatchFound(true);
            
            const isPlayer1 = gameData.player1.id === userData.id;
            const opponentData = isPlayer1 ? gameData.player2 : gameData.player1;
            setOpponent(opponentData);
            
            setTimeout(() => {
                navigate(`/newgame/${gameData.gameId}`, {
                    state: { gameData }
                });
            }, 2000);
        });

        newSocket.on('game_state', (gameData) => {
            console.log('Game state received:', gameData);
            setMatchmaking(false);
            setMatchFound(true);
            
            const isPlayer1 = gameData.player1.id === userData.id;
            const opponentData = isPlayer1 ? gameData.player2 : gameData.player1;
            setOpponent(opponentData);

            setTimeout(() => {
                navigate(`/newgame/${gameData.id}`, {
                    state: { gameData }
                });
            }, 2000);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            setError('Connection to server failed. Please try again.');
        });

        newSocket.on('game_error', (err) => {
            console.error('Game error:', err);
            setError(err.message || 'An error occurred while matching. Please try again.');
        });

        return () => {
            if (newSocket) {
                if (matchmaking && !matchFound) {
                    console.log('Canceling matchmaking...');
                    newSocket.emit('cancel_match');
                }
                newSocket.disconnect();
            }
        };
    }, [navigate]);

    const handleCancel = () => {
        if (socket) {
            socket.emit('cancel_match');
            navigate('/home');
        }
    };

    const user = JSON.parse(localStorage.getItem('user')) || {};

    return (
        <>
            <Navbar
                username={user.username}
                coins={user.coins}
                profilePic={user.profile_picture}
                onLogout={() => {
                    localStorage.removeItem('user');
                    navigate('/login');
                }}
            />
            <main className="waiting-container">
                {matchFound ? (
                    <>
                        <h1 className="waiting-title">Match Found!</h1>
                        <div className="opponent-info">
                            <img 
                                src={opponent?.profilePic || "https://th.bing.com/th/id/OIP.eMLmzmhAqRMxUZad3zXE5QHaHa"}
                                alt={opponent?.username}
                                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #fff' }}
                            />
                            <p className="opponent-name">{opponent?.username}</p>
                        </div>
                        <p className="waiting-subtitle">Game is starting...</p>
                    </>
                ) : error ? (
                    <>
                        <h1 className="waiting-title">Error</h1>
                        <p className="waiting-subtitle">{error}</p>
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/home')}
                        >
                            Return to Home
                        </button>
                    </>
                ) : (
                    <>
                        <h1 className="waiting-title">Waiting for Opponent...</h1>
                        <p className="waiting-subtitle">{statusMessage}</p>
                        <button
                            id="cancelBtn"
                            className="btn btn-secondary"
                            onClick={handleCancel}
                            disabled={matchFound}
                        >
                            Cancel
                        </button>
                    </>
                )}
            </main>
        </>
    );
};

export default Waiting;