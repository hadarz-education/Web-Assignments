import request from "supertest";
import appInit from "../server";
import mongoose from "mongoose";
import { Express } from "express";
import User, { IUser } from "../models/user";
import Post from "../models/post";
import * as Auth from "../controllers/auth";
const baseUrl = "/auth";

type User = IUser & {
  accessToken?: string;
  refreshToken?: string;
};

const testUser: User = {
  email: "user@test.com",
  password: "test",
  username: "test"
};

let app: Express;
beforeAll(async () => {
  console.log("Jest starting!");
  app = await appInit();
  await User.deleteMany();
  await Post.deleteMany();
});

afterAll(async () => {
  console.log("Jest completed!");
  await mongoose.connection.close(); // Close the database connection
});

describe("Auth Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("Auth test register", async () => {
    const response = await request(app)
      .post(`${baseUrl}/register`)
      .send(testUser);
    expect(response.status).toBe(200);
  });

  test("Auth test register user with only email", async () => {
    const response = await request(app)
      .post(`${baseUrl}/register`)
      .send({ email: testUser.email });
    expect(response.status).not.toBe(200);
  });

  test("Auth test login", async () => {
    const response = await request(app).post(`${baseUrl}/login`).send(testUser);
    expect(response.status).toBe(200);
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;
    testUser._id = response.body._id;

    expect(testUser.accessToken).toBeDefined();
    expect(testUser.refreshToken).toBeDefined();
    expect(testUser._id).toBeDefined();
  });

  test("Auth test two access tokens are not the same", async () => {
    const response = await request(app).post(`${baseUrl}/login`).send(testUser);
    expect(response.status).toBe(200);
    expect(response.body.accessToken).not.toBe(testUser.accessToken);
  });

  test("Auth test login with invalid email", async () => {
    const response = await request(app)
      .post(`${baseUrl}/login`)
      .send({ email: "invalid", password: testUser.password });
    expect(response.status).not.toBe(200);
  });

  test("Auth test login with invalid password", async () => {
    const response = await request(app)
      .post(`${baseUrl}/login`)
      .send({ email: testUser.email, password: "invalid" });
    expect(response.status).not.toBe(200);
  });

  test("should return 500 if generateToken returns null", async () => {
    const generateToken = jest.spyOn(Auth, "generateToken");
    generateToken.mockReturnValueOnce(undefined);

    const response = await request(app).post(`${baseUrl}/login`).send(testUser);

    expect(response.status).toBe(500);
    expect(response.text).toBe("Internal Server Error");
  });

  test("Auth test upload post", async () => {
    const response = await request(app)
      .post("/post")
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send({
        title: "Test Post",
        content: "Test Content",
        sender: testUser._id
      });
    expect(response.statusCode).toBe(201);
  });

  test("Refresh Token Test", async () => {
    const response = await request(app)
      .post(`${baseUrl}/refresh`)
      .send({ refreshToken: testUser.refreshToken });
    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;
  });

  test("Logout Test with invalid token", async () => {
    const response = await request(app)
      .post("/auth/logout")
      .send({ refreshToken: "invalid" });
    expect(response.status).not.toBe(200);
  });

  test("Logout And Refresh Token", async () => {
    const logoutResponse = await request(app)
      .post("/auth/logout")
      .send({ refreshToken: testUser.refreshToken });
    expect(logoutResponse.status).toBe(200);

    const refreshResponse = await request(app)
      .post(`${baseUrl}/refresh`)
      .send({ refreshToken: testUser.refreshToken });
    expect(refreshResponse.status).not.toBe(200);
  });

  test("Refresh Token Multiple Usage", async () => {
    const loginResponse = await request(app)
      .post(`${baseUrl}/login`)
      .send(testUser);
    expect(loginResponse.status).toBe(200);

    testUser.accessToken = loginResponse.body.accessToken;
    testUser.refreshToken = loginResponse.body.refreshToken;

    const firstRefresh = await request(app)
      .post(`${baseUrl}/refresh`)
      .send({ refreshToken: testUser.refreshToken });
    expect(firstRefresh.status).toBe(200);
    const newRefreshToken = firstRefresh.body.refreshToken;

    const secondResponse = await request(app)
      .post(`${baseUrl}/refresh`)
      .send({ refreshToken: testUser.refreshToken });
    expect(secondResponse.status).not.toBe(200);

    const thirdResponse = await request(app)
      .post(`${baseUrl}/refresh`)
      .send({ refreshToken: newRefreshToken });
    expect(thirdResponse.status).not.toBe(200);
  });

  test("should return 500 if TOKEN_SECRET is not set in generateToken", async () => {
    const originalTokenSecret = process.env.TOKEN_SECRET;
    delete process.env.TOKEN_SECRET;

    const response = await request(app).post(`${baseUrl}/login`).send(testUser);

    expect(response.status).toBe(500);
    expect(response.text).toBe("Internal Server Error");

    process.env.TOKEN_SECRET = originalTokenSecret;
  });

  test("should return 401 if Authorization header is missing in authMiddleware", async () => {
    const response = await request(app).post("/post").send({
      title: "Test Post",
      content: "Test Content",
      sender: testUser._id
    });

    expect(response.status).toBe(401);
    expect(response.text).toBe("Access Denied");
  });

  test("should return 401 if token is invalid in authMiddleware", async () => {
    const response = await request(app)
      .post("/post")
      .set("Authorization", "Bearer invalid-token")
      .send({
        title: "Test Post",
        content: "Test Content",
        sender: testUser._id
      });

    expect(response.status).toBe(401);
    expect(response.text).toBe("Access Denied");
  });

  test("should return 400 if refreshToken is missing in logout", async () => {
    const response = await request(app).post(`${baseUrl}/logout`).send({});

    expect(response.status).toBe(400);
    expect(response.text).toBe("Missing Refresh Token");
  });

  test("should return 400 if refreshToken is missing in logout", async () => {
    const response = await request(app).post(`${baseUrl}/logout`).send({
      refreshToken: testUser.refreshToken
    });

    expect(response.status).toBe(400);
  });

  test("should return 401 if refreshToken is invalid in logout", async () => {
    const response = await request(app)
      .post(`${baseUrl}/logout`)
      .send({ refreshToken: "invalid-token" });

    expect(response.status).toBe(401);
    expect(response.text).toBe("Invalid Refresh Token");
  });

  test("should return 404 user is not found in refresh", async () => {
    jest.spyOn(User, "findOne").mockResolvedValue(null);

    const response = await request(app)
      .post(`${baseUrl}/refresh`)
      .send({ refreshToken: testUser.refreshToken });

    expect(response.status).toBe(404);
  });

  test("should return 404 if the user is not found in logout", async () => {
    jest.spyOn(User, "findOne").mockResolvedValue(null);

    const response = await request(app)
      .post("/logout")
      .send({ refreshToken: testUser.refreshToken });

    expect(response.status).toBe(404);
  });

  test("should handle errors in user.save and return 500 in Logout", async () => {
    const userMock = {
      _id: testUser._id,
      refreshTokens: [testUser.refreshToken],
      save: jest.fn().mockRejectedValue(new Error("Database Save Error")) // Mock save to throw an error
    };
    jest.spyOn(User, "findOne").mockResolvedValue(userMock);

    const response = await request(app)
      .post(`${baseUrl}/logout`)
      .send({ refreshToken: testUser.refreshToken });

    expect(response.status).toBe(500);
  });

  test("should handle errors in user.save and return 500 in Login", async () => {
    const userMock = {
      _id: testUser._id,
      refreshTokens: [testUser.refreshToken],
      save: jest.fn().mockRejectedValue(new Error("Database Save Error")) // Mock save to throw an error
    };
    jest.spyOn(User, "findOne").mockResolvedValue(userMock);

    const response = await request(app)
      .post(`${baseUrl}/login`)
      .send({ refreshToken: testUser.refreshToken });

    expect(response.status).toBe(500);
  });

  test("should handle errors in user.save and return 500 in refresh", async () => {
    const userMock = {
      _id: testUser._id,
      refreshTokens: [testUser.refreshToken],
      save: jest.fn().mockRejectedValue(new Error("Database Save Error")) // Mock save to throw an error
    };
    jest.spyOn(User, "findOne").mockResolvedValue(userMock);

    const response = await request(app)
      .post(`${baseUrl}/refresh`)
      .send({ refreshToken: testUser.refreshToken });

    expect(response.status).toBe(500);
  });

  test("should return 400 if refreshToken is missing in refresh", async () => {
    const response = await request(app).post(`${baseUrl}/refresh`).send({});

    expect(response.status).toBe(400);
    expect(response.text).toBe("Missing Refresh Token");
  });

  test("should return 401 if refreshToken is invalid in refresh", async () => {
    const response = await request(app)
      .post(`${baseUrl}/refresh`)
      .send({ refreshToken: "invalid-token" });

    expect(response.status).toBe(401);
    expect(response.text).toBe("Invalid Token");
  });

  test("should test refresh when generate token return undefined", async () => {
    const generateToken = jest.spyOn(Auth, "generateToken");
    generateToken.mockReturnValueOnce(undefined);

    const userMock = {
      _id: testUser._id,
      refreshTokens: [testUser.refreshToken],
      save: jest.fn().mockRejectedValue(true)
    };
    jest.spyOn(User, "findOne").mockResolvedValue(userMock);

    const response = await request(app)
      .post(`${baseUrl}/refresh`)
      .send({ refreshToken: testUser.refreshToken });

    expect(response.status).toBe(500);
  });

  test("should return 500 if TOKEN_SECRET is not set in refresh", async () => {
    const originalTokenSecret = process.env.TOKEN_SECRET;
    delete process.env.TOKEN_SECRET;

    const response = await request(app)
      .post(`${baseUrl}/refresh`)
      .send({ refreshToken: testUser.refreshToken });

    expect(response.status).toBe(500);
    expect(response.text).toBe("Internal Server Error");

    process.env.TOKEN_SECRET = originalTokenSecret;
  });

  test("should return 500 if TOKEN_SECRET is not set in logout", async () => {
    const originalTokenSecret = process.env.TOKEN_SECRET;
    delete process.env.TOKEN_SECRET;

    const response = await request(app)
      .post(`${baseUrl}/logout`)
      .send({ refreshToken: testUser.refreshToken });

    expect(response.status).toBe(500);
    expect(response.text).toBe("Internal Server Error");

    process.env.TOKEN_SECRET = originalTokenSecret;
  });

  test("should return 500 if TOKEN_SECRET is not set in Auth Middleware", async () => {
    const originalTokenSecret = process.env.TOKEN_SECRET;
    delete process.env.TOKEN_SECRET;

    const response = await request(app)
      .post("/post")
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send({
        title: "Test Post",
        content: "Test Content",
        sender: testUser._id
      });
    expect(response.statusCode).toBe(500);

    process.env.TOKEN_SECRET = originalTokenSecret;
  });

  // jest.setTimeout(10000);
  // test("timeout on access token", async () => {
  //   const loginResponse = await request(app)
  //     .post(`${baseUrl}/login`)
  //     .send(testUser);
  //   testUser.accessToken = loginResponse.body.accessToken;
  //   testUser.refreshToken = loginResponse.body.refreshToken;

  //   expect(loginResponse.status).toBe(200);
  //   expect(testUser.accessToken).toBeDefined();
  //   expect(testUser.refreshToken).toBeDefined();

  //   await new Promise((resolve) => setTimeout(resolve, 6000));

  //   const failedResponse = await request(app)
  //     .post("/post")
  //     .set({
  //       Authorization: `Bearer ${testUser.accessToken}`
  //     })
  //     .send({
  //       title: "Test Post",
  //       content: "Test Content",
  //       sender: testUser._id
  //     });

  //   expect(failedResponse.status).not.toBe(201);

  //   const refreshResponse = await request(app).post(`${baseUrl}/refresh`).send({
  //     refreshToken: testUser.refreshToken
  //   });
  //   expect(refreshResponse.status).toBe(200);
  //   testUser.accessToken = refreshResponse.body.accessToken;
  //   testUser.refreshToken = refreshResponse.body.refreshToken;

  //   expect(refreshResponse.status).toBe(200);
  //   expect(testUser.accessToken).toBeDefined();
  //   expect(testUser.refreshToken).toBeDefined();

  //   const response = await request(app)
  //     .post("/post")
  //     .set({
  //       Authorization: `Bearer ${testUser.accessToken}`
  //     })
  //     .send({
  //       title: "Test Post",
  //       content: "Test Content",
  //       sender: testUser._id
  //     });

  //   expect(response.status).toBe(201);
  // });
});
