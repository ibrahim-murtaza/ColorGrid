import Game from '../models/Game.js';
import User from '../models/User.js';
import { maxAreaOfIsland } from '../utils/maxAreaOfIsland.js';

const waitingPlayers = new Map();
const activeGames = new Map();

export const initializeSocketControllers = (io) => {
    io.on("connection", (socket) => {
        console.log("USER CONNECTED:", socket.id);

        socket.on("find_match", (userData) => {
            findMatch(socket, userData, io);
        });

        socket.on("disconnect", () => {
            handleDisconnect(socket, io);
        });

        socket.on("cancel_match", () => {
            cancelMatch(socket);
        });

        socket.on("make_move", ({ gameId, playerId, move }) => {
            makeMove(socket, gameId, playerId, move, io);
        });

        socket.on("forfeit_game", ({ gameId, playerId }) => {
            forfeitGame(socket, gameId, playerId, io);
        });

        socket.on("join_game", ({ gameId, userId, socketId }) => {
            console.log(`Player ${userId} (${socket.id}) joining game ${gameId}`);
            joinGame(socket, gameId, userId, io);
        });
    });
};

const findMatch = (socket, userData, io) => {
    console.log(`Player ${userData.username} looking for a match`);

    waitingPlayers.set(socket.id, {
        ...userData, socketId: socket.id, _id: userData.id
    });

    console.log(`Waiting players count: ${waitingPlayers.size}`);

    if (waitingPlayers.size >= 2) {
        const players = Array.from(waitingPlayers.values());

        let player1 = null;
        let player2 = null;

        player1 = players.find(p => p.socketId === socket.id);

        player2 = players.find(p => p.id !== player1.id);

        if (!player2) {
            socket.emit('matchmaking_status', { message: 'Waiting for a different opponent...' });
            return;
        }

        console.log(`Matching players: ${player1.username} and ${player2.username}`);

        waitingPlayers.delete(player1.socketId);
        waitingPlayers.delete(player2.socketId);

        const gameId = `game_${Date.now()}`;

        const player1Socket = io.sockets.sockets.get(player1.socketId);
        const player2Socket = io.sockets.sockets.get(player2.socketId);

        if (!player1Socket || !player2Socket) {
            console.error("Could not find socket for one of the players");

            if (player1Socket) waitingPlayers.set(player1.socketId, player1);
            if (player2Socket) waitingPlayers.set(player2.socketId, player2);

            return;
        }

        player1Socket.join(gameId);
        player2Socket.join(gameId);

        console.log(`Created game room: ${gameId} with players ${player1.username} and ${player2.username}`);

        const colours = ['red', 'blue'];
        const randomIndex = Math.floor(Math.random() * 2);

        const game = {
            id: gameId,
            player1: {
                id: player1.id,
                username: player1.username,
                profilePic: player1.profile_picture,
                socketId: player1.socketId,
                color: colours[randomIndex]
            },
            player2: {
                id: player2.id,
                username: player2.username,
                profilePic: player2.profile_picture,
                socketId: player2.socketId,
                color: colours[1 - randomIndex]
            },
            grid: Array(5).fill().map(() => Array(5).fill(null)),
            currentTurn: 'player1',
            moveCount: 0
        };

        activeGames.set(gameId, game);

        io.to(gameId).emit("start_game", {
            gameId,
            player1: {
                id: player1.id,
                username: player1.username,
                profilePic: player1.profile_picture,
                color: game.player1.color
            },
            player2: {
                id: player2.id,
                username: player2.username,
                profilePic: player2.profile_picture,
                color: game.player2.color
            },
            grid: game.grid,
            currentTurn: game.currentTurn
        });

        player1Socket.emit("game_state", game);
        player2Socket.emit("game_state", game);

        console.log(`Emitted game data to both players in room ${gameId}`);
    }
};

const handleDisconnect = (socket, io) => {
    console.log("USER DISCONNECTED:", socket.id);
    waitingPlayers.delete(socket.id);

    for (const [gameId, game] of activeGames.entries()) {
        let isPlayer1 = game.player1.socketId === socket.id;
        let isPlayer2 = game.player2.socketId === socket.id;

        if (isPlayer1 || isPlayer2) {
            console.log(`Player ${socket.id} disconnected from game ${gameId}`);

            setTimeout(() => {
                const currentGame = activeGames.get(gameId);
                if (!currentGame) return;

                if ((isPlayer1 && currentGame.player1.socketId !== socket.id) ||
                    (isPlayer2 && currentGame.player2.socketId !== socket.id)) {
                    return;
                }

                const opponent = isPlayer1 ? game.player2 : game.player1;
                const opponentSocket = io.sockets.sockets.get(opponent.socketId);
                if (opponentSocket) {
                    opponentSocket.emit("opponent_disconnected");
                }

                activeGames.delete(gameId);
            }, 5000);

            break;
        }
    }
};

