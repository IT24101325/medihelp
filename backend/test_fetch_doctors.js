const jwt = require('jsonwebtoken');
require('dotenv').config();

// Create token for User ID 69f5d4df5624a46f11d65d5a
const token = jwt.sign({ id: '69f5d4df5624a46f11d65d5a' }, process.env.JWT_SECRET, { expiresIn: '7d' });

(async () => {
  try {
    const res = await fetch('http://localhost:4000/api/doctors', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (e) {
    console.error(e);
  }
  
  try {
    const res = await fetch('http://localhost:4000/api/doctors/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const text = await res.text();
    console.log('Status ME:', res.status);
    console.log('Body ME:', text);
  } catch (e) {
    console.error(e);
  }
})();
