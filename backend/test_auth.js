(async () => {
  try {
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hiruni@gmail.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log('Token:', loginData.token);
    const token = loginData.token;
    
    const profileRes = await fetch('http://localhost:4000/api/doctors/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const profileData = await profileRes.json();
    console.log('Profile Response:', profileRes.status, profileData);
  } catch (e) {
    console.error('Error:', e);
  }
})();
