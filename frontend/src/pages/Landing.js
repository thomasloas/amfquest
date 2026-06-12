import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, BookOpen, ChevronRight, Clock, ShieldCheck, Target } from "lucide-react";

const HERO_IMG = "https://images.unsplash.com/photo-1594655151525-cc979fc9bf8b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwyfHxmaW5hbmNpYWwlMjBkaXN0cmljdCUyMGFyY2hpdGVjdHVyZXxlbnwwfHx8fDE3ODEyNDQxODR8MA&ixlib=rb-4.1.0&q=85";
const PRO_IMG = "https://images.unsplash.com/photo-1499914485622-a88fac536970?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBzdHVkeWluZyUyMGxhcHRvcHxlbnwwfHx8fDE3ODEyNDQxODl8MA&ixlib=rb-4.1.0&q=85";
const SKY_IMG = "https://images.pexels.com/photos/33279640/pexels-photo-33279640.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function Landing() {
  return (
    <div data-testid="landing-page">
      {/* HERO */}
      <section className="relative border-b border-zinc-200 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-20 grid lg:grid-cols-12 gap-10 items-end relative">
          <div className="lg:col-span-7">
            <div className="overline mb-6" data-testid="hero-eyebrow">PRÉPARATION OFFICIELLE · EXAMEN AMF</div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[0.95] font-black text-zinc-900">
              Réussissez l'examen <br />
              <span className="text-[#002FA7]">AMF</span> du premier coup.
            </h1>
            <p className="mt-8 text-lg text-zinc-600 max-w-xl leading-relaxed">
              AMFQUEST est la plateforme française dédiée à la préparation de la certification professionnelle de l'Autorité des marchés financiers. Banque de questions à jour, examens blancs chronométrés, corrections détaillées.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link to="/inscription" data-testid="hero-cta-primary" className="btn-primary">
                Commencer gratuitement <ArrowRight size={16} />
              </Link>
              <Link to="/themes" data-testid="hero-cta-secondary" className="btn-secondary">
                Voir les 12 thèmes
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-zinc-500">
              <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#002FA7]" /> Programme officiel AMF</div>
              <div className="flex items-center gap-2"><Clock size={16} className="text-[#002FA7]" /> Examen blanc 120 questions</div>
              <div className="flex items-center gap-2"><BarChart3 size={16} className="text-[#002FA7]" /> Suivi de progression</div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="border border-zinc-200 bg-white">
              <img src={HERO_IMG} alt="Quartier financier" className="w-full h-72 object-cover grayscale" />
              <div className="p-6">
                <div className="overline mb-2">EN CHIFFRES</div>
                <div className="grid grid-cols-3 gap-6 mt-4">
                  <div>
                    <div className="font-heading text-3xl font-black tracking-tighter">120</div>
                    <div className="text-xs text-zinc-500 mt-1">questions · examen</div>
                  </div>
                  <div>
                    <div className="font-heading text-3xl font-black tracking-tighter">80<span className="text-[#002FA7]">%</span></div>
                    <div className="text-xs text-zinc-500 mt-1">seuil de réussite</div>
                  </div>
                  <div>
                    <div className="font-heading text-3xl font-black tracking-tighter">12</div>
                    <div className="text-xs text-zinc-500 mt-1">thèmes couverts</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-4">
            <div className="overline mb-4">POURQUOI AMFQUEST</div>
            <h2 className="font-heading text-4xl tracking-tight font-bold text-zinc-900 leading-tight">
              Une préparation rigoureuse, sans concession.
            </h2>
            <p className="text-zinc-600 mt-6 leading-relaxed">
              Conçu par et pour des professionnels des marchés financiers. Chaque question est accompagnée d'une explication pédagogique pour ancrer la connaissance.
            </p>
          </div>
          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-5">
            {[
              { icon: Target, title: "Mode entraînement", desc: "QCM par thème, correction immédiate, explications détaillées." },
              { icon: Clock, title: "Examen blanc chronométré", desc: "120 questions en 2h, seuil officiel de 80% comme à l'examen." },
              { icon: BarChart3, title: "Tableau de progression", desc: "Suivez votre taux de réussite, identifiez vos points faibles." },
              { icon: BookOpen, title: "Banque de questions à jour", desc: "Questions alignées sur le programme officiel de l'AMF." },
            ].map((f, i) => (
              <div key={i} className="tech-card" data-testid={`feature-card-${i}`}>
                <f.icon className="text-[#002FA7]" size={24} strokeWidth={1.5} />
                <h3 className="font-heading text-xl font-bold mt-4 text-zinc-900 tracking-tight">{f.title}</h3>
                <p className="text-zinc-600 text-sm leading-relaxed mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DARK SECTION */}
      <section className="bg-[#0A0A0A] text-white border-y border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <img src={SKY_IMG} alt="Architecture financière" className="w-full h-80 object-cover" />
          </div>
          <div className="lg:col-span-7">
            <div className="overline text-[#7FA3FF] mb-4">L'EXAMEN AMF EN BREF</div>
            <h2 className="font-heading text-4xl lg:text-5xl tracking-tighter font-black leading-tight">
              Une certification exigeante, <br /> une obligation réglementaire.
            </h2>
            <p className="text-zinc-300 mt-6 leading-relaxed max-w-2xl">
              Depuis 2010, l'AMF impose une vérification des connaissances minimales aux collaborateurs de prestataires de services d'investissement. La certification couvre 12 thèmes : réglementation, déontologie, instruments financiers, gestion collective, fiscalité de l'épargne et bien plus.
            </p>
            <div className="mt-10 grid sm:grid-cols-3 gap-6">
              <div className="border-l-2 border-[#002FA7] pl-5">
                <div className="font-heading text-3xl font-black tracking-tighter">120</div>
                <div className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">Questions à l'examen</div>
              </div>
              <div className="border-l-2 border-[#002FA7] pl-5">
                <div className="font-heading text-3xl font-black tracking-tighter">2h</div>
                <div className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">Durée maximale</div>
              </div>
              <div className="border-l-2 border-[#002FA7] pl-5">
                <div className="font-heading text-3xl font-black tracking-tighter">80%</div>
                <div className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">Seuil de réussite</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="overline mb-4">PARCOURS UTILISATEUR</div>
        <h2 className="font-heading text-4xl tracking-tighter font-bold text-zinc-900 max-w-2xl">
          Trois étapes pour aborder l'examen en confiance.
        </h2>

        <div className="mt-14 grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <img src={PRO_IMG} alt="Professionnel en révision" className="w-full h-80 lg:h-[420px] object-cover border border-zinc-200" />
          </div>
          <div className="lg:col-span-7 space-y-5">
            {[
              { n: "01", title: "Créez votre compte", desc: "Inscription gratuite, sans engagement. Accès immédiat à la banque de questions et au tableau de bord." },
              { n: "02", title: "Entraînez-vous par thème", desc: "Sélectionnez un ou plusieurs des 12 thèmes officiels. Recevez les explications après chaque question." },
              { n: "03", title: "Passez un examen blanc", desc: "Conditions réelles : 120 questions, 2h, score à 80%. Diagnostic complet à la fin de la session." },
            ].map((s, i) => (
              <div key={i} className="tech-card flex items-start gap-6" data-testid={`step-${i}`}>
                <div className="font-heading font-black text-3xl text-[#002FA7] tracking-tighter">{s.n}</div>
                <div className="flex-1">
                  <h3 className="font-heading text-xl font-bold tracking-tight">{s.title}</h3>
                  <p className="text-zinc-600 text-sm mt-2 leading-relaxed">{s.desc}</p>
                </div>
                <ChevronRight className="text-zinc-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="max-w-2xl">
            <div className="overline mb-3">PRÊT À COMMENCER</div>
            <h2 className="font-heading text-4xl tracking-tighter font-bold text-zinc-900">
              Réservez votre réussite à l'examen AMF.
            </h2>
            <p className="text-zinc-600 mt-4">Inscription en moins de 30 secondes. Aucune carte bancaire requise.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/inscription" data-testid="cta-bottom-register" className="btn-primary">Créer mon compte</Link>
            <Link to="/contact" data-testid="cta-bottom-contact" className="btn-secondary">Nous contacter</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
