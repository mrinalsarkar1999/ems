import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import {
  Employee,
  EmployeeLogin,
  CentreLogin,
  AdminLogin,
  Attendance,
} from "./model.js";
import multer from "multer";
import AWS from "aws-sdk";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();

// Check for required environment variables
if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.S3_BUCKET
) {
  console.error("Required AWS environment variables are not set");
  process.exit(1);
}

// AWS S3 configuration from environment variables
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const S3_BUCKET = process.env.S3_BUCKET;

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// Connect Database
connectDB();

// Init Middleware
app.use(cors());
app.use(express.json({ extended: false }));

app.get("/", (req, res) => res.send("API Running"));

// Authentication Routes

// Employee Registration
app.post("/api/employee/register", async (req, res) => {
  try {
    const { employeeId, email, password, firstName, lastName, centerCode } =
      req.body;

    // Check if user already exists
    const existingUser = await EmployeeLogin.findOne({
      $or: [{ email }, { employeeId }],
    });
    if (existingUser) {
      return res.status(400).json({
        error: "Employee already exists with this email or employee ID",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new employee login
    const newEmployeeLogin = new EmployeeLogin({
      employeeId,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      centerCode,
      status: "Pending",
    });

    await newEmployeeLogin.save();
    res.status(201).json({ message: "Employee registered successfully" });
  } catch (err) {
    console.error("Employee registration error:", err);

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ error: messages.join(", ") });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res
        .status(400)
        .json({ error: `Duplicate value for field: ${field}` });
    }

    // Handle MongoDB connection errors
    if (
      err.name === "MongoNetworkError" ||
      err.name === "MongoServerSelectionError"
    ) {
      return res
        .status(500)
        .json({ error: "Database connection error. Please try again later." });
    }

    // Handle other MongoDB errors
    if (err.name === "MongoError") {
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }

    res
      .status(500)
      .json({ error: err.message || "Server error during registration" });
  }
});

// Centre Registration
app.post("/api/centre/register", async (req, res) => {
  try {
    const { username, email, password, centreName, centreCode } = req.body;

    // Check if centre already exists
    const existingCentre = await CentreLogin.findOne({
      $or: [{ email }, { username }, { centreCode }],
    });
    if (existingCentre) {
      return res.status(400).json({
        error:
          "Centre already exists with this email, username, or centre code",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new centre login
    const newCentreLogin = new CentreLogin({
      username,
      email,
      password: hashedPassword,
      centreName,
      centreCode,
    });

    await newCentreLogin.save();
    res.status(201).json({ message: "Centre registered successfully" });
  } catch (err) {
    console.error("Centre registration error:", err);

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ error: messages.join(", ") });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res
        .status(400)
        .json({ error: `Duplicate value for field: ${field}` });
    }

    // Handle MongoDB connection errors
    if (
      err.name === "MongoNetworkError" ||
      err.name === "MongoServerSelectionError"
    ) {
      return res
        .status(500)
        .json({ error: "Database connection error. Please try again later." });
    }

    // Handle other MongoDB errors
    if (err.name === "MongoError") {
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }

    res
      .status(500)
      .json({ error: err.message || "Server error during registration" });
  }
});

// Employee Login
app.post("/api/employee/login", async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    // Find employee by employeeId
    const employee = await EmployeeLogin.findOne({ employeeId });
    if (!employee) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: employee._id,
        employeeId: employee.employeeId,
        role: employee.role,
        userType: "employee",
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "30m" }
    );

    res.json({
      token,
      user: {
        id: employee._id,
        employeeId: employee.employeeId,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: employee.role,
        status: employee.status,
        userType: "employee",
      },
    });
  } catch (err) {
    console.error("Employee login error:", err);

    // Handle MongoDB connection errors
    if (
      err.name === "MongoNetworkError" ||
      err.name === "MongoServerSelectionError"
    ) {
      return res
        .status(500)
        .json({ error: "Database connection error. Please try again later." });
    }

    // Handle other MongoDB errors
    if (err.name === "MongoError") {
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }

    res.status(500).json({ error: err.message || "Server error during login" });
  }
});

