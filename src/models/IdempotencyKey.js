const mongoose = require('mongoose');

const idempotencyKeySchema = new mongoose.Schema(
    {
    idempotencyKey: {type: String, required: true},
    organizerEmail: {type: String, required: true, lowercase: true, trim: true},
    requestHash: {type:String, required: true},
    status:{type: String, enum: ['in_progress', 'completed', 'failed'], default: 'in_progress'},
    bookingId: {type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null},
    expiresAt: {type: Date, required: true, default: () => new Date(Date.now() +24 * 60 * 1000)},

    },
    {timestamps: true}
    
);

idempotencyKeySchema.index({idempotencyKey: 1, organizerEmail: 1}, {unique: true});
idempotencyKeySchema.index({expiresAt: 1}, {expireAfetrSeconds: 0});

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);