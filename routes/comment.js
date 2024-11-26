const express = require("express");
const router = express.Router();

const comment = require("../controllers/comment");

router.get("/", comment.getComments);
router.get("/:id", comment.getCommentById);

router.post("/", comment.createComment);
router.put("/:id", comment.updateComment);
router.delete("/:id", comment.deleteComment);

module.exports = router;
