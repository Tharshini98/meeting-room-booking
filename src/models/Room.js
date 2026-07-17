const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    
    nameLower: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true, min: 1 },
    floor: { type: Number, required: true },
    amenities: { type: [String], default: [] },
    timezone: { type: String, default: 'UTC' },
    
    bookingLockVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

roomSchema.pre('validate', function setNameLower(next) {
  if (this.name) this.nameLower = this.name.trim().toLowerCase();
  next();
});

roomSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.nameLower;
    return ret;
  },
});

module.exports = mongoose.model('Room', roomSchema);