const cancelMatch = (socket) => {
    waitingPlayers.delete(socket.id);
    console.log(`Player ${socket.id} cancelled matchmaking`);
};

const joinGame = (socket, gameId, userId, io) => {
    const game = activeGames.get(gameId);

    if (!game) {
        if (gameId.startsWith("game_")) {
            console.log(`Game ${gameId} not found in activeGames - likely already ended`);

            socket.emit('game_over', {
                result: "already_ended",
                message: "Game has ended",
                gameOver: true
            });
            return;
        }

        Game.findById(gameId)
            .populate('player1_id', 'username profile_picture')
            .populate('player2_id', 'username profile_picture')
            .populate('winner_id', 'username')
            .then(completedGame => {
                if (completedGame) {
                    console.log(`Player ${userId} trying to join completed game ${gameId}`);

                    const gameData = {
                        id: completedGame._id,
                        player1: {
                            id: completedGame.player1_id._id,
                            username: completedGame.player1_id.username,
                            profilePic: completedGame.player1_id.profile_picture,
                            color: completedGame.player1_colour
                        },
                        player2: {
                            id: completedGame.player2_id._id,
                            username: completedGame.player2_id.username,
                            profilePic: completedGame.player2_id.profile_picture,
                            color: completedGame.player2_colour
                        },
                        grid: completedGame.final_grid,
                        result: completedGame.result,
                        winner: completedGame.winner_id ? {
                            id: completedGame.winner_id._id,
                            username: completedGame.winner_id.username
                        } : null,
                        gameOver: true
                    };

                    socket.emit('game_finished', gameData);
                } else {
                    socket.emit('game_over', {
                        result: "already_ended",
                        message: "Game not found or has ended",
                        gameOver: true
                    });

                }
            })
            .catch(err => {
                console.error("Error checking for completed game:", err);
                socket.emit('game_over', {
                    result: "already_ended",
                    message: "Game not found or has ended",
                    gameOver: true
                });
            });
        return;
    }

    socket.join(gameId);

    let playerRole = null;
    if (game.player1.id === userId) {
        game.player1.socketId = socket.id;
        playerRole = 'player1';
        console.log(`Updated player1 socket ID to ${socket.id}`);
    } else if (game.player2.id === userId) {
        game.player2.socketId = socket.id;
        playerRole = 'player2';
        console.log(`Updated player2 socket ID to ${socket.id}`);
    } else {
        socket.emit('game_error', { message: 'You are not a player in this game' });
        return;
    }

    socket.emit("game_state", game);

    console.log(`Sent game state to player ${userId} (${playerRole})`);
};

const makeMove = (socket, gameId, playerId, move, io) => {
    console.log(`Player ${socket.id} (${playerId}) making move in game ${gameId}:`, move);
    const game = activeGames.get(gameId);
    if (!game) {
        socket.emit('game_error', { message: 'Game not found' });
        return;
    }

    console.log('Current turn:', game.currentTurn, 'Player role:', playerId);

    if (game.currentTurn === playerId) {
        const { row, col } = move;

        if (game.grid[row][col] !== null) {
            socket.emit('game_error', { message: 'Cell already occupied' });
            return;
        }

        game.grid[row][col] = playerId;
        game.moveCount++;

        game.currentTurn = game.currentTurn === 'player1' ? 'player2' : 'player1';

        io.to(gameId).emit("move_made", {
            gameState: game,
            move: {
                row,
                col,
                color: playerId === 'player1' ? game.player1.color : game.player2.color
            }
        });

        console.log(`Move made in game ${gameId}, next turn: ${game.currentTurn}`);

        if (game.moveCount === 25) {
            endGame(gameId, io);
        }
    } else {
        console.log(`Invalid turn attempt by ${playerId}, current turn is ${game.currentTurn}`);
        socket.emit('game_error', { message: 'Not your turn' });
    }
};

