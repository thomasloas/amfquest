# AMFQUEST – PRD

## Problème
Un site internet vitrine dédié à une proposition d'entraînement QCM avant de passer l'examen de l'AMF (Autorité des marchés financiers).

## Choix utilisateur (verbatim)
- Nom du site : **AMFQUEST**
- Périmètre : **vitrine + plateforme complète d'entraînement**
- Formulaire de contact : **simple formulaire stocké en base**
- Style : **corporate / institutionnel**
- Langue : **100% français**

## Personas
- **Candidat AMF** : conseiller, gérant, RTO devant passer la certification AMF. Veut s'entraîner sérieusement, voir sa progression et se rassurer avant l'examen.
- **Service RH / Conformité** : besoin de former plusieurs collaborateurs (offre Entreprise — formulaire de contact).
- **Admin AMFQUEST** : consulte les contacts entrants.

## Architecture
- Backend : FastAPI + Motor (MongoDB), JWT (PyJWT) + bcrypt. Routes sous `/api`.
- Frontend : React 19 + React Router + Tailwind + Shadcn/UI (rounded-none). Sonner pour toasts.
- Design : Klein Blue (#002FA7) sur blanc, Chivo headings + IBM Plex Sans body, layout asymétrique, sans dégradés.

## Modules implémentés (12 décembre 2025)
- Auth JWT (register, login, logout, /me) avec admin seedé (`admin@amfquest.fr` / `Admin1234!`).
- 12 thèmes officiels AMF + banque de ~40 questions avec explications.
- Sessions QCM : mode entraînement (5–50 questions par thème) et examen blanc (120 questions, 90 min, seuil 80%).
- Pages : Landing, L'offre (3 tarifs), Thèmes, Contact (formulaire stocké), Connexion, Inscription, Tableau de bord, Entraînement, Examen blanc, Quiz (chronomètre, navigation), Résultats (review + explications), Historique.
- Stats utilisateur (sessions, questions, score global).
- Hidden correct_index pendant que la session est en cours (anti-triche).

## Backlog priorisé
- **P1** : E-mails transactionnels (Resend) — inscription + nouveau contact reçu.
- **P1** : Paiement (Stripe) — activer la formule « Préparation » (29€/mois).
- **P2** : Mode révision intelligent (questions ratées en priorité).
- **P2** : Statistiques par thème dans le dashboard (per_theme).
- **P2** : Reset mot de passe.
- **P3** : Export PDF du diagnostic d'examen blanc.
- **P3** : Plus de questions (objectif 600+ couvrant tout le RG AMF).

## Tests
- Backend pytest : 13/13 verts.
- Frontend Playwright : 10/10 flows OK.
- Compte test : `admin@amfquest.fr` / `Admin1234!`.
