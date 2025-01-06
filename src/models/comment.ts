import mongoose from "mongoose";

interface IComment {
  content: string;
  sender: string;
  postId: mongoose.Schema.Types.ObjectId;
}

const commentSchema = new mongoose.Schema<IComment>({
  content: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true
  }
});

const Comment = mongoose.model<IComment>("Comment", commentSchema);
export default Comment;
export { IComment };
