import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllVideos = asyncHandler(async (req, res) => {
  let {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  // Convert page & limit to numbers
  page = parseInt(page);
  limit = parseInt(limit);

  // Build filter
  const filter = {};
  if (query) {
    filter.title = { $regex: query, $options: "i" }; // case-insensitive search on title
  }
  if (userId && isValidObjectId(userId)) {
    filter.owner = userId; // filter by user
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortType === "asc" ? 1 : -1;

  // Fetch total count for pagination
  const total = await Video.countDocuments(filter);

  // Fetch videos with pagination and sorting
  const videos = await Video.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("owner", "fullName username avatar"); // optional: populate user info

  return res.json(
    new ApiResponse(true, "Videos fetched successfully", {
      total,
      page,
      limit,
      videos,
    })
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // Validate required fields
  if (
    !title ||
    !description ||
    !req.files?.videoFile ||
    !req.files?.thumbnail
  ) {
    throw new ApiError(
      400,
      "Title, description, video file, and thumbnail are required"
    );
  }

  const videoFile = req.files.videoFile[0];
  const thumbnailFile = req.files.thumbnail[0];

  // Upload video and thumbnail to Cloudinary
  const videoUpload = await uploadOnCloudinary(videoFile.path, {
    resource_type: "video",
    folder: "videos",
  });
  const thumbnailUpload = await uploadOnCloudinary(thumbnailFile.path, {
    folder: "thumbnails",
  });

  // Create video document (using dummy duration for now)
  const newVideo = await Video.create({
    videoFile: videoUpload.secure_url,
    thumbnail: thumbnailUpload.secure_url,
    title,
    description,
    duration: 60, // dummy duration in seconds
    owner: req.user._id,
    isPublished: true,
  });

  return res.json(
    new ApiResponse(true, "Video published successfully", newVideo)
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // validate ObjectId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // find video by ID
  const video = await Video.findById(videoId).populate(
    "owner",
    "fullName username avatar"
  );

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res.json(new ApiResponse(true, "Video fetched successfully", video));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  // Validate videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Find the video
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Only the owner can update
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this video");
  }

  // Update fields if provided
  if (title) video.title = title;
  if (description) video.description = description;

  // Handle thumbnail upload if new one provided
  if (req.file) {
    const thumbnailUpload = await uploadOnCloudinary(req.file.path, {
      folder: "thumbnails",
    });
    video.thumbnail = thumbnailUpload.secure_url;
  }

  await video.save();

  return res.json(new ApiResponse(true, "Video updated successfully", video));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Find the video
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Only owner can delete
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this video");
  }

  // Remove video from DB
  await Video.findByIdAndDelete(videoId);

  return res.json(new ApiResponse(true, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to toggle this video");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res.json(
    new ApiResponse(true, "Publish status updated successfully", video)
  );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
