# Guide de Dépannage

## Erreurs Courantes et Solutions

### 1. Erreur: "Worklets mismatch between JavaScript and native"

**Symptôme:** L'application crash au démarrage avec un message sur l'incompatibilité des versions worklets.

**Cause:** Les versions JavaScript et natives de react-native-worklets ne correspondent pas.

**Solution:**
```bash
# Supprimer et réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install

# Pour iOS
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..

# Nettoyer le cache et redémarrer
npx expo start --clear
```

---

### 2. Erreur: "No route named 'login' exists"

**Symptôme:** Avertissements dans les logs sur des routes introuvables.

**Cause:** Les routes d'authentification ont été déplacées dans le groupe (auth).

**Solution:**
Cette erreur a déjà été corrigée. Les routes sont maintenant:
- `/(auth)/login` au lieu de `/login`
- `/(auth)/signup` au lieu de `/signup`
- `/(auth)/email-verification` au lieu de `/email-verification`
- `/(auth)/username-setup` au lieu de `/username-setup`

Si le problème persiste, vérifiez que le fichier `app/(auth)/_layout.tsx` existe.

---

### 3. Erreur: "AnimatedTabBarIcon crashes"

**Symptôme:** L'application crash quand on touche les tabs.

**Cause:** Problème avec react-native-reanimated ou worklets.

**Solution:**
Le composant a maintenant un système de fallback. Si les animations échouent, il basculera automatiquement vers une version statique. Si le problème persiste:

```bash
# Vérifier les versions
npm list react-native-reanimated react-native-worklets

# Devrait afficher:
# react-native-reanimated@4.1.3
# └── react-native-worklets@0.6.1

# Si différent, réinstaller:
rm -rf node_modules
npm install
```

---

### 4. Erreur: "Module not found: @/screens/..."

**Symptôme:** L'application ne trouve pas les fichiers dans le dossier screens.

**Cause:** Problème avec les alias de chemin TypeScript.

**Solution:**
Vérifiez que `tsconfig.json` contient:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

Puis redémarrez Metro:
```bash
npx expo start --clear
```

---

### 5. Erreur iOS: "Command PhaseScriptExecution failed"

**Symptôme:** Le build iOS échoue lors de l'installation des pods.

**Cause:** Cache CocoaPods corrompu ou permissions incorrectes.

**Solution:**
```bash
cd ios
rm -rf Pods Podfile.lock ~/Library/Caches/CocoaPods
pod deintegrate
pod install
cd ..
```

---

### 6. Erreur Android: "Task :app:compileDebugJavaWithJavac FAILED"

**Symptôme:** Le build Android échoue.

**Cause:** Cache Gradle corrompu.

**Solution:**
```bash
cd android
./gradlew clean
./gradlew --stop
cd ..
rm -rf android/.gradle android/build
npx expo run:android
```

---

### 7. Erreur: "Error: listen EADDRINUSE: address already in use"

**Symptôme:** Metro ne peut pas démarrer car le port est déjà utilisé.

**Cause:** Une autre instance de Metro est déjà en cours d'exécution.

**Solution:**
```bash
# Trouver le processus
lsof -ti:8081

# Tuer le processus (remplacer PID par le numéro affiché)
kill -9 PID

# Ou plus simplement
pkill -f "expo"
pkill -f "metro"

# Redémarrer
npx expo start
```

---

### 8. Les animations ne fonctionnent pas (mais pas de crash)

**Symptôme:** Les animations des tabs ne s'exécutent pas, mais l'app fonctionne.

**Cause:** Le système de fallback est actif, ou react-native-reanimated n'est pas correctement configuré.

**Solution:**

1. Vérifiez que le plugin Babel est configuré dans `babel.config.js`:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // Doit être en dernier!
    ],
  };
};
```

2. Nettoyez le cache Babel:
```bash
npx expo start --clear
```

---

### 9. Erreur: "Supabase client not initialized"

**Symptôme:** Erreurs liées à Supabase lors de l'authentification.

**Cause:** Variables d'environnement manquantes ou incorrectes.

**Solution:**
Vérifiez votre fichier `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
```

Puis redémarrez:
```bash
npx expo start --clear
```

---

### 10. L'application fonctionne sur Web mais pas sur mobile

**Symptôme:** L'app se charge sur Web mais crash sur iOS/Android.

**Cause:** Dépendances natives non installées correctement.

**Solution:**

Pour iOS:
```bash
cd ios
pod install
cd ..
npx expo run:ios
```

Pour Android:
```bash
npx expo run:android
```

---

## Commandes de Diagnostic

### Vérifier l'état de l'installation

```bash
# Valider la configuration
./validate-setup.sh

# Vérifier les versions
npm list react-native-reanimated react-native-worklets react-native --depth=0

# Vérifier la structure des fichiers
ls -la app/
ls -la app/(auth)/
ls -la app/(tabs)/
```

### Logs en Temps Réel

```bash
# Démarrer avec logs détaillés
npx expo start --clear

# Pour iOS (dans un autre terminal)
npx expo run:ios

# Pour Android (dans un autre terminal)
npx expo run:android
```

### Nettoyer Complètement le Projet

Si rien d'autre ne fonctionne:

```bash
# Supprimer tous les caches et builds
rm -rf node_modules package-lock.json
rm -rf ios/Pods ios/Podfile.lock ios/build
rm -rf android/build android/.gradle
rm -rf .expo

# Réinstaller
npm install

# Pour iOS
cd ios && pod install && cd ..

# Redémarrer
npx expo start --clear
```

---

## Obtenir de l'Aide

### Informations Utiles à Fournir

Quand vous demandez de l'aide, incluez:

1. **Version de Node.js:**
   ```bash
   node --version
   ```

2. **Version d'Expo:**
   ```bash
   npx expo --version
   ```

3. **Plateforme:** iOS, Android, ou Web

4. **Message d'erreur complet** avec la stack trace

5. **Étapes pour reproduire** le problème

### Fichiers de Log

Les logs se trouvent dans:
- Metro: Terminal où vous avez lancé `npx expo start`
- iOS: Xcode Console
- Android: Logcat dans Android Studio

---

## Checklist de Débogage

Avant de chercher de l'aide, essayez dans cet ordre:

- [ ] Nettoyer le cache Metro: `npx expo start --clear`
- [ ] Vérifier les versions des dépendances
- [ ] Supprimer node_modules et réinstaller
- [ ] Pour iOS: supprimer Pods et réinstaller
- [ ] Pour Android: nettoyer Gradle
- [ ] Vérifier les variables d'environnement (.env)
- [ ] Consulter les logs complets
- [ ] Tester sur une autre plateforme (Web vs Mobile)
- [ ] Vérifier que la structure de fichiers est correcte

---

## Ressources

- [Documentation Expo](https://docs.expo.dev/)
- [Documentation React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Documentation Expo Router](https://docs.expo.dev/router/introduction/)
- [Documentation Supabase](https://supabase.com/docs)

---

**Conseil Pro:** Avant de commencer à déboguer, créez une branche Git pour pouvoir revenir en arrière facilement si nécessaire.
