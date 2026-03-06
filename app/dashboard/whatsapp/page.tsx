"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getToken } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface EventInfo {
  id: string;
  name: string;
}

interface LastMessage {
  content: string;
  role: string;
  created_at: string;
}

interface Session {
  id: string;
  status: string;
  model_provider: string;
  model_name: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message: LastMessage | null;
  users: UserInfo | null;
  events: EventInfo | null;
}

interface Message {
  id: string;
  session_id: string;
  role: string;
  content: string;
  model_used: string | null;
  provider: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) return formatTime(iso);
  if (diff < 172800000) return "Ayer";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

function truncate(str: string, max = 55) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ─── Session List Item ─────────────────────────────────────────────────────────

function SessionItem({
  session,
  selected,
  onClick,
}: {
  session: Session;
  selected: boolean;
  onClick: () => void;
}) {
  const userName = session.users?.name ?? "Usuario desconocido";
  const eventName = session.events?.name ?? "Sin evento";
  const lastMsg = session.last_message;
  const preview = lastMsg ? truncate(lastMsg.content) : "Sin mensajes";
  const ts = lastMsg ? lastMsg.created_at : session.updated_at;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 flex gap-3 items-start border-b border-border hover:bg-muted/50 transition-colors",
        selected && "bg-primary/15 hover:bg-primary/20"
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
        {userName.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-semibold text-sm text-foreground truncate">{userName}</span>
          <span className="text-xs text-muted-foreground shrink-0">{formatDate(ts)}</span>
        </div>
        <div className="text-xs text-muted-foreground truncate">{eventName}</div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">{preview}</div>
      </div>

      {/* Status */}
      <div className="shrink-0 pt-0.5">
        {session.status === "active" ? (
          <span className="text-emerald-500 text-xs">🟢</span>
        ) : (
          <span className="text-muted-foreground text-xs">⚫</span>
        )}
      </div>
    </button>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const isAssistant = msg.role === "assistant";

  if (!isUser && !isAssistant) return null; // skip system

  return (
    <div className={cn("flex mb-2", isUser ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[72%] px-3 py-2 rounded-2xl text-sm",
          isUser
            ? "bg-muted text-foreground rounded-tl-sm"
            : "bg-emerald-900/40 border border-emerald-800/30 text-foreground rounded-tr-sm"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        <div className={cn("flex items-center gap-2 mt-1", isUser ? "justify-start" : "justify-end")}>
          {isAssistant && (msg.model_used || msg.tokens_in != null) && (
            <span className="text-[10px] text-muted-foreground">
              {msg.model_used}
              {msg.tokens_in != null && ` · ${msg.tokens_in}↑ ${msg.tokens_out ?? 0}↓`}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{formatTime(msg.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [search, setSearch] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showChat, setShowChat] = useState(false); // mobile: toggle
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/messaging-sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Filter sessions
  useEffect(() => {
    const q = search.toLowerCase();
    setFilteredSessions(
      sessions.filter((s) => {
        if (!q) return true;
        return (
          s.users?.name?.toLowerCase().includes(q) ||
          s.users?.phone?.toLowerCase().includes(q) ||
          s.events?.name?.toLowerCase().includes(q) ||
          s.last_message?.content?.toLowerCase().includes(q)
        );
      })
    );
  }, [sessions, search]);

  // Fetch messages for selected session
  const selectSession = useCallback(
    async (session: Session) => {
      setSelectedId(session.id);
      setActiveSession(session);
      setShowChat(true);
      setLoadingMessages(true);
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`/api/messaging-sessions/${session.id}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setMessages(data.messages ?? []);
        // Also update session from response if enriched
        if (data.session) {
          setActiveSession(data.session);
        }
      } finally {
        setLoadingMessages(false);
      }
    },
    []
  );

  // Auto-scroll
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const userCount = sessions.length;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Sidebar (conversation list) ─────────────────────────────────────── */}
      <div
        className={cn(
          "flex flex-col border-r border-border bg-card",
          "w-full lg:w-[350px] lg:shrink-0",
          showChat ? "hidden lg:flex" : "flex"
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-base">WhatsApp Sessions</h2>
            <Badge variant="secondary">{userCount}</Badge>
          </div>
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingSessions ? (
            <div className="p-4 text-sm text-muted-foreground">Cargando sesiones…</div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Sin sesiones</div>
          ) : (
            filteredSessions.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                selected={selectedId === s.id}
                onClick={() => selectSession(s)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Chat area ──────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          !showChat ? "hidden lg:flex" : "flex"
        )}
      >
        {!activeSession ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-sm">Seleccioná una sesión para ver el chat</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3">
              {/* Mobile back */}
              <button
                className="lg:hidden text-muted-foreground hover:text-foreground mr-1"
                onClick={() => setShowChat(false)}
              >
                ←
              </button>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground shrink-0">
                {(activeSession.users?.name ?? "?").charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">
                    {activeSession.users?.name ?? "Desconocido"}
                  </span>
                  {activeSession.users?.phone && (
                    <span className="text-xs text-muted-foreground">{activeSession.users.phone}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  {activeSession.events?.name && (
                    <span>{activeSession.events.name}</span>
                  )}
                  {activeSession.model_name && (
                    <>
                      <span>·</span>
                      <span>{activeSession.model_name}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <Badge
                variant={activeSession.status === "active" ? "default" : "secondary"}
                className={cn(
                  "shrink-0 text-xs",
                  activeSession.status === "active" && "bg-emerald-700 hover:bg-emerald-700"
                )}
              >
                {activeSession.status === "active" ? "🟢 activa" : "⚫ cerrada"}
              </Badge>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-background">
              {loadingMessages ? (
                <div className="text-sm text-muted-foreground">Cargando mensajes…</div>
              ) : messages.length === 0 ? (
                <div className="text-sm text-muted-foreground">Sin mensajes en esta sesión</div>
              ) : (
                messages.map((m) => <MessageBubble key={m.id} msg={m} />)
              )}
              <div ref={bottomRef} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
