import React, { useState } from 'react';
import TempMailGenerates from './components/TempMailGenerates';
import AdminPanel from './components/AdminPanel';
import toast from 'react-hot-toast';

// Shared login logic for mail.tm API
const base = 'https://api.mail.tm';
const loginToMailTm = async (email, password, onSuccess) => {
  try {
    const loginRes = await fetch(`${base}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: email, password }),
    });
    if (!loginRes.ok) {
      toast.error('Login failed.');
      return;
    }
    const loginData = await loginRes.json();
    if (!loginData.token) {
      toast.error('Login failed.');
      return;
    }
    toast.success(`✅ Logged in as ${email}`);
    if (onSuccess) onSuccess(email, loginData.token, password);
  } catch (err) {
    console.error('Login error:', err);
    toast.error('Error during login.');
  }
};

const App = () => {
  // State for current session
  const [showAdmin, setShowAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');

  // Handler for direct login from admin panel
  const handleAdminUserLogin = (userEmail, userPassword) => {
    loginToMailTm(userEmail, userPassword, (newEmail, newToken, newPassword) => {
      setEmail(newEmail);
      setToken(newToken);
      setPassword(newPassword);
      setShowAdmin(false); // Optionally close Admin Panel
    });
  };

  return (
    <>
      <TempMailGenerates
        email={email}
        token={token}
        password={password}
        setEmail={setEmail}
        setToken={setToken}
        setPassword={setPassword}
      />
      <button
        onClick={() => setShowAdmin(true)}
        className="fixed top-4 right-4 px-3 py-2 bg-gray-800 text-white rounded z-50"
      >
        Show Admin Panel
      </button>
      {showAdmin && (
        <AdminPanel
          onClose={() => setShowAdmin(false)}
          onLoginUser={handleAdminUserLogin}
        />
      )}
    </>
  );
};

export default App;