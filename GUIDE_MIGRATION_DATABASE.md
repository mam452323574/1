# Guide: Application de la Migration Base de Données Supabase

## Introduction

Ce guide vous explique comment appliquer la migration SQL qui ajoute la colonne `analysis_result` à la table `scans`. Cette colonne est **essentielle** pour stocker les résultats d'analyse nutritionnelle et résoudre l'erreur 400 dans l'onglet Analyse.

## Pourquoi cette Migration est Nécessaire ?

Actuellement, votre application tente de:
1. Enregistrer les résultats d'analyse N8n dans la colonne `analysis_result`
2. Récupérer ces résultats depuis la colonne `analysis_result` pour afficher les graphiques

Mais cette colonne **n'existe pas encore** dans votre base de données de production, ce qui cause:
- ❌ Une erreur 400 lors de l'insertion de scans nutrition
- ❌ Une erreur dans l'onglet Analyse lors de la récupération des données
- ❌ Un affichage vide ou un message d'erreur "Impossible de charger les données"

---

## Prérequis

Avant de commencer:
- ✅ Avoir accès au Dashboard Supabase de votre projet
- ✅ Avoir les identifiants de connexion Supabase
- ✅ Avoir vérifié que l'URL Supabase dans `.env` est correcte

**URL de votre projet Supabase**: `https://qpogulljnnacrxdjbwiz.supabase.co`

---

## Étape 1: Connexion au Dashboard Supabase

### 1.1 - Accéder au Dashboard

1. Ouvrir votre navigateur web
2. Aller sur: https://supabase.com/dashboard
3. Se connecter avec vos identifiants
4. Sélectionner votre projet: **health-scan** (ID: qpogulljnnacrxdjbwiz)

### 1.2 - Naviguer vers l'Éditeur SQL

1. Dans le menu de gauche, cliquer sur **SQL Editor**
2. Vous verrez un éditeur de code SQL vide
3. Vous pouvez également cliquer sur **+ New Query** pour créer une nouvelle requête

---

## Étape 2: Vérification de l'État Actuel de la Table

Avant d'appliquer la migration, vérifions que la colonne n'existe pas déjà.

### 2.1 - Vérifier la Structure de la Table `scans`

Copiez et exécutez cette requête dans l'éditeur SQL:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'scans'
ORDER BY ordinal_position;
```

**Cliquez sur "Run" ou appuyez sur Ctrl+Enter**

### 2.2 - Analyser le Résultat

Vous devriez voir une liste de colonnes comme:
- `id` (uuid)
- `user_id` (uuid)
- `scan_type` (text)
- `image_url` (text)
- `created_at` (timestamp)

**Si vous voyez déjà `analysis_result` dans la liste**, la migration a déjà été appliquée et vous pouvez passer directement à l'Étape 4 (Vérification).

**Si `analysis_result` n'apparaît PAS**, continuez avec l'Étape 3.

---

## Étape 3: Application de la Migration

### 3.1 - Copier le Script de Migration

Le fichier de migration complet se trouve dans votre projet: `supabase/migrations/20251107000000_add_analysis_result_to_scans.sql`

Voici le contenu exact à exécuter:

```sql
/*
  # Add Analysis Result Storage to Scans

  ## Overview
  Adds a new column to store the complete JSON response from n8n workflow analysis.
  This enables tracking of nutritional data and other analysis results over time.

  ## Changes

  1. New Column
    - `analysis_result` (jsonb) - Stores the complete n8n webhook response
      * Contains items array with individual food analysis
      * Contains totals object with aggregated nutritional data
      * Nullable to support legacy scans without analysis

  2. Indexes
    - Add GIN index on analysis_result for efficient JSON queries
    - Add index on created_at for historical queries

  ## Example Analysis Result Structure
  {
    "items": [
      {
        "name": "Food item name",
        "kcal": 250,
        "protein_g": 10,
        "carb_g": 30,
        "fat_g": 8
      }
    ],
    "totals": {
      "kcal": 500,
      "protein_g": 20,
      "carb_g": 60,
      "fat_g": 16
    }
  }

  ## Security
  - No RLS policy changes needed (inherits from existing scan policies)
  - Users can only access their own scan analysis results
*/

-- Add analysis_result column to scans table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'analysis_result'
  ) THEN
    ALTER TABLE scans ADD COLUMN analysis_result jsonb DEFAULT NULL;
  END IF;
END $$;

-- Add GIN index for efficient JSON queries on analysis results
CREATE INDEX IF NOT EXISTS idx_scans_analysis_result_gin
ON scans USING GIN (analysis_result);

