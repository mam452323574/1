# Guide: Vérification et Test des Messages d'Erreur de Limite de Scan

## Introduction

Ce guide vous explique comment vérifier que les messages d'erreur de limite de scan affichent correctement la date et l'heure du prochain scan disponible. D'après l'analyse du code, **la logique est déjà implémentée correctement**, mais nous allons la valider et tester.

## Analyse du Code Existant

### 1. Fonction Edge: `check-and-record-scan`

**Fichier**: `supabase/functions/check-and-record-scan/index.ts`

Cette fonction est responsable de:
1. ✅ Vérifier si l'utilisateur a atteint sa limite de scans
2. ✅ Calculer la date du prochain scan disponible (`next_available_date`)
3. ✅ Formater le message d'erreur avec la date complète
4. ✅ Retourner ces informations au client

**Code clé (lignes 138-163)**:
```typescript
if (!BYPASS_PREMIUM_LIMITS && validTimestamps.length >= limit.count) {
  const oldestTimestamp = validTimestamps.sort()[0];
  const nextAvailableDate = new Date(oldestTimestamp).getTime() + limit.periodMs;
  const timeRemaining = nextAvailableDate - now;
  const formattedTime = formatTimeRemaining(timeRemaining);
  const absoluteDate = formatAbsoluteDate(nextAvailableDate);

  const message = `${SCAN_MESSAGES[accountTier][scanType]}. Prochain scan disponible le ${absoluteDate} (dans ${formattedTime}).`;

  return new Response(
    JSON.stringify({
      success: true,
      allowed: false,
      message: message,
      next_available_date: nextAvailableDate,
      current_count: validTimestamps.length,
      limit: limit.count,
    }),
    // ...
  );
}
```

**Exemple de message retourné**:
```
"Limite atteinte. Prochain scan disponible le 15 novembre 2025 à 14:30 (dans 2 jours)."
```

### 2. Service API Client: `ApiService.createScan`

**Fichier**: `services/api.ts` (lignes 255-275)

Cette fonction:
1. ✅ Appelle la fonction Edge `checkScanEligibility`
2. ✅ Récupère le champ `next_available_date` de la réponse
3. ✅ Formate ce timestamp en date locale française
4. ✅ Construit le message d'erreur complet
5. ✅ Lance une erreur avec ce message

**Code clé**:
```typescript
if (!eligibility.allowed) {
  console.error('[ApiService] Scan not allowed:', eligibility.message);

  let errorMessage = eligibility.message || 'Scan non autorisé';

  if (eligibility.next_available_date) {
    const nextDate = new Date(eligibility.next_available_date);
    const formattedDate = nextDate.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const baseMessage = errorMessage.split('.')[0];
    errorMessage = `${baseMessage}. Prochain scan disponible le ${formattedDate}.`;
  }

  throw new Error(errorMessage);
}
```

**Exemple de message final**:
```
"Limite atteinte. Prochain scan disponible le 15 novembre 2025 à 14:30."
```

### 3. Interface Utilisateur: `ScanPreviewScreen`

**Fichier**: `screens/ScanPreviewScreen.tsx` (lignes 66-89)

Cette fonction:
1. ✅ Capture l'erreur lancée par `ApiService.createScan`
2. ✅ Détecte si c'est une erreur de limite (contient "Limite" et "atteinte")
3. ✅ Affiche une alerte avec le message complet
4. ✅ Propose un bouton "Passer à Premium"

**Code clé**:
```typescript
catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';

  if (errorMessage.includes('Limite') && errorMessage.includes('atteinte')) {
    Alert.alert(
      'Limite atteinte',
      errorMessage,
      [
        { text: 'OK', style: 'cancel' },
        {
          text: 'Passer à Premium',
          onPress: () => {
            router.push('/premium-plan');
          },
        },
      ]
    );
  } else {
    Alert.alert('Erreur', errorMessage);
  }

  setLoading(false);
}
```

---

## Conclusion de l'Analyse

