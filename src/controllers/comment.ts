import { Request, Response } from "express";
import Comment, { IComment } from "../models/comment";
import BaseController from "./base";

class CommentController extends BaseController<IComment> {
  constructor() {
    super(Comment);
  }

  // Override getAll method
  public async getAll(req: Request, res: Response) {
    const filter = req.query;

    try {
      if (filter.sender) {
        const posts = await Comment.find({ sender: filter.sender });
        res.status(200).json(posts);
      } else {
        const posts = await Comment.find();
        res.status(200).json(posts);
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  public async create(req: Request, res: Response) {
    const userId = req.params.userId;
    const comment = {
      ...req.body,
      sender: userId
    };
    req.body = comment;
    super.create(req, res);
  }
}

export default new CommentController();
