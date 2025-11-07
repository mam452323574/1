# Guide de Débogage - Application Health Scan

## Introduction

Ce guide explique comment utiliser les logs de débogage ajoutés à l'application pour identifier et résoudre les bugs fonctionnels.

## Logs Ajoutés

Des logs détaillés ont été ajoutés dans les composants et services clés de l'application:

### 1. ScanPreviewScreen - Bouton de Confirmation

**Fichier**: `screens/ScanPreviewScreen.tsx`

**Fonction**: `handleConfirm`

**Logs disponibles**:
```
[ScanPreview] handleConfirm called
[ScanPreview] imageUri: <uri>
[ScanPreview] scanType: <type>
[ScanPreview] Loading state set to true
[ScanPreview] Nutrition scan detected, loading message updated
[ScanPreview] Calling ApiService.createScan...
[ScanPreview] Scan created successfully: <data>
[ScanPreview] Confetti triggered, badge set
[ScanPreview] Timeout callback executing...
[ScanPreview] Navigating to scan-results with analysis data
[ScanPreview] Error in handleConfirm: <error>
```

### 2. N8nWebhookService - Analyse d'Image

**Fichier**: `services/n8nWebhook.ts`

**Fonction**: `analyzeImage`

**Logs disponibles**:
```
[N8nWebhook] analyzeImage called with imageUri: <uri>
[N8nWebhook] Using workflow X of Y
[N8nWebhook] URL: <webhook-url>
[N8nWebhook] Building FormData...
[N8nWebhook] File info - filename: <name> type: <type>
[N8nWebhook] FormData prepared successfully
[N8nWebhook] Sending POST request to webhook...
[N8nWebhook] Response received - status: <status>
[N8nWebhook] Parsing JSON response...
[N8nWebhook] JSON parsed successfully
[N8nWebhook] Analysis successful: <summary>
[N8nWebhook] Error in analyzeImage: <error>
[N8nWebhook] Request timeout after 30000 ms
```

### 3. ApiService - Opérations CRUD

**Fichier**: `services/api.ts`

**Fonctions**: `getAnalytics`, `getNutritionHistory`, `createScan`

**Logs disponibles**:
```
[ApiService] getAnalytics called with period: <period>
[ApiService] User ID: <id>
[ApiService] Fetching health_scores from: <date>
[ApiService] health_scores fetched: X records
[ApiService] Error fetching health_scores: <error>

[ApiService] getNutritionHistory called with period: <period>
[ApiService] Fetching scans from: <date>
[ApiService] Nutrition scans fetched: X records
[ApiService] Error fetching nutrition scans: <error>

[ApiService] createScan called
[ApiService] imageUri: <uri>
[ApiService] scanType: <type>
[ApiService] Checking scan eligibility...
[ApiService] Eligibility result: <result>
[ApiService] Nutrition scan - calling N8nWebhookService...
[ApiService] Analysis result received from N8n
[ApiService] Fetching image from URI...
[ApiService] Image fetch response status: <status>
[ApiService] Image converted to blob, size: <size>
[ApiService] Uploading to storage with filename: <filename>
[ApiService] Image uploaded successfully
[ApiService] Public URL generated: <url>
[ApiService] Inserting scan record into database...
[ApiService] Scan created successfully: <data>
```

### 4. AnalyticsScreen - Chargement des Données

**Fichier**: `screens/AnalyticsScreen.tsx`

**Fonction**: `fetchData`

**Logs disponibles**:
```
[AnalyticsScreen] fetchData called with period: <period>
[AnalyticsScreen] Fetching analytics data...
[AnalyticsScreen] Analytics data received: <data>
[AnalyticsScreen] Error fetching analytics: <error>
[AnalyticsScreen] Nutrition history received: X items
[AnalyticsScreen] Error fetching nutrition history: <error>
[AnalyticsScreen] All data fetched successfully
[AnalyticsScreen] Error in fetchData: <error>
[AnalyticsScreen] Setting error message: <message>
[AnalyticsScreen] fetchData completed, setting loading to false
```

