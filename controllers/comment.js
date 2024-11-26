const Comment = require("../models/comment");
const mongoose = require("mongoose");

const getComments = async (req, res, next) => {
  const filter = req.query;

  try {
    if (filter.sender) {
      const comments = await Comment.find({ sender: filter.sender });
      return res.status(200).json(comments);
    } else if (filter.postId) {
      const comments = await Comment.find({ postId: filter.postId });
      return res.status(200).json(comments);
    } else {
      const comments = await Comment.find();
      return res.status(200).json(comments);
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getCommentById = async (req, res, next) => {
  const id = req.params.id;

  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      const comment = await Comment.findById(id);
      if (comment) {
        res.status(200).json(comment);
      } else {
        res.status(404).json({ message: "Comment not found!" });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(400).json({ message: "Invalid ID format!" });
  }
};

const createComment = async (req, res, next) => {
  try {
    const comment = await Comment.create(req.body);
    res.status(201).json(comment);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

const updateComment = async (req, res, next) => {
  const id = req.params.id;

  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      const comment = await Comment.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      });
      if (comment) {
        res.status(200).json(comment);
      } else {
        res.status(404).json({ message: "Comment not found!" });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(400).json({ message: "Invalid ID format!" });
  }
};

const deleteComment = async (req, res, next) => {
  const id = req.params.id;

  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      const result = await Comment.deleteOne({ _id: id });
      if (result.deletedCount > 0) {
        res.status(200).json({ message: "Comment deleted!" });
      } else {
        res.status(404).json({ message: "Comment not found!" });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(400).json({ message: "Invalid ID format!" });
  }
};

module.exports = {
  getComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment
};
