"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Talk, TalkFormat, TalkStatus } from "@/lib/types";

const FORMAT_ICONS: Record<TalkFormat, string> = {
  talk: '🎤', workshop: '🔧', lightning: '⚡', panel: '👥', fireside: '🔥',
};

const STATUS_STYLES: Record<TalkStatus, string> = {
  draft: 'bg-muted-foreground/20 text-muted-foreground',
  submitted: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
};

const FORMAT_OPTIONS: { value: TalkFormat; label: string }[] = [
  { value: 'talk', label: '🎤 Talk' },
  { value: 'workshop', label: '🔧 Workshop' },
  { value: 'lightning', label: '⚡ Lightning' },
  { value: 'panel', label: '👥 Panel' },
  { value: 'fireside', label: '🔥 Fireside' },
];

interface TalkWithEvent extends Talk {
  event_info?: { event_name: string; start_time: string | null; event_id: string } | null;
}

export default function TalksPage() {
  const { isAuthenticated, ready, token, role } = useAuth();
  const router = useRouter();
  const [talks, setTalks] = useState<TalkWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTalk, setEditingTalk] = useState<Talk | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', format: 'talk' as TalkFormat,
    duration_minutes: 30, tags: '', slides_url: '',
  });

  const isManagerOrAdmin = role === 'manager' || role === 'admin';

  const fetchTalks = useCallback(async () => {
    if (!token) return;
    try {
      const params = isManagerOrAdmin ? '' : `?speaker_id=me`;
      const res = await fetch(`/api/talks${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // For non-manager, fetch own talks via speaker_id — but we don't know id here.
      // Use no filter and backend returns what's visible to the user.
      const res2 = await fetch('/api/talks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res2.json();
      setTalks(data.talks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, isManagerOrAdmin]);

  const checkSpeakerStatus = useCallback(async () => {
    if (!token) return;
    // We'll check from the JWT user info — for now check if they have talks or is manager
    if (isManagerOrAdmin) {
      setIsSpeaker(true);
      return;
    }
    // Try fetching own talks — if they can create, they're a speaker
    // Or check profile; simplest: attempt and handle
    setIsSpeaker(true); // Optimistic — the create endpoint will gate it
  }, [token, isManagerOrAdmin]);

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (ready && isAuthenticated) {
      checkSpeakerStatus();
      fetchTalks();
    }
  }, [ready, isAuthenticated, router, checkSpeakerStatus, fetchTalks]);

  const resetForm = () => setForm({ title: '', description: '', format: 'talk', duration_minutes: 30, tags: '', slides_url: '' });

  const openCreate = () => {
    resetForm();
    setEditingTalk(null);
    setShowForm(true);
  };

  const openEdit = (talk: Talk) => {
    setForm({
      title: talk.title,
      description: talk.description || '',
      format: talk.format,
      duration_minutes: talk.duration_minutes,
      tags: (talk.tags || []).join(', '),
      slides_url: talk.slides_url || '',
    });
    setEditingTalk(talk);
    setShowForm(true);
  };

  const handleSubmitForm = async () => {
    if (!form.title || !token) return;
    setSubmitting(true);
    try {
      const body = {
        title: form.title,
        description: form.description || null,
        format: form.format,
        duration_minutes: form.duration_minutes,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        slides_url: form.slides_url || null,
      };

      let res;
      if (editingTalk) {
        res = await fetch(`/api/talks/${editingTalk.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/talks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Error al guardar');
        return;
      }

      setShowForm(false);
      await fetchTalks();
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (talk: Talk, newStatus: TalkStatus) => {
    if (!token) return;
    await fetch(`/api/talks/${talk.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchTalks();
  };

  const handleDelete = async (talk: Talk) => {
    if (!confirm(`¿Eliminar "${talk.title}"?`)) return;
    if (!token) return;
    const res = await fetch(`/api/talks/${talk.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Error al eliminar');
      return;
    }
    await fetchTalks();
  };

  if (!ready) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mis Charlas</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestioná tus propuestas de charlas</p>
        </div>
        <Button onClick={openCreate} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
          + Nueva charla
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 h-20 animate-pulse bg-muted" />
          ))}
        </div>
      ) : talks.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-3">🎤</div>
          <p className="text-muted-foreground mb-4">No tenés charlas todavía.</p>
          <Button onClick={openCreate} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
            Crear mi primera charla
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {talks.map(talk => (
            <Card key={talk.id} className="p-4 flex items-start gap-4">
              <div className="text-2xl">{FORMAT_ICONS[talk.format]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate">{talk.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[talk.status]}`}>
                    {talk.status}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {FORMAT_ICONS[talk.format]} {talk.format} · {talk.duration_minutes}min
                  </span>
                </div>
                {talk.description && (
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-1">{talk.description}</p>
                )}
                {talk.tags && talk.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {talk.tags.map(tag => (
                      <span key={tag} className="text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                )}
                {talk.event_info && (
                  <div className="text-xs text-amber-400 mt-1">
                    📅 Asignada a: {talk.event_info.event_name}
                    {talk.event_info.start_time && ` — ${new Date(talk.event_info.start_time).toLocaleString('es-AR')}`}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {talk.status === 'draft' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10 text-xs"
                    onClick={() => handleStatusChange(talk, 'submitted')}
                  >
                    Enviar a revisión
                  </Button>
                )}
                {talk.status === 'submitted' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-muted-foreground text-xs"
                    onClick={() => handleStatusChange(talk, 'draft')}
                  >
                    Volver a draft
                  </Button>
                )}
                {isManagerOrAdmin && talk.status === 'submitted' && (
                  <>
                    <Button size="sm" variant="outline" className="text-green-400 border-green-400/30 text-xs"
                      onClick={() => handleStatusChange(talk, 'approved')}>Aprobar</Button>
                    <Button size="sm" variant="outline" className="text-red-400 border-red-400/30 text-xs"
                      onClick={() => handleStatusChange(talk, 'rejected')}>Rechazar</Button>
                  </>
                )}
                <Button size="sm" variant="ghost" onClick={() => openEdit(talk)} className="text-xs">✏️</Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(talk)} className="text-red-400 hover:text-red-300 text-xs">🗑️</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Talk form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 relative">
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl"
              onClick={() => setShowForm(false)}>✕</button>
            <h2 className="text-lg font-bold mb-4">{editingTalk ? 'Editar charla' : 'Nueva charla'}</h2>

            <div className="space-y-3">
              <input
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Título *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[80px] resize-none"
                placeholder="Descripción"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
              <div className="flex gap-3">
                <select
                  className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={form.format}
                  onChange={e => setForm(f => ({ ...f, format: e.target.value as TalkFormat }))}
                >
                  {FORMAT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <select
                  className="w-32 bg-muted border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={form.duration_minutes}
                  onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) }))}
                >
                  {[10,15,20,30,45,60,90].map(d => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
              <input
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Tags (separados por coma: bitcoin, lightning, nostr)"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              />
              <input
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="URL de slides (opcional)"
                value={form.slides_url}
                onChange={e => setForm(f => ({ ...f, slides_url: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button
                onClick={handleSubmitForm}
                disabled={submitting || !form.title}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
              >
                {submitting ? 'Guardando...' : editingTalk ? 'Guardar cambios' : 'Crear charla'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