// Centre Login
app.post("/api/centre/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find centre by username
    const centre = await CentreLogin.findOne({ username });
    if (!centre) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, centre.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: centre._id,
        username: centre.username,
        role: centre.role,
        userType: "centre",
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "30m" }
    );

    res.json({
      token,
      user: {
        id: centre._id,
        username: centre.username,
        email: centre.email,
        centreName: centre.centreName,
        centreCode: centre.centreCode,
        role: centre.role,
        userType: "centre",
      },
    });
  } catch (err) {
    console.error("Centre login error:", err);

    // Handle MongoDB connection errors
    if (
      err.name === "MongoNetworkError" ||
      err.name === "MongoServerSelectionError"
    ) {
      return res
        .status(500)
        .json({ error: "Database connection error. Please try again later." });
    }

    // Handle other MongoDB errors
    if (err.name === "MongoError") {
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }

    res.status(500).json({ error: err.message || "Server error during login" });
  }
});

// Token Refresh Endpoints
app.post("/api/employee/refresh", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    if (decoded.userType !== "employee") {
      return res.status(401).json({ error: "Invalid token type" });
    }

    // Find employee
    const employee = await EmployeeLogin.findById(decoded.userId);
    if (!employee) {
      return res.status(401).json({ error: "User not found" });
    }

    // Create new token
    const newToken = jwt.sign(
      {
        userId: employee._id,
        employeeId: employee.employeeId,
        role: employee.role,
        userType: "employee",
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "30m" }
    );

    res.json({ token: newToken });
  } catch (err) {
    console.error("Token refresh error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

app.post("/api/centre/refresh", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    if (decoded.userType !== "centre") {
      return res.status(401).json({ error: "Invalid token type" });
    }

    // Find centre
    const centre = await CentreLogin.findById(decoded.userId);
    if (!centre) {
      return res.status(401).json({ error: "User not found" });
    }

    // Create new token
    const newToken = jwt.sign(
      {
        userId: centre._id,
        username: centre.username,
        role: centre.role,
        userType: "centre",
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "30m" }
    );

    res.json({ token: newToken });
  } catch (err) {
    console.error("Token refresh error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Get all centers endpoint
app.get("/api/centers", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    if (decoded.userType !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Only admins can view center data." });
    }

    // Fetch all centers from centreLogins collection
    const centers = await CentreLogin.find({}).select("-password"); // Exclude password field

    res.json(centers);
  } catch (err) {
    console.error("Error fetching centers:", err);
    res.status(500).json({ error: "Failed to fetch centers" });
  }
});

// Get all employees endpoint
app.get("/api/employees", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    if (decoded.userType !== "centre" && decoded.userType !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Only centers can view employee data." });
    }

    // Fetch all employees from employeeRecords database
    const employees = await Employee.find({});

    res.json(employees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    if (err.name === "MongoError") {
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }
    res
      .status(500)
      .json({ error: err.message || "Server Error while fetching employees" });
  }
});

// File upload endpoint
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileContent = fs.readFileSync(req.file.path);
  const key = `${Date.now()}_${req.file.originalname}`;
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: fileContent,
    ContentType: req.file.mimetype,
  };
  try {
    const data = await s3.upload(params).promise();
    fs.unlinkSync(req.file.path); // Remove file from local uploads folder
    res.json({ url: data.Location, key });
  } catch (err) {
    console.error("S3 upload error:", err);
    res.status(500).json({ error: "Failed to upload file to S3" });
  }
});

// File delete endpoint
app.delete("/api/upload", express.json(), async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: "No file key provided" });
  const params = { Bucket: S3_BUCKET, Key: key };
  try {
    await s3.deleteObject(params).promise();
    res.json({ success: true });
  } catch (err) {
    console.error("S3 delete error:", err);
    res.status(500).json({ error: "Failed to delete file from S3" });
  }
});

