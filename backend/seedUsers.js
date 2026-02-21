/**
 * seedUsers.js — Run once to create the 4 demo role accounts
 * Usage: node seedUsers.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const USERS = [
    { name: 'Alice Manager', email: 'manager@test.com', password: 'pass123', role: 'fleet_manager', isActive: true },
    { name: 'Bob Dispatcher', email: 'dispatcher@test.com', password: 'pass123', role: 'dispatcher', isActive: true },
    { name: 'Carol Safety', email: 'safety@test.com', password: 'pass123', role: 'safety_officer', isActive: true },
    { name: 'Dave Finance', email: 'finance@test.com', password: 'pass123', role: 'financial_analyst', isActive: true },
    { name: 'Eve Suspended', email: 'suspended@test.com', password: 'pass123', role: 'dispatcher', isActive: false },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        for (const userData of USERS) {
            const existing = await User.findOne({ email: userData.email });
            if (existing) {
                // Update existing user just in case we changed fields
                Object.assign(existing, userData);
                await existing.save();
                console.log(`🔄 Updated: ${userData.email}`);
            } else {
                await User.create(userData);
                console.log(`✅ Created: ${userData.email}  [${userData.role}]`);
            }
        }

        console.log('\n📋 All demo accounts ready! Login with password: pass123');
    } catch (err) {
        console.error('❌ Seed error:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected.');
    }
}

seed();
