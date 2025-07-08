import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const App = () => {
  const [email, setEmail] = useState('');
  const [password] = useState(Math.random().toString(36).substring(2));
  const [token, setToken] = useState('');
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const base = 'https://api.mail.tm';
  const intervalRef = useRef();

  useEffect(() => {
    const savedEmail = localStorage.getItem('tempMail');
    const savedToken = localStorage.getItem('tempToken');
    if (savedEmail && savedToken) {
      setEmail(savedEmail);
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    fetchMessages(true);
    setCountdown(15);

    intervalRef.current = setInterval(() => {
      fetchMessages(true);
      setCountdown(15);
    }, 15000);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 15));
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownInterval);
    };
  }, [token]);

  const randomUser = () => 'user' + Math.floor(Math.random() * 100000);

  const createAccountAndLogin = async () => {
    setLoading(true);
    const username = randomUser();
    try {
      const domainRes = await fetch(`${base}/domains`);
      const domainData = await domainRes.json();
      const domain = domainData['hydra:member'][0].domain;
      const fullEmail = `${username}@${domain}`;

      setEmail(fullEmail);
      localStorage.setItem('tempMail', fullEmail);

      await fetch(`${base}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullEmail, password }),
      });

      const loginRes = await fetch(`${base}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullEmail, password }),
      });

      const loginData = await loginRes.json();
      if (!loginData.token) {
        toast.error('Login failed. Try again.');
        return;
      }

      setToken(loginData.token);
      localStorage.setItem('tempToken', loginData.token);

      toast.success('✅ Temp email generated!');
    } catch (err) {
      console.error('Error:', err);
      toast.error('⚠️ Failed to generate email.');
    }
    setLoading(false);
  };

  const fetchMessages = async (isAuto = false) => {
    if (!token) return;

    try {
      const res = await fetch(`${base}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        toast.error('⚠️ Session expired. Please generate a new email.');
        setToken('');
        setEmail('');
        localStorage.removeItem('tempToken');
        localStorage.removeItem('tempMail');
        return;
      }

      const data = await res.json();
      const inbox = data['hydra:member'] || [];

      if (isAuto && inbox.length > messages.length) {
        toast('📬 New mail arrived!', { icon: '✉️' });
      }

      setMessages(inbox);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const fetchMessageContent = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`${base}/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSelectedMessage(data);
    } catch (err) {
      console.error('Error fetching full message:', err);
    }
  };

  const closeModal = () => setSelectedMessage(null);

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    toast.success('📋 Email copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white text-gray-800 font-sans flex flex-col items-center p-4">
      <Toaster position="top-right" />
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl p-6">
        <h1 className="text-3xl font-bold mb-4 text-center text-blue-700">
          📬 Temp Mail Generator
        </h1>

        <div className="flex flex-wrap gap-3 justify-center mb-4">
          <button onClick={createAccountAndLogin} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            {loading ? 'Generating...' : 'Generate New Email'}
          </button>
          {email && (
            <>
              <button onClick={copyEmail} className="px-4 py-2 border rounded border-blue-500 text-blue-600 hover:bg-blue-100">
                Copy Email
              </button>
              <div className="w-auto">
                <button
                  onClick={() => {
                    fetchMessages();
                    setCountdown(15);
                  }}
                  className="px-4 py-2 w-full border rounded border-blue-500 text-blue-600 hover:bg-blue-100 flex justify-center items-center gap-2"
                >
                  🔄 Refresh Inbox <span className="text-sm text-gray-500">({countdown}/15)</span>
                </button>
                <div className="h-1 bg-blue-100 w-full rounded overflow-hidden mt-1">
                  <div
                    className="bg-blue-500 h-full transition-all duration-100"
                    style={{ width: `${((15 - countdown) / 15) * 100}%` }}
                  ></div>
                </div>
              </div>
            </>
          )}
        </div>

        {email && (
          <div className="bg-blue-100 p-3 rounded text-center text-sm font-mono text-blue-900">
            {email}
          </div>
        )}

        <div className="mt-6">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center">No messages yet...</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => fetchMessageContent(msg.id)}
                className="p-4 mb-3 bg-white border border-blue-100 rounded-lg hover:bg-blue-50 cursor-pointer shadow-sm"
              >
                <div className="flex justify-between">
                  <span className="font-semibold text-blue-600">{msg.from?.address}</span>
                  <span className="text-sm text-gray-400">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 text-gray-800 font-medium">{msg.subject}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lg p-6 relative">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-2xl font-bold"
              aria-label="Close"
            >
              &times;
            </button>

            {/* Header: sender and time */}
            <div className="mb-3 border-b pb-2">
              <div className="text-sm text-gray-500 mb-1">
                From: <span className="text-blue-700">{selectedMessage.from?.address}</span>
              </div>
              <div className="text-xs text-gray-400">
                Received: {new Date(selectedMessage.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Subject */}
            <h2 className="text-xl font-semibold text-blue-800 mb-3">{selectedMessage.subject}</h2>

            {/* Message body */}
            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {selectedMessage.text || 'No text content available.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;