// Define Routes
app.post("/api/employees", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    const { email, employeeId, username, firstName, lastName } = req.body;
    const loginRecord = await EmployeeLogin.findOne(
      username ? { username } : { employeeId }
    );
    if (!loginRecord) {
      return res.status(400).json({
        error: "Employee record not found for this username or employee ID.",
      });
    }

    // Only allow employees to edit their own record and only if not approved
    if (decoded.userType === "employee") {
      if (
        decoded.employeeId !== employeeId ||
        loginRecord.status === "Approved"
      ) {
        return res
          .status(403)
          .json({ error: "Access denied. You cannot edit this record." });
      }
    }

    // Admins can edit any record
    // Validate names and email match login record
    const mismatches = [];
    if (loginRecord.firstName !== firstName) mismatches.push("First name");
    if (loginRecord.lastName !== lastName) mismatches.push("Last name");
    if (loginRecord.email !== email) mismatches.push("Email");
    if (mismatches.length > 0) {
      return res
        .status(400)
        .json({ error: `${mismatches.join(", ")} do not match our records.` });
    }

    // Handle both centerCode and centreCode fields
    let centerCode = req.body.centerCode || req.body.centreCode;
    if (!centerCode && (loginRecord.centerCode || loginRecord.centreCode)) {
      centerCode = loginRecord.centerCode || loginRecord.centreCode;
    }
    if (centerCode) {
      // Validate centerCode exists in CentreLogin
      const centreExists = await CentreLogin.findOne({
        centreCode: centerCode,
      });
      if (!centreExists) {
        return res
          .status(400)
          .json({ error: "Invalid Centre Code: No such centre exists." });
      }
      req.body.centerCode = centerCode; // Ensure centerCode is set in the body
    }

    // Upsert (update if exists, insert if not)
    const query = username ? { username } : { employeeId };
    const updatedEmployee = await Employee.findOneAndUpdate(query, req.body, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
    // Also update centerCode in EmployeeLogin
    if (centerCode) {
      await EmployeeLogin.findOneAndUpdate(
        { employeeId: req.body.employeeId },
        { centerCode }
      );
    }
    res.status(201).json(updatedEmployee);
  } catch (err) {
    console.error("Employee creation error:", err);

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ error: messages.join(", ") });
    }

    // Handle duplicate key errors (e.g., unique fields)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res
        .status(400)
        .json({ error: `Duplicate value for field: ${field}` });
    }

    // Handle MongoDB connection errors
    if (
      err.name === "MongoNetworkError" ||
      err.name === "MongoServerSelectionError"
    ) {
      return res
        .status(500)
        .json({ error: "Database connection error. Please try again later." });
    }

    // Handle other MongoDB errors
    if (err.name === "MongoError") {
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }

    // Generic error fallback
    res.status(500).json({
      error:
        err.message ||
        "An unexpected error occurred while saving employee data",
    });
  }
});

// Get all employees
app.get("/api/getemployees", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    console.error("Get employees error:", err);

    // Handle MongoDB connection errors
    if (
      err.name === "MongoNetworkError" ||
      err.name === "MongoServerSelectionError"
    ) {
      return res
        .status(500)
        .json({ error: "Database connection error. Please try again later." });
    }

    // Handle other MongoDB errors
    if (err.name === "MongoError") {
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }

    res
      .status(500)
      .json({ error: err.message || "Server Error while fetching employees" });
  }
});

// Update employee status endpoint
app.put("/api/employees/:id/status", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    if (decoded.userType !== "centre") {
      return res.status(403).json({
        error: "Access denied. Only centers can update employee status.",
      });
    }

    const { id } = req.params;
    const { status, validationNote } = req.body;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      {
        status,
        ...(validationNote && { validationNote }),
      },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // If status is being set to Approved, update EmployeeLogin as well
    if (status === "Approved" && updatedEmployee.employeeId) {
      await EmployeeLogin.findOneAndUpdate(
        { employeeId: updatedEmployee.employeeId },
        { status: "Approved" }
      );
    }
    // If status is being set to Rejected, update EmployeeLogin as well (set to Pending)
    if (status === "Rejected" && updatedEmployee.employeeId) {
      await EmployeeLogin.findOneAndUpdate(
        { employeeId: updatedEmployee.employeeId },
        { status: "Pending" }
      );
    }

    res.json(updatedEmployee);
  } catch (err) {
    console.error("Error updating employee status:", err);
    res.status(500).json({ error: "Failed to update employee status" });
  }
});

// Check onboarding status for an employee
app.get("/api/employee/onboarding-status", async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      return res.status(400).json({ error: "employeeId is required" });
    }
    const record = await Employee.findOne({ employeeId });
    res.json({ onboarded: !!record });
  } catch (err) {
    console.error("Error checking onboarding status:", err);
    res.status(500).json({ error: "Failed to check onboarding status" });
  }
});

