import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";

const LETTERS = ["A", "B", "C", "D", "E"];

export default function Quiz() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const [session, setSession] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({}); // {questionId: {correct_index, explanation, source}}
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const startRef = useRef(null);

  useEffect(() => {
    api.get(`/sessions/${sessionId}`).then(({ data }) => {
      setSession(data);
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
    const t = setInterval(() => setRemaining((r) => (r == null ? null : Math.max(0, r - 1))), 1000);
    return () => clearInterval(t);
  }, [remaining, finishExam]);

  if (!session) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="overline">Chargement…</div></div>;
  }

  const q = session.questions[idx];
  const selected = answers[q.id];
  const total = session.questions.length;
  const answered = Object.keys(answers).length;
  const isExam = session.mode === "exam";
  const reveal = revealed[q.id];

  const pick = async (i) => {
    if (selected !== undefined && !isExam) return; // training: lock after first pick
    setAnswers({ ...answers, [q.id]: i });
    try {
      await api.post(`/sessions/${sessionId}/answer`, { question_id: q.id, selected_index: i });
      if (!isExam) {
        // Fetch correction
        try {
          const { data } = await api.post(`/sessions/${sessionId}/finish-question`, { question_id: q.id });
          setRevealed({ ...revealed, [q.id]: data });
        } catch (_) { /* fallback: dont reveal */ }
      }
    } catch (_) {}
  };

  const fmtTime = (s) => {
    if (s == null) return "";
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
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
        <div className="overline text-zinc-500 mb-3">{q.theme.replace(/-/g, " ").toUpperCase()}</div>
        <h2 className="font-heading text-2xl font-bold tracking-tight leading-snug">{q.text}</h2>
        <div className="mt-8 space-y-3">
          {q.options.map((opt, i) => {
            let cls = "qcm-option";
            if (reveal) {
              if (i === reveal.correct_index) cls += " correct";
              else if (i === selected) cls += " incorrect";
            } else if (selected === i) cls += " selected";
            return (
              <button
                key={i}
                data-testid={`option-${i}`}
                onClick={() => pick(i)}
                disabled={!!reveal}
                className={cls}
              >
                <span className="option-letter">{LETTERS[i]}</span>
                <span className="font-mono-ibm">{opt}</span>
                {reveal && i === reveal.correct_index && <Check size={18} className="text-green-700 ml-auto" />}
                {reveal && i === selected && i !== reveal.correct_index && <X size={18} className="text-red-700 ml-auto" />}
              </button>
            );
          })}
        </div>

        {reveal && (
          <div className="mt-6 border-l-2 border-[#002FA7] pl-4 animate-fade-in" data-testid="reveal-block">
            <div className="overline text-[#002FA7]">EXPLICATION</div>
            <p className="text-sm text-zinc-700 mt-1 leading-relaxed">{reveal.explanation}</p>
            {reveal.source && (
              <p className="text-xs text-zinc-500 mt-3 font-mono-ibm">Source : {reveal.source}</p>
            )}
          </div>
        )}
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
