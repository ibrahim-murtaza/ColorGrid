import User from '../models/User.js';

export const register = async (req, res) => {
    try {
        const { username, password, profilePic } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const newUser = new User({
            username,
            password,
            profile_picture: profilePic || 'https://th.bing.com/th/id/OIP.eMLmzmhAqRMxUZad3zXE5QHaHa',
            coins: 1000
        });

        await newUser.save()

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                profile_picture: newUser.profile_picture,
                coins: newUser.coins,
                wins: newUser.wins,
                losses: newUser.losses,
                draws: newUser.draws,
            }
        });
    }
    catch (error) {
        console.error("Error registering user:", error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        return res.status(500).json({ message: 'Registration failed. Please try again later.' });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = password === user.password;
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                profile_picture: user.profile_picture,
                coins: user.coins,
                wins: user.wins,
                losses: user.losses,
                draws: user.draws,
            }
        });
    } catch (error) {
        console.error("Error logging in:", error);
        return res.status(500).json({ message: 'Login failed. Please try again later.' });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const { userId, username, password, profilePic } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username) {
            user.username = username;
        }
        if (password) {
            user.password = password;
        }

        if (profilePic) {
            user.profile_picture = profilePic;
        }

        await user.save();

        res.json({
            message: 'User profile updated successfully',
            user: {
                id: user._id,
                username: user.username,
                profile_picture: user.profile_picture,
                coins: user.coins,
                wins: user.wins,
                losses: user.losses,
                draws: user.draws,
            }
        });
    }
    catch (error) {
        console.error("Error updating user profile:", error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        return res.status(500).json({ message: 'Profile update failed. Please try again later.' });
    }
};

export const getUserbyId = async (req, res) => {
    try {
        const userId  = req.params.id;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error("Error fetching user by ID:", error);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        return res.status(500).json({ message: 'Failed to fetch user data. Please try again later.' });
    }
};