// Get latest employee info by employeeId
app.get("/api/employee/info", async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      return res.status(400).json({ error: "employeeId is required" });
    }
    const employee = await EmployeeLogin.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json({
      id: employee._id,
      employeeId: employee.employeeId,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: employee.role,
      status: employee.status,
      userType: "employee",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch employee info" });
  }
});

// Get employee onboarding record by username or employeeId
app.get("/api/employee/record", async (req, res) => {
  try {
    const { username, employeeId } = req.query;
    if (!username && !employeeId) {
      return res
        .status(400)
        .json({ error: "username or employeeId is required" });
    }
    const query = username ? { username } : { employeeId };
    const record = await Employee.findOne(query);
    if (!record) {
      return res.status(404).json({ error: "Employee record not found" });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch employee record" });
  }
});

// Admin Login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { adminId, password } = req.body;

    // Find admin by adminId
    const admin = await AdminLogin.findOne({ adminId });
    if (!admin) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: admin._id,
        adminId: admin.adminId,
        role: admin.role,
        userType: "admin",
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "30m" }
    );

    res.json({
      token,
      user: {
        id: admin._id,
        adminId: admin.adminId,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        userType: "admin",
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res
      .status(500)
      .json({ error: err.message || "Server error during admin login" });
  }
});

// Admin Registration
app.post("/api/admin/register", async (req, res) => {
  try {
    const { adminId, name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await AdminLogin.findOne({
      $or: [{ email }, { adminId }],
    });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ error: "Admin already exists with this email or admin ID" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin login
    const newAdminLogin = new AdminLogin({
      adminId,
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    await newAdminLogin.save();
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    console.error("Admin registration error:", err);
    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ error: messages.join(", ") });
    }
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res
        .status(400)
        .json({ error: `Duplicate value for field: ${field}` });
    }
    // Handle MongoDB connection errors
    if (
      err.name === "MongoNetworkError" ||
      err.name === "MongoServerSelectionError"
    ) {
      return res
        .status(500)
        .json({ error: "Database connection error. Please try again later." });
    }
    // Handle other MongoDB errors
    if (err.name === "MongoError") {
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }
    res
      .status(500)
      .json({ error: err.message || "Server error during admin registration" });
  }
});

