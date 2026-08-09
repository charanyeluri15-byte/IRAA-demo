const mongoose = require('mongoose');
const uri = 'mongodb://127.0.0.1:52460/restaurant-erp';
mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log('Found users:', users.map(u => ({ email: u.email, role: u.role, isActive: u.isActive })));
  
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);
  
  if (users.length > 0) {
    const owner = users.find(u => u.role === 'OWNER');
    if (owner) {
      await db.collection('users').updateOne({ _id: owner._id }, { $set: { passwordHash } });
      console.log('Reset password for ' + owner.email + ' to password123');
    }
  }
  process.exit(0);
}).catch(console.error);
