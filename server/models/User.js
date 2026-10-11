const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["candidate", "recruiter"], default: "candidate" },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    profileId: { type: String, default: null }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.otp;
    delete ret._id;
    return ret;
  }
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = User;
