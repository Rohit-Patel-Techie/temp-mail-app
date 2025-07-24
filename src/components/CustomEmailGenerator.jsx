import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { saveUserToFirestore } from './firestore-utils';

const base = 'https://api.mail.tm';

const CustomEmailGenerator = ({ onCreate, buttonClass }) => {
  const [prefix, setPrefix] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [inputError, setInputError] = useState('');
  const [domainList, setDomainList] = useState([]);

  // On mount: fetch domains and restore last used custom email/password
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const res = await fetch(`${base}/domains`);
        if (res.ok) {
          const data = await res.json();
          setDomainList(data['hydra:member'] || []);
          setCustomDomain(data['hydra:member']?.[0]?.domain || '');
        }
      } catch (err) {
        // fallback: do nothing
      }
    };
    fetchDomains();

    const savedEmail = localStorage.getItem('customTempEmail');
    const savedPassword = localStorage.getItem('customTempPassword');
    if (savedEmail && savedPassword) {
      const [savedPrefix, savedDomain] = savedEmail.split('@');
      setPrefix(savedPrefix || '');
      setCustomDomain(savedDomain || customDomain);
      setPassword(savedPassword);
    }
    // eslint-disable-next-line
  }, []);

  // LIVE validation on prefix change
  useEffect(() => {
    if (!prefix) {
      setInputError('');
      return;
    }
    if (!/^[a-z0-9._-]+$/.test(prefix)) {
      setInputError('Only lowercase letters, numbers, dot (.), dash (-), and underscore (_) allowed.');
      return;
    }
    if (prefix.length > 64) {
      setInputError('Prefix too long. Max 64 characters.');
      return;
    }
    setInputError('');
  }, [prefix]);

  const handleCreate = async () => {
    if (!prefix.trim()) {
      toast.error('Please enter a valid email prefix.');
      return;
    }
    if (inputError) {
      toast.error(inputError);
      return;
    }
    if (!password.trim()) {
      toast.error('Please enter a password.');
      return;
    }
    if (!customDomain) {
      toast.error('No domain available to create email.');
      return;
    }
    if (loading) return;

    setLoading(true);
    const fullEmail = `${prefix.trim()}@${customDomain}`;
    try {
      const accountRes = await fetch(`${base}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullEmail, password }),
      });

      if (accountRes.status === 429) {
        toast.error('Too many requests. Please wait and try again later.');
        setLoading(false);
        return;
      }

      // If account exists, login instead
      if (accountRes.status === 422) {
        const loginRes = await fetch(`${base}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: fullEmail, password }),
        });

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          toast.success('✅ Logged in with existing account!');
          localStorage.setItem('tempMail', fullEmail);
          localStorage.setItem('tempToken', loginData.token);
          localStorage.setItem('tempPassword', password);
          localStorage.setItem('customTempEmail', fullEmail);
          localStorage.setItem('customTempPassword', password);

          await saveUserToFirestore(fullEmail, password);

          if (onCreate) onCreate(fullEmail, loginData.token, password);

          setPrefix('');
          setPassword('');
          setShowModal(false);
          setLoading(false);
          return;
        } else {
          toast.error('Account exists but login failed. Please check your password.');
          setLoading(false);
          return;
        }
      }

      // Handle other API errors
      if (!accountRes.ok) {
        let errorText = 'Unknown error';
        try {
          const errorData = await accountRes.json();
          errorText = errorData['hydra:description'] || errorText;
        } catch { }
        if (
          errorText.toLowerCase().includes('must be a valid email address') ||
          errorText.toLowerCase().includes('invalid email address') ||
          errorText.toLowerCase().includes('uppercase')
        ) {
          toast.error('Email address is invalid or contains uppercase letters (only lowercase allowed).');
        } else {
          toast.error(`Account creation failed: ${errorText}`);
        }
        setLoading(false);
        return;
      }

      // Success: Now login
      const loginRes = await fetch(`${base}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullEmail, password }),
      });

      if (!loginRes.ok) {
        toast.error('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      const loginData = await loginRes.json();
      if (!loginData.token) {
        toast.error('Login failed. Try again.');
        setLoading(false);
        return;
      }

      localStorage.setItem('tempMail', fullEmail);
      localStorage.setItem('tempToken', loginData.token);
      localStorage.setItem('tempPassword', password);
      localStorage.setItem('customTempEmail', fullEmail);
      localStorage.setItem('customTempPassword', password);

      await saveUserToFirestore(fullEmail, password);

      toast.success('✅ Temp email generated with custom prefix!');
      if (onCreate) onCreate(fullEmail, loginData.token, password);

      setPrefix('');
      setPassword('');
      setShowModal(false);
    } catch (err) {
      console.error('Error:', err);
      toast.error('⚠️ Failed to generate email.');
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={buttonClass || "inline-flex px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"}
      >
        Create / Add Custom Email
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 relative">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-2xl font-bold"
              aria-label="Close"
            >
              &times;
            </button>

            <h2 className="text-xl font-semibold mb-3 text-center text-fuchsia-700">
              Create or Access Custom Temp Email
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Enter email prefix (lowercase)"
                  value={prefix}
                  onChange={e => setPrefix(e.target.value.replace(/[^a-z0-9._-]/g, '').toLowerCase())}
                  className={`px-3 py-2 border rounded focus:outline-none focus:ring-2 w-full ${inputError ? 'border-red-400 focus:ring-red-500' : 'border-fuchsia-400 focus:ring-fuchsia-500'
                    }`}
                  disabled={loading}
                  maxLength={64}
                  autoFocus
                />
                <div className="text-xs mt-1 text-gray-400">
                  {customDomain && (
                    <span className="text-pink-600 font-bold text-sm sm:text-base">
                      Email will be: <b>{prefix || '<prefix>'}@{customDomain}</b>
                    </span>
                  )}
                  {!customDomain && <span className="text-red-500">No domain available</span>}
                </div>
                {inputError && (
                  <div className="text-xs text-red-600 mt-1">{inputError}</div>
                )}
              </div>
              {/* If you want to let users choose a domain, uncomment this select */}
              {/* {domainList.length > 1 && (
                <select
                  value={customDomain}
                  onChange={e => setCustomDomain(e.target.value)}
                  className="px-3 py-2 border border-fuchsia-400 rounded focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  disabled={loading}
                >
                  {domainList.map(d => (
                    <option key={d.domain} value={d.domain}>{d.domain}</option>
                  ))}
                </select>
              )} */}
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="px-3 py-2 border border-fuchsia-400 rounded focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                disabled={loading}
              />
              <button
                onClick={handleCreate}
                disabled={loading || !!inputError || !prefix || !password}
                className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white rounded font-bold hover:from-fuchsia-600 hover:to-indigo-600 shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Create / Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomEmailGenerator;