const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;
//assignment-6-backend-relief-goods.vercel.app
// https://relief-fund-management.netlify.app/

// Middleware
https: app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
// Enable CORS for all requests
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
//   next();
// });

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
    const reliefCollection = db.collection("reliefs");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password,role } = req.body;

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
      const registeredData = await fundCollection.insertOne({
        name,
        email,
        password: hashedPassword,
        role
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        result: registeredData,
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
      const supplies = await result.toArray();
      res.status(200).json({
        success: true,
        message: "All Supplies Fetched Successfully!",
        data: supplies,
      });
    });
    //  relief goods api here
    app.get("/relief-goods", async (req, res) => {
      const query = {};
      const result = await reliefCollection.find(query);
      const reliefs = await result.toArray();
      res.status(200).json({
        success: true,
        message: "All Reliefs Fetched Successfully!",
        data: reliefs,
      });
    });

    app.get("/relief-goods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid ID" });
        }

        const result = await reliefCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!result) {
          return res
            .status(404)
            .json({ success: false, message: "Relief not found" });
        }
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
      res.status(200).json({
        success: true,
        message: " Supplies Deleted Successfully!",
        result,
      });
    });

    app.put("/supplies/:id", async (req, res) => {
      const id = req.params.id;
      const supply = req.body;

      const updateDoc = { $set: {} };

      if (supply.title) {
        updateDoc.$set.title = supply.title;
      }
      if (supply.description) {
        updateDoc.$set.description = supply.description;
      }
      if (supply.amount) {
        updateDoc.$set.amount = supply.amount;
      }

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