**✅ Le code est déjà correctement implémenté !**

La chaîne complète fonctionne comme suit:
1. La fonction Edge calcule le `next_available_date` et le retourne
2. Le service API le formate en français avec date et heure
3. L'interface utilisateur affiche le message dans une alerte

**Le seul problème potentiel** est le flag `BYPASS_PREMIUM_LIMITS = true` dans la fonction Edge, qui **désactive complètement la vérification des limites**.

---

## Test et Validation

Pour vérifier que les messages fonctionnent correctement, nous devons **désactiver temporairement le bypass** et tester.

### Étape 1: Modifier la Fonction Edge (Temporaire)

**⚠️ IMPORTANT**: Cette modification est **uniquement pour les tests**. Vous devrez la réactiver après.

#### 1.1 - Accéder au Code de la Fonction Edge

Le fichier se trouve dans: `supabase/functions/check-and-record-scan/index.ts`

#### 1.2 - Désactiver le Bypass

**Ligne 9 actuelle**:
```typescript
const BYPASS_PREMIUM_LIMITS = true;
```

**Modifier en**:
```typescript
const BYPASS_PREMIUM_LIMITS = false;
```

#### 1.3 - Redéployer la Fonction Edge

Pour redéployer la fonction modifiée, nous devons utiliser l'outil de déploiement Supabase.

**Option A: Via l'interface Bolt (si disponible)**

Bolt devrait avoir déployé automatiquement cette fonction. Pour la mettre à jour:
1. Modifiez le fichier localement (comme indiqué ci-dessus)
2. Utilisez l'outil MCP Supabase pour redéployer

**Option B: Via la console Supabase**

Si vous ne pouvez pas redéployer depuis Bolt:
1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Menu de gauche: **Edge Functions**
4. Sélectionner `check-and-record-scan`
5. Cliquer sur **Deploy** et coller le code modifié

**Option C: Via Supabase CLI (local)**

```bash
# Se connecter à Supabase
npx supabase login

# Lier votre projet
npx supabase link --project-ref qpogulljnnacrxdjbwiz

# Déployer la fonction
npx supabase functions deploy check-and-record-scan
```

---

### Étape 2: Scénario de Test Complet

Une fois le bypass désactivé, voici comment tester:

#### 2.1 - Effectuer un Premier Scan

1. Ouvrir l'application mobile (development build Android)
2. Naviguer vers l'écran **Scanner**
3. Sélectionner une image
4. Choisir **"Nutrition"** comme type de scan
5. Cliquer sur **"Confirmer et Sauvegarder"**
6. Attendre que le scan se termine avec succès

**Résultat attendu**:
- ✅ Le scan est autorisé
- ✅ Le message "Scan autorisé" apparaît dans les logs
- ✅ Les résultats s'affichent

#### 2.2 - Effectuer un Deuxième Scan Immédiatement

1. Retourner à l'écran **Scanner**
2. Sélectionner une autre image
3. Choisir **"Nutrition"** à nouveau
4. Cliquer sur **"Confirmer et Sauvegarder"**

**Résultat attendu**:
- ❌ Le scan est **refusé**
- ❌ Une alerte apparaît avec le titre **"Limite atteinte"**
- ✅ Le message contient: **"Prochain scan disponible le [DATE] à [HEURE]"**

**Exemple de message complet**:
```
Limite atteinte. Prochain scan disponible le 10 novembre 2025 à 16:45.
```

#### 2.3 - Vérifier les Logs

Dans la console Metro, vous devriez voir:

```
[ApiService] Scan not allowed: Limite atteinte. Prochain scan disponible le ...
[ScanPreview] Error in handleConfirm: Limite atteinte. Prochain scan disponible le ...
```

#### 2.4 - Vérifier le Bouton Premium

Dans l'alerte, deux boutons doivent apparaître:
1. **"OK"** - Ferme l'alerte
2. **"Passer à Premium"** - Redirige vers `/premium-plan`

