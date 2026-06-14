"""Catégories AMF dérivées du CSV officiel + politique freemium.

- 15 thèmes répartis en deux blocs : Cat A (tronc commun) et Cat C (compétences spécifiques).
- 2 thèmes sont accessibles gratuitement (50 questions au total, 25 par thème).
- Les autres thèmes nécessitent l'abonnement Premium.
"""

THEMES = [
    # Cat A
    {"key": "cat-a-deontologie-et-conformite", "csv": "Cat A - Deontologie et conformite",
     "title": "Déontologie et conformité", "block": "A",
     "description": "Règles de bonne conduite, RCSI/RCCI, primauté de l'intérêt du client."},
    {"key": "cat-a-abus-de-marche", "csv": "Cat A - Abus de marche",
     "title": "Abus de marché", "block": "A",
     "description": "Délit d'initié, manipulation de cours, diffusion fausse information."},
    {"key": "cat-a-blanchiment-dargent", "csv": "Cat A - Blanchiment d'argent",
     "title": "Lutte contre le blanchiment", "block": "A",
     "description": "LCB-FT, TRACFIN, KYC, vigilance renforcée."},
    {"key": "cat-a-commercialisation-instruments-financiers", "csv": "Cat A - Commercialisation instruments financiers (A)",
     "title": "Commercialisation des instruments financiers (A)", "block": "A",
     "description": "Démarchage, MIF 2, vente à distance."},
    {"key": "cat-a-fonctionnement-organisation-marches", "csv": "Cat A - Fonctionnement et organisation des marches (A)",
     "title": "Fonctionnement et organisation des marchés (A)", "block": "A",
     "description": "Marchés réglementés, MTF, OTF, négociation."},
    {"key": "cat-a-relations-clients", "csv": "Cat A - Relations avec les clients (A)",
     "title": "Relations avec les clients (A)", "block": "A",
     "description": "Devoir d'information, profil de risque, adéquation."},

    # Cat C
    {"key": "cat-c-cadre-institutionnel-reglementaire", "csv": "Cat C - Cadre institutionnel et reglementaire",
     "title": "Cadre institutionnel et réglementaire", "block": "C",
     "description": "AMF, ACPR, ESMA, hiérarchie des normes."},
    {"key": "cat-c-bases-comptables-financieres", "csv": "Cat C - Bases comptables et financieres",
     "title": "Bases comptables et financières", "block": "C",
     "description": "Bilan, compte de résultat, analyse financière."},
    {"key": "cat-c-instruments-financiers-crypto", "csv": "Cat C - Instruments financiers et crypto-actifs",
     "title": "Instruments financiers et crypto-actifs", "block": "C",
     "description": "Actions, obligations, dérivés, crypto-actifs."},
    {"key": "cat-c-gestion-collective", "csv": "Cat C - Gestion collective / compte de tiers",
     "title": "Gestion collective et compte de tiers", "block": "C",
     "description": "OPCVM, FIA, sociétés de gestion."},
    {"key": "cat-c-fonctionnement-organisation-marches", "csv": "Cat C - Fonctionnement et organisation des marches (C)",
     "title": "Fonctionnement et organisation des marchés (C)", "block": "C",
     "description": "Carnet d'ordres, types d'ordres, dark pools."},
    {"key": "cat-c-post-marche", "csv": "Cat C - Post-marche et infrastructures",
     "title": "Post-marché et infrastructures", "block": "C",
     "description": "Règlement-livraison, CCP, dépositaires."},
    {"key": "cat-c-emissions-operations", "csv": "Cat C - Emissions et operations sur titres",
     "title": "Émissions et opérations sur titres", "block": "C",
     "description": "Introduction en bourse, OPA, augmentations de capital."},
    {"key": "cat-c-commercialisation-instruments-financiers", "csv": "Cat C - Commercialisation instruments financiers (C)",
     "title": "Commercialisation des instruments financiers (C)", "block": "C",
     "description": "Documents pré-contractuels, PRIIPs, DIC."},
    {"key": "cat-c-relations-clients", "csv": "Cat C - Relations avec les clients (C)",
     "title": "Relations avec les clients (C)", "block": "C",
     "description": "Conseil en investissement, gestion sous mandat."},
]

# Période d'essai et abonnement
PREMIUM_PRICE_EUR = 19.99
PREMIUM_DURATION_DAYS = 30
TRIAL_DURATION_HOURS = 48

# Note historique : depuis le 13/12/2025 le freemium "50 questions sur 2 thèmes"
# n'existe plus. À l'inscription, l'utilisateur reçoit 48h d'accès Premium gratuit
# (tous les thèmes, toutes les questions, examen blanc inclus). Passé ce délai,
# l'abonnement Premium est requis.
FREE_THEME_KEYS: set = set()
FREE_QUESTIONS_PER_THEME = 0


def get_theme_by_key(key: str):
    for t in THEMES:
        if t["key"] == key:
            return t
    return None


def get_theme_by_csv(csv_label: str):
    for t in THEMES:
        if t["csv"] == csv_label:
            return t
    return None
