import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  fatherName: { type: String },
  motherName: { type: String },
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

export default mongoose.model('Employee', EmployeeSchema);
