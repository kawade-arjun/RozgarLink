const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    level: { type: String, default: "beginner" },
    hours: { type: Number, default: 0 }
  },
  { _id: false }
);

const LearningResourceSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    prerequisites: { type: [String], default: [] },
    courses: { type: [CourseSchema], default: [] }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

LearningResourceSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  }
});

const LearningResource =
  mongoose.models.LearningResource || mongoose.model("LearningResource", LearningResourceSchema);

module.exports = LearningResource;
