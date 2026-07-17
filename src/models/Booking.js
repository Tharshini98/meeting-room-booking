const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema(
    {
        roomId: {type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
        title: {type:String, required: true, trim: true},
        organizerEmail: {type: String, requires: true, trim: true, lowercase: true},
        startTime: {type:Date, required: true},
        endTime: {type: Date, required: true},
        status: {type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed'},
        cancelledAt: {type: Date, default: null},
    },
    {timestamps: true}
);

bookingSchema.index({roomId: 1, status: 1, startTime: 1, endTime:1});

bookingSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        ret.roomId = ret.roomId.toString();
        delete ret._id;
        return ret;
    },
});

module.exports = mongoose.model('Booking', bookingSchema);