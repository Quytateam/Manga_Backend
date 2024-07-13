import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import userRouter from "./routes/UserRouter.js";
import roleRouter from "./routes/RoleRouter.js";
import mangaRouter from "./routes/MangaRouter.js";
import genresController from "./routes/GenresRouter.js";
import historyRouter from "./routes/HistoryRouter.js";
import cloudRouter from "./routes/CloudRouter.js";
import behaviorRouter from "./routes/BehaviorRouter.js";
import requestRouter from "./routes/RequestRouter.js";
import adminRouter from "./routes/AdminRouter.js";
import searchRouter from "./routes/SearchRouter.js";
import googleRouter from "./routes/GoogleRouter.js";
import { autoMonth } from "./config/auto.js";
import http from "http";
import { Server } from "socket.io";
import passport from "./config/passport.js";
import session from "express-session";
import { initializeSocket } from "./socket.js";
// import { setupWebSocketServer } from "./websocketServer.js";
// import { PythonShell } from "python-shell";
// import { exec } from "child_process";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
//connect DB
connectDB();

// Route chính
app.get("/", (req, res) => {
  res.send("API running...");
});

// ************************************
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Route Google OAuth
// app.get(
//   "/auth/google",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );

// app.get(
//   "/api/google/callback",
//   passport.authenticate("google", {
//     successRedirect: "http://localhost:3000/dashboard",
//     failureRedirect: "http://localhost:3000/login",
//   })
// );
// ************************************

// Các route khác
app.use("/api/users", userRouter);
app.use("/api/role", roleRouter);
app.use("/api/manga", mangaRouter);
app.use("/api/genres", genresController);
app.use("/api/history", historyRouter);
app.use("/api/cloud", cloudRouter);
app.use("/api/behavior", behaviorRouter);
app.use("/api/request", requestRouter);
app.use("/api/admin", adminRouter);
app.use("/api/search", searchRouter);
app.use("/api/google", googleRouter);

// const pythonScriptPath =
//   "C:/Users/USER/Downloads/graduation_project/server/config/toxic.py";

// exec(`python ${pythonScriptPath}`, (error, stdout, stderr) => {});

const PORT = process.env.PORT || 5000;
// const server = http.createServer(app);
// setupWebSocketServer(server);

// app.listen(PORT, () => {
//   console.log(`Server running in http://localhost/${PORT}`);
// });

const server = app.listen(PORT, () => {
  console.log(`Server running in http://localhost/${PORT}`);
});

initializeSocket(server);

// // Khởi tạo Socket.IO server
// const io = new Server(server, {
//   pingTimeout: 60000,
//   cors: {
//     origin: "http://localhost:3000",
//   },
// });

// io.on("connection", (socket) => {
//   console.log("Connected to socket.io");
//   socket.on("setup", (userData) => {
//     socket.join(userData._id);
//     socket.emit("connected");
//   });

//   socket.off("setup", () => {
//     console.log("USER DISCONNECTED");
//     socket.leave(userData._id);
//   });
// });

// setupMongoDBChangeStream();
