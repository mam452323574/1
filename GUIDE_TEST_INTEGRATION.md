# Guide de Test Intégré - Validation Complète des Trois Corrections

## Introduction

Ce guide vous accompagne dans le test complet de l'application après avoir appliqué les trois corrections:
1. ✅ Development build Android sans crash Reanimated
2. ✅ Migration database avec la colonne `analysis_result`
3. ✅ Messages d'erreur de limite de scan avec date complète

## Prérequis

Avant de commencer ce test intégré, assurez-vous que:

- [x] Le development build Android a été créé selon `GUIDE_BUILD_ANDROID_DEV.md`
- [x] La migration database a été appliquée selon `GUIDE_MIGRATION_DATABASE.md`
- [x] L'émulateur Android est lancé et connecté
- [x] Metro Bundler est en cours d'exécution (`npm run dev`)
- [x] L'application est installée sur l'émulateur et fonctionne

---

## Scénario de Test 1: Démarrage et Navigation

### Objectif
Vérifier que l'application démarre sans crash et que la navigation fonctionne correctement.

### Étapes

#### 1.1 - Lancement Initial

1. **Fermer** complètement l'application sur l'émulateur si elle est ouverte
2. **Relancer** l'application depuis l'icône sur l'écran d'accueil de l'émulateur

**Résultats attendus**:
- ✅ L'application démarre en 2-5 secondes
- ✅ L'écran de splash s'affiche brièvement
- ✅ L'écran d'accueil (Home) apparaît
- ✅ Aucun crash
- ✅ Aucune erreur rouge dans la console Metro

**Logs attendus dans la console**:
```
› Opening on Android...
› Opening exp://192.168.x.x:8081 on emulator-5554
[App] Root layout mounted
```

**❌ Si l'application crash**:
- Vérifier les logs Metro pour voir l'erreur exacte
- Consulter la section Dépannage de `GUIDE_BUILD_ANDROID_DEV.md`

#### 1.2 - Navigation entre les Onglets

1. **Cliquer** sur l'onglet **"Scanner"** (icône caméra)
2. **Attendre** que l'écran Scanner se charge
3. **Cliquer** sur l'onglet **"Analyse"** (icône graphique)
4. **Attendre** que l'écran Analyse se charge
5. **Cliquer** sur l'onglet **"Home"** pour revenir

**Résultats attendus**:
- ✅ Les transitions sont fluides et sans saccades
- ✅ Les icônes d'onglets s'animent correctement
- ✅ Chaque écran se charge complètement
- ✅ Aucune erreur dans la console

**Logs attendus**:
```
[TabNavigation] Navigating to: scanner
[TabNavigation] Navigating to: analytics
[TabNavigation] Navigating to: home
```

#### 1.3 - Test des Animations Reanimated

Sur l'écran **Home**:
1. **Scroller** vers le bas pour voir toutes les sections
2. **Observer** les animations de fade-in des cartes
3. **Cliquer** sur une carte de produit recommandé

**Résultats attendus**:
- ✅ Les animations sont fluides
- ✅ Aucun lag ou freeze
- ✅ Les interactions répondent immédiatement
- ✅ Aucune erreur "Worklet Mismatch" dans les logs

**✅ Scénario 1 validé**: L'application démarre et navigue correctement sans crash Reanimated.

---

## Scénario de Test 2: Scan Nutrition Complet

### Objectif
Vérifier que le processus complet de scan nutrition fonctionne, de la capture d'image jusqu'à l'enregistrement dans la base de données.

### Étapes

#### 2.1 - Accès à l'Écran Scanner

1. **Naviguer** vers l'onglet **"Scanner"**
2. **Observer** l'interface de scan

**Résultats attendus**:
- ✅ L'écran Scanner s'affiche correctement
- ✅ Le bouton "Prendre une photo" ou "Choisir une image" est visible
- ✅ Les permissions caméra sont accordées (ou demandées)

#### 2.2 - Sélection d'une Image

**Option A: Depuis la galerie (recommandé pour les tests)**
1. **Cliquer** sur le bouton de sélection d'image
2. **Choisir** une image d'aliment depuis la galerie de l'émulateur
3. **Confirmer** la sélection

**Option B: Prendre une photo**
1. **Cliquer** sur le bouton caméra
2. **Prendre** une photo avec l'émulateur
3. **Confirmer** la capture

**Résultats attendus**:
- ✅ L'image sélectionnée s'affiche en aperçu
- ✅ Vous êtes redirigé vers l'écran de prévisualisation