-- Add index on created_at for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_scans_created_at
ON scans(created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN scans.analysis_result IS 'Complete JSON response from n8n workflow containing nutritional analysis data';
```

### 3.2 - Exécuter la Migration

1. **Coller** le script complet dans l'éditeur SQL de Supabase
2. **Vérifier** que tout le code est bien sélectionné
3. Cliquer sur **"Run"** ou appuyer sur **Ctrl+Enter**
4. Attendre que l'exécution se termine (quelques secondes)

### 3.3 - Vérifier le Succès

Vous devriez voir dans la console de résultats:

```
Success. No rows returned
```

Ou

```
Command completed successfully
```

**Si vous voyez une erreur**, ne paniquez pas ! Passez à la section Dépannage ci-dessous.

---

## Étape 4: Vérification Post-Migration

Maintenant, vérifions que la migration a bien été appliquée.

### 4.1 - Vérifier la Nouvelle Colonne

Exécutez à nouveau la requête de vérification:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'scans'
ORDER BY ordinal_position;
```

**Résultat attendu**: Vous devez maintenant voir `analysis_result` (type: jsonb, nullable: YES)

### 4.2 - Vérifier les Index

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'scans';
```

**Résultat attendu**: Vous devez voir deux nouveaux index:
- `idx_scans_analysis_result_gin`
- `idx_scans_created_at`

### 4.3 - Test d'Insertion

Testons une insertion fictive pour vérifier que la colonne fonctionne:

```sql
-- Créer un test scan (remplacez <votre-user-id> par votre vrai user_id)
-- Pour obtenir votre user_id:
-- SELECT id FROM auth.users LIMIT 1;

-- Ne pas exécuter cette requête en production, c'est juste un exemple
-- INSERT INTO scans (user_id, scan_type, image_url, analysis_result)
-- VALUES (
--   '<votre-user-id>',
--   'nutrition',
--   'https://example.com/test.jpg',
--   '{"items": [{"name": "Test", "kcal": 100, "protein_g": 5, "carb_g": 10, "fat_g": 2}], "totals": {"kcal": 100, "protein_g": 5, "carb_g": 10, "fat_g": 2}}'::jsonb
-- );
```

**Note**: Ne lancez cette requête de test que si vous êtes sûr de votre user_id et que vous voulez créer un scan de test.

### 4.4 - Vérifier les Politiques RLS

Les politiques RLS existantes doivent automatiquement s'appliquer à la nouvelle colonne.

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'scans';
```

**Résultat attendu**: Vous devez voir des politiques comme:
- `Users can read own scans`
- `Users can insert own scans`
- `Users can update own scans`
- `Users can delete own scans`

**Important**: Aucune nouvelle politique n'est nécessaire. La colonne `analysis_result` hérite automatiquement des politiques existantes.

---

## Étape 5: Test avec l'Application Mobile

Maintenant que la migration est appliquée, testez avec votre application.

### 5.1 - Relancer l'Application

Si votre development build Android est déjà lancé:
1. Rechargez l'application (Ctrl+M → Reload)
2. Ou relancez Metro: `npm run dev`

### 5.2 - Effectuer un Scan Nutrition

1. Naviguer vers l'écran **Scanner**
2. Sélectionner une image
3. Choisir **"Nutrition"** comme type de scan
4. Cliquer sur **"Confirmer et Sauvegarder"**
5. Attendre l'analyse N8n

**Résultat attendu**:
- ✅ Le scan se termine avec succès
- ✅ Les résultats d'analyse s'affichent dans l'écran de résultats
- ✅ Aucune erreur 400 dans la console

### 5.3 - Vérifier l'Onglet Analyse

1. Naviguer vers l'onglet **Analyse**
2. Attendre le chargement des données

**Résultat attendu**:
- ✅ Les graphiques de nutrition apparaissent
- ✅ Les données de calories et lipides sont affichées
- ✅ Aucune erreur "Impossible de charger les données"

### 5.4 - Vérifier les Données dans Supabase

Retournez dans le Dashboard Supabase:

```sql
SELECT id, scan_type, analysis_result, created_at
FROM scans
WHERE scan_type = 'nutrition'
ORDER BY created_at DESC
LIMIT 5;
```

**Résultat attendu**: Vous devez voir vos scans nutrition avec des données JSON dans `analysis_result`:

```json
{
  "items": [
    {"name": "Pomme", "kcal": 52, "protein_g": 0.3, "carb_g": 14, "fat_g": 0.2}
  ],
  "totals": {
    "kcal": 52,
    "protein_g": 0.3,
    "carb_g": 14,
    "fat_g": 0.2
  }
}
```

---

## Dépannage

### Erreur 1: "Column already exists"

**Message**:
```
ERROR: column "analysis_result" of relation "scans" already exists
```

**Cause**: La colonne a déjà été ajoutée.

**Solution**: Aucune action nécessaire. La migration utilise `IF NOT EXISTS` donc c'est une erreur bénigne. Passez directement à l'Étape 4.

### Erreur 2: "Permission denied"

**Message**:
```
ERROR: permission denied for table scans
```

**Cause**: Vous n'avez pas les droits d'administration sur la base de données.

**Solution**:
1. Vérifiez que vous êtes bien connecté en tant que propriétaire du projet
2. Utilisez l'onglet "SQL Editor" de Supabase (pas un client externe)
3. Contactez le support Supabase si le problème persiste

### Erreur 3: "Table 'scans' does not exist"

**Message**:
```
ERROR: relation "scans" does not exist
```

**Cause**: La table `scans` n'a jamais été créée.

**Solution**: Vous devez d'abord exécuter les migrations précédentes qui créent la table. Consultez les fichiers dans `supabase/migrations/` et exécutez-les dans l'ordre chronologique (par nom de fichier).

Migrations à exécuter en premier:
1. `20251011185556_create_health_scan_tables.sql`
2. `20251011190837_update_rls_policies_for_auth.sql`
3. `20251011192822_add_scan_type_to_scans.sql`
4. `20251011200414_update_scans_schema_and_storage.sql`

Puis retentez cette migration.

### Erreur 4: "Cannot create GIN index"

**Message**:
```
ERROR: data type jsonb has no default operator class
```

**Cause**: Version de PostgreSQL trop ancienne (< 9.4).

**Solution**: Supabase utilise PostgreSQL 15+, donc cette erreur ne devrait jamais survenir. Si elle apparaît, contactez le support Supabase.

### Erreur 5: Données Nutrition Toujours Vides dans l'Onglet Analyse

**Cause possible 1**: Aucun scan nutrition n'a été effectué depuis la migration.

**Solution**: Effectuez au moins un scan nutrition avec l'application pour avoir des données à afficher.

**Cause possible 2**: Les scans existants n'ont pas de `analysis_result`.

**Solution**: C'est normal. Seuls les nouveaux scans nutrition auront des données. Les anciens scans ont `analysis_result = NULL`.

**Cause possible 3**: L'analyse N8n échoue.

**Solution**: Vérifiez les logs de l'application lors d'un scan nutrition:
```
[N8nWebhook] analyzeImage called
[N8nWebhook] Response received - status: 200
[N8nWebhook] Analysis successful
```

Si l'analyse échoue, le problème vient du webhook N8n, pas de la base de données.

---

## Script de Rollback (Si Nécessaire)

Si vous devez annuler la migration pour une raison quelconque:

```sql
-- ATTENTION: Ceci supprimera la colonne et toutes les données qu'elle contient

-- Supprimer les index
DROP INDEX IF EXISTS idx_scans_analysis_result_gin;
DROP INDEX IF EXISTS idx_scans_created_at;

-- Supprimer la colonne
ALTER TABLE scans DROP COLUMN IF EXISTS analysis_result;
```

**⚠️ ATTENTION**: Cette opération est **irréversible** et supprimera toutes les données d'analyse nutritionnelle enregistrées. Ne l'exécutez que si vous êtes absolument certain de vouloir revenir en arrière.

---

## Checklist de Validation Finale

Avant de passer à l'étape suivante, vérifiez que:

- [ ] La colonne `analysis_result` existe dans la table `scans`
- [ ] Les index `idx_scans_analysis_result_gin` et `idx_scans_created_at` existent
- [ ] Les politiques RLS s'appliquent correctement à la nouvelle colonne
- [ ] Vous pouvez effectuer un scan nutrition sans erreur 400
- [ ] L'onglet Analyse affiche les données nutritionnelles
- [ ] Les données sont bien enregistrées dans Supabase avec `analysis_result` rempli

---

## Prochaines Étapes

Une fois la migration appliquée et validée, vous pourrez:

1. ✅ **Tester les messages d'erreur** de limite de scan
2. ✅ **Valider le flux complet** de l'application
3. ✅ **Déployer en production** avec confiance

Consultez le guide suivant: `GUIDE_ERROR_MESSAGES.md`

---

## Ressources

- [Supabase SQL Editor Documentation](https://supabase.com/docs/guides/database/overview)
- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [PostgreSQL GIN Indexes](https://www.postgresql.org/docs/current/gin-intro.html)
- [Supabase Migrations Best Practices](https://supabase.com/docs/guides/database/migrations)

---

**Note Importante**: Cette migration est **safe** et **réversible**. Elle n'affecte pas les données existantes et ne supprime aucune colonne. Les anciens scans continueront de fonctionner avec `analysis_result = NULL`.
