"use client";

import { useTranslation } from "../i18n/useTranslation";
import { useIsMobile } from "../hooks/useMediaQuery";
import { theme } from "../lib/theme";

export function BlogPost() {
  const { lang } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <section id="blog" style={styles.section}>
      <div
        style={{
          ...styles.inner,
          maxWidth: 800,
          padding: isMobile ? "0 20px" : "0 40px",
        }}
      >
        <article style={styles.article}>
          <h1 style={styles.title}>
            {lang === "es" 
              ? "La Ventaja del Emprendedor en la Era de la IA"
              : "The Entrepreneur's Advantage in the AI Era"}
          </h1>
          
          <div style={styles.meta}>
            <span>Agustin Kassis</span>
            <span style={styles.dot}>•</span>
            <span>OpenClaw Meetup 2026</span>
          </div>

          <div style={styles.content}>
            <h2 style={styles.h2}>
              {lang === "es" ? "El momento es ahora" : "The moment is now"}
            </h2>
            <p style={styles.p}>
              {lang === "es"
                ? "Estamos viviendo un punto de inflexión. La inteligencia artificial está cambiando las reglas del juego, y por primera vez en décadas, los emprendedores tienen una ventaja estructural sobre las grandes empresas."
                : "We're living at an inflection point. AI is changing the rules of the game, and for the first time in decades, entrepreneurs have a structural advantage over large companies."}
            </p>

            <h2 style={styles.h2}>
              {lang === "es" ? "¿Por qué las empresas grandes van lento?" : "Why do big companies move slowly?"}
            </h2>
            <p style={styles.p}>
              {lang === "es" ? "Las corporaciones tienen:" : "Corporations have:"}
            </p>
            <ul style={styles.ul}>
              <li><strong>{lang === "es" ? "Burocracia" : "Bureaucracy"}:</strong> {lang === "es" ? "Cada decisión pasa por 10 niveles de aprobación" : "Every decision goes through 10 levels of approval"}</li>
              <li><strong>Legal & Compliance:</strong> {lang === "es" ? "Meses de revisión antes de implementar" : "Months of review before implementation"}</li>
              <li><strong>Legacy Systems:</strong> {lang === "es" ? "Sistemas de hace 20 años que no pueden tocar" : "20-year-old systems they can't touch"}</li>
              <li><strong>{lang === "es" ? "Comités" : "Committees"}:</strong> {lang === "es" ? '"Formemos un comité para evaluar la IA"' : '"Let\'s form a committee to evaluate AI"'}</li>
              <li><strong>{lang === "es" ? "Miedo al riesgo" : "Risk aversion"}:</strong> {lang === "es" ? "Prefieren no moverse a moverse mal" : "They'd rather not move than move wrong"}</li>
            </ul>

            <p style={styles.p}>
              {lang === "es" ? "Mientras tanto, el emprendedor:" : "Meanwhile, the entrepreneur:"}
            </p>
            <div style={styles.codeBlock}>
              <code>Idea → {lang === "es" ? "Implementación" : "Implementation"} → {lang === "es" ? "Iteración" : "Iteration"} → Escala</code>
              <br />
              <small>({lang === "es" ? "en días, no en meses" : "in days, not months"})</small>
            </div>

            <h2 style={styles.h2}>
              {lang === "es" ? "La ventaja concreta" : "The concrete advantage"}
            </h2>

            <h3 style={styles.h3}>1. {lang === "es" ? "Velocidad de adopción" : "Speed of adoption"}</h3>
            <p style={styles.p}>
              {lang === "es"
                ? "Un emprendedor puede instalar OpenClaw hoy y tener un agente funcionando mañana. Una empresa grande necesita 6-12 meses de aprobaciones, revisiones y pilotos. El emprendedor ya facturó."
                : "An entrepreneur can install OpenClaw today and have an agent running tomorrow. A large company needs 6-12 months of approvals, reviews, and pilots. The entrepreneur already billed."}
            </p>

            <h3 style={styles.h3}>2. {lang === "es" ? "Sin sistemas heredados" : "No legacy systems"}</h3>
            <p style={styles.p}>
              {lang === "es"
                ? 'Las grandes empresas tienen sistemas de los 90s que "no se pueden tocar". El emprendedor empieza de cero, con las mejores herramientas disponibles hoy.'
                : 'Large companies have 90s systems that "can\'t be touched". The entrepreneur starts from scratch, with the best tools available today.'}
            </p>

            <h3 style={styles.h3}>3. {lang === "es" ? "Costos marginales" : "Marginal costs"}</h3>
            <p style={styles.p}>
              {lang === "es"
                ? 'Con herramientas open source como OpenClaw, el costo de tener un "empleado digital" es una fracción de lo que paga una corporación por soluciones enterprise.'
                : 'With open source tools like OpenClaw, the cost of having a "digital employee" is a fraction of what a corporation pays for enterprise solutions.'}
            </p>

            <h3 style={styles.h3}>4. {lang === "es" ? "Experimentación sin permiso" : "Permission-less experimentation"}</h3>
            <p style={styles.p}>
              {lang === "es"
                ? "El emprendedor puede probar 10 ideas esta semana. La corporación necesita un business case para cada una."
                : "The entrepreneur can test 10 ideas this week. The corporation needs a business case for each one."}
            </p>

            <h2 style={styles.h2}>
              {lang === "es" ? "La paradoja" : "The paradox"}
            </h2>
            <p style={styles.p}>
              {lang === "es"
                ? "Las empresas grandes tienen más recursos, pero los recursos no ganan esta carrera. Gana la velocidad. Gana la adaptabilidad. Gana el que está dispuesto a experimentar."
                : "Large companies have more resources, but resources don't win this race. Speed wins. Adaptability wins. The willingness to experiment wins."}
            </p>

            <h2 style={styles.h2}>
              {lang === "es" ? "El mensaje" : "The message"}
            </h2>
            <p style={styles.p}>
              {lang === "es"
                ? "Si sos emprendedor, este es tu momento. Las herramientas que antes solo tenían las grandes empresas ahora están disponibles para vos. Gratis. Open source. Listas para usar."
                : "If you're an entrepreneur, this is your moment. The tools that only big companies had are now available to you. Free. Open source. Ready to use."}
            </p>
            <p style={styles.highlight}>
              {lang === "es"
                ? "La pregunta no es si podés competir con las grandes empresas. La pregunta es: ¿cuánto terreno vas a ganar mientras ellos siguen en reuniones?"
                : "The question isn't whether you can compete with big companies. The question is: how much ground will you gain while they're still in meetings?"}
            </p>

            <blockquote style={styles.quote}>
              "{lang === "es" 
                ? "La IA no reemplaza emprendedores. Reemplaza a los que no la usan."
                : "AI doesn't replace entrepreneurs. It replaces those who don't use it."}"
            </blockquote>
          </div>
        </article>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    padding: `${theme.spacing.section}px 0`,
    background: theme.colors.background,
  },
  inner: {
    margin: "0 auto",
  },
  article: {
    background: theme.colors.cardBg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 16,
    padding: 40,
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: 800,
    margin: "0 0 16px 0",
    lineHeight: 1.2,
  },
  meta: {
    color: theme.colors.textDim,
    fontSize: 14,
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  dot: {
    margin: "0 8px",
  },
  content: {},
  h2: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: 700,
    margin: "32px 0 16px 0",
  },
  h3: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: 600,
    margin: "24px 0 12px 0",
  },
  p: {
    color: theme.colors.textMuted,
    fontSize: 16,
    lineHeight: 1.7,
    margin: "0 0 16px 0",
  },
  ul: {
    color: theme.colors.textMuted,
    fontSize: 16,
    lineHeight: 1.7,
    paddingLeft: 24,
    margin: "0 0 16px 0",
  },
  codeBlock: {
    background: theme.colors.background,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 8,
    padding: 16,
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    color: theme.colors.primary,
    margin: "16px 0",
    textAlign: "center" as const,
  },
  highlight: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.6,
    margin: "24px 0",
  },
  quote: {
    background: `linear-gradient(135deg, ${theme.colors.primary}22 0%, ${theme.colors.primary}11 100%)`,
    border: `1px solid ${theme.colors.primary}44`,
    borderRadius: 12,
    padding: 24,
    margin: "32px 0 0 0",
    fontStyle: "italic",
    fontSize: 18,
    color: theme.colors.text,
    textAlign: "center" as const,
  },
};
