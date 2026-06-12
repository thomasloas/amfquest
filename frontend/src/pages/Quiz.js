import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

const LETTERS = ["A", "B", "C", "D", "E"];

export default function Quiz() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const [session, setSession] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const startRef = useRef(null);

  useEffect(() => {
    api.get(`/sessions/${sessionId}`).then(({ data }) => {
      setSession({
        ...data,
        questions: data.questions.map((q) => ({
          id: q.id, theme: q.theme, text: q.text, options: q.options,
        })),
      });
      setAnswers(data.answers || {});
      startRef.current = new Date(data.started_at).getTime();
      if (data.duration_seconds) {
        const elapsed = (Date.now() - startRef.current) / 1000;
        setRemaining(Math.max(0, data.duration_seconds - elapsed));
      }
    }).catch((e) => {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
      nav("/tableau-de-bord");
    });
  }, [sessionId, nav]);

  const finishExam = useCallback(async () => {
    setSubmitting(true);
    try {
      await api.post(`/sessions/${sessionId}/finish`);
      nav(`/resultats/${sessionId}`);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
      setSubmitting(false);
    }
  }, [sessionId, nav]);

  useEffect(() => {
    if (remaining == null) return;
    if (remaining <= 0) { finishExam(); return; }
    const t = setInterval(() => {
      setRemaining((r) => (r == null ? null : Math.max(0, r - 1)));
    }, 1000);
    return () => clearInterval(t);
  }, [remaining, finishExam]);

  if (!session) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="overline">Chargement de la session…</div></div>;
  }

  const q = session.questions[idx];
  const selected = answers[q.id];
  const total = session.questions.length;
  const answered = Object.keys(answers).length;
  const isExam = session.mode === "exam";

  const pick = async (i) => {
    setAnswers({ ...answers, [q.id]: i });
    try { await api.post(`/sessions/${sessionId}/answer`, { question_id: q.id, selected_index: i }); } catch (e) {}
  };

  const fmtTime = (s) => {
    if (s == null) return "";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div data-testid="quiz-page" className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="overline">{isExam ? "EXAMEN BLANC" : "ENTRAÎNEMENT"}</div>
          <div className="font-mono-ibm text-sm text-zinc-500 mt-1">Question {idx + 1} / {total} · {answered} répondues</div>
        </div>
        {isExam && (
          <div data-testid="quiz-timer" className="flex items-center gap-2 border border-zinc-300 px-4 py-2 font-mono-ibm font-bold text-lg">
            <Clock size={16} /> {fmtTime(remaining)}
          </div>
        )}
      </div>

      <div className="h-2 bg-zinc-200 mb-8">
        <div className="h-full bg-[#002FA7]" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>

      <div className="border border-zinc-200 bg-white p-8" data-testid={`question-${idx}`}>
        <div className="overline text-zinc-500 mb-3">{q.theme.toUpperCase().replace(/-/g, " ")}</div>
        <h2 className="font-heading text-2xl font-bold tracking-tight leading-snug">{q.text}</h2>
        <div className="mt-8 space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              data-testid={`option-${i}`}
              onClick={() => pick(i)}
              className={`qcm-option ${selected === i ? "selected" : ""}`}
            >
              <span className="option-letter">{LETTERS[i]}</span>
              <span className="font-mono-ibm">{opt}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button data-testid="quiz-prev" disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="btn-secondary disabled:opacity-40">
          <ChevronLeft size={16} /> Précédente
        </button>
        {idx < total - 1 ? (
          <button data-testid="quiz-next" onClick={() => setIdx(idx + 1)} className="btn-primary">
            Suivante <ChevronRight size={16} />
          </button>
        ) : (
          <button data-testid="quiz-finish" onClick={finishExam} disabled={submitting} className="btn-primary">
            {submitting ? "Calcul du score…" : "Terminer et voir le score"}
          </button>
        )}
      </div>
    </div>
  );
}
