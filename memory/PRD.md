# AMFQUEST – PRD

## Problème
Site internet vitrine + plateforme d'entraînement QCM pour la certification professionnelle de l'AMF.

## Choix utilisateur (verbatim)
- Nom : **AMFQUEST**
- Périmètre : vitrine + plateforme complète d'entraînement
- Formulaire contact stocké en base
- Style : corporate / institutionnel
- Langue : 100% français
- Itération 2 : « 50 questions sur 2 thématiques pour les personnes gratuites » ; « accès illimité aux abonnés Premium 19,99€/mois »

## Personas
- **Candidat AMF** (gratuit puis Premium) : conseiller, gérant, RTO devant passer la certification.
- **Service RH / Conformité** (Entreprise) : formulaire de contact.
- **Admin AMFQUEST** : gère les contacts, considéré Premium par défaut.

## Architecture
- Backend : FastAPI + Motor (MongoDB) + JWT/bcrypt + emergentintegrations Stripe.
- Frontend : React 19 + Router + Tailwind + Shadcn UI + Sonner.
- Design : Klein Blue (#002FA7) sur blanc, Chivo + IBM Plex Sans, layout asymétrique.

## Modules implémentés
### Itération 1 (12 décembre 2025)
- Auth JWT (register/login/logout/me) + admin seedé.
- Banque manuelle de 40 questions, 12 thèmes.
- Sessions QCM, examen blanc, historique, stats.
- Pages : Landing, Offre, Thèmes, Contact, Connexion, Inscription, Tableau de bord, Entraînement, Examen blanc, Quiz, Résultats, Historique.

### Itération 2 (13 décembre 2025)
- **Banque de 2 389 questions** seedée automatiquement depuis `data/questions.csv` (15 thèmes officiels Cat A/Cat C).
- **Freemium** : 2 thèmes gratuits (Déontologie et conformité, Cadre institutionnel et réglementaire) × 25 questions = 50 questions accessibles aux comptes gratuits ; tout le reste verrouillé.
- **Abonnement Stripe 19,99€/30j** : page `/abonnement`, checkout via emergentintegrations, polling `/paiement-succes`, webhook prêt pour la prod (`/api/webhook/stripe`).
- **Quiz mode entraînement** : révélation immédiate de la bonne réponse + explication + source réglementaire après chaque clic.
- **Examen blanc** réservé aux abonnés Premium (120 q · 90 min · seuil 80%).
- Paywall visuel : badges PREMIUM/GRATUIT sur Thèmes/Dashboard, bannière upsell, blocage start-exam.
- CORS : retrait de `withCredentials` côté front (Bearer uniquement) pour fonctionner cross-origin sur les domaines preview.

## Backlog priorisé
- **P1** : E-mails transactionnels (Resend) – confirmation inscription + reçu Stripe + alerte expiration.
- **P1** : Vraies subscriptions Stripe (recurring) au lieu de paiements ponctuels mensuels.
- **P2** : Statistiques par thème dans le dashboard.
- **P2** : Mode révision intelligent (priorise les questions ratées).
- **P2** : Reset mot de passe.
- **P3** : Export PDF du diagnostic d'examen blanc.
- **P3** : Coaching IA personnalisé (analyse points faibles).

## Tests
- Itération 1 : 13/13 backend, 10/10 frontend.
- Itération 2 : 20/20 backend pytest, tous flows frontend OK.

## Credentials
Voir `/app/memory/test_credentials.md`.
