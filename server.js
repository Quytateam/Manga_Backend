import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import userRouter from "./routes/UserRouter.js";
import roleRouter from "./routes/RoleRouter.js";
import mangaRouter from "./routes/MangaRouter.js";
import categoriesRouter from "./routes/CategoriesRouter.js";
import historyRouter from "./routes/HistoryRouter.js";
import { autoMonth } from "./config/auto.js";

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

// Các route khác
app.use("/api/users", userRouter);
app.use("/api/role", roleRouter);
app.use("/api/manga", mangaRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/history", historyRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in http://localhost/${PORT}`);
});
