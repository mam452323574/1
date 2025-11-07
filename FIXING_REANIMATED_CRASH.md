# Guide de Correction du Crash Mobile - Reanimated Worklet Mismatch

## Problème Identifié

L'application crash au démarrage sur mobile avec l'erreur:
```
Uncaught Error: Worklet Mismatch between JavaScript part and Native part of worklet (0.6.1 vs 0.5.1)
```

Ce problème est causé par une **configuration Babel manquante** pour React Native Reanimated. Sans le plugin Babel approprié, les versions JavaScript et native de Reanimated ne sont pas synchronisées.

## Solution Implémentée

### 1. Configuration Babel Créée

Un fichier `babel.config.js` a été créé à la racine du projet avec la configuration requise:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};
```

**IMPORTANT**: Le plugin `react-native-reanimated/plugin` **DOIT** être en dernière position dans la liste des plugins.

### 2. Scripts de Nettoyage Ajoutés

De nouveaux scripts ont été ajoutés dans `package.json` pour faciliter le nettoyage:

```json
"scripts": {
  "clean": "rm -rf node_modules package-lock.json",
  "clean:cache": "npm start -- --reset-cache",
  "clean:all": "rm -rf node_modules package-lock.json && npm install"
}
```

## Étapes de Correction (À FAIRE PAR L'UTILISATEUR)

Pour corriger le crash mobile, suivez ces étapes **dans l'ordre**:

### Étape 1: Nettoyage Complet de l'Environnement

```bash
# 1. Supprimer les dépendances et le lockfile
rm -rf node_modules package-lock.json

# 2. Nettoyer le cache Metro
npx expo start --clear

# 3. Si vous utilisez Watchman (macOS/Linux)
watchman watch-del-all

# 4. Nettoyer les caches système temporaires
rm -rf $TMPDIR/metro-* $TMPDIR/haste-*
```

### Étape 2: Réinstallation des Dépendances

```bash
# Installer les dépendances depuis zéro
npm install
```

### Étape 3: Nettoyage des Projets Natifs

```bash
# Nettoyer et régénérer les projets natifs Android/iOS
npx expo prebuild --clean
```

Cette commande va:
- Supprimer les dossiers `android/` et `ios/` existants
- Régénérer les projets natifs avec la configuration Babel correcte
- Appliquer tous les plugins configurés dans `app.json`

### Étape 4: Reconstruire l'Application

#### Pour Android (Development Build):
```bash
npx expo run:android
```

#### Pour iOS (Development Build):
```bash
npx expo run:ios
```

#### Pour créer un APK de production Android:
```bash
# Utiliser EAS Build (recommandé)
npx eas build --platform android --profile production

# OU build local
cd android
./gradlew assembleRelease
```

### Étape 5: Vérification

Une fois l'application reconstruite:
1. Installez-la sur un appareil mobile réel ou un émulateur
2. Lancez l'application
3. Vérifiez que le crash Reanimated n'apparaît plus
4. Testez les animations et transitions de l'app

## Scripts Rapides

Pour les prochaines fois, utilisez ces scripts simplifiés:

```bash
# Nettoyage complet et réinstallation
npm run clean:all

# Nettoyage uniquement du cache Metro
npm run clean:cache

# Nettoyage des node_modules uniquement
npm run clean
```

## Pourquoi ce problème est survenu ?

1. **Configuration Babel manquante**: React Native Reanimated nécessite un plugin Babel spécial pour transformer le code JavaScript en worklets natifs
2. **Désynchronisation des versions**: Sans la transformation Babel, le code JS et le code natif utilisent des versions incompatibles
3. **Caches obsolètes**: Les anciens builds gardent en mémoire l'ancienne configuration

## Prévention Future

Pour éviter ce problème à l'avenir:
1. **Toujours** garder le fichier `babel.config.js` dans le projet
2. **Ne jamais** supprimer le plugin `react-native-reanimated/plugin`
3. Après une mise à jour de dépendances, toujours:
   - Nettoyer les caches (`npm run clean:cache`)
   - Régénérer les projets natifs (`npx expo prebuild --clean`)
   - Reconstruire l'application

## Références

- [React Native Reanimated - Installation](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/)
- [Expo - Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [React Native - Debugging](https://reactnative.dev/docs/debugging)
