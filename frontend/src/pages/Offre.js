import { Link } from "react-router-dom";
import { Check } from "lucide-react";

export default function Offre() {
  const tiers = [
    {
      name: "Gratuit",
      price: "0€",
      desc: "Inscription en 30 secondes, sans carte bancaire.",
      features: [
        "Accès à 50 questions sur 2 thèmes",
        "Mode entraînement avec correction immédiate",
        "Tableau de bord et historique",
      ],
      cta: "Créer un compte",
      to: "/inscription",
      featured: false,
    },
    {
      name: "Premium",
      price: "19,99€",
      suffix: "/ 30 jours",
      desc: "Accès illimité à toute la banque AMF.",
      features: [
        "2 389 questions · 15 thèmes officiels",
        "Examen blanc chronométré 120 questions",
        "Explications détaillées et sources",
        "Statistiques avancées de progression",
        "Aucune reconduction automatique",
      ],
      cta: "S'abonner",
      to: "/abonnement",
      featured: true,
    },
    {
      name: "Entreprise",
      price: "Sur devis",
      desc: "Pour les équipes et CCI.",
      features: [
        "Gestion multi-utilisateurs",
        "Reporting RH",
        "Personnalisation du contenu",
        "Support dédié",
      ],
      cta: "Nous contacter",
      to: "/contact",
      featured: false,
    },
  ];

  return (
    <div data-testid="offre-page" className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <div className="overline mb-4">L'OFFRE AMFQUEST</div>
      <h1 className="font-heading text-5xl sm:text-6xl tracking-tighter font-black text-zinc-900 max-w-3xl leading-[1]">
        Choisissez la formule adaptée à votre objectif.
      </h1>
      <p className="text-zinc-600 mt-6 max-w-2xl">Paiement sécurisé par Stripe. Tous les tarifs sont TTC.</p>

      <div className="mt-16 grid lg:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <div
            key={t.name}
            data-testid={`tier-${t.name.toLowerCase()}`}
            className={`bg-white border ${t.featured ? "border-[#002FA7] border-2" : "border-zinc-200"} p-8 flex flex-col relative`}
          >
            {t.featured && <div className="absolute -top-3 left-8 bg-[#002FA7] text-white text-xs font-bold tracking-wider px-3 py-1">RECOMMANDÉ</div>}
            <h3 className="font-heading text-2xl font-bold tracking-tight">{t.name}</h3>
            <div className="mt-6 flex items-end gap-2">
              <div className="font-heading text-5xl font-black tracking-tighter">{t.price}</div>
              {t.suffix && <div className="text-zinc-500 text-sm pb-2">{t.suffix}</div>}
            </div>
            <p className="text-zinc-600 text-sm mt-3">{t.desc}</p>
            <ul className="mt-8 space-y-3 flex-1">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-zinc-700">
                  <Check size={16} className={`mt-0.5 flex-shrink-0 ${t.featured ? "text-[#002FA7]" : "text-zinc-500"}`} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link to={t.to} className={`mt-8 ${t.featured ? "btn-primary" : "btn-secondary"} justify-center`}>
              {t.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
