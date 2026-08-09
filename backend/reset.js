const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-erp';

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log('Users found:', users.map(u => ({ email: u.email, role: u.role })));
  
  if (users.length > 0) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    await db.collection('users').updateOne({ _id: users[0]._id }, { $set: { passwordHash } });
    console.log('Reset password for ' + users[0].email + ' to password123');
  }
  process.exit(0);
}).catch(console.error);
