import mongoose from "mongoose";

interface IUser {
  username: string;
  email: string;
  password: string;
  refreshTokens?: string[];
  _id?: string;
}

const userSchema = new mongoose.Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  refreshTokens: {
    type: [String],
    default: []
  }
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;
export { IUser };
