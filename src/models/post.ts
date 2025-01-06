import mongoose from "mongoose";

interface IPost {
  title: string;
  content: string;
  sender: string;
}

const postSchema = new mongoose.Schema<IPost>({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String
  },
  sender: {
    type: String,
    required: true
  }
});

const Post = mongoose.model<IPost>("Post", postSchema);
export default Post;
export { IPost };
