import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicLayout from "@/components/PublicLayout";

import Landing from "@/pages/Landing";
import Offre from "@/pages/Offre";
import Themes from "@/pages/Themes";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Entrainement from "@/pages/Entrainement";
import ExamenBlanc from "@/pages/ExamenBlanc";
import Quiz from "@/pages/Quiz";
import Resultats from "@/pages/Resultats";
import Historique from "@/pages/Historique";
import Abonnement from "@/pages/Abonnement";
import PaiementSucces from "@/pages/PaiementSucces";
import Compte from "@/pages/Compte";

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/offre" element={<Offre />} />
                <Route path="/themes" element={<Themes />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/connexion" element={<Login />} />
                <Route path="/inscription" element={<Register />} />
                <Route path="/tableau-de-bord" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/entrainement" element={<ProtectedRoute><Entrainement /></ProtectedRoute>} />
                <Route path="/examen-blanc" element={<ProtectedRoute><ExamenBlanc /></ProtectedRoute>} />
                <Route path="/quiz/:sessionId" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
                <Route path="/resultats/:sessionId" element={<ProtectedRoute><Resultats /></ProtectedRoute>} />
                <Route path="/historique" element={<ProtectedRoute><Historique /></ProtectedRoute>} />
                <Route path="/abonnement" element={<ProtectedRoute><Abonnement /></ProtectedRoute>} />
                <Route path="/paiement-succes" element={<ProtectedRoute><PaiementSucces /></ProtectedRoute>} />
                <Route path="/compte" element={<ProtectedRoute><Compte /></ProtectedRoute>} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
