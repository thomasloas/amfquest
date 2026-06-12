import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "@/lib/api";
import { Check, X } from "lucide-react";

const LETTERS = ["A", "B", "C", "D", "E"];

export default function Resultats() {
  const { sessionId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    // call finish (idempotent if already finished it returns same review) – but we use the GET if already finished
    api.get(`/sessions/${sessionId}`).then(async ({ data: sess }) => {
      if (!sess.finished_at) {
        const { data: result } = await api.post(`/sessions/${sessionId}/finish`);
        setData(result);
      } else {
        // rebuild a result-like object
        const review = sess.questions.map((q) => ({
          question_id: q.id, theme: q.theme, text: q.text, options: q.options,
          correct_index: q.correct_index, selected_index: (sess.answers || {})[q.id],
          is_correct: (sess.answers || {})[q.id] === q.correct_index, explanation: q.explanation,
        }));
        setData({
          id: sess.id, mode: sess.mode, category: sess.category,
          score: sess.score, total: sess.total, percent: sess.percent,
          passed: sess.passed, review, finished_at: sess.finished_at,
        });
      }
    });
  }, [sessionId]);

  if (!data) return <div className="min-h-[60vh] flex items-center justify-center"><div className="overline">Calcul du score…</div></div>;

  const isExam = data.mode === "exam";
  return (
    <div data-testid="results-page" className="max-w-5xl mx-auto px-6 lg:px-10 py-14">
      <div className="overline mb-3">RÉSULTATS</div>
      <h1 className="font-heading text-5xl tracking-tighter font-black">
        {isExam ? (data.passed ? "Examen réussi." : "Examen non validé.") : "Session terminée."}
      </h1>

      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        <div className="border border-zinc-200 bg-white p-6">
          <div className="overline text-zinc-500">SCORE</div>
          <div className="font-heading text-5xl font-black tracking-tighter mt-2" data-testid="result-score">{data.score} / {data.total}</div>
        </div>
        <div className={`border-2 ${data.passed === false ? "border-red-500 bg-red-50" : "border-[#002FA7] bg-[#EFF3FF]"} p-6`}>
          <div className="overline text-zinc-500">TAUX DE RÉUSSITE</div>
          <div className="font-heading text-5xl font-black tracking-tighter mt-2" data-testid="result-percent">{data.percent}%</div>
        </div>
        <div className="border border-zinc-200 bg-white p-6">
          <div className="overline text-zinc-500">{isExam ? "SEUIL OFFICIEL" : "MODE"}</div>
          <div className="font-heading text-5xl font-black tracking-tighter mt-2">{isExam ? "80%" : "Libre"}</div>
        </div>
      </div>

      <div className="mt-12">
        <div className="overline mb-4">CORRECTION DÉTAILLÉE</div>
        <div className="space-y-3">
          {data.review.map((r, i) => (
            <div key={r.question_id} data-testid={`review-${i}`} className="border border-zinc-200 bg-white p-6">
              <div className="flex items-start gap-3">
                <div className={`mt-1 w-6 h-6 inline-flex items-center justify-center ${r.is_correct ? "bg-green-600" : "bg-red-600"} text-white`}>
                  {r.is_correct ? <Check size={14} /> : <X size={14} />}
                </div>
                <div className="flex-1">
                  <div className="overline text-zinc-500">Q{i + 1} · {r.theme.replace(/-/g, " ").toUpperCase()}</div>
                  <h3 className="font-heading font-bold text-lg mt-1">{r.text}</h3>
                  <div className="mt-4 space-y-2">
                    {r.options.map((o, j) => {
                      let cls = "qcm-option";
                      if (j === r.correct_index) cls += " correct";
                      else if (j === r.selected_index) cls += " incorrect";
                      return (
                        <div key={j} className={cls}>
                          <span className="option-letter">{LETTERS[j]}</span>
                          <span className="font-mono-ibm">{o}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 border-l-2 border-[#002FA7] pl-4 text-sm text-zinc-700">
                    <span className="overline text-[#002FA7]">EXPLICATION</span>
                    <p className="mt-1 leading-relaxed">{r.explanation}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 flex gap-3 flex-wrap">
        <Link to="/tableau-de-bord" className="btn-secondary">Tableau de bord</Link>
        <Link to="/entrainement" data-testid="result-restart" className="btn-primary">Nouvelle session</Link>
      </div>
    </div>
  );
}
