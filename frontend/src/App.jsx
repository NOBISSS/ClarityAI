import { useEffect, useRef, useState } from "react";
import { RiMoonLine, RiSunLine } from "react-icons/ri";
import { IoMdSend } from "react-icons/io";

const API_BASE=import.meta.env.VITE_API_BASE_URL || "";
console.log(API_BASE);
const THEMES = {
  dark: {
    name: "dark",
    appBg: "#050816",
    textMain: "#e5e7eb",
    textSubtle: "#9ca3af",
    border: "#1f2937",
    userBubble: "#4f46e5",
    botBubble: "#111827",
    inputBg: "#020617",
    headerBg: "rgba(5, 8, 22, 0.9)",
  },
  light: {
    name: "light",
    appBg: "#f3f4f6",
    textMain: "#111827",
    textSubtle: "#6b7280",
    border: "#e5e7eb",
    userBubble: "#2563eb",
    botBubble: "#ffffff",
    inputBg: "#f9fafb",
    headerBg: "rgba(243, 244, 246, 0.9)",
    green:"#22c55e"
  },
};

function App() {
  const [theme, setTheme] = useState("dark");
  const t = THEMES[theme];

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hey! I’m your custom AI agent. Ask me anything 🚀",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [threadId] = useState(() => {
    let existing = localStorage.getItem("threadId");
    if (!existing) {
      existing = Math.random().toString(36).slice(2);
      localStorage.setItem("threadId", existing);
    }
    return existing;
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, threadId }),
      });

      const data = await res.json();

      const botMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.reply || "Sorry, I couldn't generate a response.",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "assistant",
          content: "⚠️ Something went wrong talking to the server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: t.appBg,
        color: t.textMain,
        display: "flex",
        flexDirection: "column",
        fontFamily:
          '"Inter", "Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* HEADER */}
      <header
        style={{
          borderBottom: `1px solid ${t.border}`,
          padding: "10px 0",
          display: "flex",
          justifyContent: "center",
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(10px)",
          background: t.headerBg,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1200px", // wider on laptop
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: "1.1rem",fontFamily:"Poppins" }}>
              <span style={{background:t.userBubble,padding:"3px",borderRadius:"3px",color:"white"}}>ClarityAI</span>
            </div>
            <div
              style={{
                fontSize: "0.78rem",
                color: t.textSubtle,
                marginTop: 2,
                fontFamily:"Poppins"
              }}
            >
              LangGraph · Groq · Tavily · Thread: {threadId.slice(0, 6)}
            </div>
          </div>

          <button
            onClick={toggleTheme}
            type="button"
            style={{
              width: 38,
              height: 38,
              borderRadius: "999px",
              border: `1px solid ${t.border}`,
              backgroundColor:
                theme === "dark" ? "#020617" : "#e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                // borderRadius: "30%",
                backgroundColor: theme==="dark" ? "#0000" : "#fffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0f172a",
              }}
            >
              {theme === "dark" ? (
                <RiSunLine size={16} style={{color:"white"}}/>
              ) : (
                <RiMoonLine size={16}  />
              )}
            </div>
          </button>
        </div>
      </header>

      {/* MAIN CHAT AREA */}
      <main
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          paddingTop: 8,
          paddingBottom: 120, // room for input
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1200px", // same as header/input
            padding: "0 20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {/* Messages scroll area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                paddingTop: 10,
                paddingBottom: 10,
              }}
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent:
                      m.role === "user" ? "flex-end" : "flex-start",
                    marginBottom: 10,
                    fontFamily:"Poppins"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection:
                        m.role === "user" ? "row-reverse" : "row",
                      alignItems: "flex-start",
                      gap: 10,
                      maxWidth: "70%", // good on large screens
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "999px",
                        backgroundColor: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: m.role === "user" ? "#2563eb" : "#10b981",
                        flexShrink: 0,
                        boxShadow: "0 4px 10px rgba(15,23,42,0.25)",
                      }}
                    >
                      {m.role === "user" ? "You" : "AI"}
                    </div>

                    {/* Bubble */}
                    <div
                      style={{
                        backgroundColor:
                          m.role === "user" ? t.userBubble : t.botBubble,
                        color: m.role === "user" ? "#f9fafb" : t.textMain,
                        padding: "9px 12px",
                        borderRadius: 14,
                        borderBottomLeftRadius:
                          m.role === "assistant" ? 4 : 14,
                        borderBottomRightRadius:
                          m.role === "user" ? 4 : 14,
                        fontSize: "0.94rem",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        boxShadow:
                          theme === "dark"
                            ? "0 10px 25px rgba(15,23,42,0.7)"
                            : "0 8px 18px rgba(148,163,184,0.5)",
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: t.textSubtle,
                    marginTop: 6,
                  }}
                >
                  AI is thinking…
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </main>

      {/* INPUT AREA */}
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          padding: "10px 0 14px",
          background:
            theme === "dark"
              ? "linear-gradient(to top, rgba(5,8,22,1), rgba(5,8,22,0.9), rgba(5,8,22,0))"
              : "linear-gradient(to top, rgba(243,244,246,1), rgba(243,244,246,0.95), rgba(243,244,246,0))",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            maxWidth: "1200px",
            padding: "0 20px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: t.inputBg,
              borderRadius: 999,
              border: `1px solid ${t.border}`,
              padding: "6px 52px 6px 16px",
              display: "flex",
              alignItems: "center",
              boxShadow:
                theme === "dark"
                  ? "0 10px 30px rgba(15,23,42,0.9)"
                  : "0 8px 24px rgba(148,163,184,0.5)",
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message your custom AI agent..."
              rows={1}
              style={{
                flex: 1,
                resize: "none",
                border: "none",
                outline: "none",
                background: "transparent",
                color: t.textMain,
                fontSize: "0.95rem",
                maxHeight: 120,
                paddingTop: 6,
                paddingBottom: 6,
                fontFamily:"Poppins"
              }}
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                position: "absolute",
                right: 10,
                width: 55,
                height: 35,
                borderRadius: "500px",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  loading || !input.trim() ? "#6b7280" : "#2563eb",
                color: "#020617",
                cursor:
                  loading || !input.trim() ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
                // boxShadow: "0 6px 16px rgba(34,197,94,0.45)",
                boxShadow: "0 6px 16px rgba(114, 168, 134, 0.45)",
              }}
            >
              <IoMdSend />
            </button>
          </div>

          <div
            style={{
              fontSize: "0.72rem",
              color: t.textSubtle,
              textAlign: "center",
            }}
          >
            Press <strong>Enter</strong> to send ·{" "}
            <strong>Shift + Enter</strong> for new line · Theme:{" "}
            {theme === "dark" ? "Dark" : "Light"}
          </div>
        </form>
      </footer>
    </div>
  );
}

export default App;
