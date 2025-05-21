import express from 'express';
import Game from '../models/Game.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const games = await Game.find({ $or: [{ player1_id: userId }, { player2_id: userId }] })
            .sort({ createdAt: -1 })
            .populate('player1_id', 'username profile_picture')
            .populate('player2_id', 'username profile_picture')
            .populate('winner_id', 'username');
        const gameHistory = games.map(game => {
            const isPlayer1 = game.player1_id._id.toString() === userId;
            const opponent = isPlayer1 ? game.player2_id : game.player1_id;

            let result;
            if (game.result === 'draw') {
                result = 'Draw';
            }

            else if (game.winner_id && game.winner_id._id.toString() === userId) {
                result = "Won"
            }

            else {
                result = "Lost";
            }

            return {
                id: game._id,
                opponent: opponent.username,
                opponentPic: opponent.profile_picture,
                result,
                date: game.createdAt
            };
        });
        res.json(gameHistory);
    }

    catch (error) {
        console.error("Error fetching game history:", error);
        res.status(500).json({ message: "Failed to fetch game history" });
    }
});

router.get('/details/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const game = await Game.findById(gameId)
            .populate('player1_id', 'username profile_picture')
            .populate('player2_id', 'username profile_picture')
            .populate('winner_id', 'username');

        if (!game) {
            return res.status(404).json({ message: "Game not found" });
        }

        res.json({
            id: game._id,
            player1: {
                id: game.player1_id._id,
                username: game.player1_id.username,
                profilePic: game.player1_id.profile_picture,
                color: game.player1_color
            },
            player2: {
                id: game.player2_id._id,
                username: game.player2_id.username,
                profilePic: game.player2_id.profile_picture,
                color: game.player2_color
            },
            grid: game.final_grid,
            result: game.result,
            winner: game.winner_id ? game.winner_id.username : null,
            forfeit: game.forfeit,
            date: game.createdAt
        });
    }

    catch (error) {
        console.error("Error fetching game details:", error);
        res.status(500).json({ message: "Failed to fetch game details" });
    }
});

router.get('/leaderboard', async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query.username = { $regex: search, $options: 'i' };
        }

        const users = await User.find(query).select("username coins wins losses draws profile_picture").sort({ coins: -1 }).limit(10);
        res.json(users);
    }

    catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
})

export default router;