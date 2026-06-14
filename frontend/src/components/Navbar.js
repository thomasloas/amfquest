import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LogOut, Menu, Moon, Settings, Sparkles, Sun, X } from "lucide-react";
import { useState } from "react";

const linkBase = "text-sm font-semibold tracking-wide hover:text-[#002FA7] transition-colors";
const linkActive = "text-[#002FA7]";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isPremium = !!user?.subscription_active;
  const trialActive = !!user?.trial_active;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" data-testid="navbar-logo" className="flex items-center gap-2">
          <span className="w-7 h-7 bg-[#002FA7] inline-flex items-center justify-center text-white font-black font-heading">A</span>
          <span className="font-heading font-black tracking-tighter text-lg">AMFQUEST</span>
          <span className="hidden md:inline-block overline ml-2">CERTIFICATION AMF</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7">
          <NavLink data-testid="nav-home" to="/" end className={({isActive}) => `${linkBase} ${isActive ? linkActive : "text-zinc-700"}`}>Accueil</NavLink>
          <NavLink data-testid="nav-offre" to="/offre" className={({isActive}) => `${linkBase} ${isActive ? linkActive : "text-zinc-700"}`}>L'offre</NavLink>
          <NavLink data-testid="nav-themes" to="/themes" className={({isActive}) => `${linkBase} ${isActive ? linkActive : "text-zinc-700"}`}>Thèmes</NavLink>
          <NavLink data-testid="nav-contact" to="/contact" className={({isActive}) => `${linkBase} ${isActive ? linkActive : "text-zinc-700"}`}>Contact</NavLink>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <button
            data-testid="theme-toggle"
            onClick={toggle}
            aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
            className="w-9 h-9 inline-flex items-center justify-center border border-zinc-300 hover:border-[#002FA7] transition-colors"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user ? (
            <>
              {isPremium ? (
                trialActive ? (
                  <Link to="/abonnement" data-testid="nav-trial-badge" className="text-xs font-bold tracking-wider px-2 py-1 border border-amber-600 text-amber-700 hover:bg-amber-50">ESSAI 48H</Link>
                ) : (
                  <span data-testid="nav-premium-badge" className="text-xs font-bold tracking-wider px-2 py-1 border border-[#059669] text-[#059669]">PREMIUM</span>
                )
              ) : (
                <Link to="/abonnement" data-testid="nav-upgrade" className="btn-primary !py-2 !px-3 text-xs">
                  <Sparkles size={12} /> Premium
                </Link>
              )}
              <Link to="/tableau-de-bord" data-testid="nav-dashboard" className="btn-secondary !py-2 !px-4 text-sm">Mon tableau</Link>
              <Link to="/compte" data-testid="nav-compte" aria-label="Mon compte" className="w-9 h-9 inline-flex items-center justify-center border border-zinc-300 hover:border-[#002FA7]">
                <Settings size={16} />
              </Link>
              <button data-testid="nav-logout" onClick={async () => { await logout(); navigate("/"); }} className="btn-secondary !py-2 !px-3 text-sm" aria-label="Déconnexion">
                <LogOut size={14} />
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
                <Link to="/abonnement" onClick={() => setOpen(false)} className={linkBase}>Abonnement</Link>
                <Link to="/compte" onClick={() => setOpen(false)} className={linkBase}>Mon compte</Link>
                <Link to="/tableau-de-bord" onClick={() => setOpen(false)} className="btn-secondary !py-2 !px-4 text-sm justify-center">Mon tableau</Link>
                <button onClick={() => { toggle(); setOpen(false); }} className="btn-secondary !py-2 !px-4 text-sm justify-center">
                  {theme === "dark" ? "Mode clair" : "Mode sombre"}
                </button>
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
