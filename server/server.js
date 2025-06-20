import express from 'express';
import cors from 'cors';
import connectDB from './db.js';
import Employee from './model.js';
import multer from 'multer';
import AWS from 'aws-sdk';
import fs from 'fs';

const app = express();

// AWS S3 configuration (hardcoded)
const s3 = new AWS.S3({
  accessKeyId: 'AKIAXTORPV237ISQBO4A',
  secretAccessKey: '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',
  region: 'us-east-1',
});
const S3_BUCKET = 'ssonboardingfiles';

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Connect Database
connectDB();

// Init Middleware
app.use(cors());
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API Running'));

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
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
    console.error('S3 upload error:', err);
    res.status(500).json({ error: 'Failed to upload file to S3' });
  }
});

// File delete endpoint
app.delete('/api/upload', express.json(), async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'No file key provided' });
  const params = { Bucket: S3_BUCKET, Key: key };
  try {
    await s3.deleteObject(params).promise();
    res.json({ success: true });
  } catch (err) {
    console.error('S3 delete error:', err);
    res.status(500).json({ error: 'Failed to delete file from S3' });
  }
});

// Define Routes
app.post('/api/employees', async (req, res) => {
    try {
        const newEmployee = new Employee(req.body);
        await newEmployee.save();
        res.status(201).json(newEmployee);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all employees
app.get('/api/getemployees', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

const PORT = 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

