"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getToken } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  phone: string | null;
  status: string;
  user_id: string | null;
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
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
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
  return !str ? "" : str.length > max ? str.slice(0, max) + "…" : str;
}

// ─── Session List Item ─────────────────────────────────────────────────────────

function SessionItem({ session, selected, onClick }: { session: Session; selected: boolean; onClick: () => void }) {
  const displayName = session.users?.name || session.phone || "Desconocido";
  const subtitle = session.users?.name ? (session.phone || "") : (session.events?.name || "");
  const lastMsg = session.last_message;
  const preview = lastMsg ? truncate(lastMsg.content) : "Sin mensajes";
  const ts = lastMsg ? lastMsg.created_at : session.updated_at;
  const unassigned = !session.user_id;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 flex gap-3 items-start border-b border-border hover:bg-muted/50 transition-colors",
        selected && "bg-primary/15 hover:bg-primary/20"
      )}
    >
      <div className="shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
        {displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-sm text-foreground truncate">{displayName}</span>
            {unassigned && <span className="text-amber-500 text-xs" title="Sin usuario asignado">⚠️</span>}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{formatDate(ts)}</span>
        </div>
        {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
        <div className="text-xs text-muted-foreground truncate mt-0.5">{preview}</div>
      </div>
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
  if (!isUser && !isAssistant) return null;

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

// ─── User Assignment Panel ────────────────────────────────────────────────────

function AssignPanel({
  session,
  matchingUsers,
  onAssign,
}: {
  session: Session;
  matchingUsers: UserInfo[];
  onAssign: (userId: string | null) => void;
}) {
  if (matchingUsers.length <= 1 && session.user_id) return null;

  return (
    <div className="px-4 py-2 bg-amber-950/30 border-b border-amber-800/30">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-amber-400 text-xs font-medium">
          ⚠️ {matchingUsers.length} usuario{matchingUsers.length !== 1 ? "s" : ""} con este número
        </span>
        {!session.user_id && (
          <Badge variant="outline" className="text-[10px] border-amber-700 text-amber-400">
            Sin asignar
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {matchingUsers.map((u) => (
          <Button
            key={u.id}
            size="sm"
            variant={session.user_id === u.id ? "default" : "outline"}
            className={cn(
              "text-xs h-7",
              session.user_id === u.id && "bg-amber-700 hover:bg-amber-600"
            )}
            onClick={() => onAssign(session.user_id === u.id ? null : u.id)}
          >
            {u.name || u.email} {session.user_id === u.id && "✓"}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

function SendMessageBar({ sessionId, onSent }: { sessionId: string; onSent: (msg: Message) => void }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/messaging-sessions/${sessionId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) onSent(data.message);
        setText("");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t p-3 flex gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribir mensaje..."
        className="flex-1"
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        disabled={sending}
      />
      <Button onClick={handleSend} disabled={sending || !text.trim()} size="sm">
        {sending ? "..." : "Enviar"}
      </Button>
    </div>
  );
}

export default function WhatsAppPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [matchingUsers, setMatchingUsers] = useState<UserInfo[]>([]);
  const [search, setSearch] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

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

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // SSE: real-time WhatsApp messages
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const es = new EventSource(`/api/sse/whatsapp?token=${encodeURIComponent(token)}`);

    es.addEventListener('message.new', (e) => {
      const msg = JSON.parse(e.data) as Message;

      // Update session list: bump session to top with new last_message
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === msg.session_id);
        if (idx === -1) return prev;
        const updated = [...prev];
        const session = { ...updated[idx] };
        session.last_message = { content: msg.content, role: msg.role, created_at: msg.created_at };
        session.message_count = (session.message_count || 0) + 1;
        session.updated_at = msg.created_at;
        updated.splice(idx, 1);
        return [session, ...updated];
      });

      // Append to active conversation if it matches
      if (msg.session_id === selectedIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev; // dedup
          return [...prev, msg];
        });
      }
    });

    es.addEventListener('session.new', (e) => {
      const session = JSON.parse(e.data) as Session;
      setSessions((prev) => {
        if (prev.some((s) => s.id === session.id)) return prev;
        return [{ ...session, message_count: 0, last_message: null, users: null, events: null }, ...prev];
      });
    });

    es.addEventListener('session.updated', (e) => {
      const update = JSON.parse(e.data);
      setSessions((prev) => prev.map((s) => (s.id === update.id ? { ...s, ...update } : s)));
      setActiveSession((prev) => (prev?.id === update.id ? { ...prev, ...update } : prev));
    });

    return () => es.close();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFilteredSessions(
      sessions.filter((s) => {
        if (!q) return true;
        return (
          s.phone?.toLowerCase().includes(q) ||
          s.users?.name?.toLowerCase().includes(q) ||
          s.users?.phone?.toLowerCase().includes(q) ||
          s.events?.name?.toLowerCase().includes(q) ||
          s.last_message?.content?.toLowerCase().includes(q)
        );
      })
    );
  }, [sessions, search]);

  const selectSession = useCallback(async (session: Session) => {
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
      if (data.session) setActiveSession(data.session);

      // Fetch matching users for this phone
      if (session.phone || data.session?.phone) {
        const phone = session.phone || data.session?.phone;
        const usersRes = await fetch(`/api/users?phone=${encodeURIComponent(phone)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setMatchingUsers(usersData.users ?? []);
        }
      } else {
        setMatchingUsers([]);
      }
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const handleAssign = async (userId: string | null) => {
    if (!activeSession) return;
    const token = getToken();
    if (!token) return;
    await fetch(`/api/messaging-sessions/${activeSession.id}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId }),
    });
    // Refresh
    await fetchSessions();
    if (activeSession) {
      const updated = { ...activeSession, user_id: userId };
      setActiveSession(updated as Session);
    }
  };

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const displayName = (s: Session) => s.users?.name || s.phone || "Desconocido";

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "flex flex-col border-r border-border bg-card w-full lg:w-[350px] lg:shrink-0",
        showChat ? "hidden lg:flex" : "flex"
      )}>
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-base">WhatsApp</h2>
            <Badge variant="secondary">{sessions.length}</Badge>
          </div>
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingSessions ? (
            <div className="p-4 text-sm text-muted-foreground">Cargando…</div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Sin sesiones</div>
          ) : (
            filteredSessions.map((s) => (
              <SessionItem key={s.id} session={s} selected={selectedId === s.id} onClick={() => selectSession(s)} />
            ))
          )}
        </div>
      </div>

      {/* Chat */}
      <div className={cn("flex-1 flex flex-col min-w-0", !showChat ? "hidden lg:flex" : "flex")}>
        {!activeSession ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-sm">Seleccioná una sesión para ver el chat</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3">
              <button className="lg:hidden text-muted-foreground hover:text-foreground mr-1" onClick={() => setShowChat(false)}>←</button>
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground shrink-0">
                {displayName(activeSession).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{displayName(activeSession)}</span>
                  {activeSession.phone && activeSession.users?.name && (
                    <span className="text-xs text-muted-foreground">{activeSession.phone}</span>
                  )}
                  {!activeSession.user_id && (
                    <Badge variant="outline" className="text-[10px] border-amber-700 text-amber-400">Sin asignar</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  {activeSession.events?.name && <span>{activeSession.events.name}</span>}
                  {activeSession.model_name && (
                    <><span>·</span><span>{activeSession.model_name}</span></>
                  )}
                </div>
              </div>
              <Badge
                variant={activeSession.status === "active" ? "default" : "secondary"}
                className={cn("shrink-0 text-xs", activeSession.status === "active" && "bg-emerald-700 hover:bg-emerald-700")}
              >
                {activeSession.status === "active" ? "🟢 activa" : "⚫ cerrada"}
              </Badge>
            </div>

            {/* User assignment warning */}
            {matchingUsers.length > 1 && (
              <AssignPanel session={activeSession} matchingUsers={matchingUsers} onAssign={handleAssign} />
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-background">
              {loadingMessages ? (
                <div className="text-sm text-muted-foreground">Cargando…</div>
              ) : messages.length === 0 ? (
                <div className="text-sm text-muted-foreground">Sin mensajes</div>
              ) : (
                messages.map((m) => <MessageBubble key={m.id} msg={m} />)
              )}
              <div ref={bottomRef} />
            </div>

            {/* Send message input */}
            {activeSession.status === "active" && activeSession.phone && (
              <SendMessageBar
                sessionId={activeSession.id}
                onSent={(msg) => {
                  setMessages((prev) => {
                    if (prev.some((m) => m.id === msg.id)) return prev;
                    return [...prev, msg];
                  });
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
