import { useState, useRef, useEffect } from "react";
import axios from "axios"

// const API_URL = "https://youtube-ai-video-system.onrender.com/process-video";
const API_URL = " https://youtube-ai-video-system.onrender.com/process-video";
const CHAT_API_URL = "https://youtube-ai-video-system.onrender.com/ask-question"

function getVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

export default function YouTubeSummarizer() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Chat state
  const [chatInput,setChatInput] = useState("");
  const [chatMessages,setChatMessages] = useState([]);
  const [chatLoading,setChatLoading] = useState(false);


  const inputRef = useRef(null);
  const chatBottomRef = useRef(null);
  const chatInputRef = useRef(null);

  // auto scroll chat to bottom code start here
  useEffect(()=>{
    chatBottomRef.curren?.scrollIntoView({behavior : "smooth"})
  },[chatMessages,chatLoading])
  // end here

  const handleSummarize = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please paste a YouTube URL first.");
      return;
    }
    const videoId = getVideoId(trimmed);
    if (!videoId) {
      setError("That doesn't look like a valid YouTube URL. Please check and try again.");
      return;
    }

    setError("");
    setResult(null);
    setLoading(true);
    setChatMessages([]);

    try {
      const response = await axios.post(API_URL,
        {url: trimmed},
        {
          headers : {
            'Content-Type' : "application/json"
          }
        }
      );
      const data = response.data;
      setResult({
        title : data.title || "Untitled Video",
        summary : data.summary,
        thumb : `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        url : trimmed
      });
      // Welcome message in chat
      setChatMessages([{
        role : "assistant",
        text : `I have summarized **${data.title || "This Video"}**. Feel free to ask anything about this video.!`
      }]);
      // code ends here
    }catch(err) {
      setError(err.response?.data?.detail || err.message || "Something error have been occured.")
    } finally {
      setLoading(false);
    }
  };

  // code for handle api starts here
  const handleChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
 
    const userMsg = { role: "user", text: msg };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);
 
    try {
      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: msg,
          summary: result?.summary || "",
          video_url: result?.url || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to get response.");
      setChatMessages(prev => [...prev, { role: "assistant", text: data.answer }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", text: `Sorry, something went wrong: ${err.message}` }]);
    } finally {
      setChatLoading(false);
      chatInputRef.current?.focus();
    }
  };
  // Code for calling chat bot api

  const handleChatKeyDown = (e) => {
    // if (e.key === "Enter") handleSummarize();
    if (e.key === "Enter" && !e.shiftKey) {e.preventDefault(); handleChat();}
  };

  const copySummary = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap');
 
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #f5f4f0; color: #1a1a18; min-height: 100vh; }
 
        .yt-app { min-height: 100vh; display: flex; flex-direction: column; background: #f5f4f0; }
 
        .yt-overlay {
          position: fixed; inset: 0; background: rgba(10,10,10,0.55);
          z-index: 200; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 18px; backdrop-filter: blur(2px);
        }
        .yt-spinner {
          width: 48px; height: 48px; border: 3px solid rgba(255,255,255,0.2);
          border-top-color: #fff; border-radius: 50%; animation: spin 0.75s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .yt-overlay-text { color: #fff; font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 500; }
 
        .yt-header {
          background: #fff; border-bottom: 1px solid #e8e6e0; padding: 14px 24px;
          display: flex; align-items: center; gap: 16px;
          position: sticky; top: 0; z-index: 10; flex-wrap: wrap;
        }
        .yt-logo {
          font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 700;
          color: #1a1a18; display: flex; align-items: center; gap: 9px; white-space: nowrap; flex-shrink: 0;
        }
        .yt-logo-badge {
          width: 30px; height: 30px; background: #e03e3d; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
        }
        .yt-logo-badge svg { width: 14px; height: 14px; fill: #fff; }
 
        .yt-search { flex: 1; display: flex; align-items: center; gap: 10px; min-width: 0; }
        .yt-input {
          flex: 1; height: 42px; padding: 0 16px; border: 1.5px solid #e0deda;
          border-radius: 10px; font-size: 14px; font-family: 'DM Sans', sans-serif;
          background: #faf9f7; color: #1a1a18; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s; min-width: 0;
        }
        .yt-input::placeholder { color: #aba9a2; }
        .yt-input:focus { border-color: #e03e3d; box-shadow: 0 0 0 3px rgba(224,62,61,0.1); background: #fff; }
        .yt-input:disabled { opacity: 0.5; cursor: not-allowed; }
 
        .yt-btn {
          height: 42px; padding: 0 22px; background: #e03e3d; color: #fff; border: none;
          border-radius: 10px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 7px;
          transition: opacity 0.15s, transform 0.1s; flex-shrink: 0;
        }
        .yt-btn:hover:not(:disabled) { opacity: 0.88; }
        .yt-btn:active:not(:disabled) { transform: scale(0.97); }
        .yt-btn:disabled { opacity: 0.45; cursor: not-allowed; }
 
        .yt-main { flex: 1; padding: 32px 24px; max-width: 820px; width: 100%; margin: 0 auto; }
 
        .yt-error {
          background: #fff2f2; border: 1px solid #fcc9c9; border-radius: 10px;
          padding: 13px 16px; display: flex; align-items: flex-start; gap: 10px;
          margin-bottom: 22px; color: #c0302f; font-size: 14px; line-height: 1.5;
        }
        .yt-error-close {
          margin-left: auto; background: none; border: none; cursor: pointer;
          color: #c0302f; opacity: 0.6; font-size: 18px; line-height: 1; padding: 0; flex-shrink: 0;
        }
        .yt-error-close:hover { opacity: 1; }
 
        .yt-placeholder {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 90px 24px; text-align: center; gap: 14px;
        }
        .yt-placeholder-icon {
          width: 64px; height: 64px; background: #edecea; border-radius: 16px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 8px;
        }
        .yt-placeholder-icon svg { width: 28px; height: 28px; stroke: #9e9c96; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
        .yt-placeholder h2 { font-family: 'Syne', sans-serif; font-size: 21px; font-weight: 600; color: #3a3a36; }
        .yt-placeholder p { font-size: 14px; color: #8a8880; max-width: 360px; line-height: 1.65; }
 
        /* Result card */
        .yt-card {
          background: #fff; border: 1px solid #e8e6e0; border-radius: 14px;
          overflow: hidden; animation: fadeUp 0.3s ease; margin-bottom: 20px;
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
 
        .yt-card-header {
          padding: 18px 20px; border-bottom: 1px solid #f0eeea;
          display: flex; align-items: flex-start; gap: 14px; background: #faf9f7;
        }
        .yt-thumb { width: 100px; height: 66px; border-radius: 7px; object-fit: cover; border: 1px solid #e8e6e0; flex-shrink: 0; background: #edecea; }
        .yt-video-info { flex: 1; min-width: 0; }
        .yt-video-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 600; color: #1a1a18; line-height: 1.4; margin-bottom: 5px; word-break: break-word; }
        .yt-video-url { font-size: 12px; color: #aba9a2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
 
        .yt-card-body { padding: 22px 20px; position: relative; }
        .yt-summary-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #b0ada6; margin-bottom: 14px; }
        .yt-summary-text { font-size: 15px; line-height: 1.8; color: #2a2a26; white-space: pre-wrap; padding-right: 40px; }
 
        .yt-copy-btn {
          position: absolute; top: 22px; right: 20px; width: 34px; height: 34px;
          border-radius: 8px; background: #f5f4f0; border: 1px solid #e8e6e0;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, border-color 0.15s; color: #7a7870;
        }
        .yt-copy-btn:hover { background: #edecea; color: #1a1a18; }
        .yt-copy-btn.copied { background: #f0faf4; border-color: #a8dfc0; color: #2a8a52; }
        .yt-copy-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
 
        /* ── CHAT BOX ── */
        .yt-chat {
          background: #fff; border: 1px solid #e8e6e0; border-radius: 14px;
          overflow: hidden; animation: fadeUp 0.35s ease 0.1s both; display: flex; flex-direction: column;
        }
 
        .yt-chat-header {
          padding: 14px 18px; border-bottom: 1px solid #f0eeea;
          display: flex; align-items: center; gap: 9px; background: #faf9f7;
        }
        .yt-chat-header-icon {
          width: 28px; height: 28px; background: #e03e3d; border-radius: 7px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .yt-chat-header-icon svg { width: 14px; height: 14px; stroke: #fff; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .yt-chat-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; color: #1a1a18; }
        .yt-chat-subtitle { font-size: 12px; color: #aba9a2; margin-left: auto; }
 
        .yt-chat-messages {
          padding: 16px; display: flex; flex-direction: column; gap: 12px;
          max-height: 340px; overflow-y: auto; scroll-behavior: smooth;
        }
        .yt-chat-messages::-webkit-scrollbar { width: 4px; }
        .yt-chat-messages::-webkit-scrollbar-track { background: transparent; }
        .yt-chat-messages::-webkit-scrollbar-thumb { background: #e0deda; border-radius: 4px; }
 
        .yt-msg { display: flex; gap: 9px; align-items: flex-start; }
        .yt-msg.user { flex-direction: row-reverse; }
 
        .yt-msg-avatar {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; font-family: 'Syne', sans-serif;
        }
        .yt-msg.user .yt-msg-avatar { background: #e03e3d; color: #fff; }
        .yt-msg.assistant .yt-msg-avatar { background: #edecea; color: #5a5a56; }
 
        .yt-msg-bubble {
          max-width: 75%; padding: 10px 14px; border-radius: 12px;
          font-size: 14px; line-height: 1.6; word-break: break-word;
        }
        .yt-msg.user .yt-msg-bubble { background: #e03e3d; color: #fff; border-bottom-right-radius: 3px; }
        .yt-msg.assistant .yt-msg-bubble { background: #f5f4f0; color: #1a1a18; border-bottom-left-radius: 3px; }
 
        /* Typing indicator */
        .yt-typing { display: flex; align-items: center; gap: 4px; padding: 12px 14px; }
        .yt-typing span {
          width: 7px; height: 7px; background: #b0ada6; border-radius: 50%;
          animation: bounce 1.2s infinite;
        }
        .yt-typing span:nth-child(2) { animation-delay: 0.2s; }
        .yt-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
 
        .yt-chat-input-row {
          padding: 12px 16px; border-top: 1px solid #f0eeea;
          display: flex; align-items: flex-end; gap: 10px; background: #faf9f7;
        }
        .yt-chat-input {
          flex: 1; min-height: 40px; max-height: 100px; padding: 10px 14px;
          border: 1.5px solid #e0deda; border-radius: 10px; font-size: 14px;
          font-family: 'DM Sans', sans-serif; background: #fff; color: #1a1a18;
          outline: none; resize: none; transition: border-color 0.15s, box-shadow 0.15s;
          line-height: 1.4;
        }
        .yt-chat-input::placeholder { color: #aba9a2; }
        .yt-chat-input:focus { border-color: #e03e3d; box-shadow: 0 0 0 3px rgba(224,62,61,0.1); }
        .yt-chat-input:disabled { opacity: 0.5; cursor: not-allowed; }
 
        .yt-chat-send {
          width: 40px; height: 40px; background: #e03e3d; border: none;
          border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: opacity 0.15s, transform 0.1s; color: #fff;
        }
        .yt-chat-send:hover:not(:disabled) { opacity: 0.88; }
        .yt-chat-send:active:not(:disabled) { transform: scale(0.95); }
        .yt-chat-send:disabled { opacity: 0.4; cursor: not-allowed; }
        .yt-chat-send svg { width: 16px; height: 16px; stroke: #fff; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
 
        /* Footer */
        .yt-footer { border-top: 1px solid #e8e6e0; background: #fff; padding: 22px 24px; text-align: center; margin-top: 32px; }
        .yt-footer-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; color: #3a3a36; margin-bottom: 14px; }
        .yt-footer-links { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }
        .yt-footer-link {
          display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 500;
          color: #5a5a56; text-decoration: none; padding: 7px 14px; border-radius: 8px;
          border: 1px solid #e8e6e0; background: #faf9f7; transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .yt-footer-link:hover { background: #f0eeea; color: #1a1a18; border-color: #d0cec8; }
        .yt-footer-link svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
 
        @media (max-width: 600px) {
          .yt-header { padding: 12px 16px; }
          .yt-search { order: 3; flex: 0 0 100%; }
          .yt-logo { order: 1; }
          .yt-main { padding: 20px 14px; }
          .yt-thumb { width: 80px; height: 54px; }
          .yt-placeholder { padding: 60px 16px; }
          .yt-msg-bubble { max-width: 88%; }
          .yt-chat-subtitle { display: none; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #f5f4f0;
          color: #1a1a18;
          min-height: 100vh;
        }

        .yt-app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f5f4f0;
        }

        /* ── OVERLAY ── */
        .yt-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10,10,10,0.55);
          z-index: 200;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
          backdrop-filter: blur(2px);
        }

        .yt-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(255,255,255,0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .yt-overlay-text {
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        /* ── HEADER ── */
        .yt-header {
          background: #fff;
          border-bottom: 1px solid #e8e6e0;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 10;
          flex-wrap: wrap;
        }

        .yt-logo {
          font-family: 'Syne', sans-serif;
          font-size: 19px;
          font-weight: 700;
          color: #1a1a18;
          display: flex;
          align-items: center;
          gap: 9px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .yt-logo-badge {
          width: 30px;
          height: 30px;
          background: #e03e3d;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .yt-logo-badge svg {
          width: 14px;
          height: 14px;
          fill: #fff;
        }

        .yt-search {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .yt-input {
          flex: 1;
          height: 42px;
          padding: 0 16px;
          border: 1.5px solid #e0deda;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          background: #faf9f7;
          color: #1a1a18;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          min-width: 0;
        }

        .yt-input::placeholder { color: #aba9a2; }
        .yt-input:focus {
          border-color: #e03e3d;
          box-shadow: 0 0 0 3px rgba(224,62,61,0.1);
          background: #fff;
        }
        .yt-input:disabled { opacity: 0.5; cursor: not-allowed; }

        .yt-btn {
          height: 42px;
          padding: 0 22px;
          background: #e03e3d;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 7px;
          transition: opacity 0.15s, transform 0.1s;
          flex-shrink: 0;
        }

        .yt-btn:hover:not(:disabled) { opacity: 0.88; }
        .yt-btn:active:not(:disabled) { transform: scale(0.97); }
        .yt-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── MAIN ── */
        .yt-main {
          flex: 1;
          padding: 32px 24px;
          max-width: 820px;
          width: 100%;
          margin: 0 auto;
        }

        /* ── ERROR ── */
        .yt-error {
          background: #fff2f2;
          border: 1px solid #fcc9c9;
          border-radius: 10px;
          padding: 13px 16px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 22px;
          color: #c0302f;
          font-size: 14px;
          line-height: 1.5;
        }

        .yt-error-close {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: #c0302f;
          opacity: 0.6;
          font-size: 18px;
          line-height: 1;
          padding: 0;
          flex-shrink: 0;
        }

        .yt-error-close:hover { opacity: 1; }

        /* ── PLACEHOLDER ── */
        .yt-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 90px 24px;
          text-align: center;
          gap: 14px;
        }

        .yt-placeholder-icon {
          width: 64px;
          height: 64px;
          background: #edecea;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .yt-placeholder-icon svg {
          width: 28px;
          height: 28px;
          stroke: #9e9c96;
          fill: none;
          stroke-width: 1.5;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .yt-placeholder h2 {
          font-family: 'Syne', sans-serif;
          font-size: 21px;
          font-weight: 600;
          color: #3a3a36;
        }

        .yt-placeholder p {
          font-size: 14px;
          color: #8a8880;
          max-width: 360px;
          line-height: 1.65;
        }

        /* ── RESULT CARD ── */
        .yt-card {
          background: #fff;
          border: 1px solid #e8e6e0;
          border-radius: 14px;
          overflow: hidden;
          animation: fadeUp 0.3s ease;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .yt-card-header {
          padding: 18px 20px;
          border-bottom: 1px solid #f0eeea;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: #faf9f7;
        }

        .yt-thumb {
          width: 100px;
          height: 66px;
          border-radius: 7px;
          object-fit: cover;
          border: 1px solid #e8e6e0;
          flex-shrink: 0;
          background: #edecea;
        }

        .yt-video-info { flex: 1; min-width: 0; }

        .yt-video-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #1a1a18;
          line-height: 1.4;
          margin-bottom: 5px;
          word-break: break-word;
        }

        .yt-video-url {
          font-size: 12px;
          color: #aba9a2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .yt-card-body {
          padding: 22px 20px;
          position: relative;
        }

        .yt-summary-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #b0ada6;
          margin-bottom: 14px;
        }

        .yt-summary-text {
          font-size: 15px;
          line-height: 1.8;
          color: #2a2a26;
          white-space: pre-wrap;
          padding-right: 40px;
        }

        .yt-copy-btn {
          position: absolute;
          top: 22px;
          right: 20px;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #f5f4f0;
          border: 1px solid #e8e6e0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, border-color 0.15s;
          color: #7a7870;
        }

        .yt-copy-btn:hover { background: #edecea; color: #1a1a18; }

        .yt-copy-btn.copied {
          background: #f0faf4;
          border-color: #a8dfc0;
          color: #2a8a52;
        }

        .yt-copy-btn svg {
          width: 16px;
          height: 16px;
          stroke: currentColor;
          fill: none;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* ── FOOTER ── */
        .yt-footer {
          border-top: 1px solid #e8e6e0;
          background: #fff;
          padding: 22px 24px;
          text-align: center;
        }

        .yt-footer-name {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #3a3a36;
          margin-bottom: 14px;
        }

        .yt-footer-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .yt-footer-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          font-weight: 500;
          color: #5a5a56;
          text-decoration: none;
          padding: 7px 14px;
          border-radius: 8px;
          border: 1px solid #e8e6e0;
          background: #faf9f7;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }

        .yt-footer-link:hover {
          background: #f0eeea;
          color: #1a1a18;
          border-color: #d0cec8;
        }

        .yt-footer-link svg {
          width: 16px;
          height: 16px;
          stroke: currentColor;
          fill: none;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 600px) {
          .yt-header { padding: 12px 16px; }
          .yt-search { order: 3; flex: 0 0 100%; }
          .yt-logo { order: 1; }
          .yt-main { padding: 20px 14px; }
          .yt-thumb { width: 80px; height: 54px; }
          .yt-placeholder { padding: 60px 16px; }
        }
      `}</style>

      <div className="yt-app">

        {/* Loading overlay — disables whole page */}
        {loading && (
          <div className="yt-overlay" role="status" aria-live="polite">
            <div className="yt-spinner" />
            <div className="yt-overlay-text">Generating summary…</div>
          </div>
        )}

        {/* Header */}
        <header className="yt-header">
          <div className="yt-logo">
            <div className="yt-logo-badge">
              {/* Play icon */}
              <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
            </div>
            Summary Tube
          </div>

          <div className="yt-search">
            <input
              ref={inputRef}
              className="yt-input"
              type="url"
              placeholder="Paste a YouTube URL…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              // onKeyDown={handleKeyDown}
              onKeyDown={(e)=> e.key === "Enter" && handleSummarize()}
              disabled={loading}
              autoComplete="off"
              spellCheck="false"
              aria-label="YouTube URL"
            />
            <button
              className="yt-btn"
              onClick={handleSummarize}
              disabled={loading}
            >
              {/* Sparkle icon */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
              </svg>
              Summarize
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="yt-main">

          {/* Error bar */}
          {error && (
            <div className="yt-error" role="alert">
              {/* Alert icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
              <button className="yt-error-close" onClick={() => setError("")} aria-label="Close error">×</button>
            </div>
          )}

          {/* Placeholder */}
          {!result && (
            <div className="yt-placeholder">
              <div className="yt-placeholder-icon">
                <svg viewBox="0 0 24 24">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <polyline points="8 21 12 17 16 21"/>
                  <line x1="12" y1="17" x2="12" y2="3"/>
                </svg>
              </div>
              <h2>Paste a YouTube link above</h2>
              <p>Get an AI-generated summary of any YouTube video in seconds no need to watch the whole thing.</p>
            </div>
          )}

          {/* Result card */}
          {result && (
            <>
            {/* Summary Card Code Start Here */}
            {/* <div className="yt-card">
              <div className="yt-card-header">
                <img className="yt-thumb" src={result.thumb} alt="Video thumbnail" />
                <div className="yt-video-info">
                  <div className="yt-video-title">{result.title}</div>
                  <div className="yt-video-url">{result.url}</div>
                </div>
              </div>

              <div className="yt-card-body">
                <div className="yt-summary-label">Summary</div>
                <div className="yt-summary-text">{result.summary}</div>

                <button
                  className={`yt-copy-btn${copied ? " copied" : ""}`}
                  onClick={copySummary}
                  aria-label="Copy summary"
                  title="Copy summary"
                >
                  {copied ? (
                    // Check icon
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    // Copy icon
                    <svg viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  )}
                </button>
              </div>
            </div> */}
            {/* Summary Card Code Ends Start Here */}
            {/* Chat box code start here */}
            <div className="yt-chat">
                <div className="yt-chat-header">
                  <div className="yt-chat-header-icon">
                    <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <span className="yt-chat-title">Ask about this video</span>
                  <span className="yt-chat-subtitle">Powered by AI</span>
                </div>
 
                <div className="yt-chat-messages">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`yt-msg ${msg.role}`}>
                      <div className="yt-msg-avatar">
                        {msg.role === "user" ? "You" : "AI"}
                      </div>
                      <div className="yt-msg-bubble">{msg.text}</div>
                    </div>
                  ))}
 
                  {chatLoading && (
                    <div className="yt-msg assistant">
                      <div className="yt-msg-avatar">AI</div>
                      <div className="yt-msg-bubble" style={{padding:"2px 0"}}>
                        <div className="yt-typing">
                          <span/><span/><span/>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>
 
                <div className="yt-chat-input-row">
                  <textarea
                    ref={chatInputRef}
                    className="yt-chat-input"
                    placeholder="Ask anything about this video…"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    disabled={chatLoading}
                    rows={1}
                  />
                  <button className="yt-chat-send" onClick={handleChat} disabled={chatLoading || !chatInput.trim()} aria-label="Send">
                    <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
              </div>
            {/* Chat box code ends start here */}
            </>
          )}

        </main>

        {/* Footer */}
        <footer className="yt-footer">
          <div className="yt-footer-name">Built by KAMRAN AKHTAR</div>
          <div className="yt-footer-links">
            <a className="yt-footer-link" href="https://github.com/Mirza5056" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              GitHub
            </a>
            <a className="yt-footer-link" href="https://leetcode.com/u/mirza5056/" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              LeetCode
            </a>
            <a className="yt-footer-link" href="https://www.linkedin.com/in/kamranakthar" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              LinkedIn
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}