Cliquez sur **"Passer à Premium"** et vérifiez que la navigation fonctionne.

---

### Étape 3: Test des Différents Types de Scan

Testez également les autres types de scan pour vérifier leurs messages spécifiques.

#### 3.1 - Scan "Health" (Limite: 1 par semaine)

1. Effectuer un premier scan "Health"
2. Tenter un deuxième scan "Health" immédiatement

**Message attendu**:
```
Limite hebdomadaire atteinte. Prochain scan disponible le [DATE dans ~7 jours] à [HEURE].
```

#### 3.2 - Scan "Body" (Limite: 1 par mois)

1. Effectuer un premier scan "Body"
2. Tenter un deuxième scan "Body" immédiatement

**Message attendu**:
```
Limite mensuelle atteinte. Prochain scan disponible le [DATE dans ~30 jours] à [HEURE].
```

#### 3.3 - Scan "Nutrition" (Limite: 1 par 3 jours)

1. Effectuer un premier scan "Nutrition"
2. Tenter un deuxième scan "Nutrition" immédiatement

**Message attendu**:
```
Limite atteinte. Prochain scan disponible le [DATE dans ~3 jours] à [HEURE].
```

---

### Étape 4: Réactiver le Bypass

**⚠️ IMPORTANT**: Une fois les tests terminés, réactivez le bypass pour ne pas gêner votre développement.

#### 4.1 - Modifier la Fonction Edge

**Ligne 9 à remettre**:
```typescript
const BYPASS_PREMIUM_LIMITS = true;
```

#### 4.2 - Redéployer la Fonction Edge

Utilisez la même méthode qu'à l'Étape 1.3 pour redéployer avec le bypass activé.

#### 4.3 - Vérifier que le Bypass Fonctionne

Effectuez plusieurs scans successifs du même type et vérifiez qu'ils sont tous autorisés.

**Résultat attendu**:
- ✅ Tous les scans passent sans erreur de limite
- ✅ Aucun message "Limite atteinte" n'apparaît

---

## Vérification dans Supabase Dashboard

Pour voir les données de limitation de scan dans la base de données:

### Requête: Voir l'Utilisation de Scan d'un Utilisateur

```sql
SELECT
  id,
  email,
  account_tier,
  scan_usage
FROM user_profiles
WHERE email = 'votre.email@example.com';
```

**Résultat attendu**:
```json
{
  "health": {
    "last_scan_date": "2025-11-07T14:30:00.000Z",
    "scan_timestamps": ["2025-11-07T14:30:00.000Z"]
  },
  "body": {
    "last_scan_date": null,
    "scan_timestamps": []
  },
  "nutrition": {
    "last_scan_date": "2025-11-07T15:45:00.000Z",
    "scan_timestamps": ["2025-11-07T15:45:00.000Z"]
  }
}
```

### Requête: Réinitialiser l'Utilisation de Scan (Pour Tests)

Si vous voulez réinitialiser vos compteurs de scan pour retester:

```sql
UPDATE user_profiles
SET scan_usage = '{
  "health": {"last_scan_date": null, "scan_timestamps": []},
  "body": {"last_scan_date": null, "scan_timestamps": []},
  "nutrition": {"last_scan_date": null, "scan_timestamps": []}
}'::jsonb
WHERE email = 'votre.email@example.com';
```

**⚠️ Attention**: Ceci supprime l'historique des scans de l'utilisateur. À utiliser uniquement en développement.

---

## Dépannage

### Problème 1: Le Message N'Affiche Pas la Date

**Symptôme**: Le message est juste "Limite atteinte" sans date.

**Causes possibles**:
1. La fonction Edge retourne `next_available_date = undefined`
2. Le service API ne formate pas correctement le timestamp
3. Le bypass est toujours activé

**Solution**:
1. Vérifier les logs côté serveur de la fonction Edge
2. Vérifier les logs `[ApiService]` dans la console mobile
3. Confirmer que `BYPASS_PREMIUM_LIMITS = false` et redéployer