**Logs attendus**:
```
[Scanner] Image selected: <uri>
[Navigation] Navigating to: scan-preview
```

#### 2.3 - Prévisualisation et Choix du Type

Sur l'écran de prévisualisation:
1. **Observer** l'image affichée en grand
2. **Sélectionner** le type de scan: **"Nutrition"**
3. **Observer** le badge indiquant "Type de scan: Nutrition"

**Résultats attendus**:
- ✅ L'image est bien visible
- ✅ Le sélecteur de type affiche les trois options (Body, Health, Nutrition)
- ✅ "Nutrition" est bien sélectionné
- ✅ Le bouton "Confirmer et Sauvegarder" est actif

#### 2.4 - Confirmation et Enregistrement

1. **Cliquer** sur **"Confirmer et Sauvegarder"**
2. **Observer** le changement de texte du bouton: "Analyse en cours..."
3. **Attendre** la fin de l'analyse (10-30 secondes selon le webhook N8n)

**Résultats attendus**:
- ✅ Le bouton devient disabled et affiche "Analyse en cours..."
- ✅ Un indicateur de chargement apparaît
- ✅ Après quelques secondes, des confettis apparaissent brièvement
- ✅ Vous êtes redirigé vers l'écran de résultats

**Logs attendus**:
```
[ScanPreview] handleConfirm called
[ScanPreview] imageUri: <uri>
[ScanPreview] scanType: nutrition
[ScanPreview] Loading state set to true
[ScanPreview] Nutrition scan detected, loading message updated
[ScanPreview] Calling ApiService.createScan...
[ApiService] createScan called
[ApiService] Checking scan eligibility...
[ApiService] Eligibility result: { allowed: true, ... }
[ApiService] Nutrition scan - calling N8nWebhookService...
[N8nWebhook] analyzeImage called with imageUri: <uri>
[N8nWebhook] Sending POST request to webhook...
[N8nWebhook] Response received - status: 200
[N8nWebhook] Analysis successful
[ApiService] Analysis result received from N8n
[ApiService] Fetching image from URI...
[ApiService] Image fetch response status: 200
[ApiService] Image converted to blob, size: XXXXX
[ApiService] Uploading to storage with filename: <filename>
[ApiService] Image uploaded successfully
[ApiService] Inserting scan record into database...
[ApiService] Scan created successfully: <data>
[ScanPreview] Scan created successfully
[ScanPreview] Navigating to scan-results
```

**❌ Si une erreur survient**:
- **Erreur 400**: La migration database n'a pas été appliquée correctement
- **Timeout N8n**: Le webhook N8n n'est pas accessible ou trop lent
- **Upload failed**: Problème de permissions storage dans Supabase

#### 2.5 - Affichage des Résultats

Sur l'écran de résultats:
1. **Observer** les données nutritionnelles affichées
2. **Vérifier** que chaque aliment est listé avec ses macros
3. **Vérifier** que les totaux sont calculés correctement

**Résultats attendus**:
- ✅ L'image scannée est affichée
- ✅ Une liste d'aliments détectés apparaît
- ✅ Chaque aliment affiche: Nom, Calories, Protéines, Glucides, Lipides
- ✅ Un total général est affiché en bas
- ✅ Un bouton "Terminer" ou "Retour" est présent

**Exemple de données affichées**:
```
Pomme
Calories: 52 kcal
Protéines: 0.3 g
Glucides: 14 g
Lipides: 0.2 g

---

TOTAL
Calories: 52 kcal
Protéines: 0.3 g
Glucides: 14 g
Lipides: 0.2 g
```

#### 2.6 - Vérification dans Supabase

1. **Ouvrir** le Dashboard Supabase dans votre navigateur
2. **Naviguer** vers **Table Editor** → **scans**
3. **Trouver** le scan que vous venez de créer (le plus récent)
4. **Cliquer** sur la ligne pour voir les détails

**Résultats attendus**:
- ✅ Une nouvelle ligne existe avec `scan_type = 'nutrition'`
- ✅ Le champ `image_url` contient une URL valide
- ✅ Le champ `analysis_result` contient des données JSON (pas NULL)
- ✅ Le JSON a la structure: `{ "items": [...], "totals": {...} }`

**Exemple de `analysis_result`**:
```json
{
  "items": [
    {
      "name": "Pomme",
      "kcal": 52,
      "protein_g": 0.3,
      "carb_g": 14,
      "fat_g": 0.2
    }
  ],
  "totals": {
    "kcal": 52,
    "protein_g": 0.3,
    "carb_g": 14,
    "fat_g": 0.2
  }
}
```

