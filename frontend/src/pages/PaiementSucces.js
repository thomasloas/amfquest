import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function PaiementSucces() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("polling"); // polling | paid | failed
  const [data, setData] = useState(null);
  const tries = useRef(0);
  const { refresh } = useAuth();

  useEffect(() => {
    if (!sessionId) { setStatus("failed"); return; }
    let cancelled = false;
    const poll = async () => {
      try {
        const { data } = await api.get(`/subscription/status/${sessionId}`);
        if (cancelled) return;
        setData(data);
        if (data.payment_status === "paid") {
          setStatus("paid");
          refresh();
          return;
        }
        if (data.status === "expired") { setStatus("failed"); return; }
        tries.current += 1;
        if (tries.current < 10) setTimeout(poll, 2000);
        else setStatus("failed");
      } catch (e) {
        setStatus("failed");
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [sessionId, refresh]);

  return (
    <div data-testid="paiement-page" className="max-w-2xl mx-auto px-6 lg:px-10 py-24 text-center">
      {status === "polling" && (
        <>
          <Loader2 className="mx-auto text-[#002FA7] animate-spin" size={48} />
          <h1 className="font-heading text-3xl font-black tracking-tighter mt-6">Vérification du paiement…</h1>
          <p className="text-zinc-600 mt-3">Nous confirmons votre transaction auprès de Stripe.</p>
        </>
      )}
      {status === "paid" && (
        <>
          <CheckCircle2 className="mx-auto text-[#059669]" size={48} />
          <h1 className="font-heading text-3xl font-black tracking-tighter mt-6">Paiement confirmé.</h1>
          <p className="text-zinc-600 mt-3">
            Votre accès Premium est actif {data?.subscription_until ? `jusqu'au ${new Date(data.subscription_until).toLocaleDateString("fr-FR")}` : ""}.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link to="/entrainement" data-testid="paiement-go-train" className="btn-primary">Commencer un entraînement</Link>
            <Link to="/tableau-de-bord" className="btn-secondary">Tableau de bord</Link>
          </div>
        </>
      )}
      {status === "failed" && (
        <>
          <XCircle className="mx-auto text-red-600" size={48} />
          <h1 className="font-heading text-3xl font-black tracking-tighter mt-6">Paiement non confirmé.</h1>
          <p className="text-zinc-600 mt-3">Aucune somme n'a été débitée si le paiement n'a pas abouti. Vous pouvez réessayer.</p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link to="/abonnement" className="btn-primary">Réessayer</Link>
            <Link to="/contact" className="btn-secondary">Contacter le support</Link>
          </div>
        </>
      )}
    </div>
  );
}
