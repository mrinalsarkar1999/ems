import mongoose from 'mongoose';
import { loginDB, employeeDB } from './db.js';

const EmployeeSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  fatherName: { type: String },
  motherName: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  validationNote: { type: String },
  highestQualification: { type: String },
  dobAsPerCertificate: { type: Date },
  dobAsPerCelebration: { type: Date },
  maritalStatus: { type: String, enum: ['', 'Single', 'Married', 'Divorced', 'Widowed'], default: 'Single' },
  spouseName: { type: String },
  spouseDateOfBirth: { type: Date },
  spouseEmail: { type: String },
  bloodGroup: { type: String },
  email: { type: String, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  experience: { type: String },
  currentSalary: { type: Number },
  position: { type: String },
  uanNumber: { type: String },
  esiNumber: { type: String },
  aadharNumber: { type: String },
  namesAsOnAadhar: { type: String },
  panNumber: { type: String },
  namesAsOnPan: { type: String },
  bankAccountNumber: { type: String },
  namesAsPerBankDetails: { type: String },
  bankName: { type: String },
  branchName: { type: String },
  ifscCode: { type: String },
  documents: [
    {
      type: { type: String },
      url: { type: String },
      key: { type: String }
    }
  ]
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
}, { timestamps: true });

// Use employeeDB for Employee model (employeeRecords database)
export const Employee = employeeDB.model('Employee', EmployeeSchema);

// Use loginDB for User model (logins database)
export const User = loginDB.model('User', UserSchema, 'employeeLogins');