## Comment Déboguer les Bugs

### Bug #1: Bouton "Confirmer et Sauvegarder" ne fait rien (PC)

**Symptôme**: Cliquer sur le bouton ne déclenche aucune action visible.

**Étapes de débogage**:

1. **Ouvrir la Console de Développement**:
   - Sur PC web: Ouvrir DevTools (F12) → Console
   - Sur mobile: Utiliser React Native Debugger ou la console Metro

2. **Reproduire le problème**:
   - Sélectionner une image
   - Cliquer sur "Confirmer et Sauvegarder"

3. **Analyser les logs**:

   **Scénario A - Le bouton n'est pas cliqué du tout**:
   - Aucun log `[ScanPreview] handleConfirm called`
   - **Cause probable**: Problème d'interface (bouton disabled, z-index, overlay)
   - **Solution**: Vérifier l'état `loading` et la hiérarchie des composants

   **Scénario B - La fonction est appelée mais échoue silencieusement**:
   ```
   [ScanPreview] handleConfirm called
   [ScanPreview] Calling ApiService.createScan...
   [ApiService] createScan called
   [ApiService] Checking scan eligibility...
   // Puis plus rien
   ```
   - **Cause probable**: L'appel à `checkScanEligibility` échoue sans erreur catchée
   - **Solution**: Vérifier les logs côté serveur Supabase Edge Function

   **Scénario C - L'analyse N8n échoue**:
   ```
   [ApiService] Nutrition scan - calling N8nWebhookService...
   [N8nWebhook] analyzeImage called with imageUri: <uri>
   [N8nWebhook] Sending POST request to webhook...
   // Timeout ou erreur
   [N8nWebhook] Error in analyzeImage: Network request failed
   ```
   - **Cause probable**: Problème réseau ou serveur N8n inaccessible
   - **Solution**: Vérifier la connectivité, le pare-feu, et les logs serveur N8n

   **Scénario D - L'upload Supabase échoue**:
   ```
   [ApiService] Fetching image from URI...
   [ApiService] Image fetch response status: 404
   ```
   - **Cause probable**: L'URI de l'image est invalide sur PC
   - **Solution**: Vérifier comment l'URI est générée sur PC vs mobile

4. **Corriger le problème identifié**:
   - Une fois la cause trouvée via les logs, appliquer le correctif approprié
   - Retester en vérifiant les nouveaux logs

### Bug #2: Onglet "Analyse" affiche une erreur (PC)

**Symptôme**: Message "Une erreur est survenue" en rouge.

**Étapes de débogage**:

1. **Ouvrir la Console**:
   - DevTools → Console (F12)

2. **Naviguer vers l'onglet Analyse**:
   - Cliquer sur l'onglet Analytics

3. **Analyser les logs**:

   **Scénario A - Erreur lors de la récupération des health_scores**:
   ```
   [AnalyticsScreen] Fetching analytics data...
   [ApiService] getAnalytics called with period: 30days
   [ApiService] Fetching health_scores from: 2025-10-08
   [ApiService] Error fetching health_scores: {
     code: "42P01",
     message: "relation \"health_scores\" does not exist"
   }
   ```
   - **Cause**: La table `health_scores` n'existe pas dans Supabase
   - **Solution**: Exécuter les migrations manquantes dans Supabase

   **Scénario B - Erreur lors de la récupération des scans**:
   ```
   [ApiService] getNutritionHistory called with period: 30days
   [ApiService] Error fetching nutrition scans: {
     code: "42P01",
     message: "relation \"scans\" does not exist"
   }
   ```
   - **Cause**: La table `scans` n'existe pas
   - **Solution**: Exécuter les migrations manquantes

   **Scénario C - Erreur de permission RLS**:
   ```
   [ApiService] Error fetching health_scores: {
     code: "42501",
     message: "new row violates row-level security policy"
   }
   ```
   - **Cause**: Les politiques RLS bloquent l'accès aux données
   - **Solution**: Vérifier et corriger les politiques RLS dans Supabase

   **Scénario D - Aucune donnée disponible**:
   ```
   [AnalyticsScreen] All data fetched successfully
   [ApiService] health_scores fetched: 0 records
   [ApiService] Nutrition scans fetched: 0 records
   ```
   - **Cause**: L'utilisateur n'a pas encore de données
   - **Comportement attendu**: Afficher "Commencez à scanner pour voir vos progrès!"

