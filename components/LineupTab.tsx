"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EventTalk, Talk, TalkFormat, TalkStatus } from "@/lib/types";

const FORMAT_ICONS: Record<TalkFormat, string> = {
  talk: '🎤', workshop: '🔧', lightning: '⚡', panel: '👥', fireside: '🔥',
};

const STATUS_STYLES: Record<TalkStatus, string> = {
  draft: 'bg-muted-foreground/20 text-muted-foreground',
  submitted: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
};

interface LineupTabProps {
  eventId: string;
}

export function LineupTab({ eventId }: LineupTabProps) {
  const { token, role } = useAuth();
  const [lineup, setLineup] = useState<EventTalk[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [availableTalks, setAvailableTalks] = useState<Talk[]>([]);
  const [loadingTalks, setLoadingTalks] = useState(false);
  const [editEntry, setEditEntry] = useState<EventTalk | null>(null);
  const [editForm, setEditForm] = useState({ start_time: '', end_time: '', room: '' });

  const isManagerOrAdmin = role === 'manager' || role === 'admin';

  const fetchLineup = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/lineup`);
      const data = await res.json();
      setLineup(data.lineup || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchLineup();
  }, [fetchLineup]);

  const fetchAvailableTalks = async () => {
    if (!token) return;
    setLoadingTalks(true);
    try {
      const res = await fetch('/api/talks?status=approved', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // Filter out already assigned talks
      const assignedIds = new Set(lineup.map(e => e.talk_id));
      setAvailableTalks((data.talks || []).filter((t: Talk) => !assignedIds.has(t.id)));
    } finally {
      setLoadingTalks(false);
    }
  };

  const handleAddTalk = async (talkId: string) => {
    if (!token) return;
    await fetch(`/api/events/${eventId}/lineup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ talk_id: talkId }),
    });
    setShowPicker(false);
    await fetchLineup();
  };

  const handleRemove = async (eventTalkId: string) => {
    if (!confirm('¿Quitar esta charla del lineup?')) return;
    if (!token) return;
    await fetch(`/api/events/${eventId}/lineup`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ event_talk_id: eventTalkId }),
    });
    await fetchLineup();
  };

  const openEditEntry = (entry: EventTalk) => {
    setEditEntry(entry);
    setEditForm({
      start_time: entry.start_time ? entry.start_time.slice(0, 16) : '',
      end_time: entry.end_time ? entry.end_time.slice(0, 16) : '',
      room: entry.room || '',
    });
  };

  const handleSaveEntry = async () => {
    if (!editEntry || !token) return;
    await fetch(`/api/events/${eventId}/lineup`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        event_talk_id: editEntry.id,
        start_time: editForm.start_time || null,
        end_time: editForm.end_time || null,
        room: editForm.room || null,
      }),
    });
    setEditEntry(null);
    await fetchLineup();
  };

  const handleMoveOrder = async (entry: EventTalk, direction: 'up' | 'down') => {
    if (!token) return;
    const currentIdx = lineup.findIndex(e => e.id === entry.id);
    const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= lineup.length) return;

    const targetEntry = lineup[targetIdx];

    await Promise.all([
      fetch(`/api/events/${eventId}/lineup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_talk_id: entry.id, sort_order: targetEntry.sort_order }),
      }),
      fetch(`/api/events/${eventId}/lineup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_talk_id: targetEntry.id, sort_order: entry.sort_order }),
      }),
    ]);
    await fetchLineup();
  };

  if (loading) {
    return (
      <Card className="p-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Lineup</h2>
        {isManagerOrAdmin && (
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
            onClick={() => { setShowPicker(true); fetchAvailableTalks(); }}
          >
            + Agregar charla
          </Button>
        )}
      </div>

      {lineup.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <div className="text-4xl mb-2">🎤</div>
          <p>No hay charlas en el lineup todavía.</p>
          {isManagerOrAdmin && (
            <Button
              className="mt-3 bg-amber-500 hover:bg-amber-400 text-black font-bold"
              size="sm"
              onClick={() => { setShowPicker(true); fetchAvailableTalks(); }}
            >
              Agregar primera charla
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {lineup.map((entry, idx) => {
            const talk = entry.talk;
            if (!talk) return null;
            return (
              <div key={entry.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                {isManagerOrAdmin && (
                  <div className="flex flex-col gap-0.5">
                    <button
                      className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-20"
                      onClick={() => handleMoveOrder(entry, 'up')}
                      disabled={idx === 0}
                    >▲</button>
                    <button
                      className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-20"
                      onClick={() => handleMoveOrder(entry, 'down')}
                      disabled={idx === lineup.length - 1}
                    >▼</button>
                  </div>
                )}

                <div className="text-xl">{FORMAT_ICONS[talk.format]}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{talk.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[talk.status]}`}>
                      {talk.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{talk.duration_minutes}min</span>
                  </div>
                  {talk.speaker && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {talk.speaker.speaker_photo && (
                        <img src={talk.speaker.speaker_photo} alt="" className="w-4 h-4 rounded-full object-cover" />
                      )}
                      <span className="text-xs text-muted-foreground">{talk.speaker.name}</span>
                      {talk.speaker.speaker_tagline && (
                        <span className="text-xs text-muted-foreground/60">· {talk.speaker.speaker_tagline}</span>
                      )}
                    </div>
                  )}
                  {(entry.start_time || entry.room) && (
                    <div className="flex gap-2 mt-0.5 text-xs text-amber-400/80">
                      {entry.start_time && <span>🕐 {new Date(entry.start_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>}
                      {entry.end_time && <span>→ {new Date(entry.end_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>}
                      {entry.room && <span>📍 {entry.room}</span>}
                    </div>
                  )}
                </div>

                {isManagerOrAdmin && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => openEditEntry(entry)}>✏️</Button>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 text-xs"
                      onClick={() => handleRemove(entry.id)}>🗑️</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add talk picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 relative max-h-[80vh] flex flex-col">
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl"
              onClick={() => setShowPicker(false)}>✕</button>
            <h2 className="text-lg font-bold mb-4">Agregar charla al lineup</h2>

            {loadingTalks ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : availableTalks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-3xl mb-2">😕</div>
                <p>No hay charlas aprobadas disponibles.</p>
                <p className="text-sm mt-1">Aprobá charlas desde el panel de Talks primero.</p>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-2">
                {availableTalks.map(talk => (
                  <button
                    key={talk.id}
                    className="w-full text-left p-3 bg-muted/30 hover:bg-muted/60 rounded-lg border border-border transition-all"
                    onClick={() => handleAddTalk(talk.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{FORMAT_ICONS[talk.format]}</span>
                      <span className="font-medium">{talk.title}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{talk.duration_minutes}min</span>
                    </div>
                    {talk.speaker && (
                      <div className="text-xs text-muted-foreground mt-0.5 ml-6">{talk.speaker.name}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Edit entry modal */}
      {editEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-sm p-6 relative">
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl"
              onClick={() => setEditEntry(null)}>✕</button>
            <h2 className="text-lg font-bold mb-4">Editar slot</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Inicio</label>
                <input
                  type="datetime-local"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={editForm.start_time}
                  onChange={e => setEditForm(f => ({ ...f, start_time: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Fin</label>
                <input
                  type="datetime-local"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={editForm.end_time}
                  onChange={e => setEditForm(f => ({ ...f, end_time: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Sala / Track</label>
                <input
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Ej: Main Stage, Sala A..."
                  value={editForm.room}
                  onChange={e => setEditForm(f => ({ ...f, room: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setEditEntry(null)}>Cancelar</Button>
              <Button onClick={handleSaveEntry} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
                Guardar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}