**✅ Scénario 2 validé**: Le scan nutrition fonctionne de bout en bout et enregistre correctement les données.

---

## Scénario de Test 3: Onglet Analyse avec Données Nutrition

### Objectif
Vérifier que l'onglet Analyse affiche correctement les graphiques nutritionnels grâce à la nouvelle colonne `analysis_result`.

### Étapes

#### 3.1 - Accès à l'Onglet Analyse

1. **Cliquer** sur l'onglet **"Analyse"**
2. **Observer** le chargement des données

**Résultats attendus**:
- ✅ Un spinner de chargement apparaît brièvement
- ✅ Les graphiques se chargent progressivement
- ✅ Aucune erreur rouge n'apparaît
- ✅ Aucun message "Impossible de charger les données"

**Logs attendus**:
```
[AnalyticsScreen] fetchData called with period: 30days
[AnalyticsScreen] Fetching analytics data...
[ApiService] getAnalytics called with period: 30days
[ApiService] health_scores fetched: X records
[ApiService] getNutritionHistory called with period: 30days
[ApiService] Nutrition scans fetched: X records
[ApiService] Extracted data points: X
[ApiService] Aggregated data points: X
[AnalyticsScreen] Nutrition history received: X items
[AnalyticsScreen] All data fetched successfully
[AnalyticsScreen] fetchData completed, setting loading to false
```

#### 3.2 - Vérification des Graphiques

**Graphiques attendus**:
1. **Score Santé** (Line Chart)
2. **Calories Consommées** (Bar Chart)
3. **Composition Corporelle** (Line Chart avec deux courbes)
4. **Calories Nutritionnelles** (Line Chart) ← **NOUVEAU**
5. **Lipides Consommés** (Line Chart) ← **NOUVEAU**

**Pour chaque graphique**:
- ✅ Le titre du graphique est affiché
- ✅ Les axes sont correctement labellisés
- ✅ Les données sont affichées (points, barres, ou lignes)
- ✅ Les dates sur l'axe X correspondent aux derniers jours

**Si vous voyez "Commencez à scanner pour voir vos progrès!"**:
- C'est normal si vous n'avez fait qu'un seul scan
- Effectuez 2-3 scans nutrition à des jours différents pour voir les tendances
- Ou modifiez manuellement les dates dans Supabase pour simuler des scans passés

#### 3.3 - Test du Sélecteur de Période

1. **Cliquer** sur **"7 jours"**
2. **Observer** le rechargement des graphiques
3. **Cliquer** sur **"3 mois"**
4. **Observer** à nouveau le rechargement

**Résultats attendus**:
- ✅ Les graphiques se mettent à jour en fonction de la période sélectionnée
- ✅ Le nombre de points de données change selon la période
- ✅ Aucune erreur dans les logs

**Logs attendus**:
```
[AnalyticsScreen] fetchData called with period: 7days
[ApiService] Fetching health_scores from: <date>
[ApiService] Fetching scans from: <date>
[AnalyticsScreen] All data fetched successfully
```

#### 3.4 - Vérification des Données Nutritionnelles

Si vous avez au moins un scan nutrition avec `analysis_result`:

**Graphique "Calories Nutritionnelles"**:
- ✅ Affiche les calories totales par jour
- ✅ Les valeurs correspondent aux totaux de vos scans

**Graphique "Lipides Consommés"**:
- ✅ Affiche les grammes de lipides par jour
- ✅ Les valeurs correspondent aux totaux de vos scans

**Si ces graphiques n'apparaissent pas**:
- Vérifiez que `analysis_result` n'est pas NULL dans Supabase
- Vérifiez que la structure JSON contient bien `totals.kcal` et `totals.fat_g`
- Consultez les logs pour voir si `getNutritionHistory` retourne des données

**✅ Scénario 3 validé**: L'onglet Analyse affiche correctement les données nutritionnelles.

---

## Scénario de Test 4: Messages d'Erreur de Limite

### Objectif
Vérifier que les messages d'erreur affichent bien la date du prochain scan disponible.

### Prérequis pour ce Test
- Le flag `BYPASS_PREMIUM_LIMITS` doit être à `false` dans la fonction Edge (voir `GUIDE_ERROR_MESSAGES.md`)
- Vous devez avoir un compte Free (non Premium) pour tester les limites

### Étapes

#### 4.1 - Effectuer un Premier Scan

1. **Naviguer** vers l'écran **Scanner**
2. **Sélectionner** une image
3. **Choisir** "Nutrition"
4. **Confirmer** et attendre la fin

**Résultats attendus**:
- ✅ Le scan est autorisé et enregistré
- ✅ Aucune erreur