const forfeitGame = (socket, gameId, playerId, io) => {
    console.log(`Player ${socket.id} (${playerId}) forfeiting game ${gameId}`);
    const game = activeGames.get(gameId);
    if (!game) {
        socket.emit('game_error', { message: 'Game not found' });
        return;
    }

    const isPlayer1 = playerId === 'player1';
    const forfeiter = isPlayer1 ? game.player1 : game.player2;
    const winner = isPlayer1 ? game.player2 : game.player1;

    const finalGrid = game.grid.map(row =>
        row.map(cell => cell === 'player1' ? 1 : cell === 'player2' ? 2 : 0)
    );

    console.log("Sending game_over for forfeit with data:", {
        result: 'forfeit',
        winner: { id: winner.id, username: winner.username },
        forfeiter: { id: forfeiter.id, username: forfeiter.username }
    });

    saveGameResult(game, isPlayer1 ? "player2_won" : "player1_won", winner, forfeiter);

    io.to(gameId).emit("game_over", {
        result: "forfeit",
        winner: winner,
        forfeiter: forfeiter,
        finalGrid: finalGrid,
        gameId: gameId,
        player1: game.player1,
        player2: game.player2,
        gameOver: true
    });

    activeGames.delete(gameId);
    console.log(`Game ${gameId} ended due to forfeit`);
    console.log(`Game ${gameId} removed from activeGames? ${!activeGames.has(gameId)}`);
};

const findGameBySocketId = (socketId) => {
    for (const game of activeGames.values()) {
        if (game.player1.socketId === socketId || game.player2.socketId === socketId) {
            return game;
        }
    }
    return null;
};

const endGame = async (gameId, io) => {
    const game = activeGames.get(gameId);
    if (!game) {
        return;
    }

    const binaryGrid = game.grid.map(row =>
        row.map(cell => cell === 'player1' ? 1 : cell === 'player2' ? 2 : 0)
    );

    const player1Islands = maxAreaOfIsland(binaryGrid, 1);
    const player2Islands = maxAreaOfIsland(binaryGrid, 2);

    console.log(`Game ${gameId} ended. Islands: Player1=${player1Islands}, Player2=${player2Islands}`);

    let result;
    let winner = null;

    if (player1Islands > player2Islands) {
        result = "player1_won";
        winner = game.player1;
    }
    else if (player2Islands > player1Islands) {
        result = "player2_won";
        winner = game.player2;
    }
    else {
        result = "draw";
        winner = null;
    }

    await saveGameResult(game, result, winner);

    const finalBinaryGrid = game.grid.map(row =>
        row.map(cell => cell === 'player1' ? 1 : cell === 'player2' ? 2 : 0)
    );

    io.to(gameId).emit("game_over", {
        result,
        winner,
        finalGrid: finalBinaryGrid,
        scores: {
            [game.player1.username]: player1Islands,
            [game.player2.username]: player2Islands,
        }
    });

    activeGames.delete(gameId);
    console.log(`Game ${gameId} ended normally`);
};

const saveGameResult = async (game, result, winner, forfeiter = null) => {
    try {
        const finalGrid = game.grid.map(row =>
            row.map(cell => cell === 'player1' ? 1 : cell === 'player2' ? 2 : 0)
        );

        const newGame = new Game({
            player1_id: game.player1.id,
            player2_id: game.player2.id,
            player1_colour: game.player1.color,
            player2_colour: game.player2.color,
            final_grid: finalGrid,
            result: result,
            winner_id: winner?.id || null,
            forfeit: !!forfeiter,
            forfeiter_id: forfeiter?.id || null,
        });

        await newGame.save();
        console.log(`Game saved to database with ID: ${newGame._id}`);

        if (result !== "draw") {
            if (winner) {
                const winnerUser = await User.findById(winner.id);
                if (winnerUser) {
                    winnerUser.wins += 1;
                    winnerUser.coins += 200;
                    await winnerUser.save();
                    console.log(`Updated winner ${winner.username}: +1 win, +200 coins`);
                }
            }

            const loserId = winner?.id === game.player1.id ? game.player2.id : game.player1.id;
            const loserUser = await User.findById(loserId);
            if (loserUser) {
                loserUser.losses += 1;
                if (loserUser.coins >= 200) {
                    loserUser.coins -= 200;
                }
                else {
                    loserUser.coins = 0;
                }
                await loserUser.save();
                console.log(`Updated loser: +1 loss, -200 coins`);
            }
        }
        else {
            const player1User = await User.findById(game.player1.id);
            if (player1User) {
                player1User.draws += 1;
                await player1User.save();
            }

            const player2User = await User.findById(game.player2.id);
            if (player2User) {
                player2User.draws += 1;
                await player2User.save();
            }
            console.log(`Updated both players: +1 draw each`);
        }
    }
    catch (error) {
        console.error("Error saving game result:", error);
    }
};