4. **Vérifier les tables Supabase**:
   ```sql
   -- Se connecter à la console Supabase et exécuter:
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';

   -- Vérifier les données d'un utilisateur spécifique:
   SELECT * FROM health_scores WHERE user_id = '<user-id>';
   SELECT * FROM scans WHERE user_id = '<user-id>';
   ```

5. **Vérifier les politiques RLS**:
   ```sql
   -- Lister les politiques RLS:
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE tablename IN ('health_scores', 'scans');
   ```

## Outils de Débogage

### Console Metro (React Native)

Pour voir les logs en temps réel pendant le développement:

```bash
# Terminal 1: Démarrer Metro
npm run dev

# Les logs console.log/error apparaîtront automatiquement
```

### React Native Debugger (Recommandé pour Mobile)

1. Installer React Native Debugger:
   ```bash
   # macOS
   brew install --cask react-native-debugger

   # Windows/Linux
   # Télécharger depuis https://github.com/jhen0409/react-native-debugger/releases
   ```

2. Lancer l'application:
   ```bash
   npm run dev
   ```

3. Ouvrir React Native Debugger sur le port 8081

4. Activer le Remote Debugging dans l'app:
   - Secouer l'appareil ou Cmd+D (iOS) / Cmd+M (Android)
   - Sélectionner "Debug"

### DevTools Chrome (Pour Web)

1. Lancer l'application web:
   ```bash
   npm run dev
   # Appuyer sur 'w' pour ouvrir dans le navigateur
   ```

2. Ouvrir DevTools: F12 ou Cmd+Option+I (Mac)

3. Onglet Console: Voir tous les logs

4. Onglet Network: Voir les requêtes API et webhooks

## Scénarios de Test

### Test du Scan Preview

1. Naviguer vers l'écran Scanner
2. Sélectionner une image
3. Choisir "Nutrition" comme type de scan
4. Vérifier dans la console:
   - Les logs `[ScanPreview]` apparaissent
   - Les logs `[ApiService]` suivent
   - Les logs `[N8nWebhook]` pour l'analyse
   - Pas d'erreur rouge

### Test de l'Analytics

1. S'assurer d'avoir au moins un scan enregistré
2. Naviguer vers l'onglet Analyse
3. Vérifier dans la console:
   - Les logs `[AnalyticsScreen]` apparaissent
   - Les logs `[ApiService]` pour getAnalytics et getNutritionHistory
   - Les données sont bien récupérées (X records)
   - Pas d'erreur rouge

## Résumé des Points de Défaillance Possibles

### Pour le Bug du Bouton Scan:
1. ❌ Bouton pas cliqué → Problème UI
2. ❌ checkScanEligibility échoue → Edge Function ou RLS
3. ❌ N8nWebhookService timeout → Réseau ou serveur N8n
4. ❌ Upload Supabase échoue → Permissions storage ou URI invalide
5. ❌ Navigation échoue → Route mal configurée

### Pour le Bug de l'Analytics:
1. ❌ Table health_scores inexistante → Migration manquante
2. ❌ Table scans inexistante → Migration manquante
3. ❌ RLS bloque l'accès → Politique trop restrictive
4. ❌ Aucune donnée → Normal si premier usage
5. ❌ Requête Supabase mal formée → Erreur SQL

## Conclusion

Avec ces logs détaillés, vous pouvez maintenant:
1. Identifier précisément où le code échoue
2. Comprendre le flux d'exécution complet
3. Diagnostiquer rapidement les problèmes réseau, base de données, ou logique métier
4. Communiquer efficacement avec l'équipe sur les bugs rencontrés

**Note**: En production, pensez à désactiver ou réduire ces logs pour optimiser les performances et éviter de logger des données sensibles.
