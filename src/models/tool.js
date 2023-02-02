import { Schema, model } from "mongoose";
// import serviceAssignment from './serviceAssignment';

const toolSchema = new Schema(
  {
    serialNumber: {
      type: String,
      upperCase: true,
      required: false,
      unique: true,
    },
    partNumber: {
      type: String,
      upperCase: true,
    },
    barcode: {
      type: Number,
    },
    status: {
      type: String,
      required: true,
    },
    serviceAssignment: {
      type: String,
      upperCase: true,
    },
    description: {
      type: String,
      maxLength: 128,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      ref: "User",
      type: Schema.Types.ObjectId,
    },
    updatedBy: {
      ref: "User",
      type: Schema.Types.ObjectId,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

toolSchema.findAll = function (callback) {
  return this.model("tool").find({}, callback);
};

const Tool = model("tool", toolSchema);

export default Tool;
