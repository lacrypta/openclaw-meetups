"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<"loading" | "confirm" | "success" | "already" | "invalid">("loading");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    fetch(`/api/unsubscribe?token=${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("invalid");
        return res.json();
      })
      .then((data) => {
        setEmail(data.email);
        setState(data.subscribed ? "confirm" : "already");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  const handleUnsubscribe = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setState("success");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1a2540] rounded-2xl p-8 text-center shadow-xl border border-white/5">
        <div className="text-4xl mb-4">⚡</div>

        {state === "loading" && (
          <p className="text-gray-400">Cargando...</p>
        )}

        {state === "confirm" && (
          <>
            <h1 className="text-xl font-bold text-white mb-2">
              ¿Dejar de recibir emails?
            </h1>
            <p className="text-gray-400 mb-6 text-sm">
              Vas a desuscribir a <span className="text-white font-medium">{email}</span> de nuestros emails.
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={submitting}
              className="w-full bg-[#ff8c00] hover:bg-[#e07d00] text-black font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? "Procesando..." : "Confirmar"}
            </button>
          </>
        )}

        {state === "success" && (
          <>
            <h1 className="text-xl font-bold text-white mb-2">
              ✅ Te desuscribiste
            </h1>
            <p className="text-gray-400 text-sm">
              No vas a recibir más emails.
            </p>
          </>
        )}

        {state === "already" && (
          <>
            <h1 className="text-xl font-bold text-white mb-2">
              Ya estás desuscripto
            </h1>
            <p className="text-gray-400 text-sm">
              Este email ya no recibe nuestras comunicaciones.
            </p>
          </>
        )}

        {state === "invalid" && (
          <>
            <h1 className="text-xl font-bold text-white mb-2">
              Link inválido
            </h1>
            <p className="text-gray-400 text-sm">
              Este link de desuscripción no es válido.
            </p>
          </>
        )}

        <div className="mt-8 text-xs text-gray-600">
          La Crypta ⚡
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
