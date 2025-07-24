import React, { useState } from 'react';
import { fetchAllUsersFromFirestore } from "./firestore-utils";
import { HiOutlineUserCircle, HiOutlineMail, HiOutlineLockClosed, HiX, HiOutlineClipboard, HiOutlineLogin } from "react-icons/hi";

const ADMIN_PASSWORD = "Rohit"; // Your admin password

const AdminPanel = ({ onClose, onLoginUser }) => {
    const [password, setPassword] = useState('');
    const [authorized, setAuthorized] = useState(false);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState({});

    const handleLogin = async () => {
        if (password === ADMIN_PASSWORD) {
            setAuthorized(true);
            try {
                const usersList = await fetchAllUsersFromFirestore();
                setUsers(usersList);
            } catch (err) {
                setError("Failed to fetch users.");
            }
        } else {
            setError("Incorrect admin password.");
        }
    };

    // Copy function for email/password
    const handleCopy = (userId, textType, text) => {
        navigator.clipboard.writeText(text);
        setCopied(prev => ({
            ...prev,
            [userId]: { ...prev[userId], [textType]: true }
        }));
        setTimeout(() => {
            setCopied(prev => ({
                ...prev,
                [userId]: { ...prev[userId], [textType]: false }
            }));
        }, 1200);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-800/70 via-indigo-500/40 to-cyan-400/20">
            <div className="bg-white rounded-2xl shadow-2xl py-8 px-6 w-full max-w-lg relative border border-gray-200">
                {/* Close Button */}
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold transition-colors"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <HiX />
                </button>
                {/* Accent Bar */}
                <div className="w-20 h-2 rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-400 mx-auto mb-6"></div>
                {!authorized ? (
                    <div className="flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-indigo-700 mb-3">Admin Panel Login</h2>
                        <p className="text-sm text-gray-500 mb-5">Access temp mail users database</p>
                        <div className="w-full flex flex-col gap-3">
                            <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-indigo-400">
                                <HiOutlineLockClosed className="text-indigo-400 mr-2 text-xl" />
                                <input
                                    type="password"
                                    value={password}
                                    placeholder="Enter admin password"
                                    onChange={e => setPassword(e.target.value)}
                                    className="bg-transparent outline-none flex-1 text-gray-700"
                                />
                            </div>
                            <button
                                onClick={handleLogin}
                                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
                            >
                                Login
                            </button>
                        </div>
                        {error && <div className="text-red-500 mt-3">{error}</div>}
                    </div>
                ) : (
                    <div>
                        <h2 className="text-2xl font-bold mb-2 text-indigo-700 text-center">All Temp Mail Users</h2>
                        <p className="text-xs text-gray-500 text-center mb-4">Database snapshot below</p>
                        <ul className="bg-gray-50 rounded-xl shadow-inner p-4 max-h-64 overflow-y-auto space-y-3">
                            {users.length === 0 ? (
                                <li className="text-gray-400 text-center py-2">No users found.</li>
                            ) : (
                                users.map(user => (
                                    <li key={user.id} className="flex flex-col md:flex-row md:items-center gap-2 border-b border-gray-200 py-3">
                                        {/* Icon - always same size */}
                                        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8">
                                            <HiOutlineUserCircle className="text-indigo-500 text-2xl" />
                                        </div>
                                        {/* User Info (flex layout, wrap for date) */}
                                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <HiOutlineMail className="text-cyan-500 text-lg" />
                                                <span className="font-semibold text-gray-900 break-all">{user.email}</span>
                                                <button
                                                    className="ml-2 text-indigo-500 hover:text-indigo-700 transition-colors"
                                                    title="Copy Email"
                                                    onClick={() => handleCopy(user.id, 'email', user.email)}
                                                >
                                                    <HiOutlineClipboard className="text-lg" />
                                                </button>
                                                {copied[user.id]?.email && (
                                                    <span className="ml-1 text-green-500 text-xs">Copied!</span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <HiOutlineLockClosed className="text-gray-400 text-lg" />
                                                <span className="text-gray-700 break-all">{user.password}</span>
                                                <button
                                                    className="ml-2 text-indigo-500 hover:text-indigo-700 transition-colors"
                                                    title="Copy Password"
                                                    onClick={() => handleCopy(user.id, 'password', user.password)}
                                                >
                                                    <HiOutlineClipboard className="text-lg" />
                                                </button>
                                                {copied[user.id]?.password && (
                                                    <span className="ml-1 text-green-500 text-xs">Copied!</span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Date and Login */}
                                        <div className="flex flex-row gap-2 items-center mt-2 md:mt-0 min-w-[120px]">
                                            <span className="bg-indigo-50 text-indigo-600 rounded px-2 py-1 text-xs font-mono block text-center whitespace-nowrap">
                                                {new Date(user.createdAt).toLocaleString('en-GB', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                    hour12: true
                                                }).replace(',', '')}
                                            </span>
                                            <button
                                                className="ml-2 px-2 py-1 rounded bg-cyan-500 hover:bg-cyan-600 text-white text-xs flex items-center gap-1"
                                                title="Login as this user"
                                                onClick={() => onLoginUser(user.email, user.password)}
                                            >
                                                <HiOutlineLogin className="text-base" />
                                                Login
                                            </button>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;