// Add after other employee routes
app.delete("/api/employees/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    if (decoded.userType !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Only admins can delete employees." });
    }
    const { id } = req.params;
    // Find the employee record
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    // Remove from Employee collection
    await Employee.findByIdAndDelete(id);
    // Remove from EmployeeLogin collection by employeeId
    await EmployeeLogin.findOneAndDelete({ employeeId: employee.employeeId });
    res.json({ success: true, message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

// Attendance Face & Location Validation
app.post(
  "/api/attendance/validate",
  upload.single("file"),
  async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      if (!latitude || !longitude || !req.file) {
        return res
          .status(400)
          .json({ error: "Missing image or location data" });
      }
      // Geo-fence config (same as attendanceFaceID)
      const AUTHORIZED_LOCATION = [17.483114, 78.320068];
      const GEOFENCE_RADIUS_METERS = 100;
      const userLocation = [parseFloat(latitude), parseFloat(longitude)];
      // Calculate distance (Haversine formula)
      function toRad(x) {
        return (x * Math.PI) / 180;
      }
      function geoDistance(loc1, loc2) {
        const R = 6371000;
        const dLat = toRad(loc2[0] - loc1[0]);
        const dLon = toRad(loc2[1] - loc1[1]);
        const lat1 = toRad(loc1[0]);
        const lat2 = toRad(loc2[0]);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) *
            Math.sin(dLon / 2) *
            Math.cos(lat1) *
            Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      }
      const distance = geoDistance(userLocation, AUTHORIZED_LOCATION);
      const location_ok = distance <= GEOFENCE_RADIUS_METERS;
      // AWS Rekognition setup
      const rekognition = new AWS.Rekognition({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
      });
      // S3 setup
      const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
      });
      const BUCKET_NAME = process.env.S3_BUCKET;
      const FOLDER_NAME = "emp-imges";
      let face_matched = false;
      let matched_key = null;
      let similarity = 0;
      // Read uploaded image
      const imageBuffer = fs.readFileSync(req.file.path);
      // List S3 images
      let files;
      try {
        files = await s3
          .listObjectsV2({ Bucket: BUCKET_NAME, Prefix: FOLDER_NAME + "/" })
          .promise();
      } catch (e) {
        return res.json({
          face_matched: false,
          matched_with: null,
          similarity: 0,
          location_ok,
          distance_m: Math.round(distance * 100) / 100,
          status: `⚠️ S3 error. Location ${
            location_ok ? "ok" : "outside geo-fence"
          }`,
          note: "Check AWS credentials and S3 bucket configuration",
        });
      }
      if (!files.Contents || files.Contents.length === 0) {
        return res.json({
          face_matched: false,
          matched_with: null,
          similarity: 0,
          location_ok,
          distance_m: Math.round(distance * 100) / 100,
          status: `⚠️ No employee photos found in S3. Location ${
            location_ok ? "ok" : "outside geo-fence"
          }`,
          note: "Upload employee photos to S3 bucket for face recognition",
        });
      }
      for (const obj of files.Contents) {
        const key = obj.Key;
        if (key.endsWith(".jpg") || key.endsWith(".png")) {
          try {
            const response = await rekognition
              .compareFaces({
                SourceImage: { S3Object: { Bucket: BUCKET_NAME, Name: key } },
                TargetImage: { Bytes: imageBuffer },
                SimilarityThreshold: 90,
              })
              .promise();
            if (response.FaceMatches && response.FaceMatches.length > 0) {
              similarity = response.FaceMatches[0].Similarity;
              matched_key = key;
              face_matched = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
      let status = "";
      if (face_matched && location_ok)
        status = "✅ Face matched & inside geo-fence";
      else if (face_matched && !location_ok)
        status = "⚠️ Face matched but outside geo-fence";
      else if (!face_matched && location_ok)
        status = "❌ Face not matched but inside geo-fence";
      else status = "❌ Face not matched and outside geo-fence";
      res.json({
        face_matched,
        matched_with: matched_key,
        similarity: Math.round(similarity * 100) / 100,
        location_ok,
        distance_m: Math.round(distance * 100) / 100,
        status,
      });
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
    } catch (err) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: err.message });
    }
  }
);

