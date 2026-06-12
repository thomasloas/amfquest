import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const linkBase = "text-sm font-semibold tracking-wide hover:text-[#002FA7] transition-colors";
const linkActive = "text-[#002FA7]";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" data-testid="navbar-logo" className="flex items-center gap-2">
          <span className="w-7 h-7 bg-[#002FA7] inline-flex items-center justify-center text-white font-black font-heading">A</span>
          <span className="font-heading font-black tracking-tighter text-lg">AMFQUEST</span>
          <span className="hidden md:inline-block overline ml-2">CERTIFICATION AMF</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <NavLink data-testid="nav-home" to="/" end className={({isActive}) => `${linkBase} ${isActive ? linkActive : "text-zinc-700"}`}>Accueil</NavLink>
          <NavLink data-testid="nav-offre" to="/offre" className={({isActive}) => `${linkBase} ${isActive ? linkActive : "text-zinc-700"}`}>L'offre</NavLink>
          <NavLink data-testid="nav-themes" to="/themes" className={({isActive}) => `${linkBase} ${isActive ? linkActive : "text-zinc-700"}`}>Thèmes</NavLink>
          <NavLink data-testid="nav-contact" to="/contact" className={({isActive}) => `${linkBase} ${isActive ? linkActive : "text-zinc-700"}`}>Contact</NavLink>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/tableau-de-bord" data-testid="nav-dashboard" className="btn-secondary !py-2 !px-4 text-sm">Mon tableau</Link>
              <button data-testid="nav-logout" onClick={async () => { await logout(); navigate("/"); }} className="btn-primary !py-2 !px-4 text-sm">
                <LogOut size={14} /> Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/connexion" data-testid="nav-login" className="btn-secondary !py-2 !px-4 text-sm">Se connecter</Link>
              <Link to="/inscription" data-testid="nav-register" className="btn-primary !py-2 !px-4 text-sm">Commencer</Link>
            </>
          )}
        </div>
        <button data-testid="nav-mobile-toggle" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-zinc-200 bg-white">
          <div className="px-6 py-4 flex flex-col gap-3">
            <Link to="/" onClick={() => setOpen(false)} className={linkBase}>Accueil</Link>
            <Link to="/offre" onClick={() => setOpen(false)} className={linkBase}>L'offre</Link>
            <Link to="/themes" onClick={() => setOpen(false)} className={linkBase}>Thèmes</Link>
            <Link to="/contact" onClick={() => setOpen(false)} className={linkBase}>Contact</Link>
            {user ? (
              <>
                <Link to="/tableau-de-bord" onClick={() => setOpen(false)} className="btn-secondary !py-2 !px-4 text-sm justify-center">Mon tableau</Link>
                <button onClick={async () => { await logout(); setOpen(false); navigate("/"); }} className="btn-primary !py-2 !px-4 text-sm justify-center">Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/connexion" onClick={() => setOpen(false)} className="btn-secondary !py-2 !px-4 text-sm justify-center">Se connecter</Link>
                <Link to="/inscription" onClick={() => setOpen(false)} className="btn-primary !py-2 !px-4 text-sm justify-center">Commencer</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
