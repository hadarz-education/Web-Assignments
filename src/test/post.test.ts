import request from "supertest";
import appInit from "../server";
import mongoose from "mongoose";
import Post, { IPost } from "../models/post";
import { Express } from "express";
import User, { IUser } from "../models/user";

// Define hard-coded text for the post objects
type User = IUser & {
  accessToken?: string;
  refreshToken?: string;
};
const testUser: User = {
  email: "user@test.com",
  password: "test",
  username: "test"
};

const newPost = {
  title: "Test Post",
  content: "Test Content",
  sender: "Test Sender"
};

const updatedPost = {
  title: "Updated Title",
  content: "Updated Content",
  sender: "Updated Sender"
};

const invalidPost = {
  title: "",
  content: "Test Content",
  sender: "Test Sender"
};

const invalidId = "12345";

let app: Express;
beforeAll(async () => {
  console.log("Jest starting!");
  app = await appInit();

  await Post.deleteMany();
  await User.deleteMany();

  await request(app).post("/auth/register").send(testUser);
  const res = await request(app).post("/auth/login").send(testUser);
  testUser.accessToken = res.body.accessToken;
  testUser._id = res.body._id;
  expect(testUser.accessToken).toBeDefined();
});

afterAll(async () => {
  console.log("Jest completed!");
  await mongoose.connection.close(); // Close the database connection
});

describe("Get Posts Test Suite", () => {
  test("It should respond to the GET method with no posts", async () => {
    const response = await request(app).get("/post");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("It should filter comments by sender", async () => {
    const createdPost = await Post.create(newPost);
    const response = await request(app).get(`/post?sender=${testUser._id}`);
    expect(response.statusCode).toBe(200);

    response.body.forEach((post: IPost) => {
      expect(post.title).toBe(createdPost.title);
      expect(post.content).toBe(createdPost.content);
      expect(post.sender).toBe(testUser._id);
    });
  });

  test("It should handle errors during the get process", async () => {
    const findMock = jest.spyOn(Post, "find").mockImplementation(() => {
      throw new Error();
    });

    const response = await request(app).get("/post");
    expect(response.statusCode).toBe(400);

    findMock.mockRestore();
  });
});

describe("Get Specific Post Test Suite", () => {
  test("It should get a post by ID", async () => {
    const createdPost = await Post.create(newPost);
    const response = await request(app).get(`/post/${createdPost._id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe(createdPost.title);
    expect(response.body.content).toBe(createdPost.content);
    expect(response.body.sender).toBe(createdPost.sender);
  });

  test("It should fail with invalid mongoose ID format", async () => {
    const response = await request(app).get(`/post/${invalidId}`);
    expect(response.statusCode).toBe(400);
  });

  test("It should handle errors during the get process", async () => {
    const findByIdMock = jest.spyOn(Post, "findById").mockImplementation(() => {
      throw new Error();
    });

    const createdPost = await Post.create(newPost);
    const response = await request(app).get(`/post/${createdPost._id}`);
    expect(response.statusCode).toBe(400);

    findByIdMock.mockRestore();
  });
});

describe("Create Posts Test Suite", () => {
  test("It should create a new post", async () => {
    const response = await request(app)
      .post("/post")
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(newPost);
    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe(newPost.title);
    expect(response.body.content).toBe(newPost.content);
    expect(response.body.sender).toBe(testUser._id);
  });

  test("It should fail to create a new post with invalid data", async () => {
    const response = await request(app)
      .post("/post")
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(invalidPost);
    expect(response.statusCode).toBe(400);
  });
});

describe("Update Posts Test Suite", () => {
  test("It should update a post by ID", async () => {
    const createdPost = await Post.create(newPost);
    const response = await request(app)
      .put(`/post/${createdPost._id}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(updatedPost);
    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe(updatedPost.title);
    expect(response.body.content).toBe(updatedPost.content);
    expect(response.body.sender).toBe(updatedPost.sender);
  });

  test("It should return 404 when updating a non-existent post", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .put(`/post/${nonExistentId}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(updatedPost);
    expect(response.statusCode).toBe(404);
  });

  test("It should return 400 for invalid ID format when updating a post", async () => {
    const response = await request(app)
      .put(`/post/${invalidId}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(updatedPost);
    expect(response.statusCode).toBe(400);
  });

  test("It should handle errors during the update process", async () => {
    const findByIdAndUpdateMock = jest
      .spyOn(Post, "findByIdAndUpdate")
      .mockImplementation(() => {
        throw new Error();
      });

    const createdPost = await Post.create(newPost);
    const response = await request(app)
      .put(`/post/${createdPost._id}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(updatedPost);
    expect(response.statusCode).toBe(400);

    findByIdAndUpdateMock.mockRestore();
  });
});

describe("Delete Posts Test Suite", () => {
  test("It should delete a post by ID and return 404 on subsequent GET", async () => {
    const createdPost = await Post.create(newPost);
    const deleteResponse = await request(app)
      .delete(`/post/${createdPost._id}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` });
    expect(deleteResponse.statusCode).toBe(200);

    const getResponse = await request(app).get(`/post/${createdPost._id}`);
    expect(getResponse.statusCode).toBe(404);
  });

  test("It should return 404 when deleting a non-existent post", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .delete(`/post/${nonExistentId}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(updatedPost);
    expect(response.statusCode).toBe(404);
  });

  test("It should return 400 for invalid ID format when deleting a post", async () => {
    const response = await request(app)
      .delete(`/post/${invalidId}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(updatedPost);
    expect(response.statusCode).toBe(400);
  });

  test("It should handle errors during the delete process", async () => {
    const deleteOneMock = jest
      .spyOn(Post, "deleteOne")
      .mockImplementation(() => {
        throw new Error();
      });

    const createdPost = await Post.create(newPost);
    const response = await request(app)
      .delete(`/post/${createdPost._id}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` });
    expect(response.statusCode).toBe(400);

    deleteOneMock.mockRestore();
  });
});