// Save/Update attendance record
app.post("/api/attendance", async (req, res) => {
  try {
    const {
      employeeId,
      checkIn,
      checkOut,
      status,
      clientDate,
      clientTimezone,
    } = req.body;
    if (!employeeId) {
      return res.status(400).json({ error: "employeeId is required" });
    }

    // Use client's time instead of server time
    const clientTime = new Date();
    const clientDateObj = clientDate
      ? new Date(clientDate)
      : new Date(
          clientTime.getFullYear(),
          clientTime.getMonth(),
          clientTime.getDate()
        );

    console.log(`Client timezone: ${clientTimezone || "Not provided"}`);
    console.log(`Client date: ${clientDateObj.toISOString()}`);
    console.log(`Client time: ${clientTime.toLocaleString()}`);

    // Find existing attendance record for this employee on this date
    let attendanceRecord = await Attendance.findOne({
      employeeId: employeeId,
      date: {
        $gte: clientDateObj,
        $lt: new Date(clientDateObj.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (attendanceRecord) {
      // Update existing record for today
      if (checkIn && checkIn !== false) {
        attendanceRecord.checkIn = new Date(checkIn);
        attendanceRecord.status = "Checked In";
      }

      if (checkOut && checkOut !== false) {
        attendanceRecord.checkOut = new Date(checkOut);
        attendanceRecord.status = "Checked Out";

        // Calculate working hours if we have both check-in and check-out
        if (attendanceRecord.checkIn) {
          const sessionHours =
            (attendanceRecord.checkOut - attendanceRecord.checkIn) /
            (1000 * 60 * 60);
          attendanceRecord.workingHours = sessionHours;
        }
      }

      await attendanceRecord.save();
      console.log(
        `Updated attendance record for employee ${employeeId} on ${clientDateObj.toLocaleDateString()}`
      );
    } else {
      // Create new record for today
      const newRecord = {
        employeeId,
        date: clientDateObj,
        status: "Present",
        workingHours: 0,
      };

      if (checkIn && checkIn !== false) {
        newRecord.checkIn = new Date(checkIn);
        newRecord.status = "Checked In";
      }

      if (checkOut && checkOut !== false) {
        newRecord.checkOut = new Date(checkOut);
        newRecord.status = "Checked Out";
      }

      attendanceRecord = new Attendance(newRecord);
      await attendanceRecord.save();
      console.log(
        `Created new attendance record for employee ${employeeId} on ${clientDateObj.toLocaleDateString()}`
      );
    }

    res.status(201).json(attendanceRecord);
  } catch (err) {
    console.error("Error saving/updating attendance record:", err);
    res.status(500).json({ error: "Failed to save attendance record" });
  }
});

// Employee password reset
app.post("/api/employee/reset-password", async (req, res) => {
  try {
    const { employeeId, newPassword } = req.body;
    if (!employeeId || !newPassword) {
      return res
        .status(400)
        .json({ error: "employeeId and newPassword are required" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await EmployeeLogin.findOneAndUpdate(
      { employeeId },
      { password: hashedPassword },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Centre password reset
app.post("/api/centre/reset-password", async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) {
      return res
        .status(400)
        .json({ error: "username and newPassword are required" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await CentreLogin.findOneAndUpdate(
      { username },
      { password: hashedPassword },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Centre not found" });
    }
    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// In-memory OTP store for demo
const otpStore = { employee: {}, centre: {} };

// Helper to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Employee request reset
app.post("/api/employee/request-reset", async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId)
    return res.status(400).json({ error: "employeeId required" });
  const user = await EmployeeLogin.findOne({ employeeId });
  if (!user) return res.status(404).json({ error: "Employee not found" });
  const otp = generateOTP();
  otpStore.employee[employeeId] = { otp, expires: Date.now() + 10 * 60 * 1000 };
  // Simulate sending OTP via email
  console.log(`OTP for employee ${employeeId} (${user.email}): ${otp}`);
  res.json({
    success: true,
    message: "OTP sent to registered email (simulated)",
  });
});

// Employee verify reset
app.post("/api/employee/verify-reset", async (req, res) => {
  const { employeeId, otp, newPassword } = req.body;
  if (!employeeId || !otp || !newPassword)
    return res.status(400).json({ error: "All fields required" });
  const record = otpStore.employee[employeeId];
  if (!record || record.otp !== otp)
    return res.status(400).json({ error: "Invalid OTP" });
  if (Date.now() > record.expires)
    return res.status(400).json({ error: "OTP expired" });
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const updated = await EmployeeLogin.findOneAndUpdate(
    { employeeId },
    { password: hashedPassword }
  );
  if (!updated) return res.status(404).json({ error: "Employee not found" });
  delete otpStore.employee[employeeId];
  res.json({ success: true, message: "Password reset successful" });
});

// Centre request reset
app.post("/api/centre/request-reset", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "username required" });
  const user = await CentreLogin.findOne({ username });
  if (!user) return res.status(404).json({ error: "Centre not found" });
  const otp = generateOTP();
  otpStore.centre[username] = { otp, expires: Date.now() + 10 * 60 * 1000 };
  // Simulate sending OTP via email
  console.log(`OTP for centre ${username} (${user.email}): ${otp}`);
  res.json({
    success: true,
    message: "OTP sent to registered email (simulated)",
  });
});

// Centre verify reset
app.post("/api/centre/verify-reset", async (req, res) => {
  const { username, otp, newPassword } = req.body;
  if (!username || !otp || !newPassword)
    return res.status(400).json({ error: "All fields required" });
  const record = otpStore.centre[username];
  if (!record || record.otp !== otp)
    return res.status(400).json({ error: "Invalid OTP" });
  if (Date.now() > record.expires)
    return res.status(400).json({ error: "OTP expired" });
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const updated = await CentreLogin.findOneAndUpdate(
    { username },
    { password: hashedPassword }
  );
  if (!updated) return res.status(404).json({ error: "Centre not found" });
  delete otpStore.centre[username];
  res.json({ success: true, message: "Password reset successful" });
});

// Get all attendance records
app.get("/api/attendance", async (req, res) => {
  try {
    const records = await Attendance.find();
    res.json(records);
  } catch (err) {
    console.error("Error fetching attendance records:", err);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
