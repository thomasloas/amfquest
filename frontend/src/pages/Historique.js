import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";

export default function Historique() {
  const [sessions, setSessions] = useState([]);
  useEffect(() => { api.get("/sessions").then((r) => setSessions(r.data)); }, []);

  return (
    <div data-testid="history-page" className="max-w-5xl mx-auto px-6 lg:px-10 py-14">
      <div className="overline mb-3">HISTORIQUE</div>
      <h1 className="font-heading text-4xl tracking-tighter font-black">Toutes vos sessions.</h1>

      <div className="mt-10 border border-zinc-200 bg-white">
        {sessions.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            Aucune session pour le moment.<br />
            <Link to="/entrainement" className="text-[#002FA7] font-semibold">Commencer maintenant →</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-left">
              <tr>
                <th className="p-3 font-semibold">DÉBUT</th>
                <th className="p-3 font-semibold">MODE</th>
                <th className="p-3 font-semibold">SCORE</th>
                <th className="p-3 font-semibold">STATUT</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t border-zinc-200">
                  <td className="p-3">{new Date(s.started_at).toLocaleString("fr-FR")}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-bold ${s.mode === "exam" ? "bg-[#002FA7] text-white" : "bg-zinc-100 text-zinc-700"}`}>
                      {s.mode === "exam" ? "EXAMEN" : "ENTRAÎNEMENT"}
                    </span>
                  </td>
                  <td className="p-3 font-mono-ibm font-bold">
                    {s.finished_at ? `${s.score}/${s.total} · ${s.percent}%` : "—"}
                  </td>
                  <td className="p-3">
                    {!s.finished_at ? <span className="text-amber-600 font-semibold">En cours</span> :
                      s.passed === true ? <span className="text-green-600 font-semibold">Réussi</span> :
                      s.passed === false ? <span className="text-red-600 font-semibold">Échoué</span> :
                      <span className="text-zinc-500">Terminé</span>}
                  </td>
                  <td className="p-3 text-right">
                    {s.finished_at ?
                      <Link to={`/resultats/${s.id}`} className="text-[#002FA7] font-semibold">Détails</Link> :
                      <Link to={`/quiz/${s.id}`} className="text-[#002FA7] font-semibold">Reprendre</Link>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
