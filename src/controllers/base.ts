import { Request, Response } from "express";
import mongoose, { Model } from "mongoose";

class BaseController<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  // Get all documents
  // Currently being overridden by all of the controllers so it seems like the test isn't covering it
  // public async getAll(req: Request, res: Response) {
  //   try {
  //     const documents = await this.model.find();
  //     res.status(200).json(documents);
  //   } catch (error: any) {
  //     res.status(400).json({ message: error.message });
  //   }
  // }

  // Get a document by ID
  public async getById(req: Request, res: Response) {
    const id = req.params.id;

    if (mongoose.Types.ObjectId.isValid(id)) {
      try {
        const document = await this.model.findById(id);
        if (document) {
          res.status(200).json(document);
        } else {
          res.status(404).json({ message: "Document not found" });
        }
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    } else {
      res.status(400).json({ message: "Invalid ID format" });
    }
  }

  // Create a new document
  public async create(req: Request, res: Response) {
    try {
      const document = await this.model.create(req.body);
      res.status(201).json(document);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  // Update a document by ID
  public async update(req: Request, res: Response) {
    const id = req.params.id;

    if (mongoose.Types.ObjectId.isValid(id)) {
      try {
        const document = await this.model.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true
        });
        if (document) {
          res.status(200).json(document);
        } else {
          res.status(404).json({ message: "Document not found" });
        }
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    } else {
      res.status(400).json({ message: "Invalid ID format" });
    }
  }

  // Delete a document by ID
  public async delete(req: Request, res: Response) {
    const id = req.params.id;

    if (mongoose.Types.ObjectId.isValid(id)) {
      try {
        const result = await this.model.deleteOne({ _id: id });
        if (result.deletedCount > 0) {
          res.status(200).json({ message: "Document deleted" });
        } else {
          res.status(404).json({ message: "Document not found" });
        }
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    } else {
      res.status(400).json({ message: "Invalid ID format" });
    }
  }
}

export default BaseController;
