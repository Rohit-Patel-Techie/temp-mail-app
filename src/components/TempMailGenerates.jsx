import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import CustomEmailGenerator from './CustomEmailGenerator';

const base = 'https://api.mail.tm';

const TempMailGenerates = ({
  email,
  token,
  password,
  setEmail,
  setToken,
  setPassword,
}) => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef();

  // Always restore all credentials from localStorage on mount (fix session loss on refresh)
  useEffect(() => {
    const savedEmail = localStorage.getItem('tempMail');
    const savedToken = localStorage.getItem('tempToken');
    const savedPassword = localStorage.getItem('tempPassword');
    if (savedEmail && savedToken && savedPassword) {
      setEmail(savedEmail);
      setToken(savedToken);
      setPassword(savedPassword);
    }
    // eslint-disable-next-line
  }, [setEmail, setToken, setPassword]);

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
    // eslint-disable-next-line
  }, [token]);

  const randomUser = () => 'user' + Math.floor(Math.random() * 100000);

  const createAccountAndLogin = async () => {
    setLoading(true);
    const username = randomUser();
    // Always generate a password and remember it
    const tempPass = Math.random().toString(36).substring(2, 12);
    try {
      const domainRes = await fetch(`${base}/domains`);
      const domainData = await domainRes.json();
      const domain = domainData['hydra:member'][0].domain;
      const fullEmail = `${username}@${domain}`;

      await fetch(`${base}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullEmail, password: tempPass }),
      });

      const loginRes = await fetch(`${base}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullEmail, password: tempPass }),
      });

      const loginData = await loginRes.json();
      if (!loginData.token) {
        toast.error('Login failed. Try again.');
        setLoading(false);
        return;
      }

      setEmail(fullEmail);
      setToken(loginData.token);
      setPassword(tempPass);

      localStorage.setItem('tempMail', fullEmail);
      localStorage.setItem('tempToken', loginData.token);
      localStorage.setItem('tempPassword', tempPass);

      toast.success('✅ Temp email generated!');
      setMessages([]);
      setSelectedMessage(null);
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
        setPassword('');
        localStorage.removeItem('tempToken');
        localStorage.removeItem('tempMail');
        localStorage.removeItem('tempPassword');
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
    if (email) {
      navigator.clipboard.writeText(email).then(() => {
        setCopied(true);
        toast.success('📋 Email copied to clipboard!');
        setTimeout(() => setCopied(false), 1200);
      }).catch(() => {
        setCopied(false);
        toast.error('Failed to copy! Try manually.');
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-100 via-blue-50 to-emerald-100 text-gray-800 font-sans flex flex-col items-center p-4">
      <Toaster position="top-center" toastOptions={{ style: { fontWeight: 'bold', fontSize: 16, background: "#1e1b4b", color: "#f7fafc" } }} />
      <div className="bg-white/80 w-full max-w-xl rounded-2xl shadow-2xl p-6 border border-fuchsia-200">
        <h1 className="text-3xl font-extrabold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-indigo-600 drop-shadow">
          ✨ Temp Mail Generator
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4 w-full">
          <button
            onClick={createAccountAndLogin}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white font-bold rounded shadow hover:from-fuchsia-600 hover:to-indigo-600 transition"
          >
            {loading ? 'Generating...' : 'Generate New Email'}
          </button>
          <CustomEmailGenerator
            onCreate={(newEmail, newToken, newPassword) => {
              setEmail(newEmail);
              setToken(newToken);
              setPassword(newPassword);
              localStorage.setItem('tempMail', newEmail);
              localStorage.setItem('tempToken', newToken);
              localStorage.setItem('tempPassword', newPassword);
              setMessages([]);
              setSelectedMessage(null);
              toast.success('Custom temp email created and logged in!');
            }}
            buttonClass="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-fuchsia-500 text-white font-bold rounded shadow hover:from-teal-600 hover:to-fuchsia-600 transition"
          />
        </div>
        {email && (
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-center w-full mb-4">
            <button
              onClick={copyEmail}
              className="px-4 py-2 rounded shadow font-bold text-white flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-fuchsia-500 hover:from-emerald-600 hover:to-fuchsia-600 min-w-[140px] h-[38px] relative"
            >
              {copied ? (
                <span className="text-emerald-100 font-bold">Copied!</span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16h8a2 2 0 002-2V8m-6 8V8a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2h-6a2 2 0 01-2-2z" /></svg>
                  Copy Email
                </>
              )}
            </button>
            <div className="w-full sm:w-auto">
              <button
                onClick={() => {
                  fetchMessages();
                  setCountdown(15);
                }}
                className="px-4 py-2 w-full border rounded border-fuchsia-400 text-fuchsia-700 font-semibold hover:bg-fuchsia-50 flex justify-center items-center gap-2 transition-all duration-150"
              >
                🔄 Refresh Inbox <span className="text-sm text-gray-500">({countdown}/15)</span>
              </button>
              <div className="h-1 bg-fuchsia-100 w-full rounded overflow-hidden mt-1">
                <div
                  className="bg-fuchsia-500 h-full transition-all duration-100"
                  style={{ width: `${((15 - countdown) / 15) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {email && (
          <div className="bg-gradient-to-r from-fuchsia-200 via-teal-100 to-indigo-200 text-fuchsia-900 p-3 rounded text-center text-sm font-mono border border-fuchsia-200">
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
                className="p-4 mb-3 bg-white/70 border border-fuchsia-100 rounded-lg hover:bg-fuchsia-50/80 cursor-pointer shadow-sm transition-all"
              >
                <div className="flex justify-between">
                  <span className="font-semibold text-fuchsia-700">{msg.from?.address}</span>
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
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lg p-6 relative border-2 border-fuchsia-400">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-fuchsia-500 hover:text-fuchsia-700 text-2xl font-bold"
              aria-label="Close"
            >
              &times;
            </button>

            {/* Header: sender and time */}
            <div className="mb-3 border-b pb-2">
              <div className="text-sm text-gray-500 mb-1">
                From: <span className="text-fuchsia-700">{selectedMessage.from?.address}</span>
              </div>
              <div className="text-xs text-gray-400">
                Received: {new Date(selectedMessage.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Subject */}
            <h2 className="text-xl font-semibold text-fuchsia-800 mb-3">{selectedMessage.subject}</h2>

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

export default TempMailGenerates;