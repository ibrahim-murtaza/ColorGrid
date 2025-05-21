import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Welcome from './components/Welcome/Welcome';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import Home from './components/Home/Home';
import Waiting from './components/Game/Waiting';
import Gameplay from './components/Game/Gameplay';
import History from './components/History/History';
import HistoryDetail from './components/History/HistoryDetail';
import Leaderboard from './components/Leaderboard/Leaderboard';
import UpdateProfile from './components/Profile/UpdateProfile';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setIsLoggedIn(false);
    };

    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={isLoggedIn ? <Navigate to="/home" /> : <Welcome />} />
                <Route path="/login" element={isLoggedIn ? <Navigate to="/home" /> : <Login setIsLoggedIn={setIsLoggedIn} />} />
                <Route path="/signup" element={isLoggedIn ? <Navigate to="/home" /> : <SignUp setIsLoggedIn={setIsLoggedIn} />} />

                {/* Protected Routes */}
                <Route path="/home" element={isLoggedIn ? <Home handleLogout={handleLogout} /> : <Navigate to="/login" />} />
                <Route path="/newgame/waiting" element={isLoggedIn ? <Waiting /> : <Navigate to="/login" />} />
                <Route path="/newgame/:gameId" element={isLoggedIn ? <Gameplay /> : <Navigate to="/login" />} />
                <Route path="/history" element={isLoggedIn ? <History /> : <Navigate to="/login" />} />
                <Route path="/history/:gameId" element={isLoggedIn ? <HistoryDetail /> : <Navigate to="/login" />} />
                <Route path="/leaderboard" element={isLoggedIn ? <Leaderboard /> : <Navigate to="/login" />} />
                <Route path="/update-profile" element={isLoggedIn ? <UpdateProfile /> : <Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App
