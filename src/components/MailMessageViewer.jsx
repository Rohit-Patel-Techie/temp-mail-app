import React from "react";

// Helper to detect if a string is actually HTML tags
function isProbablyHTML(str) {
    return /<[a-z][\s\S]*>/i.test(str);
}

// Helper to decode HTML entities (if needed)
function decodeHTMLEntities(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
}

// Utility to safely render HTML or fallback to plain text
function renderMailBody(message) {
    // Prefer the HTML part if present and non-empty
    if (message.html && message.html.length > 0 && isProbablyHTML(message.html[0])) {
        let html = message.html[0];
        if (html.includes('&lt;') || html.includes('&gt;')) {
            html = decodeHTMLEntities(html);
        }
        return (
            <div
                className="prose prose-sm sm:prose max-w-none email-html"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    }
    // If the text is actually HTML, render it as HTML too
    if (message.text && isProbablyHTML(message.text)) {
        let html = message.text;
        if (html.includes('&lt;') || html.includes('&gt;')) {
            html = decodeHTMLEntities(html);
        }
        return (
            <div
                className="prose prose-sm sm:prose max-w-none email-html"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    }
    // Otherwise, render as plain text
    if (message.text) {
        return (
            <pre className="whitespace-pre-wrap text-gray-800 font-mono bg-gray-50 px-3 py-2 rounded">
                {message.text}
            </pre>
        );
    }
    return (
        <div className="text-gray-400 italic text-center py-4">
            No content available.
        </div>
    );
}

const MailMessageViewer = ({ message, onClose }) => {
    if (!message) return null;

    const date = new Date(message.createdAt);
    const avatar =
        message.from?.address?.[0]?.toUpperCase() ||
        <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>;
    const hasAttachments = message.attachments && message.attachments.length > 0;

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-2 sm:px-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border-2 border-fuchsia-400 flex flex-col max-h-[90vh] overflow-hidden relative">
                {/* Action bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-indigo-100 via-fuchsia-50 to-emerald-50">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                            {avatar}
                        </div>
                        <div>
                            <div className="font-bold text-indigo-700">
                                {message.from?.address}
                            </div>
                            <div className="text-xs text-gray-500">{date.toLocaleString()}</div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-3 text-2xl text-fuchsia-400 hover:text-fuchsia-700 font-bold px-2 transition"
                        title="Close"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>

                {/* Subject */}
                <div className="px-6 py-3 border-b bg-white/80">
                    <h2 className="text-lg sm:text-xl font-semibold text-fuchsia-900">
                        {message.subject || <span className="italic text-gray-400">No Subject</span>}
                    </h2>
                </div>

                {/* To, cc, etc. */}
                <div className="px-6 py-2 border-b bg-white/70 text-sm text-gray-700">
                    <span className="font-medium">To:</span> {message.to?.map(t => t.address).join(", ")}
                </div>

                {/* Attachments bar */}
                {hasAttachments && (
                    <div className="px-6 py-2 border-b bg-fuchsia-50 text-xs text-fuchsia-700 flex gap-3 items-center">
                        <span className="font-bold">Attachments:</span>
                        {message.attachments.map((a, idx) => (
                            <a
                                key={a.id}
                                href={a.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-indigo-600"
                            >
                                {a.filename || `Attachment ${idx + 1}`}
                            </a>
                        ))}
                    </div>
                )}

                {/* Message body */}
                <div className="flex-1 overflow-auto px-6 py-4 bg-gradient-to-br from-white via-fuchsia-50 to-blue-50">
                    {renderMailBody(message)}
                </div>

                {/* Actions (copy, print, open in new tab) */}
                <div className="px-6 py-3 border-t flex flex-col sm:flex-row gap-2 items-center sm:justify-between bg-white/80">
                    <div className="text-xs text-gray-400 font-mono">
                        Message ID: {message.id}
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold"
                            onClick={() => {
                                if (message.text) {
                                    navigator.clipboard.writeText(message.text);
                                    if (window.toast && window.toast.success) {
                                        window.toast.success("Message copied!");
                                    } else {
                                        alert("Message copied!");
                                    }
                                }
                            }}
                        >
                            Copy Text
                        </button>
                        <button
                            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold"
                            onClick={() => window.print()}
                        >
                            Print
                        </button>
                        <button
                            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold"
                            onClick={() => {
                                // Open in new tab
                                const win = window.open();
                                win.document.write(
                                    `<html><head><title>${message.subject || "Message"}</title></head><body>${message.html?.[0] || `<pre>${message.text || "No content"}</pre>`}</body></html>`
                                );
                                win.document.close();
                            }}
                        >
                            Open in Tab
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MailMessageViewer;