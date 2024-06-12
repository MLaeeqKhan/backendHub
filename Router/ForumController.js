// controller files
const express = require("express");
const router = express.Router();
const categories = require("../Models/ForumModels/categoriesSchema");
const Threads = require("../Models/ForumModels/ThreadsSchema");
const replies = require("../Models/ForumModels/Replies");
const developers = require("../Models/ForumModels/DeveloperSchema");
const Reply = require("../Models/ForumModels/Replies");
const cloudinary = require("../Middleware/cloudinay");

router.get("/getcategories", async (req, res) => {
  try {
    const category = await categories.find();
    res.json({ category });
  } catch (error) {
    console.log("error", error);
    res.send(error);
  }
});

router.get("/getThreads", async (req, res) => {
  try {
    const thread = await Threads.find();
    res.json({ thread });
  } catch (error) {
    console.log("error", error);
    res.send(error);
  }
});

router.post("/postReply", async (req, res) => {
  const { ReplyContent, userId, threadID, threadUserID } = req.body;

  console.log("ReplyContent:", ReplyContent);
  console.log("userId:", userId);
  console.log("threadID:", threadID);
  console.log("threadUserID:", threadUserID);

  try {
    if (!ReplyContent) {
      return res.status(422).send("Please Fill Field!");
    }

    const reply = await Reply.create({
      ReplyContent,
      userId,
      threadID,
      threadUserID 
    });

    console.log('reply:', reply);
    res.status(200).send("Reply Posted Successfully");
  } catch (error) {
    console.error("error", error);
    res.status(500).send("postReply: Internal Server error!");
  }
});


router.get("/getReplies", async (req, res) => {
  try {
    const reply = await Reply.find().populate('userId');
    console.log(reply);
    res.json({ reply });
  } catch (error) {
    console.log("error", error);
    res.send(error);
  }
});

// getDeveloper
//controller.js file
router.get("/getDeveloper", async (req, res) => {
  try {
    const developer = await developers.find();
    res.json({ developer });
  } catch (error) {
    console.log("Error:", error);
  }
});

// // Search endpoint

const levenshteinDistance = (a, b) => {
  const distanceMatrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    distanceMatrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    distanceMatrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      distanceMatrix[j][i] = Math.min(
        distanceMatrix[j][i - 1] + 1,
        distanceMatrix[j - 1][i] + 1,
        distanceMatrix[j - 1][i - 1] + indicator
      );
    }
  }

  return distanceMatrix[b.length][a.length];
};

router.get("/search", async (req, res) => {
  const searchText = req.query.text; // Get the search text from the query parameter

  try {
    const allThreads = await Threads.find(); // Retrieve all Threads from the database

    // Filter the Threads based on the search text using Levenshtein distance
    const filteredThreads = allThreads.filter((thread) => {
      const titleDistance = levenshteinDistance(
        searchText.toLowerCase(),
        thread.threadTile.toLowerCase()
      );
      const descDistance = levenshteinDistance(
        searchText.toLowerCase(),
        thread.threadDesc.toLowerCase()
      );

      const titleSimilarity =
        1 -
        titleDistance / Math.max(searchText.length, thread.threadTile.length);
      const descSimilarity =
        1 -
        descDistance / Math.max(searchText.length, thread.threadDesc.length);

      return titleSimilarity >= 0.5 || descSimilarity >= 0.5;
    });

    res.json(filteredThreads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/updateQuestion/:id", async (req, res) => {
  const { id } = req.params;
  const { questionTitle, questionDesc } = req.body;
  try {
    let updateFields = {};
    if (questionTitle) {
      updateFields.questionTile = questionTitle;
    }
    if (questionDesc) {
      updateFields.questionDesc = questionDesc;
    }
    const updatedQuestion = await Threads.findByIdAndUpdate(id, updateFields, {
      new: true,
    });
    res.json({ question: updatedQuestion });
  } catch (error) {
    console.log("error", error);
    res.send(error);
  }
});

// Delete a thread by ID
router.delete("/deleteThread/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await Threads.deleteOne({ _id: id });
    res.sendStatus(204); // No Content
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete replies by thread ID
router.delete("/deleteReplies/:threadID", async (req, res) => {
  const { threadID } = req.params;
  console.log("threadID:", threadID);
  try {
    await replies.deleteMany({ threadID: threadID });
    res.sendStatus(204); // No Content
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// update reply status
router.put("/updateReply/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updatedReply = await replies.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    res.json({ reply: updatedReply });
  } catch (error) {
    console.log("error", error);
    res.send(error);
  }
});

// Update developer profile
const updateProfile = async (req, res) => {
  try {
    // Get the developer's user ID from the authenticated user
    const userID = req.user.id;

    // Find the developer in the database based on the user ID
    const developer = await developers.findOneAndUpdate(
      { userID },
      req.body.developerData,
      { new: true }
    );

    if (!developer) {
      return res.status(404).json({ message: "Developer not found." });
    }

    res
      .status(200)
      .json({ message: "Developer profile updated successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update developer profile." });
  }
};

// Multer configuration
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post(
  "/postQuestion",
  upload.fields([{ name: "multipleImages", maxCount: 12 }]),
  async (req, res) => {
    const { title, userId, description } = req.body;
    const multipleImages = req.files["multipleImages"] || [];

    console.log("title:", title);
    console.log("userId:", userId);
    console.log("description:", description);
    console.log("multipleImages:", multipleImages);
    try {
      if (!title || !description || !multipleImages) {
        return res.status(422).send("Please Fill All Fields!");
      }
      const multipleImagesResults = await Promise.all(
        multipleImages.map(async (file) => {
          const res = await cloudinary.uploader.upload(file.path, {
            folder: "products",
          });
          return {
            public_id: res.public_id,
            url: res.secure_url,
          };
        })
      );

      const product = await Threads.create({
        multipleImages: multipleImagesResults,
        userId,
        title,
        description,
      });

      res.status(200).send("Question Posted Successfully");
    } catch (error) {
      console.error("error", error);
      res.status(500).send("postQuestion: Internal Server error!");
    }
  }
);

router.get("/getQuestion", async (req, res) => {
  try {
    const questions = await Threads.find();
    res.json({ questions });
  } catch (error) {
    console.log("error", error);
    res.send(error);
  }
});

module.exports = router;