**Logs attendus**:
```
[ApiService] Eligibility result: { allowed: true, message: "Scan autorisé", ... }
```

#### 4.2 - Tenter un Deuxième Scan Immédiatement

1. **Retourner** à l'écran Scanner (bouton retour ou navigation)
2. **Sélectionner** une autre image
3. **Choisir** "Nutrition" à nouveau
4. **Cliquer** sur "Confirmer et Sauvegarder"

**Résultats attendus**:
- ❌ Le scan est **refusé**
- ✅ Une **alerte** apparaît avec le titre "Limite atteinte"
- ✅ Le message contient: **"Prochain scan disponible le [DATE] à [HEURE]"**
- ✅ Deux boutons sont présents: **"OK"** et **"Passer à Premium"**

**Exemple de message complet**:
```
Limite atteinte. Prochain scan disponible le 10 novembre 2025 à 16:45.
```

**Logs attendus**:
```
[ApiService] Eligibility result: {
  allowed: false,
  message: "Limite atteinte. Prochain scan disponible le ...",
  next_available_date: 1731253500000
}
[ApiService] Scan not allowed: Limite atteinte. Prochain scan disponible le ...
[ScanPreview] Error in handleConfirm: Limite atteinte. Prochain scan disponible le ...
```

#### 4.3 - Test du Bouton Premium

1. Dans l'alerte, **cliquer** sur **"Passer à Premium"**
2. **Observer** la navigation

**Résultats attendus**:
- ✅ L'alerte se ferme
- ✅ Vous êtes redirigé vers la page `/premium-plan`
- ✅ Les détails du plan Premium s'affichent

#### 4.4 - Vérifier les Différents Messages par Type

**Pour "Health" (limite hebdomadaire)**:

1. Effectuer un scan "Health"
2. Tenter un deuxième scan "Health" immédiatement

**Message attendu**:
```
Limite hebdomadaire atteinte. Prochain scan disponible le [DATE dans ~7 jours] à [HEURE].
```

**Pour "Body" (limite mensuelle)**:

1. Effectuer un scan "Body"
2. Tenter un deuxième scan "Body" immédiatement

**Message attendu**:
```
Limite mensuelle atteinte. Prochain scan disponible le [DATE dans ~30 jours] à [HEURE].
```

#### 4.5 - Vérification de la Date et Heure

**Points à vérifier**:
- ✅ La date est au format français: "15 novembre 2025"
- ✅ L'heure est au format 24h: "14:30"
- ✅ Le délai correspond à la période attendue (3 jours pour nutrition, 7 jours pour health, 30 jours pour body)
- ✅ La date est dans le futur (pas dans le passé)

**✅ Scénario 4 validé**: Les messages d'erreur affichent correctement la date complète du prochain scan.

---

## Scénario de Test 5: Historique des Scans

### Objectif
Vérifier que l'historique des scans fonctionne correctement avec les nouvelles données.

### Étapes

#### 5.1 - Accès à l'Historique

1. Dans l'onglet **Analyse**, **cliquer** sur l'icône **Historique** (en haut à droite)
2. **Observer** l'écran d'historique

**Résultats attendus**:
- ✅ Une liste de vos scans apparaît
- ✅ Chaque scan affiche: Type, Date, Miniature de l'image
- ✅ Les scans sont triés par date (le plus récent en premier)

#### 5.2 - Consultation d'un Scan Nutrition

1. **Cliquer** sur un scan de type "Nutrition"
2. **Observer** les détails du scan

**Résultats attendus**:
- ✅ L'image du scan est affichée
- ✅ Les résultats d'analyse nutritionnelle sont visibles
- ✅ Les données correspondent à ce qui était affiché lors de la création

**Si les résultats n'apparaissent pas**:
- Vérifiez que `analysis_result` n'est pas NULL dans Supabase pour ce scan
- Consultez les logs pour voir si le scan a bien été récupéré avec `analysis_result`

**✅ Scénario 5 validé**: L'historique affiche correctement les scans avec leurs données nutritionnelles.

---

## Checklist de Validation Finale

### Bug #1: Crash Reanimated au Démarrage

- [ ] L'application démarre sans crash
- [ ] Aucune erreur "Worklet Mismatch" dans les logs
- [ ] Les animations de navigation sont fluides
- [ ] Les transitions d'onglets fonctionnent correctement
- [ ] Aucun freeze ou lag pendant l'utilisation

### Bug #2: Onglet Analyse Bloqué (Erreur 400)

