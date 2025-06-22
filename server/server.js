import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import { Employee, EmployeeLogin, CentreLogin } from "./model.js";
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
    const { employeeId, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await EmployeeLogin.findOne({ $or: [{ email }, { employeeId }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Employee already exists with this email or employee ID" });
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
      status: 'Pending',
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
      return res.status(400).json({ error: `Duplicate value for field: ${field}` });
    }
    
    // Handle MongoDB connection errors
    if (err.name === "MongoNetworkError" || err.name === "MongoServerSelectionError") {
      return res.status(500).json({ error: "Database connection error. Please try again later." });
    }
    
    // Handle other MongoDB errors
    if (err.name === "MongoError") {
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }
    
    res.status(500).json({ error: err.message || "Server error during registration" });
  }
});

// Centre Registration
app.post("/api/centre/register", async (req, res) => {
  try {
    const { username, email, password, centreName, centreCode } = req.body;

    // Check if centre already exists
    const existingCentre = await CentreLogin.findOne({ 
      $or: [{ email }, { username }, { centreCode }] 
    });
    if (existingCentre) {
      return res
        .status(400)
        .json({ error: "Centre already exists with this email, username, or centre code" });
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
      return res.status(400).json({ error: `Duplicate value for field: ${field}` });
    }
    
    // Handle MongoDB connection errors
    if (err.name === "MongoNetworkError" || err.name === "MongoServerSelectionError") {
      return res.status(500).json({ error: "Database connection error. Please try again later." });
    }
    
    // Handle other MongoDB errors
    if (err.name === "MongoError") {
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }
    
    res.status(500).json({ error: err.message || "Server error during registration" });
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
        userType: 'employee'
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
        userType: 'employee'
      },
    });
  } catch (err) {
    console.error("Employee login error:", err);
    
    // Handle MongoDB connection errors
    if (err.name === "MongoNetworkError" || err.name === "MongoServerSelectionError") {
      return res.status(500).json({ error: "Database connection error. Please try again later." });
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
        userType: 'centre'
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
        userType: 'centre'
      },
    });
  } catch (err) {
    console.error("Centre login error:", err);
    
    // Handle MongoDB connection errors
    if (err.name === "MongoNetworkError" || err.name === "MongoServerSelectionError") {
      return res.status(500).json({ error: "Database connection error. Please try again later." });
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
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    if (decoded.userType !== 'employee') {
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
        userType: 'employee'
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
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    if (decoded.userType !== 'centre') {
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
        userType: 'centre'
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
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    if (decoded.userType !== 'centre') {
      return res.status(403).json({ error: "Access denied. Only centers can view center data." });
    }

    // Fetch all centers from centreLogins collection
    const centers = await CentreLogin.find({}).select('-password'); // Exclude password field
    
    res.json(centers);
  } catch (err) {
    console.error("Error fetching centers:", err);
    res.status(500).json({ error: "Failed to fetch centers" });
  }
});

// Get all employees endpoint
app.get("/api/employees", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    if (decoded.userType !== 'centre') {
      return res.status(403).json({ error: "Access denied. Only centers can view employee data." });
    }

    // Fetch all employees from employeeRecords database
    const employees = await Employee.find({});
    
    res.json(employees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    if (err.name === "MongoError") {
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }
    res.status(500).json({ error: err.message || "Server Error while fetching employees" });
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
    const { employeeId, firstName, lastName, email } = req.body;
    // Find the employee login record
    const loginRecord = await EmployeeLogin.findOne({ employeeId });
    if (!loginRecord) {
      return res.status(400).json({ error: "Employee record not found for this ID." });
    }
    // Compare firstName, lastName, and email
    const mismatches = [];
    if (loginRecord.firstName !== firstName) mismatches.push('First name');
    if (loginRecord.lastName !== lastName) mismatches.push('Last name');
    if (loginRecord.email !== email) mismatches.push('Email');
    if (mismatches.length > 0) {
      return res.status(400).json({ error: `${mismatches.join(', ')} do not match our records.` });
    }
    // If all match, proceed to save
    const newEmployee = new Employee(req.body);
    await newEmployee.save();
    res.status(201).json(newEmployee);
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
    if (err.name === "MongoNetworkError" || err.name === "MongoServerSelectionError") {
      return res.status(500).json({ error: "Database connection error. Please try again later." });
    }
    
    // Handle other MongoDB errors
    if (err.name === "MongoError") {
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }
    
    // Generic error fallback
    res.status(500).json({ error: err.message || "An unexpected error occurred while saving employee data" });
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
    if (err.name === "MongoNetworkError" || err.name === "MongoServerSelectionError") {
      return res.status(500).json({ error: "Database connection error. Please try again later." });
    }
    
    // Handle other MongoDB errors
    if (err.name === "MongoError") {
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }
    
    res.status(500).json({ error: err.message || "Server Error while fetching employees" });
  }
});

// Update employee status endpoint
app.put("/api/employees/:id/status", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    if (decoded.userType !== 'centre') {
      return res.status(403).json({ error: "Access denied. Only centers can update employee status." });
    }

    const { id } = req.params;
    const { status, validationNote } = req.body;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { 
        status,
        ...(validationNote && { validationNote })
      },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // If status is being set to Approved, update EmployeeLogin as well
    if (status === 'Approved' && updatedEmployee.employeeId) {
      await EmployeeLogin.findOneAndUpdate(
        { employeeId: updatedEmployee.employeeId },
        { status: 'Approved' }
      );
    }
    // If status is being set to Rejected, update EmployeeLogin as well (set to Pending)
    if (status === 'Rejected' && updatedEmployee.employeeId) {
      await EmployeeLogin.findOneAndUpdate(
        { employeeId: updatedEmployee.employeeId },
        { status: 'Pending' }
      );
    }

    res.json(updatedEmployee);
  } catch (err) {
    console.error("Error updating employee status:", err);
    res.status(500).json({ error: "Failed to update employee status" });
  }
});

// Check onboarding status for an employee
app.get('/api/employee/onboarding-status', async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }
    const record = await Employee.findOne({ employeeId });
    res.json({ onboarded: !!record });
  } catch (err) {
    console.error('Error checking onboarding status:', err);
    res.status(500).json({ error: 'Failed to check onboarding status' });
  }
});

// Get latest employee info by employeeId
app.get('/api/employee/info', async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }
    const employee = await EmployeeLogin.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({
      id: employee._id,
      employeeId: employee.employeeId,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: employee.role,
      status: employee.status,
      userType: 'employee'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employee info' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));