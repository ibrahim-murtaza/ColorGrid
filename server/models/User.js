import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
        },
        profile_picture: {
            type: String,
            default: "https://th.bing.com/th/id/OIP.eMLmzmhAqRMxUZad3zXE5QHaHa",
        },
        coins: {
            type: Number,
            default: 0,
        },
        wins: {
            type: Number,
            default: 0,
        },
        losses: {
            type: Number,
            default: 0,
        },
        draws: {
            type: Number,
            default: 0,
        }
    },
    { timestamps: true }
);

userSchema.methods.comparePassword = async function (password) {
    return password === this.password;
}

const User = mongoose.model("User", userSchema);
export default User;