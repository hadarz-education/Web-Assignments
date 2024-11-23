const Posts = require("../models/posts");
const mongoose = require("mongoose");

const getPosts = async (req, res, next) => {
  const filter = req.query;

  try {
    if (filter.sender) {
      const posts = await Posts.find({ sender: filter.sender });
      return res.status(200).json(posts);
    } else {
      const posts = await Posts.find();
      return res.status(200).json(posts);
    }
  } catch {
    return res.status(400).json({ message: error.message });
  }
};

const getPostById = async (req, res, next) => {
  const id = req.params.id;

  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      const post = await Posts.findById(id);
      if (post) {
        res.status(200).json(post);
      } else {
        res.status(404).json({ message: "Post not found" });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(400).json({ message: "Invalid ID format" });
  }
};

const createPost = async (req, res, next) => {
  try {
    const post = await Posts.create(req.body);
    res.status(201).json(post);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

const updatePost = async (req, res, next) => {
  const id = req.params.id;

  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      const post = await Posts.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      });
      if (post) {
        res.status(200).json(post);
      } else {
        res.status(404).json({ message: "Post not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(400).json({ message: "Invalid ID format" });
  }
};

const deletePost = async (req, res, next) => {
  const id = req.params.id;

  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      const result = await Posts.deleteOne({ _id: id });
      if (result.deletedCount > 0) {
        res.status(200).json({ message: "Post deleted" });
      } else {
        res.status(404).json({ message: "Post not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(400).json({ message: "Invalid ID format" });
  }
};

module.exports = { getPosts, getPostById, createPost, updatePost, deletePost };
