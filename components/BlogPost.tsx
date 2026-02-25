"use client";

import { useTranslation } from "../i18n/useTranslation";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function BlogPost() {
  const { lang } = useTranslation();

  return (
    <section id="blog" className="py-20 bg-background">
      <div className="max-w-[800px] mx-auto px-5 md:px-10">
        <Card className="p-10">
          <h1 className="text-foreground text-[32px] font-extrabold mb-4 leading-tight">
            {lang === "es"
              ? "La Ventaja del Emprendedor en la Era de la IA"
              : "The Entrepreneur's Advantage in the AI Era"}
          </h1>

          <div className="text-muted-foreground/60 text-sm mb-8 pb-6 border-b border-border">
            <span>Agustin Kassis</span>
            <span className="mx-2">•</span>
            <span>OpenClaw Meetup 2026</span>
          </div>

          <div className="prose-custom">
            <h2 className="text-foreground text-[22px] font-bold mt-8 mb-4">
              {lang === "es" ? "El momento es ahora" : "The moment is now"}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-4">
              {lang === "es"
                ? "Estamos viviendo un punto de inflexión. La inteligencia artificial está cambiando las reglas del juego, y por primera vez en décadas, los emprendedores tienen una ventaja estructural sobre las grandes empresas."
                : "We're living at an inflection point. AI is changing the rules of the game, and for the first time in decades, entrepreneurs have a structural advantage over large companies."}
            </p>

            <h2 className="text-foreground text-[22px] font-bold mt-8 mb-4">
              {lang === "es" ? "¿Por qué las empresas grandes van lento?" : "Why do big companies move slowly?"}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-4">
              {lang === "es" ? "Las corporaciones tienen:" : "Corporations have:"}
            </p>
            <ul className="text-muted-foreground text-base leading-relaxed pl-6 mb-4 list-disc">
              <li><strong>{lang === "es" ? "Burocracia" : "Bureaucracy"}:</strong> {lang === "es" ? "Cada decisión pasa por 10 niveles de aprobación" : "Every decision goes through 10 levels of approval"}</li>
              <li><strong>Legal & Compliance:</strong> {lang === "es" ? "Meses de revisión antes de implementar" : "Months of review before implementation"}</li>
              <li><strong>Legacy Systems:</strong> {lang === "es" ? "Sistemas de hace 20 años que no pueden tocar" : "20-year-old systems they can't touch"}</li>
              <li><strong>{lang === "es" ? "Comités" : "Committees"}:</strong> {lang === "es" ? '"Formemos un comité para evaluar la IA"' : '"Let\'s form a committee to evaluate AI"'}</li>
              <li><strong>{lang === "es" ? "Miedo al riesgo" : "Risk aversion"}:</strong> {lang === "es" ? "Prefieren no moverse a moverse mal" : "They'd rather not move than move wrong"}</li>
            </ul>

            <p className="text-muted-foreground text-base leading-relaxed mb-4">
              {lang === "es" ? "Mientras tanto, el emprendedor:" : "Meanwhile, the entrepreneur:"}
            </p>
            <div className="bg-background border border-border rounded-lg p-4 font-mono text-sm text-primary my-4 text-center">
              <code>Idea → {lang === "es" ? "Implementación" : "Implementation"} → {lang === "es" ? "Iteración" : "Iteration"} → Escala</code>
              <br />
              <small className="text-muted-foreground">({lang === "es" ? "en días, no en meses" : "in days, not months"})</small>
            </div>

            <h2 className="text-foreground text-[22px] font-bold mt-8 mb-4">
              {lang === "es" ? "La ventaja concreta" : "The concrete advantage"}
            </h2>

            <h3 className="text-primary text-lg font-semibold mt-6 mb-3">
              1. {lang === "es" ? "Velocidad de adopción" : "Speed of adoption"}
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed mb-4">
              {lang === "es"
                ? "Un emprendedor puede instalar OpenClaw hoy y tener un agente funcionando mañana. Una empresa grande necesita 6-12 meses de aprobaciones, revisiones y pilotos. El emprendedor ya facturó."
                : "An entrepreneur can install OpenClaw today and have an agent running tomorrow. A large company needs 6-12 months of approvals, reviews, and pilots. The entrepreneur already billed."}
            </p>

            <h3 className="text-primary text-lg font-semibold mt-6 mb-3">
              2. {lang === "es" ? "Sin sistemas heredados" : "No legacy systems"}
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed mb-4">
              {lang === "es"
                ? 'Las grandes empresas tienen sistemas de los 90s que "no se pueden tocar". El emprendedor empieza de cero, con las mejores herramientas disponibles hoy.'
                : 'Large companies have 90s systems that "can\'t be touched". The entrepreneur starts from scratch, with the best tools available today.'}
            </p>

            <h3 className="text-primary text-lg font-semibold mt-6 mb-3">
              3. {lang === "es" ? "Costos marginales" : "Marginal costs"}
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed mb-4">
              {lang === "es"
                ? 'Con herramientas open source como OpenClaw, el costo de tener un "empleado digital" es una fracción de lo que paga una corporación por soluciones enterprise.'
                : 'With open source tools like OpenClaw, the cost of having a "digital employee" is a fraction of what a corporation pays for enterprise solutions.'}
            </p>

            <h3 className="text-primary text-lg font-semibold mt-6 mb-3">
              4. {lang === "es" ? "Experimentación sin permiso" : "Permission-less experimentation"}
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed mb-4">
              {lang === "es"
                ? "El emprendedor puede probar 10 ideas esta semana. La corporación necesita un business case para cada una."
                : "The entrepreneur can test 10 ideas this week. The corporation needs a business case for each one."}
            </p>

            <h2 className="text-foreground text-[22px] font-bold mt-8 mb-4">
              {lang === "es" ? "La paradoja" : "The paradox"}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-4">
              {lang === "es"
                ? "Las empresas grandes tienen más recursos, pero los recursos no ganan esta carrera. Gana la velocidad. Gana la adaptabilidad. Gana el que está dispuesto a experimentar."
                : "Large companies have more resources, but resources don't win this race. Speed wins. Adaptability wins. The willingness to experiment wins."}
            </p>

            <h2 className="text-foreground text-[22px] font-bold mt-8 mb-4">
              {lang === "es" ? "El mensaje" : "The message"}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-4">
              {lang === "es"
                ? "Si sos emprendedor, este es tu momento. Las herramientas que antes solo tenían las grandes empresas ahora están disponibles para vos. Gratis. Open source. Listas para usar."
                : "If you're an entrepreneur, this is your moment. The tools that only big companies had are now available to you. Free. Open source. Ready to use."}
            </p>
            <p className="text-foreground text-lg font-semibold leading-relaxed my-6">
              {lang === "es"
                ? "La pregunta no es si podés competir con las grandes empresas. La pregunta es: ¿cuánto terreno vas a ganar mientras ellos siguen en reuniones?"
                : "The question isn't whether you can compete with big companies. The question is: how much ground will you gain while they're still in meetings?"}
            </p>

            <blockquote className="bg-primary/10 border border-primary/30 rounded-xl p-6 mt-8 italic text-lg text-foreground text-center">
              &quot;{lang === "es"
                ? "La IA no reemplaza emprendedores. Reemplaza a los que no la usan."
                : "AI doesn't replace entrepreneurs. It replaces those who don't use it."}&quot;
            </blockquote>
          </div>
        </Card>
      </div>
    </section>
  );
}
