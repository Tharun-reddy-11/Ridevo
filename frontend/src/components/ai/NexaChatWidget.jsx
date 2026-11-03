import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { BotIcon, CloseIcon, SparklesIcon, ArrowRightIcon } from '../icons/Icons';

export default function NexaChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hi! I'm Nexa, your AI mobility assistant. Ask me about finding nearby vehicles, doorstep delivery, late-fee policies, or rental pricing."
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', { message: text });
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.data.reply,
        vehicles: res.data.vehicles,
        suggestedAction: res.data.suggestedAction
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: "I'm temporarily experiencing connectivity issues with the server. Please try again in a few moments."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nexa-widget-container">
      {open ? (
        <div className="nexa-chat-card">
          <div className="nexa-chat-header">
            <div className="nexa-header-avatar">
              <BotIcon className="w-5 h-5 text-cyan" />
              <div>
                <strong>Nexa Assistant</strong>
                <span className="live-status-text">● Live AI Mobility Guide</span>
              </div>
            </div>
            <button className="btn-close-chat" onClick={() => setOpen(false)} aria-label="Close chat">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="nexa-messages-list">
            {messages.map((m) => (
              <div key={m.id} className={`nexa-message-bubble ${m.sender}`}>
                <p>{m.text}</p>
                {m.vehicles && m.vehicles.length > 0 && (
                  <div className="nexa-vehicle-chips">
                    {m.vehicles.map((v) => (
                      <div
                        key={v.id}
                        className="nexa-mini-vehicle"
                        onClick={() => {
                          setOpen(false);
                          navigate(`/vehicles/${v.id}`);
                        }}
                      >
                        <strong>{v.make} {v.model}</strong>
                        <span>₹{v.daily_rate}/day · {v.city}</span>
                        <small className="tap-view">View Details →</small>
                      </div>
                    ))}
                  </div>
                )}
                {m.suggestedAction && (
                  <button
                    className="nexa-action-btn"
                    onClick={() => {
                      setOpen(false);
                      navigate(m.suggestedAction);
                    }}
                  >
                    View Matching Listings <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div className="nexa-message-bubble bot typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="nexa-quick-prompts">
            <button onClick={() => handleSend("How does doorstep delivery work?")}>Doorstep Delivery?</button>
            <button onClick={() => handleSend("What is the late return grace period?")}>Grace Period?</button>
            <button onClick={() => handleSend("Find cars in Tirupati")}>Cars in Tirupati</button>
          </div>

          <form
            className="nexa-chat-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about vehicles, delivery, pricing..."
              maxLength={250}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      ) : (
        <button className="nexa-launcher-btn" onClick={() => setOpen(true)} title="Ask Nexa Assistant">
          <div className="launcher-icon-wrap">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <span className="launcher-text">Ask Nexa AI</span>
        </button>
      )}
    </div>
  );
}
