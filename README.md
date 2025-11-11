# Health Scan App

Application mobile de suivi santé développée avec Expo et React Native.

## Technologies

- **Frontend**: Expo SDK 54, React Native, TypeScript
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Navigation**: Expo Router
- **State Management**: React Context API
- **Paiements**: React Native IAP
- **Analyse d'images**: N8n Webhooks

## Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase configuré

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env` à la racine du projet avec:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Développement

```bash
npm run dev
```

Pour les builds natifs:

```bash
npm run android
npm run ios
```

## Structure du projet

```
/app              # Routes Expo Router
  /(auth)         # Écrans d'authentification
  /(tabs)         # Navigation par onglets
/components       # Composants réutilisables
/contexts         # Contextes React (Auth, Notifications, Badges)
/hooks            # Hooks personnalisés
/screens          # Écrans de l'application
/services         # Services (API, Supabase, Paiements, N8n)
/types            # Définitions TypeScript
/constants        # Constantes (thème, limites de scan)
/utils            # Utilitaires
/supabase         # Migrations et Edge Functions
  /migrations     # Migrations SQL
  /functions      # Edge Functions Deno
```

## Fonctionnalités principales

### Authentification
- Inscription/Connexion par email/mot de passe
- OAuth (Google, Apple)
- Vérification par email avec code
- Gestion des appareils de confiance

### Scans
- **Scan Santé (Visage)**: Analyse de la santé générale
- **Scan Corps**: Analyse de la composition corporelle
- **Scan Nutrition**: Analyse nutritionnelle des repas (via N8n)

Limites par type de compte:
- **Free**: 1 scan santé/semaine, 1 scan corps/mois, 1 scan nutrition/3 jours
- **Premium**: 3 scans par jour pour chaque type

### Système de notifications
- Notifications push (Expo Notifications)
- Rappels de scans disponibles
- Achievements et jalons

### Analytics
- Historique des scans
- Graphiques d'évolution
- Statistiques nutritionnelles

## Edge Functions

Les Edge Functions Supabase sont utilisées pour:
- `check-and-record-scan`: Vérification et enregistrement des limites de scan
- `send-verification-email`: Envoi des codes de vérification email
- `upgrade-to-premium`: Gestion des upgrades premium
- `send-push-notifications`: Envoi des notifications push
- `schedule-scan-notifications`: Planification des rappels de scan

## Sécurité

- Row Level Security (RLS) activé sur toutes les tables Supabase
- Validation des JWT côté serveur dans les Edge Functions
- Chiffrement des données sensibles
- Vérification des emails jetables

## Scripts utiles

```bash
npm run clean          # Nettoyer node_modules
npm run clean:cache    # Nettoyer le cache Expo
npm run typecheck      # Vérification TypeScript
npm run lint           # Linter
```

## Déploiement

### Android
1. Configurer `app.json` avec le bon `package` et `versionCode`
2. Générer un keystore de signature
3. Build avec EAS Build ou localement

### iOS
1. Configurer `app.json` avec le bon `bundleIdentifier`
2. Configurer les certificats Apple
3. Build avec EAS Build ou Xcode

## Support

Pour toute question ou problème, référez-vous à la documentation Expo et Supabase.
