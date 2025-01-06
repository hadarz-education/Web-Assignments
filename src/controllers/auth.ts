import { NextFunction, Request, Response } from "express";
import User from "../models/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

type Payload = {
  _id: string;
};

const register = async (req: Request, res: Response) => {
  try {
    const password = req.body.password;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: req.body.email,
      password: hashedPassword,
      username: req.body.username
    });

    res.status(200).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      res.status(400).send("Wrong username or password");
      return;
    }

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!validPassword) {
      res.status(400).send("Wrong username or password");
      return;
    }

    const tokens = generateToken(user._id);
    if (!tokens) {
      res.status(500).send("Internal Server Error");
      return;
    }

    if (user.refreshTokens === undefined) {
      user.refreshTokens = [];
    } else {
      user.refreshTokens.push(tokens.refreshToken);
    }
    user.save();

    res.status(200).send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      _id: user._id
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

export const generateToken = (_id: string) => {
  const random = Math.floor(Math.random() * 1000000);
  if (!process.env.TOKEN_SECRET) {
    return;
  }
  const accessToken = jwt.sign({ _id, random }, process.env.TOKEN_SECRET, {
    expiresIn: process.env.TOKEN_EXPIRES
  });

  const refreshToken = jwt.sign({ _id, random }, process.env.TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES
  });

  return { accessToken, refreshToken };
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.header("Authorization");
  const token = authorization && authorization.split(" ")[1];

  if (!token) {
    res.status(401).send("Access Denied");
    return;
  }

  if (!process.env.TOKEN_SECRET) {
    res.status(500).send("Internal Server Error");
    return;
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (error, payload) => {
    if (error) {
      res.status(401).send("Access Denied");
      return;
    }
    req.params.userId = (payload as Payload)._id;
    next();
  });
};

export default {
  register,
  login
};
