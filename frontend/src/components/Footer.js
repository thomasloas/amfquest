import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] text-white mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 bg-[#002FA7] inline-flex items-center justify-center text-white font-black font-heading">A</span>
            <span className="font-heading font-black tracking-tighter text-lg">AMFQUEST</span>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
            La plateforme de préparation à l'examen de certification professionnelle de l'AMF.
            Banque de questions à jour, examens blancs chronométrés, suivi de progression.
          </p>
          <p className="overline mt-6 text-[#7FA3FF]">CONFORME AU PROGRAMME OFFICIEL AMF</p>
        </div>
        <div>
          <div className="overline text-zinc-500 mb-4">PLATEFORME</div>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li><Link to="/offre" className="hover:text-white">L'offre</Link></li>
            <li><Link to="/themes" className="hover:text-white">12 thèmes officiels</Link></li>
            <li><Link to="/inscription" className="hover:text-white">Inscription</Link></li>
            <li><Link to="/connexion" className="hover:text-white">Connexion</Link></li>
          </ul>
        </div>
        <div>
          <div className="overline text-zinc-500 mb-4">CONTACT</div>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li><Link to="/contact" className="hover:text-white">Nous contacter</Link></li>
            <li>support@amfquest.fr</li>
            <li>Paris, France</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-col md:flex-row justify-between gap-2 text-xs text-zinc-500">
        <p>
          © {new Date().getFullYear()} AMFQUEST. Plateforme indépendante de préparation à l'examen AMF.
        </p>
    
        <div className="flex flex-wrap gap-4">
          <Link to="/mentions-legales" className="hover:text-white">
            Mentions légales
          </Link>
    
          <Link to="/cgv" className="hover:text-white">
            CGV
          </Link>
    
          <Link to="/politique-confidentialite" className="hover:text-white">
            Politique de confidentialité
          </Link>
        </div>
      </div>
    </div>
    </footer>
  );
}
