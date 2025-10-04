import express from "express";

import cookieParser from "cookie-parser";
const app = express();

import cors from "cors";

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import router from "./routes/user.routes.js";

import Videorouter from "./routes/video.routes.js";
import playlist from "./routes/playlist.routes.js";
app.use("/api/v1/users", router);
app.use("/api/v1/videos", Videorouter);
app.use("/api/v1/playlists", playlist);

// routes

export default app;
