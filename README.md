# ColorGrid 🎨

## About This Project

ColorGrid is a 2-player, turn-based color conquest game inspired by simple logic mechanics like "Tic Tac Toe" and "Connect X". This project was developed as Assignment 3 for the Advanced Programming course (Spring 2025). The game is built using the MERN stack (MongoDB, Express, React, Node.js) and utilizes Socket.IO for real-time communication between players.

The goal of the game is to have the largest connected block (island) of your color when all cells on the 5x5 grid are filled.

### Core Features

* **Real-time Multiplayer:** Engage in live 2-player matches.
* **Turn-Based Gameplay:** Players take turns selecting cells on a 5x5 grid to fill with their assigned color.
* **Winning Condition:** The player with the larger connected "island" (horizontally or vertically connected cells) of their color wins. The game can also end in a draw.
* **User Authentication:** Secure login and signup functionality (Note: Passwords are currently stored and compared as plain text).
* **Coin System:** New users start with 1000 coins. Wins award 200 coins, while losses deduct 200 coins (or less if the balance is low).
* **Matchmaking:** Players are randomly matched to start a new game.
* **Game History:** View a list of past games and their outcomes, including snapshots of the final game state.
* **Leaderboard:** See top players ranked by their coin balance.
* **Profile Management:** Users can update their username, password, and profile picture.
* **Seamless Experience:** Gameplay is managed using Socket.IO, ensuring no page refreshes are needed during a match.

### Tech Stack

* **Frontend:**
    * React (Vite)
    * React Router for navigation
    * Socket.IO Client for real-time communication
    * Axios for HTTP requests [client/package.json]
    * Styling: Basic HTML/CSS provided (from `design` folder), with an option to use Tailwind CSS.
* **Backend:**
    * Node.js
    * Express.js
    * MongoDB for the database
    * Mongoose as ODM [server/package.json]
    * Socket.IO for real-time events

## Setup and Installation

Follow these instructions to get the ColorGrid application running locally.

### Prerequisites

* Node.js and npm (Node Package Manager)
* MongoDB (Ensure your MongoDB server is running)

### Backend Setup

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```
2.  **Create Environment File:**
    Create a `config.env` file in the `server/` directory and add the following environment variables:
    ```env
    PORT=8000
    MONGO_URI=<your_mongodb_connection_string>
    ```
    Replace `<your_mongodb_connection_string>` with your actual MongoDB connection string (e.g., `mongodb://localhost:27017/colorgrid`) [server/config/db.js].

3.  **Install Dependencies:**
    ```bash
    npm install
    ```
    This will install all the necessary backend packages defined in `server/package.json`.

4.  **Start the Server:**
    ```bash
    npm run dev
    ```
    The backend server should now be running on `http://localhost:8000` [server/server.js].

### Frontend Setup

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
    This will install all the necessary frontend packages defined in `client/package.json`.
3.  **Start the Client:**
    ```bash
    npm run dev
    ```
    The frontend development server should now be running on `http://localhost:5173`.

## Project Structure

The project is organized into a client-server architecture:

* `client/`: Contains the React frontend application, built with Vite.
    * `src/`: Main source code for the React app.
        * `components/`: Reusable React components (Auth, Game, History, Home, Layout, Leaderboard, Profile, Welcome).
        * `App.jsx`: Main application component with routing.
        * `main.jsx`: Entry point for the React application.
    * `public/`: Static assets.
    * `index.html`: Main HTML file for the Vite app.
* `server/`: Contains the Node.js backend application.
    * `config/`: Database connection (`db.js`) and environment configuration.
    * `controllers/`: Logic for handling user authentication, game events, and socket communication (`userController.js`, `gameController.js`).
    * `models/`: Mongoose schemas for Users and Games (`User.js`, `Game.js`).
    * `routes/`: Express API routes for user and game-related actions (`userRoutes.js`, `gameRoutes.js`).
    * `utils/`: Utility functions, such as `maxAreaOfIsland.js`.
    * `app.js`: Express application setup.
    * `server.js`: Main entry point for the backend server, including Socket.IO setup.
* `design/`: Contains the provided HTML and CSS design templates for various pages.

## Gameplay Overview

* **Matchmaking:** Players join a queue and are randomly matched.
* **Game Start:** Each player is assigned a random color (e.g., red or blue). A 5x5 grid is displayed.
* **Turns:** Players take turns clicking on an empty cell, which then fills with their color. The game status indicates whose turn it is.
* **Game End:**
    * The game ends when all 25 cells are filled.
    * A player can forfeit, resulting in an immediate win for the opponent.
* **Winner Determination:** The player with the larger connected "island" (horizontally or vertically connected cells) of their color wins. The `server/utils/maxAreaOfIsland.js` utility is used for this calculation.
* **Scoring:**
    * Win: +200 coins
    * Loss: -200 coins (or to 0 if balance is less than 200)
    * Draw: User stats (draw count) are updated [server/controllers/gameController.js].