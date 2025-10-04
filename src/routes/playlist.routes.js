import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controllers.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const playlist = Router();

playlist.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

playlist.route("/").post(createPlaylist);

playlist
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

playlist.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
playlist.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

playlist.route("/user/:userId").get(getUserPlaylists);

export default playlist;
