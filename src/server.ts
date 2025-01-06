import express, { Express } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import indexRouter from "./routes/index";
import postRouter from "./routes/post";
import commentRouter from "./routes/comment";
import authRouter from "./routes/auth";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

dotenv.config();

const db = mongoose.connection;
db.on("error", (error: Error) => console.error(error));
db.once("open", () => console.log("Connected to database"));

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", indexRouter);
app.use("/post", postRouter);
app.use("/comment", commentRouter);
app.use("/auth", authRouter);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Web Dev",
      version: "1.0.0",
      description: "REST server including authentication using JWT"
    },
    servers: [{ url: "http://localhost:3000" }]
  },
  apis: ["./src/routes/*.ts"]
};
const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

const appInit = () => {
  return new Promise<Express>(async (resolve, reject) => {
    if (process.env.DATABASE_URL === undefined) {
      reject("No database URL provided");
    } else {
      await mongoose.connect(process.env.DATABASE_URL);
      resolve(app);
    }
  });
};

export default appInit;