### Problème 2: La Date Affichée est Incorrecte

**Symptôme**: La date affichée ne correspond pas à la période attendue (ex: "dans 10 minutes" au lieu de "dans 3 jours").

**Causes possibles**:
1. Les constantes `SCAN_LIMITS` sont mal configurées dans la fonction Edge
2. Le fuseau horaire n'est pas géré correctement

**Solution**:
1. Vérifier les valeurs dans `SCAN_LIMITS` (ligne 26-37 de `check-and-record-scan/index.ts`):
   - `nutrition`: `periodMs: 3 * 24 * 60 * 60 * 1000` (3 jours)
   - `health`: `periodMs: 7 * 24 * 60 * 60 * 1000` (7 jours)
   - `body`: `periodMs: 30 * 24 * 60 * 60 * 1000` (30 jours)
2. Vérifier que `formatAbsoluteDate` utilise bien le locale 'fr-FR'

### Problème 3: Le Bouton "Passer à Premium" Ne S'Affiche Pas

**Symptôme**: L'alerte n'a qu'un bouton "OK".

**Causes possibles**:
1. Le message d'erreur ne contient pas les mots-clés "Limite" ET "atteinte"
2. La logique dans `ScanPreviewScreen.tsx` ne détecte pas l'erreur

**Solution**:
1. Vérifier les logs `[ScanPreview]` pour voir le message exact
2. Confirmer que le message contient bien "Limite" et "atteinte"
3. Vérifier le code ligne 72-85 de `ScanPreviewScreen.tsx`

### Problème 4: Les Scans Passent Malgré le Bypass Désactivé

**Symptôme**: Vous pouvez faire autant de scans que vous voulez même avec `BYPASS_PREMIUM_LIMITS = false`.

**Causes possibles**:
1. La fonction Edge n'a pas été redéployée correctement
2. Le cache de la fonction Edge n'a pas été invalidé
3. Une ancienne version de la fonction est toujours en cours d'exécution

**Solution**:
1. Attendre 1-2 minutes après le déploiement (cache CDN)
2. Redéployer la fonction explicitement
3. Vérifier dans Dashboard Supabase → Edge Functions que la version déployée est correcte
4. Effectuer un "hard refresh" de l'application mobile

---

## Checklist de Validation Finale

Avant de considérer ce bug comme résolu:

- [ ] Le code de la fonction Edge calcule bien `next_available_date`
- [ ] Le service API formate bien la date en français
- [ ] L'interface affiche bien le message complet avec date et heure
- [ ] Les trois types de scan ont des messages différents (hebdomadaire, mensuelle, 3 jours)
- [ ] Le bouton "Passer à Premium" apparaît dans l'alerte
- [ ] Le bypass peut être activé/désactivé facilement pour les tests
- [ ] Les logs sont clairs et permettent de déboguer facilement

---

## Résumé

**✅ Le code existant implémente déjà correctement la fonctionnalité demandée.**

Les messages d'erreur affichent:
- Le type de limite (hebdomadaire, mensuelle, ou par période)
- La date exacte du prochain scan disponible (format français: "15 novembre 2025 à 14:30")
- Un bouton pour upgrader vers Premium

**La seule action nécessaire** est de désactiver temporairement `BYPASS_PREMIUM_LIMITS` pour tester que tout fonctionne comme prévu.

---

## Prochaines Étapes

Une fois les trois bugs validés:

1. ✅ **Development build Android** créé et fonctionnel
2. ✅ **Migration database** appliquée et validée
3. ✅ **Messages d'erreur** testés et validés

Vous êtes prêt pour le **test intégré final** !

Consultez le guide suivant: `GUIDE_TEST_INTEGRATION.md`

---

## Ressources

- [React Native Alert API](https://reactnative.dev/docs/alert)
- [JavaScript Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [Supabase Edge Functions Deployment](https://supabase.com/docs/guides/functions/deploy)
