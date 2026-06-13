import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Sparkles } from "lucide-react";

export default function Themes() {
  const [cats, setCats] = useState([]);
  const { user } = useAuth();
  const isPremium = !!user?.subscription_active;

  useEffect(() => { api.get("/categories").then((r) => setCats(r.data)); }, [user]);

  const blocks = { A: cats.filter((c) => c.block === "A"), C: cats.filter((c) => c.block === "C") };

  return (
    <div data-testid="themes-page" className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <div className="overline mb-4">15 THÈMES OFFICIELS · 2 389 QUESTIONS</div>
      <h1 className="font-heading text-5xl sm:text-6xl tracking-tighter font-black text-zinc-900 max-w-3xl leading-[1]">
        Toute la matière du programme AMF.
      </h1>
      <p className="text-zinc-600 mt-6 max-w-2xl">
        2 thèmes accessibles gratuitement après inscription. Accès illimité aux 15 thèmes en passant à la formule Premium.
      </p>

      {!user && (
        <div className="mt-8 border border-[#002FA7] bg-[#EFF3FF] p-5 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-zinc-800"><strong>Inscrivez-vous gratuitement</strong> pour accéder à 50 questions sur 2 thèmes.</p>
          <Link to="/inscription" className="btn-primary !py-2 !px-4 text-sm">Créer un compte</Link>
        </div>
      )}
      {user && !isPremium && (
        <div className="mt-8 border border-[#002FA7] bg-[#EFF3FF] p-5 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-zinc-800">Vous êtes en formule <strong>gratuite</strong>. Passez Premium pour débloquer les 15 thèmes et l'examen blanc.</p>
          <Link to="/abonnement" data-testid="themes-cta-upgrade" className="btn-primary !py-2 !px-4 text-sm">
            <Sparkles size={14} /> Passer Premium · 19,99€/mois
          </Link>
        </div>
      )}

      {["A", "C"].map((b) => (
        <section key={b} className="mt-14">
          <div className="flex items-baseline gap-4">
            <div className="overline text-zinc-500">CATÉGORIE {b}</div>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {blocks[b].map((c, i) => (
              <div key={c.key} data-testid={`theme-${c.key}`} className="tech-card relative">
                <div className="flex items-start justify-between">
                  <div className="overline text-zinc-400">{String(i + 1).padStart(2, "0")}</div>
                  {c.is_locked ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-zinc-500 uppercase">
                      <Lock size={12} /> Premium
                    </div>
                  ) : c.is_free_theme ? (
                    <div className="text-xs font-bold text-[#059669] uppercase">Gratuit</div>
                  ) : (
                    <div className="text-xs font-mono-ibm text-[#002FA7] font-bold">{c.question_count} questions</div>
                  )}
                </div>
                <h3 className="font-heading text-xl font-bold mt-4 tracking-tight">{c.title}</h3>
                <p className="text-zinc-600 text-sm mt-2 leading-relaxed">{c.description}</p>
                <div className="mt-4 text-xs text-zinc-500 font-mono-ibm">
                  {c.is_free_theme ? `${c.free_count} questions gratuites · ` : ""}{c.question_count} questions au total
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="mt-16 border-t border-zinc-200 pt-10 flex flex-col sm:flex-row gap-4 sm:justify-between items-start sm:items-center">
        <p className="text-zinc-600">Prêt à passer à la pratique ?</p>
        <Link to={user ? "/entrainement" : "/inscription"} className="btn-primary">
          {user ? "Commencer un entraînement" : "Créer un compte gratuit"}
        </Link>
      </div>
    </div>
  );
}
