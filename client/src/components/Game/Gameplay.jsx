import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Navbar from '../Layout/Navbar';
import '../../../../design/css/gameplay.css';

const Gameplay = () => {
    const { gameId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [status, setStatus] = useState('Connecting...');
    const [gameEnded, setGameEnded] = useState(false);
    const [user, setUser] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    const gameHasEnded = useRef(false);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            setUser(userData);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const isMyTurn = useCallback(() => {
        if (!gameState || !playerId || gameEnded) return false;
        const isPlayer1Turn = gameState.currentTurn === 'player1';
        return (isPlayer1Turn && playerId === 'player1') || (!isPlayer1Turn && playerId === 'player2');
    }, [gameState, playerId, gameEnded]);

    useEffect(() => {
        gameHasEnded.current = false;

        if (!user) return;

        const newSocket = io('http://localhost:8000');
        setSocket(newSocket);
        setStatus('Connecting...');

        newSocket.on('connect', () => {
            console.log('Socket connected with ID:', newSocket.id);
            if (!gameHasEnded.current) {
                console.log(`Attempting to join game ${gameId}`);
                newSocket.emit('join_game', {
                    gameId,
                    userId: user.id,
                    socketId: newSocket.id
                });
            } else {
                console.log("Connect event: Game already ended according to ref, not joining.");
            }
        });

        newSocket.on('game_state', (data) => {
            if (!gameHasEnded.current) {
                console.log('Received game state:', data);
                setGameState(data);
                if (data.player1.id === user.id) setPlayerId('player1');
                else if (data.player2.id === user.id) setPlayerId('player2');
            } else {
                console.log("Ignoring game_state as game has ended (ref).");
            }
        });

        newSocket.on('move_made', (data) => {
            if (!gameHasEnded.current) {
                console.log('Move made:', data);
                setGameState(data.gameState);
            } else {
                console.log("Ignoring move_made as game has ended (ref).");
            }
        });

        newSocket.on('game_over', (result) => {
            console.log('Game over received:', result);
            console.log('Full game_over payload:', JSON.stringify(result, null, 2));

            if (gameHasEnded.current) {
                console.log("Already processed game_over (ref).");
                return;
            }

            gameHasEnded.current = true;
            setGameEnded(true);

            if (result.finalGrid) {
                setGameState(prev => ({ ...(prev || {}), grid: result.finalGrid }));
            }

            if (result.result === "already_ended") {
                setStatus("Game has ended");
                return;
            }

            if (result.result === 'draw') {
                const drawMessage = 'Draw';
                setStatus(drawMessage);
                localStorage.setItem(`game_status_${gameId}`, drawMessage);

                setGameState(prev => ({
                    ...(prev || {}),
                    gameOver: true,
                    result: 'draw'
                }));
            } else if (result.result === 'forfeit') {
                let forfeitMessage;
                const currentUserData = JSON.parse(localStorage.getItem('user'));

                if (result.forfeiter && currentUserData && result.forfeiter.id === currentUserData.id) {
                    const coinsBeforeLoss = currentUserData.coins;
                    const coinsLost = Math.min(coinsBeforeLoss, 200);

                    forfeitMessage = `You Forfeited - You Lost (${coinsLost} coins)`;
                    updateCoins(false);
                } else {
                    forfeitMessage = 'Opponent Forfeited - You Won (+200 coins)';
                    updateCoins(true);
                }
                setStatus(forfeitMessage);
                localStorage.setItem(`game_status_${gameId}`, forfeitMessage);
            } else if (result.winner && result.winner.id === user.id) {
                const winMessage = 'You Won! (+200 coins)';
                setStatus(winMessage);
                localStorage.setItem(`game_status_${gameId}`, winMessage);
                updateCoins(true);
            } else {
                const loseMessage = 'You Lost (-200 coins)';
                setStatus(loseMessage);
                localStorage.setItem(`game_status_${gameId}`, loseMessage);
                updateCoins(false);
            }
        });

        newSocket.on('opponent_disconnected', () => {
            if (gameHasEnded.current) {
                console.log("Already processed game end (opponent_disconnected ref).");
                return;
            }
            gameHasEnded.current = true;
            setGameEnded(true);
            setStatus('Opponent Disconnected - You won (+200 coins)');
            updateCoins(true);
        });

        newSocket.on('game_error', (error) => {
            console.error('Game error:', error);
            if (!gameHasEnded.current) {
                setErrorMessage(error.message || 'An error occurred');
                setStatus(`Error: ${error.message}`);
            } else {
                console.log("Ignoring game_error because game has already ended (ref).");
            }
        });

        newSocket.on('game_finished', (data) => {
            console.log('Received finished game state:', data);
            if (gameHasEnded.current) {
                console.log("Already processed game end (game_finished ref).");
                return;
            }
            gameHasEnded.current = true;
            setGameEnded(true);
            setGameState(data);
            if (data.player1.id === user.id) setPlayerId('player1');
            else if (data.player2.id === user.id) setPlayerId('player2');
            if (data.result === 'draw') setStatus('Draw');
            else if (data.winner && data.winner.id === user.id) setStatus('You Won! (+200 coins)');
            else setStatus('You Lost (-200 coins)');
        });

        if (location.state?.gameData && !gameState) {
            const initialGameData = location.state.gameData;
            console.log('Processing initial game data from navigation:', initialGameData);

            if (initialGameData.gameOver || initialGameData.result && initialGameData.result !== 'ongoing') {
                if (!gameHasEnded.current) {
                    gameHasEnded.current = true;
                    setGameEnded(true);

                    if (initialGameData.result === 'draw') setStatus('Draw');
                    else if (initialGameData.winner && initialGameData.winner.id === user.id) setStatus('You Won! (+200 coins)');
                    else setStatus('You Lost (-200 coins)');
                }
            }

            setGameState({
                ...initialGameData,
                currentTurn: initialGameData.currentTurn || 'player1'
            });

            if (initialGameData.player1.id === user?.id) setPlayerId('player1');
            else if (initialGameData.player2.id === user?.id) setPlayerId('player2');
        }


        return () => {
            if (newSocket) {
                console.log("Disconnecting socket in cleanup:", newSocket.id);
                newSocket.disconnect();
            }
        };
    }, [gameId, user, navigate, location.state]);

    useEffect(() => {
        if (gameEnded || gameState?.gameOver || gameState?.result === 'draw') {
            return;
        }

        if (gameState && playerId) {
            setStatus(isMyTurn() ? 'Your Turn' : 'Opponent\'s Turn');
        }
    }, [gameState, playerId, isMyTurn, gameEnded]);

    const updateCoins = useCallback((isWinner) => {
        if (!user) return;

        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) return;

        let coinChange = 0;
        if (isWinner) {
            coinChange = 200;
            userData.coins += 200;
        } else {
            if (userData.coins >= 200) {
                coinChange = -200;
                userData.coins -= 200;
            } else {
                coinChange = -userData.coins;
                userData.coins = 0;
            }
        }

        console.log(`Updating coins: ${coinChange}`);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    }, [user]);

    const handleCellClick = (row, col) => {
        if (gameHasEnded.current || !gameState || !socket || !isMyTurn()) {
            return;
        }

        if (gameState.grid[row][col] !== null) {
            console.log('Cell already occupied!');
            return;
        }

        console.log('Making move:', row, col);
        if (socket.connected && !gameHasEnded.current) {
            socket.emit('make_move', {
                gameId,
                playerId,
                move: { row, col }
            });
        } else {
            console.log("Cannot make move: Socket not connected or game ended.");
        }
    };

    const handleForfeit = () => {
        if (socket && socket.connected && !gameHasEnded.current) {
            console.log("Forfeiting game...");
            socket.emit('forfeit_game', { gameId, playerId });
        } else {
            console.log("Cannot forfeit: Socket not connected or game ended.");
        }
    };

    const handlePlayAgain = () => {
        navigate('/newgame/waiting');
    };

    const getCellColor = (cellValue) => {
        if (!gameState) return 'rgba(255,255,255,0.1)';

        if (cellValue === 'player1' || cellValue === 1) return gameState.player1?.color || 'red';
        if (cellValue === 'player2' || cellValue === 2) return gameState.player2?.color || 'blue';

        return 'rgba(255,255,255,0.1)';
    };


    if (!gameState || !user) {
        return (
            <>
                <Navbar
                    username={user?.username}
                    coins={user?.coins}
                    profilePic={user?.profile_picture}
                    onLogout={() => {
                        localStorage.removeItem('user');
                        navigate('/login');
                    }}
                />
                <div className="game-container">
                    <h1>Loading Game...</h1>
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                </div>
            </>
        );
    }

    const getStatusMessage = () => {
        const savedStatus = localStorage.getItem(`game_status_${gameId}`);

        if (savedStatus && (
            status.includes("Error:") ||
            status.includes("Game has ended") ||
            status === "Game has ended"
        )) {
            return savedStatus;
        }

        if (status.includes("Error: Game not found") ||
            status.includes("Error: Game not found or ended") ||
            status.includes("Error: Game not found or has ended")) {
            return "Game has ended";
        }

        return status;
    };

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
            <main className="game-container">
                <div className="players-header">
                    <div className="player">
                        <img
                            src={gameState.player1?.profilePic || "https://th.bing.com/th/id/OIP.eMLmzmhAqRMxUZad3zXE5QHaHa"}
                            alt={gameState.player1?.username}
                            style={{ width: '100px', height: '100px', borderRadius: '50%', border: `3px solid ${gameState.player1?.color || 'grey'}` }}
                        />
                        <span>{gameState.player1?.username}</span>
                    </div>
                    <span className="vs">VS</span>
                    <div className="player">
                        <img
                            src={gameState.player2?.profilePic || "https://th.bing.com/th/id/OIP.eMLmzmhAqRMxUZad3zXE5QHaHa"}
                            alt={gameState.player2?.username}
                            style={{ width: '100px', height: '100px', borderRadius: '50%', border: `3px solid ${gameState.player2?.color || 'grey'}` }}
                        />
                        <span>{gameState.player2?.username}</span>
                    </div>
                </div>

                <div className="grid">
                    {gameState.grid.map((row, rowIndex) => (
                        row.map((cellValue, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className="cell"
                                style={{
                                    backgroundColor: getCellColor(cellValue),
                                    cursor: gameEnded || !isMyTurn() ? 'default' : 'pointer'
                                }}
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                            />
                        ))
                    ))}
                </div>

                <div className="status-area">
                    <p id="status">Status: <span>{getStatusMessage()}</span></p>

                    {!gameEnded && getStatusMessage() !== "Game has ended" && (
                        <button
                            id="forfeitBtn"
                            className="btn btn-secondary"
                            onClick={handleForfeit}
                            disabled={gameEnded}
                        >
                            Forfeit
                        </button>
                    )}

                    {(gameEnded || getStatusMessage() === "Game has ended") && (
                        <button
                            id="playAgainBtn"
                            className="btn btn-primary"
                            onClick={handlePlayAgain}
                        >
                            Play Again
                        </button>
                    )}
                </div>
                {errorMessage && !gameEnded && getStatusMessage() !== "Game has ended" && (
                    <p className="error-message">{errorMessage}</p>
                )}
            </main>
        </>
    );
};

export default Gameplay;