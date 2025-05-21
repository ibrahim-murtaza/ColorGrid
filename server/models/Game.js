import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
    player1_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    player2_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    player1_colour: {
        type: String,
        required: true
    },
    player2_colour: {
        type: String,
        required: true
    },
    final_grid: {
        type: [[Number]],
        required: true,
        default: Array(5).fill().map(() => Array(5).fill(0))
    },
    result: {
        type: String,
        enum: ["player1_won", "player2_won", "draw", "ongoing", "forfeit"],
        default: 'ongoing'
    },
    winner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    forfeit: {
        type: Boolean,
        default: false
    },
    forfeiter_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }
}, { timestamps: true });

const Game = mongoose.model("Game", gameSchema);
export default Game;