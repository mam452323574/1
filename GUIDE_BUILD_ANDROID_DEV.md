# Guide Complet: Créer un Development Build Android

## Introduction

Ce guide vous aidera à créer votre premier **development build Android** pour résoudre le crash Reanimated Worklet Mismatch. Ce build est nécessaire car **Expo Go ne supporte pas la configuration avancée de react-native-reanimated** utilisée dans cette application.

## Pourquoi ce problème existe ?

L'erreur `Worklet Mismatch between JavaScript part and Native part of worklet (0.6.1 vs 0.5.1)` survient parce que:

1. **React Native Reanimated** nécessite une transformation Babel spéciale
2. **Expo Go** ne peut pas appliquer cette transformation car c'est un environnement pré-compilé
3. Un **development build personnalisé** est requis pour compiler le plugin Babel correctement

## Prérequis

Avant de commencer, assurez-vous d'avoir:

- ✅ Node.js et npm installés
- ✅ Android Studio installé
- ✅ Un émulateur Android configuré dans Android Studio
- ✅ Les variables d'environnement Android configurées (ANDROID_HOME, PATH)

Si vous n'êtes pas sûr de ces prérequis, consultez d'abord le fichier `TROUBLESHOOTING.md`.

---

## Étape 1: Nettoyage Complet de l'Environnement

Cette étape est **CRITIQUE**. Les anciens caches peuvent causer des erreurs persistantes même après avoir corrigé le code.

### 1.1 - Supprimer les Dépendances et Caches Node

```bash
# Naviguer vers le répertoire du projet
cd /chemin/vers/health-scan

# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json

# OU utiliser le script npm (si vous êtes sur Windows, utilisez 'del' au lieu de 'rm')
npm run clean
```

### 1.2 - Nettoyer les Caches Metro

```bash
# Nettoyer le cache Metro Bundler
npx expo start --clear

# Ou simplement supprimer le dossier cache
# Windows:
del /s /q %LOCALAPPDATA%\Temp\metro-*
del /s /q %LOCALAPPDATA%\Temp\haste-*

# macOS/Linux:
rm -rf $TMPDIR/metro-* $TMPDIR/haste-*
```

### 1.3 - Nettoyer les Caches Gradle (Android)

```bash
# Nettoyer le cache Gradle global
cd android
./gradlew clean
cd ..

# Supprimer le dossier build
rm -rf android/build
rm -rf android/app/build

# Nettoyer le cache Gradle global (optionnel mais recommandé)
# Windows:
rmdir /s /q %USERPROFILE%\.gradle\caches

# macOS/Linux:
rm -rf ~/.gradle/caches
```

### 1.4 - Nettoyer Watchman (macOS/Linux uniquement)

```bash
# Si vous avez Watchman installé
watchman watch-del-all
```

---

## Étape 2: Vérification de la Configuration Babel

Avant de reconstruire, vérifions que `babel.config.js` est correctement configuré.

### 2.1 - Ouvrir babel.config.js

Ouvrez le fichier `babel.config.js` à la racine du projet:

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

### 2.2 - Points de Vérification

✅ **Le plugin `react-native-reanimated/plugin` DOIT être en dernière position dans le tableau `plugins`**

✅ **Aucun autre plugin ne doit venir après lui**

✅ **Le preset `babel-preset-expo` doit être présent dans `presets`**

Si votre fichier est différent, corrigez-le pour qu'il corresponde exactement à l'exemple ci-dessus.

---

## Étape 3: Réinstallation des Dépendances

```bash
# Installer toutes les dépendances depuis zéro
npm install

# Attendre que l'installation se termine complètement
# Cela peut prendre quelques minutes
```

**Note**: Ne pas utiliser `npm ci` car nous voulons une installation propre avec un nouveau `package-lock.json`.

---

## Étape 4: Supprimer les Projets Natifs Existants

Si vous avez déjà un dossier `android/` ou `ios/`, supprimez-les:

```bash
# Supprimer les projets natifs existants
rm -rf android/ ios/

# Windows:
rmdir /s /q android
rmdir /s /q ios
```

**Pourquoi ?** Nous voulons régénérer ces dossiers avec la configuration Babel correcte.

---

## Étape 5: Régénérer les Projets Natifs

```bash
# Régénérer les projets natifs avec prebuild
npx expo prebuild --clean

# Cette commande va:
# 1. Créer le dossier android/ avec la configuration correcte
# 2. Créer le dossier ios/ avec la configuration correcte
# 3. Installer toutes les dépendances natives
# 4. Appliquer tous les plugins Expo configurés dans app.json
```

**Sortie attendue**:
```
✔ Created native directories | /android, /ios
✔ Updated package.json
✔ Config synced
```

**Erreurs possibles**:

- Si vous voyez `ANDROID_HOME not found`, configurez vos variables d'environnement Android
- Si vous voyez des erreurs de permissions, exécutez en tant qu'administrateur (Windows) ou avec `sudo` (macOS/Linux)

---

## Étape 6: Lancer l'Émulateur Android

Avant de construire l'application, lancez un émulateur Android.

### 6.1 - Via Android Studio

1. Ouvrir **Android Studio**
2. Cliquer sur **Device Manager** (icône téléphone en haut à droite)
3. Sélectionner un émulateur existant ou en créer un nouveau
4. Cliquer sur le bouton **Play** pour lancer l'émulateur
5. Attendre que l'émulateur démarre complètement (écran d'accueil visible)

### 6.2 - Via la Ligne de Commande

