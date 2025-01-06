import request from "supertest";
import appInit from "../server";
import mongoose from "mongoose";
import Comment, { IComment } from "../models/comment";
import { Express } from "express";
import User, { IUser } from "../models/user";

// Define hard-coded text for the comment objects
type User = IUser & {
  accessToken?: string;
  refreshToken?: string;
};

const testUser: User = {
  email: "user@test.com",
  password: "test",
  username: "test"
};

const newComment = {
  content: "Test Comment",
  sender: "Test Sender",
  postId: new mongoose.Types.ObjectId()
};

const updatedComment = {
  content: "Updated Content",
  sender: "Updated Sender",
  postId: new mongoose.Types.ObjectId()
};

const invalidComment = {
  content: "",
  sender: "Test Sender",
  postId: new mongoose.Types.ObjectId()
};

const invalidId = "12345";

let app: Express;
beforeAll(async () => {
  console.log("Jest starting!");
  app = await appInit();

  await Comment.deleteMany();
  await User.deleteMany();

  await request(app).post("/auth/register").send(testUser);
  const res = await request(app).post("/auth/login").send(testUser);
  testUser.accessToken = res.body.accessToken;
  testUser.refreshToken = res.body.refreshToken;
  testUser._id = res.body._id;
  expect(testUser.accessToken).toBeDefined();
  expect(testUser.refreshToken).toBeDefined();
  expect(testUser._id).toBeDefined();
});

afterAll(async () => {
  console.log("Jest completed!");
  await mongoose.connection.close(); // Close the database connection
});

describe("Get Comments Test Suite", () => {
  test("It should respond to the GET method with no comments", async () => {
    const response = await request(app).get("/comment");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("It should filter comments by sender", async () => {
    const createdComment = await Comment.create(newComment);
    const response = await request(app).get(
      `/comment?sender=${createdComment.sender}`
    );
    expect(response.statusCode).toBe(200);

    response.body.forEach((comment: IComment) => {
      expect(comment.content).toBe(createdComment.content);
      expect(comment.sender).toBe(createdComment.sender);
      expect(comment.postId.toString()).toBe(createdComment.postId.toString());
    });
  });

  test("It should handle errors during the get process", async () => {
    const findMock = jest.spyOn(Comment, "find").mockImplementation(() => {
      throw new Error();
    });

    const response = await request(app).get("/comment");
    expect(response.statusCode).toBe(400);

    findMock.mockRestore();
  });
});

describe("Get Specific Comment Test Suite", () => {
  test("It should get a comment by ID", async () => {
    const createdComment = await Comment.create(newComment);
    const response = await request(app).get(`/comment/${createdComment._id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.content).toBe(createdComment.content);
    expect(response.body.sender).toBe(createdComment.sender);
    expect(response.body.postId.toString()).toBe(
      createdComment.postId.toString()
    );
  });

  test("It should fail with invalid mongoose ID format", async () => {
    const response = await request(app).get(`/comment/${invalidId}`);
    expect(response.statusCode).toBe(400);
  });

  test("It should handle errors during the get process", async () => {
    const findByIdMock = jest
      .spyOn(Comment, "findById")
      .mockImplementation(() => {
        throw new Error();
      });

    const createdComment = await Comment.create(newComment);
    const response = await request(app).get(`/comment/${createdComment._id}`);
    expect(response.statusCode).toBe(400);

    findByIdMock.mockRestore();
  });
});

describe("Create Comments Test Suite", () => {
  test("It should create a new comment", async () => {
    const response = await request(app)
      .post("/comment")
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(newComment);
    expect(response.statusCode).toBe(201);
    expect(response.body.content).toBe(newComment.content);
    expect(response.body.sender).toBe(testUser._id);
    expect(response.body.postId.toString()).toBe(newComment.postId.toString());
  });

  test("It should fail to create a new comment with invalid data", async () => {
    const response = await request(app)
      .post("/comment")
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(invalidComment);
    expect(response.statusCode).toBe(400);
  });
});

describe("Update Comments Test Suite", () => {
  test("It should update a comment by ID", async () => {
    const createdComment = await Comment.create(newComment);
    const response = await request(app)
      .put(`/comment/${createdComment._id}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(updatedComment);
    expect(response.statusCode).toBe(200);
    expect(response.body.content).toBe(updatedComment.content);
    expect(response.body.sender).toBe(updatedComment.sender);
    expect(response.body.postId.toString()).toBe(
      updatedComment.postId.toString()
    );
  });

  test("It should return 404 when updating a non-existent comment", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .put(`/comment/${nonExistentId}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(updatedComment);
    expect(response.statusCode).toBe(404);
  });

  test("It should return 400 for invalid ID format when updating a comment", async () => {
    const response = await request(app)
      .put(`/comment/${invalidId}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(updatedComment);
    expect(response.statusCode).toBe(400);
  });

  test("It should handle errors during the update process", async () => {
    const findByIdAndUpdateMock = jest
      .spyOn(Comment, "findByIdAndUpdate")
      .mockImplementation(() => {
        throw new Error();
      });

    const createdComment = await Comment.create(newComment);
    const response = await request(app)
      .put(`/comment/${createdComment._id}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(updatedComment);
    expect(response.statusCode).toBe(400);

    findByIdAndUpdateMock.mockRestore();
  });
});

describe("Delete Comments Test Suite", () => {
  test("It should delete a comment by ID and return 404 on subsequent GET", async () => {
    const createdComment = await Comment.create(newComment);
    const deleteResponse = await request(app)
      .delete(`/comment/${createdComment._id}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` });
    expect(deleteResponse.statusCode).toBe(200);

    const getResponse = await request(app).get(
      `/comment/${createdComment._id}`
    );
    expect(getResponse.statusCode).toBe(404);
  });

  test("It should return 404 when deleting a non-existent comment", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .delete(`/comment/${nonExistentId}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(updatedComment);
    expect(response.statusCode).toBe(404);
  });

  test("It should return 400 for invalid ID format when deleting a comment", async () => {
    const response = await request(app)
      .delete(`/comment/${invalidId}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` })
      .send(updatedComment);
    expect(response.statusCode).toBe(400);
  });

  test("It should handle errors during the delete process", async () => {
    const deleteOneMock = jest
      .spyOn(Comment, "deleteOne")
      .mockImplementation(() => {
        throw new Error();
      });

    const createdComment = await Comment.create(newComment);
    const response = await request(app)
      .delete(`/comment/${createdComment._id}`)
      .set({ Authorization: `Bearer ${testUser.accessToken}` });
    expect(response.statusCode).toBe(400);

    deleteOneMock.mockRestore();
  });
});
