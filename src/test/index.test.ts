import request from "supertest";
import express from "express";
import router from "../routes/index";

const app = express();
app.use("/", router);

describe("Health Check", () => {
  it("should return Hello World!", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.text).toBe("Hello World!");
  });
});
