import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";

export default function Themes() {
  const [cats, setCats] = useState([]);
  useEffect(() => { api.get("/categories").then((r) => setCats(r.data)); }, []);

  return (
    <div data-testid="themes-page" className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <div className="overline mb-4">12 THÈMES OFFICIELS</div>
      <h1 className="font-heading text-5xl sm:text-6xl tracking-tighter font-black text-zinc-900 max-w-3xl leading-[1]">
        Toute la matière du programme AMF.
      </h1>
      <p className="text-zinc-600 mt-6 max-w-2xl">
        Notre banque de questions couvre l'intégralité des thématiques exigées par l'examen de certification professionnelle.
      </p>

      <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cats.map((c, i) => (
          <div key={c.key} data-testid={`theme-${c.key}`} className="tech-card">
            <div className="flex items-start justify-between">
              <div className="overline text-zinc-400">{String(i + 1).padStart(2, "0")}</div>
              <div className="text-xs font-mono-ibm text-[#002FA7] font-bold">{c.question_count} questions</div>
            </div>
            <h3 className="font-heading text-xl font-bold mt-4 tracking-tight">{c.title}</h3>
            <p className="text-zinc-600 text-sm mt-2 leading-relaxed">{c.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 border-t border-zinc-200 pt-10 flex flex-col sm:flex-row gap-4 sm:justify-between items-start sm:items-center">
        <p className="text-zinc-600">Prêt à passer à la pratique ?</p>
        <Link to="/inscription" className="btn-primary">Commencer un entraînement</Link>
      </div>
    </div>
  );
}
