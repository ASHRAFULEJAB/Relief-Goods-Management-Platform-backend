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
    origin: "https://relief-fund-management.netlify.app",
    credentials: true,
  })
);
// app.use(
//   cors({
//     origin: "https://relief-fund-management.netlify.app",
//     credentials: true,
//   })
// );

app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  next();
});
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
    const userCollection = db.collection("users");
    const projectsCollection = db.collection("allprojects");

    // User Registration
    app.post("/register", async (req, res) => {
      const { name, email, password, role } = req.body;

      // Check if email already exists
      const existingUser = await userCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      const registeredData = await userCollection.insertOne({
        name,
        email,
        password: hashedPassword,
        role,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        result: registeredData,
      });
    });

    // User Login
    // app.post("/login", async (req, res) => {
    //   const { email, password } = req.body;

    //   // Find user by email
    //   const user = await fundCollection.findOne({ email });
    //   if (!user) {
    //     return res.status(401).json({ message: "Invalid email or password" });
    //   }

    //   // Compare hashed password
    //   const isPasswordValid = await bcrypt.compare(password, user.password);
    //   if (!isPasswordValid) {
    //     return res.status(401).json({ message: "Invalid email or password" });
    //   }

    //   // Generate JWT token
    //   const accesstoken = jwt.sign(
    //     { email: user.email },
    //     process.env.JWT_SECRET,
    //     {
    //       expiresIn: process.env.EXPIRES_IN,
    //     }
    //   );
    //   res.cookie("accesstoken", accesstoken, {
    //     secure: process.env.NODE_ENV === "production",
    //     httpOnly: true,
    //     sameSite: "none",
    //     maxAge: 1000 * 60 * 60 * 24 * 365,
    //   });

    //   res.json({
    //     success: true,
    //     message: "Login successful",
    //     data: {
    //       user,
    //       accesstoken,
    //     },
    //   });
    // });
    // User Login
    app.post("/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await userCollection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token with role information
      const accesstoken = jwt.sign(
        { email: user.email, role: user.role },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.EXPIRES_IN,
        }
      );
      res.cookie("accesstoken", accesstoken, {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 365,
      });

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user,
          accesstoken,
        },
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
    app.get("/projects", async (req, res) => {
      const query = {};
      const result = await projectsCollection.find(query);
      const projects = await result.toArray();
      res.status(200).json({
        success: true,
        message: "All projects Fetched Successfully!",
        data: projects,
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

    // projetcs

    app.delete("/projects/:id", async (req, res) => {
      const id = req.params.id;
      const result = await projectsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.status(200).json({
        success: true,
        message: "Project Deleted Successfully!",
        result,
      });
    });

    app.put("/projects/:id", async (req, res) => {
      const id = req.params.id;
      const project = req.body;

      const updateDoc = { $set: {} };

      if (project.name) {
        updateDoc.$set.name = project.name;
      }
      if (project.description) {
        updateDoc.$set.description = project.description;
      }
      if (project.startDate) {
        updateDoc.$set.startDate = project.startDate;
      }
      if (project.endDate) {
        updateDoc.$set.endDate = project.endDate;
      }
      if (project.status) {
        updateDoc.$set.status = project.status;
      }
      if (project.amountRaised) {
        updateDoc.$set.amountRaised = project.amountRaised;
      }
      if (project.targetAmount) {
        updateDoc.$set.targetAmount = project.targetAmount;
      }

      const filter = { _id: new ObjectId(id) };

      try {
        const result = await projectsCollection.updateOne(filter, updateDoc);
        res.status(200).json({
          success: true,
          message: "Project Updated Successfully!",
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
const authenticateJWT = (req, res, next) => {
  const token = req.cookies.accesstoken;

  if (!token) {
    return res.sendStatus(403);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.sendStatus(403);
    }
    next();
  };
};

app.get(
  "/dashboard/admin",
  authenticateJWT,
  authorizeRoles("admin"),
  (req, res) => {
    res.send("Admin Dashboard");
  }
);

app.get(
  "/dashboard/user",
  authenticateJWT,
  authorizeRoles("user"),
  (req, res) => {
    res.send("User Dashboard");
  }
);
