'use client';

import { useEffect, useRef, useState } from 'react';
import { NDAFormData } from '@/types/nda';
import { getToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  data: NDAFormData;
  onChange: (data: NDAFormData) => void;
  onComplete: () => void;
}

function fieldsFromResponse(raw: Record<string, unknown>): Partial<NDAFormData> {
  const p1 = (raw.party1 as Record<string, string>) ?? {};
  const p2 = (raw.party2 as Record<string, string>) ?? {};
  return {
    purpose: (raw.purpose as string) || '',
    effectiveDate: (raw.effectiveDate as string) || '',
    mndaTermType: ((raw.mndaTermType as string) === 'continues' ? 'continues' : 'expires'),
    mndaTermYears: (raw.mndaTermYears as string) || '1',
    confidentialityTermType: ((raw.confidentialityTermType as string) === 'perpetuity' ? 'perpetuity' : 'years'),
    confidentialityTermYears: (raw.confidentialityTermYears as string) || '1',
    governingLaw: (raw.governingLaw as string) || '',
    jurisdiction: (raw.jurisdiction as string) || '',
    modifications: (raw.modifications as string) || '',
    party1: {
      company: p1.company ?? '',
      name: p1.name ?? '',
      title: p1.title ?? '',
      noticeAddress: p1.noticeAddress ?? '',
    },
    party2: {
      company: p2.company ?? '',
      name: p2.name ?? '',
      title: p2.title ?? '',
      noticeAddress: p2.noticeAddress ?? '',
    },
  };
}

export default function NDAChat({ data, onChange, onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Always keep a fresh ref to data so sendToApi never closes over a stale value
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  // Load the AI's opening message on mount
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
    const current = dataRef.current;

    try {
      const res = await fetch(`${API_BASE}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: msgs,
          current_fields: {
            purpose: current.purpose,
            effectiveDate: current.effectiveDate,
            mndaTermType: current.mndaTermType,
            mndaTermYears: current.mndaTermYears,
            confidentialityTermType: current.confidentialityTermType,
            confidentialityTermYears: current.confidentialityTermYears,
            governingLaw: current.governingLaw,
            jurisdiction: current.jurisdiction,
            modifications: current.modifications,
            party1: current.party1,
            party2: current.party2,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        appendAssistant(err.detail ?? 'Something went wrong. Please try again.');
        return;
      }

      const json = await res.json();
      appendAssistant(json.reply);

      // Update NDA fields from AI response
      if (json.fields) {
        const updates = fieldsFromResponse(json.fields);
        onChange({ ...current, ...updates });
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
    // Clear chat state first, then reset the NDA form fields
    setMessages([]);
    setIsComplete(false);
    onComplete(); // resets formData to initialFormData in parent → dataRef updates on next render
    // sendToApi is called once the parent re-renders and dataRef.current is cleared
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
              Start New NDA
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 px-4 py-3 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isComplete ? 'NDA complete — click "Start New NDA" above' : 'Type your reply…'}
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
