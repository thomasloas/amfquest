import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Award, BarChart3, BookOpen, Clock, Sparkles, Timer } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [cats, setCats] = useState([]);
  const isPremium = !!user?.subscription_active;
  const trialActive = !!user?.trial_active;
  const trialUntil = user?.trial_until ? new Date(user.trial_until) : null;

  useEffect(() => {
    api.get("/stats").then((r) => setStats(r.data));
    api.get("/categories").then((r) => setCats(r.data));
  }, []);

  return (
    <div data-testid="dashboard-page" className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="overline mb-3">VOTRE ESPACE</div>
          <h1 className="font-heading text-4xl tracking-tighter font-black">
            Bonjour, {user?.name?.split(" ")[0]}.
          </h1>
          <p className="text-zinc-600 mt-2">Voici votre progression et vos prochaines sessions.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link to="/entrainement" data-testid="cta-start-training" className="btn-primary">
            <BookOpen size={16} /> Nouvel entraînement
          </Link>
          <Link to="/examen-blanc" data-testid="cta-start-exam" className="btn-secondary">
            <Timer size={16} /> Examen blanc
          </Link>
        </div>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Sessions terminées" value={stats?.total_sessions ?? "—"} testid="stat-sessions" />
        <StatCard label="Questions traitées" value={stats?.total_questions ?? "—"} testid="stat-questions" />
        <StatCard label="Bonnes réponses" value={stats?.total_correct ?? "—"} testid="stat-correct" />
        <StatCard label="Taux global" value={stats ? `${stats.global_percent}%` : "—"} testid="stat-percent" highlight />
      </div>

      {!isPremium && (
        <div className="mt-10 border-2 border-[#002FA7] bg-[#EFF3FF] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" data-testid="dashboard-upgrade-banner">
          <div className="flex items-start gap-4">
            <Sparkles className="text-[#002FA7] mt-1" />
            <div>
              <div className="overline text-[#002FA7]">FORMULE GRATUITE</div>
              <h3 className="font-heading text-xl font-bold mt-1">Débloquez les 2 389 questions et l'examen blanc.</h3>
              <p className="text-zinc-600 text-sm mt-1">Accès illimité aux 15 thèmes pour 19,99€ / 30 jours.</p>
            </div>
          </div>
          <Link to="/abonnement" data-testid="dashboard-cta-upgrade" className="btn-primary">Passer Premium</Link>
        </div>
      )}

          {
      isPremium && (
        <div className="mt-10 border-2 border-emerald-600 bg-emerald-50 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="overline text-emerald-700">PREMIUM ACTIF</div>
            <h3 className="font-heading text-xl font-bold mt-1">
              Votre accès Premium est actif jusqu'au{" "}
              {new Date(user.subscription_until).toLocaleString("fr-FR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </h3>
            <p className="text-zinc-600 text-sm mt-1">
              Accès illimité aux 2 389 questions, aux 15 thèmes et à l'examen blanc.
            </p>
          </div>
        </div>
      );
    }

      {!isPremium && trialActive && trialUntil && (
        <div className="mt-10 border-2 border-[#F59E0B] bg-amber-50 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" data-testid="dashboard-trial-banner">
          <div className="flex items-start gap-4">
            <Clock className="text-amber-600 mt-1" />
            <div>
              <div className="overline text-amber-700">ESSAI PREMIUM · 48H</div>
              <h3 className="font-heading text-xl font-bold mt-1">Votre essai gratuit expire le {trialUntil.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}.</h3>
              <p className="text-zinc-600 text-sm mt-1">Profitez de l'accès complet jusqu'à la fin de l'essai, puis passez Premium pour conserver vos avantages.</p>
            </div>
          </div>
          <Link to="/abonnement" data-testid="dashboard-cta-from-trial" className="btn-primary">Passer Premium</Link>
        </div>
      )}

      <div className="mt-12 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <div className="overline mb-4">DERNIÈRES SESSIONS</div>
          <div className="border border-zinc-200 bg-white">
            {(stats?.last_sessions ?? []).length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                Vous n'avez pas encore terminé de session. <Link to="/entrainement" className="text-[#002FA7] font-semibold">Commencer maintenant →</Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr className="text-left">
                    <th className="p-3 font-semibold">MODE</th>
                    <th className="p-3 font-semibold">SCORE</th>
                    <th className="p-3 font-semibold">DATE</th>
                    <th className="p-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.last_sessions.map((s) => (
                    <tr key={s.id} className="border-t border-zinc-200" data-testid={`session-row-${s.id}`}>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 text-xs font-bold ${s.mode === "exam" ? "bg-[#002FA7] text-white" : "bg-zinc-100 text-zinc-700"}`}>
                          {s.mode === "exam" ? "EXAMEN" : "ENTRAÎNEMENT"}
                        </span>
                      </td>
                      <td className="p-3 font-mono-ibm font-bold">{s.score}/{s.total} · {s.percent}%</td>
                      <td className="p-3 text-zinc-500">{new Date(s.finished_at).toLocaleDateString("fr-FR")}</td>
                      <td className="p-3 text-right">
                        <Link to={`/resultats/${s.id}`} className="text-[#002FA7] font-semibold inline-flex items-center gap-1">
                          Détails <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Link to="/historique" data-testid="link-history" className="mt-4 inline-block text-sm text-[#002FA7] font-semibold">
            Voir tout l'historique →
          </Link>
        </div>

        <div className="lg:col-span-5">
          <div className="overline mb-4">DÉMARRER PAR THÈME</div>
          <div className="border border-zinc-200 bg-white max-h-[460px] overflow-y-auto">
            {cats.map((c) => {
              const locked = c.is_locked && !isPremium;
              return (
                <Link
                  key={c.key}
                  to={locked ? "/abonnement" : `/entrainement?theme=${c.key}`}
                  data-testid={`dashboard-theme-${c.key}`}
                  className="flex items-center justify-between p-4 border-b border-zinc-100 hover:bg-zinc-50"
                >
                  <div className="flex items-center gap-3">
                    <Award size={16} className={locked ? "text-zinc-400" : "text-[#002FA7]"} />
                    <span className={`text-sm font-semibold ${locked ? "text-zinc-500" : ""}`}>{c.title}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{locked ? "Premium" : (c.is_free_theme ? `${c.free_count} gratuites` : c.question_count)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, testid, highlight }) {
  return (
    <div data-testid={testid} className={`border ${highlight ? "border-[#002FA7] border-2 bg-[#EFF3FF]" : "border-zinc-200 bg-white"} p-5`}>
      <div className="overline text-zinc-500">{label.toUpperCase()}</div>
      <div className="font-heading text-3xl font-black tracking-tighter mt-2">{value}</div>
    </div>
  );
}
