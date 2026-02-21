const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    role: {
        type: String,
        enum: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'],
        default: 'dispatcher'
    },
    // Security: account suspension
    isActive: {
        type: Boolean,
        default: true
    },
    // Security: invalidate old tokens after a role change
    lastRoleChange: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Auto-stamp lastRoleChange when role is modified
userSchema.pre('save', async function () {
    if (this.isModified('role') && !this.isNew) {
        this.lastRoleChange = new Date();
    }
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }
});

// Instance method: compare plaintext vs hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
