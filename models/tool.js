const mongoose = require('mongoose');
const serviceAssignment = require('./serviceAssignment');

const toolSchema = new mongoose.Schema({

    serialNumber: {
        type: String,
        upperCase: true,
        required: false,
        maxLength: 20,
        unique: true
    },
    partNumber: {
        type: String,
        upperCase: true,
        maxLength: 20
    },
    barcode: {
        type: Number,
        maxLength: 10
    },
    status: {
        type: String,
        upperCase: true,
        required: true,
        maxLength: 20,
        default: 'CI - In Stock'
    },
    serviceAssignment: {
        type: String,
        upperCase: true,
    },
    description: {
        type: String,
        maxLength: 128
    },
    manufacturer: {
        type: String,
        maxLength: 28,
        trim: true,
    },
    archived: {
        type: Boolean,
        default: false
    },
    createdBy: {
        ref: 'User',
        type: mongoose.Schema.Types.ObjectId
    },
    updatedBy: {
        ref: 'User',
        type: mongoose.Schema.Types.ObjectId
    },
    image: {
        type: String,
    },
},
    {
    timestamps: true,
    strict: false
});


toolSchema.findAll = function (callback) { return this.model('tool').find({}, callback); }

const Tool = mongoose.model('tool', toolSchema)

module.exports = Tool