"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Speaker {
  id: string;
  name: string;
  email: string;
  speaker_bio: string | null;
  speaker_tagline: string | null;
  speaker_photo: string | null;
  speaker_twitter: string | null;
  speaker_github: string | null;
  speaker_website: string | null;
  speaker_company: string | null;
  talk_count: number;
}

type FormStep = 'personal' | 'links' | 'bio' | 'talk';

const FORMAT_OPTIONS = [
  { value: 'talk', label: '🎤 Talk' },
  { value: 'workshop', label: '🔧 Workshop' },
  { value: 'lightning', label: '⚡ Lightning' },
  { value: 'panel', label: '👥 Panel' },
  { value: 'fireside', label: '🔥 Fireside' },
];

const STEPS: FormStep[] = ['personal', 'links', 'bio', 'talk'];
const STEP_LABELS: Record<FormStep, string> = {
  personal: 'Info personal',
  links: 'Links',
  bio: 'Bio',
  talk: 'Tu charla',
};

export default function SpeakersPage() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<FormStep>('personal');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', email: '', tagline: '', company: '',
    twitter: '', github: '', website: '',
    bio: '',
    talkTitle: '', talkDescription: '', talkFormat: 'talk', talkDuration: '30',
    includeTalk: false,
  });

  useEffect(() => {
    fetch('/api/speakers')
      .then(r => r.json())
      .then(d => setSpeakers(d.speakers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: string | boolean) => setForm(f => ({ ...f, [key]: value }));

  const currentStepIndex = STEPS.indexOf(step);

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setStep(STEPS[currentStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setStep(STEPS[currentStepIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      setError('Nombre y email son requeridos');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      // Register speaker
      const res = await fetch('/api/speakers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          tagline: form.tagline,
          company: form.company,
          twitter: form.twitter,
          github: form.github,
          website: form.website,
          bio: form.bio,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrarse');

      // Optionally create talk (would need auth; skip for now, just note)
      setSubmitted(true);
      // Refresh speakers list
      const speakersRes = await fetch('/api/speakers');
      const speakersData = await speakersRes.json();
      setSpeakers(speakersData.speakers || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050d1a] text-foreground">
      {/* Hero / CTA section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0a1628] to-[#050d1a] border-b border-white/5">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(ellipse at 20% 50%, #f59e0b33 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #3b82f633 0%, transparent 60%)'
        }} />
        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-amber-400 text-sm font-medium mb-6">
            ⚡ La Crypta Meetups
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
            Compartí tu conocimiento
          </h1>
          <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto">
            Sumáte como speaker en los meetups de La Crypta. Bitcoin, Lightning, Nostr y todo lo que construye el futuro del dinero libre.
          </p>
          <Button
            onClick={() => { setShowForm(true); setSubmitted(false); setStep('personal'); }}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3 text-base rounded-lg transition-all"
          >
            Quiero dar una charla →
          </Button>
        </div>
      </div>

      {/* Registration Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-[#0d1f3c] border-white/10 p-6 relative">
            <button
              className="absolute top-4 right-4 text-white/40 hover:text-white text-xl"
              onClick={() => setShowForm(false)}
            >✕</button>

            {submitted ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-xl font-bold text-white mb-2">¡Registrado!</h2>
                <p className="text-white/60 mb-6">Tu perfil de speaker fue creado. Te contactaremos pronto.</p>
                <Button onClick={() => setShowForm(false)} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
                  Cerrar
                </Button>
              </div>
            ) : (
              <>
                {/* Step indicator */}
                <div className="flex gap-2 mb-6">
                  {STEPS.map((s, i) => (
                    <div key={s} className="flex-1">
                      <div className={`h-1 rounded-full transition-all ${i <= currentStepIndex ? 'bg-amber-500' : 'bg-white/10'}`} />
                      <div className={`text-xs mt-1 text-center ${i === currentStepIndex ? 'text-amber-400' : 'text-white/30'}`}>
                        {STEP_LABELS[s]}
                      </div>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded mb-4">
                    {error}
                  </div>
                )}

                {step === 'personal' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-white">Info personal</h2>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                      placeholder="Nombre completo *"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                    />
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                      placeholder="Email *"
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                    />
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                      placeholder="Tagline (ej: Bitcoin developer @ La Crypta)"
                      value={form.tagline}
                      onChange={e => set('tagline', e.target.value)}
                    />
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                      placeholder="Empresa / organización"
                      value={form.company}
                      onChange={e => set('company', e.target.value)}
                    />
                  </div>
                )}

                {step === 'links' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-white">Links</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 w-5">𝕏</span>
                      <input
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                        placeholder="@usuario en Twitter/X"
                        value={form.twitter}
                        onChange={e => set('twitter', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 w-5">⌨</span>
                      <input
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                        placeholder="GitHub username"
                        value={form.github}
                        onChange={e => set('github', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 w-5">🌐</span>
                      <input
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                        placeholder="Website / blog"
                        value={form.website}
                        onChange={e => set('website', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {step === 'bio' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-white">Tu bio</h2>
                    <p className="text-white/40 text-sm">Contanos quién sos, qué construís, por qué hablar en La Crypta.</p>
                    <textarea
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 min-h-[120px] resize-none"
                      placeholder="Ej: Developer de Bitcoin desde 2013, construí el primer exchange de LATAM..."
                      value={form.bio}
                      onChange={e => set('bio', e.target.value)}
                    />
                  </div>
                )}

                {step === 'talk' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-white">Proponé una charla</h2>
                    <p className="text-white/40 text-sm">Opcional — podés proponer una charla ahora o después.</p>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.includeTalk}
                        onChange={e => set('includeTalk', e.target.checked)}
                        className="w-4 h-4 accent-amber-500"
                      />
                      <span className="text-white/70 text-sm">Quiero proponer una charla ahora</span>
                    </label>

                    {form.includeTalk && (
                      <div className="space-y-3 pt-2">
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                          placeholder="Título de la charla *"
                          value={form.talkTitle}
                          onChange={e => set('talkTitle', e.target.value)}
                        />
                        <textarea
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 min-h-[80px] resize-none"
                          placeholder="Descripción breve"
                          value={form.talkDescription}
                          onChange={e => set('talkDescription', e.target.value)}
                        />
                        <div className="flex gap-3">
                          <select
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500/50"
                            value={form.talkFormat}
                            onChange={e => set('talkFormat', e.target.value)}
                          >
                            {FORMAT_OPTIONS.map(o => (
                              <option key={o.value} value={o.value} className="bg-[#0d1f3c]">{o.label}</option>
                            ))}
                          </select>
                          <select
                            className="w-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500/50"
                            value={form.talkDuration}
                            onChange={e => set('talkDuration', e.target.value)}
                          >
                            {['10','15','20','30','45','60','90'].map(d => (
                              <option key={d} value={d} className="bg-[#0d1f3c]">{d} min</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                  {currentStepIndex > 0 ? (
                    <Button variant="ghost" onClick={handleBack} className="text-white/60 hover:text-white">
                      ← Atrás
                    </Button>
                  ) : <div />}

                  {currentStepIndex < STEPS.length - 1 ? (
                    <Button onClick={handleNext} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
                      Siguiente →
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
                    >
                      {submitting ? 'Enviando...' : 'Registrarme ⚡'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Speaker grid */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-white mb-2">Speakers</h2>
        <p className="text-white/40 mb-8">Las personas que comparten su conocimiento en La Crypta.</p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : speakers.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <div className="text-5xl mb-4">🎤</div>
            <p>Todavía no hay speakers registrados.</p>
            <p className="text-sm mt-1">¡Sé el primero!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {speakers.map(speaker => (
              <SpeakerCard key={speaker.id} speaker={speaker} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SpeakerCard({ speaker }: { speaker: Speaker }) {
  return (
    <Card className="bg-[#0d1f3c] border-white/10 p-5 flex flex-col gap-3 hover:border-amber-500/20 transition-all">
      <div className="flex items-start gap-3">
        {speaker.speaker_photo ? (
          <img
            src={speaker.speaker_photo}
            alt={speaker.name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-amber-500/20"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl flex-shrink-0">
            🎤
          </div>
        )}
        <div className="min-w-0">
          <div className="font-semibold text-white truncate">{speaker.name}</div>
          {speaker.speaker_tagline && (
            <div className="text-xs text-white/50 truncate">{speaker.speaker_tagline}</div>
          )}
          {speaker.speaker_company && (
            <div className="text-xs text-amber-400/70 truncate">{speaker.speaker_company}</div>
          )}
        </div>
      </div>

      {speaker.speaker_bio && (
        <p className="text-white/50 text-xs line-clamp-2">{speaker.speaker_bio}</p>
      )}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex gap-2">
          {speaker.speaker_twitter && (
            <a href={`https://twitter.com/${speaker.speaker_twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer"
              className="text-white/30 hover:text-amber-400 transition-colors text-sm">𝕏</a>
          )}
          {speaker.speaker_github && (
            <a href={`https://github.com/${speaker.speaker_github}`} target="_blank" rel="noopener noreferrer"
              className="text-white/30 hover:text-amber-400 transition-colors text-sm">⌨</a>
          )}
          {speaker.speaker_website && (
            <a href={speaker.speaker_website} target="_blank" rel="noopener noreferrer"
              className="text-white/30 hover:text-amber-400 transition-colors text-sm">🌐</a>
          )}
        </div>
        {speaker.talk_count > 0 && (
          <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
            {speaker.talk_count} talk{speaker.talk_count !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </Card>
  );
}
