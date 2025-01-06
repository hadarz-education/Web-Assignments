import { Request, Response } from "express";
import Post, { IPost } from "../models/post";
import BaseController from "./base";

class PostController extends BaseController<IPost> {
  constructor() {
    super(Post);
  }

  // Override getAll method
  public async getAll(req: Request, res: Response) {
    const filter = req.query;

    try {
      if (filter.sender) {
        const posts = await Post.find({ sender: filter.sender });
        res.status(200).json(posts);
      } else {
        const posts = await Post.find();
        res.status(200).json(posts);
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  public async create(req: Request, res: Response) {
    const userId = req.params.userId;
    const post = {
      ...req.body,
      sender: userId
    };
    req.body = post;
    super.create(req, res);
  }
}

export default new PostController();
