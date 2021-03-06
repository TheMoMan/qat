const mongoose = require('mongoose');

const mediationSchema = new mongoose.Schema({
    mediator: { type: 'ObjectId', ref: 'User', required: true },
    comment: { type: String },
    vote: { type: Number, enum: [1, 2, 3] },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Mediation = mongoose.model('Mediation', mediationSchema);

module.exports = Mediation;
