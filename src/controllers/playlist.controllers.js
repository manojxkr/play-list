import { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // 1️⃣ Validate input
  if (!name || !description) {
    throw new ApiError(400, "Both name and description are required");
  }

  // 2️⃣ Create the playlist
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id, // current logged-in user
    videos: [], // empty initially
  });

  // 3️⃣ Double-check creation
  if (!playlist) {
    throw new ApiError(500, "Something went wrong while creating playlist");
  }

  // 4️⃣ Send success response
  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // 1️⃣ Validate userId
  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // 2️⃣ Fetch playlists
  const playlists = await Playlist.find({ owner: userId })
    .populate("videos") // optional: include video details
    .sort({ createdAt: -1 }); // newest first

  // 3️⃣ If no playlists found
  if (!playlists.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No playlists found for this user"));
  }

  // 4️⃣ Send response
  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "User playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  // 1️⃣ Validate playlistId
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  // 2️⃣ Fetch the playlist with videos populated
  const playlist = await Playlist.findById(playlistId).populate("videos");

  // 3️⃣ Check if playlist exists
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // 4️⃣ Send success response
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist ID or video ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.videos.includes(videoId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, playlist, "Video already in playlist"));
  }

  playlist.videos.push(videoId);
  await playlist.save();
  await playlist.populate("videos");

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video added to playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist ID or video ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!playlist.videos.includes(videoId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, playlist, "Video not found in playlist"));
  }

  playlist.videos = playlist.videos.filter((id) => id.toString() !== videoId);
  await playlist.save();
  await playlist.populate("videos");

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video removed from playlist successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  // 1️⃣ Validate playlistId
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  // 2️⃣ Find the playlist
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // 3️⃣ Delete the playlist entirely
  await playlist.deleteOne(); // ✅ modern Mongoose method

  // 4️⃣ Send response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  // 1️⃣ Validate playlistId
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  // 2️⃣ Validate input
  if (!name && !description) {
    throw new ApiError(
      400,
      "At least one field (name or description) is required to update"
    );
  }

  // 3️⃣ Find and update the playlist
  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        ...(name && { name }),
        ...(description && { description }),
      },
    },
    { new: true } // return the updated document
  ).populate("videos");

  // 4️⃣ Check if playlist exists
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // 5️⃣ Send response
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
