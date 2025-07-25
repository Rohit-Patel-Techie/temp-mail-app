import React, { useState, useEffect } from 'react';
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

  // Admin login handler: updates both admin and current session
  const handleAdminUserLogin = (userEmail, userPassword) => {
    loginToMailTm(userEmail, userPassword, (newEmail, newToken, newPassword) => {
      setEmail(newEmail);
      setToken(newToken);
      setPassword(newPassword);
      setShowAdmin(false);

      // Save as admin session (for history) and also as current session (for use)
      localStorage.setItem("adminEmail", newEmail);
      localStorage.setItem("adminToken", newToken);
      localStorage.setItem("adminPassword", newPassword);

      localStorage.setItem("currentEmail", newEmail);
      localStorage.setItem("currentToken", newToken);
      localStorage.setItem("currentPassword", newPassword);
    });
  };

  // On mount: always restore from current session
  useEffect(() => {
    const savedEmail = localStorage.getItem("currentEmail");
    const savedToken = localStorage.getItem("currentToken");
    const savedPassword = localStorage.getItem("currentPassword");

    if (savedEmail && savedToken && savedPassword) {
      setEmail(savedEmail);
      setToken(savedToken);
      setPassword(savedPassword);
    }
  }, []);

  return (
    <>
      <TempMailGenerates
        email={email}
        token={token}
        password={password}
        setEmail={setEmail}
        setToken={setToken}
        setPassword={setPassword}
        onSessionChange={(newEmail, newToken, newPassword, type) => {
          // Save both specific and current session
          if (type === "temp") {
            localStorage.setItem("tempMail", newEmail);
            localStorage.setItem("tempToken", newToken);
            localStorage.setItem("tempPassword", newPassword);
          } else if (type === "custom") {
            localStorage.setItem("customTempEmail", newEmail);
            localStorage.setItem("customTempPassword", newPassword);
          }
          // Always set as current session for all
          localStorage.setItem("currentEmail", newEmail);
          localStorage.setItem("currentToken", newToken);
          localStorage.setItem("currentPassword", newPassword);
        }}
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