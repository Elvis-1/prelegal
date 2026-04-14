'use client';

import { useEffect, useRef, useState } from 'react';
import { DocumentFields } from '@/types/document';
import { getToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  documentType: string;
  documentName: string;
  fields: DocumentFields;
  onChange: (fields: DocumentFields) => void;
  onComplete: () => void;
}

export default function DocChat({ documentType, documentName, fields, onChange, onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep a fresh ref to fields to avoid stale closures in sendToApi
  const fieldsRef = useRef(fields);
  useEffect(() => { fieldsRef.current = fields; }, [fields]);

  // Trigger opening greeting on mount
  useEffect(() => {
    sendToApi([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendToApi(msgs: Message[]) {
    const token = getToken();
    if (!token) {
      appendAssistant('Session expired — please sign in again.');
      return;
    }

    setLoading(true);
    const current = fieldsRef.current;

    try {
      const res = await fetch(`${API_BASE}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_type: documentType,
          messages: msgs,
          current_fields: current,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        appendAssistant(err.detail ?? 'Something went wrong. Please try again.');
        return;
      }

      const json = await res.json();
      appendAssistant(json.reply);

      if (json.fields) {
        const updated: DocumentFields = {};
        for (const [k, v] of Object.entries(json.fields)) {
          updated[k] = typeof v === 'string' ? v : String(v ?? '');
        }
        onChange({ ...current, ...updated });
      }

      if (json.is_complete) {
        setIsComplete(true);
      }
    } catch {
      appendAssistant('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function appendAssistant(content: string) {
    setMessages((prev) => [...prev, { role: 'assistant', content }]);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput('');

    await sendToApi(updatedMsgs);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleReset() {
    setMessages([]);
    setIsComplete(false);
    onComplete();
    requestAnimationFrame(() => sendToApi([]));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2 mt-0.5"
                style={{ backgroundColor: '#209dd7' }}
              >
                AI
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white rounded-br-sm'
                  : 'bg-slate-100 text-gray-800 rounded-bl-sm'
              }`}
              style={msg.role === 'user' ? { backgroundColor: '#209dd7' } : {}}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2"
              style={{ backgroundColor: '#209dd7' }}
            >
              AI
            </div>
            <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="flex justify-center pt-2">
            <button
              onClick={handleReset}
              className="text-sm font-medium text-white px-5 py-2.5 rounded-xl transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#753991' }}
            >
              Start New {documentName}
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 px-4 py-3 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isComplete ? `Document complete — click "Start New ${documentName}" above` : 'Type your reply…'}
            disabled={loading || isComplete}
            rows={1}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || isComplete}
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: '#753991' }}
            aria-label="Send"
          >
            <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
