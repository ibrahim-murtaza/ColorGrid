import { Socket, Server } from "socket.io";
import http from "http";
import { app } from "./app.js";
import { config } from "dotenv";
import connectDB from "./config/db.js";
import { initializeSocketControllers } from "./controllers/gameController.js";

config({
    path: "./config.env",
});

await connectDB()

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: false,
    },
});

initializeSocketControllers(io);

server.listen(8000, () => {
    console.log("Server is running on port 8000");
});