- [ ] L'onglet Analyse se charge sans erreur
- [ ] Les graphiques de santé s'affichent correctement
- [ ] Les graphiques de nutrition s'affichent correctement (si scans disponibles)
- [ ] Le sélecteur de période (7j/30j/3m) fonctionne
- [ ] Les données dans Supabase ont bien `analysis_result` rempli

### Bug #3: Message d'Erreur de Limite Incomplet

- [ ] Le message d'erreur apparaît quand la limite est atteinte
- [ ] Le message contient la date au format: "15 novembre 2025"
- [ ] Le message contient l'heure au format: "14:30"
- [ ] Le message est différent selon le type de scan (hebdomadaire, mensuelle, 3 jours)
- [ ] Le bouton "Passer à Premium" s'affiche dans l'alerte

### Validation Globale

- [ ] Tous les onglets sont accessibles sans crash
- [ ] Les scans peuvent être créés et enregistrés
- [ ] Les données sont persistées correctement dans Supabase
- [ ] Les messages d'erreur sont clairs et informatifs
- [ ] L'application est stable et utilisable

---

## Dépannage Global

### Problème: L'Application Crash Encore après les Corrections

**Solution complète de nettoyage**:
```bash
# 1. Tout supprimer
rm -rf node_modules package-lock.json android ios

# 2. Nettoyer les caches
rm -rf $TMPDIR/metro-* $TMPDIR/haste-*
cd android && ./gradlew clean && cd ..

# 3. Réinstaller
npm install

# 4. Régénérer
npx expo prebuild --clean

# 5. Reconstruire
npx expo run:android
```

### Problème: Les Graphiques Nutrition Sont Vides

**Vérifications**:
1. Avez-vous au moins un scan nutrition avec `analysis_result` non-NULL ?
2. Le scan est-il dans la période sélectionnée (7j/30j/3m) ?
3. La structure JSON de `analysis_result` est-elle correcte ?

**Requête SQL de vérification**:
```sql
SELECT id, scan_type, analysis_result, created_at
FROM scans
WHERE scan_type = 'nutrition'
  AND analysis_result IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

### Problème: Les Messages d'Erreur N'Affichent Pas la Date

**Vérifications**:
1. Le flag `BYPASS_PREMIUM_LIMITS` est-il à `false` ?
2. La fonction Edge a-t-elle été redéployée ?
3. Attendez 1-2 minutes après le déploiement (cache CDN)

**Tester manuellement la fonction Edge**:
```bash
curl -X POST https://qpogulljnnacrxdjbwiz.supabase.co/functions/v1/check-and-record-scan \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scanType": "nutrition"}'
```

---

## Rapport de Test Final

Une fois tous les scénarios testés, remplissez ce rapport:

### Environnement de Test
- **Date**: _____________________
- **Appareil**: Émulateur Android (API Level: ____)
- **Version de l'App**: 1.0.0
- **Build Type**: Development Build

### Résultats des Tests

| Scénario | Statut | Notes |
|----------|--------|-------|
| 1. Démarrage et Navigation | ✅ / ❌ | |
| 2. Scan Nutrition Complet | ✅ / ❌ | |
| 3. Onglet Analyse | ✅ / ❌ | |
| 4. Messages d'Erreur | ✅ / ❌ | |
| 5. Historique des Scans | ✅ / ❌ | |

### Bugs Résiduels Identifiés

_Listez ici tous les bugs ou comportements inattendus découverts pendant les tests_

---

### Validation Finale

Si tous les scénarios sont ✅:

**🎉 FÉLICITATIONS ! Les trois bugs critiques sont résolus.**

Votre application est maintenant prête pour:
- [ ] Tests avec de vrais utilisateurs
- [ ] Création d'un build de production
- [ ] Déploiement sur Google Play Store (si applicable)

---

## Prochaines Étapes Recommandées

1. **Tests sur Appareil Réel**: Testez sur un vrai téléphone Android
2. **Tests iOS**: Si applicable, créez un build iOS et testez
3. **Performance Testing**: Testez avec de nombreux scans (50+)
4. **Network Testing**: Testez avec une connexion lente ou instable
5. **Edge Cases**: Testez avec des images invalides, très grandes, etc.

---

## Ressources

- [Guide Build Android](./GUIDE_BUILD_ANDROID_DEV.md)
- [Guide Migration Database](./GUIDE_MIGRATION_DATABASE.md)
- [Guide Error Messages](./GUIDE_ERROR_MESSAGES.md)
- [Debugging Guide](./DEBUGGING_GUIDE.md)

---

**Bon courage pour vos tests ! 🚀**