```bash
# Lister les émulateurs disponibles
emulator -list-avds

# Lancer un émulateur spécifique
emulator -avd <nom_de_l_emulateur>

# Exemple:
emulator -avd Pixel_5_API_33
```

### 6.3 - Vérifier que l'Émulateur est Détecté

```bash
# Vérifier les appareils connectés
adb devices

# Sortie attendue:
# List of devices attached
# emulator-5554   device
```

---

## Étape 7: Construire et Installer le Development Build

Maintenant, nous allons compiler l'application et l'installer sur l'émulateur.

```bash
# Construire et installer l'application sur l'émulateur
npx expo run:android

# Cette commande va:
# 1. Compiler le code natif Android (Gradle)
# 2. Compiler le code JavaScript (Metro)
# 3. Installer l'APK sur l'émulateur
# 4. Lancer l'application automatiquement
```

**Durée estimée**: 5-10 minutes pour la première compilation.

**Sortie attendue**:
```
> Configure project :app
> Task :app:compileDebugJavaWithJavac
> Task :app:installDebug
Installing APK...
Installed on 1 device.

BUILD SUCCESSFUL in 8m 32s
```

---

## Étape 8: Vérification du Build

Une fois l'application installée et lancée sur l'émulateur:

### 8.1 - Vérifier l'Absence de Crash au Démarrage

✅ **L'application doit démarrer sans crash**

✅ **Aucun message d'erreur rouge "Worklet Mismatch"**

✅ **Les écrans de navigation doivent être visibles**

### 8.2 - Tester les Animations

1. Naviguer entre les différents onglets (Home, Scanner, Analytics)
2. Vérifier que les transitions sont fluides
3. Tester les animations de la barre d'onglets

### 8.3 - Vérifier les Logs Metro

Dans le terminal où vous avez exécuté `npx expo run:android`, vous devriez voir:

```
› Opening on Android...
› Opening exp://192.168.1.x:8081 on emulator-5554
```

**Aucune erreur rouge ne doit apparaître.**

---

## Étape 9: Développement Quotidien

Maintenant que le development build est créé, vous pouvez développer normalement.

### 9.1 - Démarrer Metro pour le Développement

```bash
# Lancer Metro Bundler
npm run dev

# OU
npx expo start --dev-client
```

### 9.2 - Recharger l'Application

Sur l'émulateur Android:
- Appuyez deux fois sur **R** pour recharger
- Ou secouez l'appareil (Ctrl+M sur Windows, Cmd+M sur macOS)
- Sélectionnez **Reload** dans le menu de développement

### 9.3 - Reconstruire Uniquement si Nécessaire

Vous devrez **reconstruire l'application** uniquement si vous:
- Ajoutez une nouvelle dépendance native
- Modifiez `app.json` ou `babel.config.js`
- Mettez à jour des packages natifs

Pour les changements de code JavaScript/TypeScript uniquement, un simple **reload** suffit.

---

## Dépannage

### Problème 1: "ANDROID_HOME is not set"

**Solution**:
```bash
# Windows (dans PowerShell Admin):
$env:ANDROID_HOME = "C:\Users\VotreNom\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator"

# macOS/Linux (dans ~/.bashrc ou ~/.zshrc):
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Problème 2: "Unable to load script"

**Cause**: Metro Bundler n'est pas démarré.

**Solution**:
```bash
# Relancer Metro
npx expo start --dev-client
```

### Problème 3: "Failed to install the app"

**Cause**: L'émulateur n'est pas détecté.

**Solution**:
```bash
# Vérifier les appareils
adb devices

# Redémarrer ADB si nécessaire
adb kill-server
adb start-server
```

### Problème 4: "Duplicate resources" ou "AAPT error"

**Cause**: Cache Gradle corrompu.

**Solution**:
```bash
cd android
./gradlew clean
cd ..
rm -rf android/build android/app/build
npx expo run:android
```

### Problème 5: L'Application Crash Encore avec Worklet Mismatch

**Cause**: Les caches n'ont pas été complètement supprimés.

**Solution complète**:
```bash
# 1. Tout supprimer
rm -rf node_modules package-lock.json android ios

# 2. Nettoyer les caches globaux
rm -rf $TMPDIR/metro-* $TMPDIR/haste-*
rm -rf ~/.gradle/caches

# 3. Réinstaller
npm install

# 4. Régénérer
npx expo prebuild --clean

# 5. Reconstruire
npx expo run:android
```

---

## Checklist de Validation Finale

Avant de passer à l'étape suivante, vérifiez que:

- [ ] L'application démarre sans crash
- [ ] Aucune erreur "Worklet Mismatch" dans les logs
- [ ] La navigation entre onglets fonctionne
- [ ] Les animations sont fluides
- [ ] Vous pouvez naviguer vers l'écran Scanner
- [ ] Le Metro Bundler se connecte correctement
- [ ] Vous pouvez recharger l'application avec Ctrl+M → Reload

---

## Prochaines Étapes

Une fois ce build Android fonctionnel, vous pourrez:

1. ✅ **Appliquer la migration Supabase** pour ajouter la colonne `analysis_result`
2. ✅ **Tester l'onglet Analyse** avec de vraies données
3. ✅ **Vérifier les messages d'erreur** de limite de scan

Consultez le guide suivant: `GUIDE_MIGRATION_DATABASE.md`

---

## Ressources

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [React Native Reanimated Installation](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/)
- [Android Studio Setup](https://developer.android.com/studio/run/emulator)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)

---

**Note Importante**: Ce build est un **development build**, pas un build de production. Pour créer un APK de production, vous devrez utiliser `eas build` ou `cd android && ./gradlew assembleRelease`.
