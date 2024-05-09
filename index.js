const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("assignment6-relief-fund");
    const fundCollection = db.collection("supplies");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await fundCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await fundCollection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    // WRITE YOUR CODE HERE
    // ==============================================================
    app.post("/create-supply", async (req, res) => {
      const supply = req.body;
      const result = await fundCollection.insertOne(supply);
      res.status(201).json({
        success: true,
        message: "Supplies created successfully",
        result,
      });
    });

    app.get("/supplies", async (req, res) => {
      const query = {};
      const result = await fundCollection.find(query);
      // console.log(result);
      const supplies = await result.toArray();
      res.status(200).json({
        success: true,
        message: "All Supplies Fetched Successfully!",
        data: supplies,
      });
    });

    app.get("/relief-goods/:id", async (req, res) => {
      try {
        const id = req.params.id;

        // Check if id is a valid ObjectId
        if (!ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid ID" });
        }

        const result = await fundCollection.findOne({ _id: new ObjectId(id) });

        if (!result) {
          return res
            .status(404)
            .json({ success: false, message: "Relief not found" });
        }

        // console.log(result);
        res.status(200).json({
          success: true,
          message: "Single Relief Fetched Successfully!",
          result,
        });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.delete("/supplies/:id", async (req, res) => {
      const id = req.params.id;
      const result = await fundCollection.deleteOne({ _id: new ObjectId(id) });
      // console.log(result);
      res.status(200).json({
        success: true,
        message: " Supplies Deleted Successfully!",
        result,
      });
    });

    // status update
    app.put("/supplies/:id", async (req, res) => {
      const id = req.params.id;
      const supply = req.body;

      // Construct update document dynamically based on the fields in the request body
      const updateDoc = { $set: {} };

      if (supply.title) {
        updateDoc.$set.title = supply.title;
      }
      if (supply.category) {
        updateDoc.$set.category = supply.category;
      }
      if (supply.amount) {
        updateDoc.$set.amount = supply.amount;
      }

      // Construct filter to identify the document to be updated
      const filter = { _id: new ObjectId(id) };

      try {
        const result = await fundCollection.updateOne(filter, updateDoc);
        res.status(200).json({
          success: true,
          message: " Single Supply Updated Successfully!",
          result,
        });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
