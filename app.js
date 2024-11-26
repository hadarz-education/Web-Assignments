const express = require("express");
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));

const indexRouter = require("./routes/index");
app.use("/", indexRouter);

const postRouter = require("./routes/post");
app.use("/post", postRouter);

const commentRouter = require("./routes/comment");
app.use("/comment", commentRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
