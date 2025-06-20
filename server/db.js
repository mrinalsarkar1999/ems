import mongoose from 'mongoose';

const MONGO_URI = "mongodb+srv://mrinal0g:Kannamma121@nodeapi.llb5wjp.mongodb.net/?retryWrites=true&w=majority&appName=NodeAPI"; // IMPORTANT: Replace with your actual MongoDB connection string

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'employeeRecords'
    });
    console.log('MongoDB connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDB; 