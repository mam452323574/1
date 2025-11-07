# Guide de Démarrage Rapide

## Toutes les corrections ont été appliquées avec succès! 🎉

### Ce qui a été corrigé

1. ✅ **Versions des dépendances synchronisées**
   - react-native-reanimated: 4.1.3
   - react-native-worklets: 0.6.1 (automatiquement installé)

2. ✅ **Navigation restructurée**
   - Création du groupe `(auth)` pour tous les écrans d'authentification
   - Routes correctement organisées
   - Avertissements "No route named..." éliminés

3. ✅ **Animations protégées**
   - Système de fallback pour AnimatedTabBarIcon
   - Gestion d'erreur complète
   - Basculement automatique vers mode statique en cas de problème

4. ✅ **Caches nettoyés**
   - npm cache vidé
   - node_modules réinstallé
   - Caches iOS et Android supprimés

---

## Commandes pour Démarrer

### 🌐 Pour le Web (Recommandé pour tester rapidement)

```bash
npm run dev
```

Puis ouvrez votre navigateur à l'URL indiquée (généralement http://localhost:8081)

---

### 📱 Pour iOS

```bash
# 1. Installer les pods (première fois seulement ou après changement de dépendances)
cd ios
pod install
cd ..

# 2. Lancer l'application
npx expo run:ios

# Alternative: avec Xcode
open ios/HealthScan.xcworkspace
```

---

### 🤖 Pour Android

```bash
# Lancer l'application
npx expo run:android
```

---

### 🧹 Si vous rencontrez des problèmes

#### Nettoyer le cache Metro
```bash
npx expo start --clear
```

#### Nettoyer tous les caches
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules
npm install

# Pour iOS
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..

# Pour Android
cd android
./gradlew clean
cd ..

# Redémarrer avec cache propre
npx expo start --clear
```

---

## Structure de Navigation

### Flux Utilisateur

```
┌─────────────────────────────────────────┐
│  Non Authentifié                        │
│  → /(auth)/login                        │
│  → /(auth)/signup                       │
│  → /(auth)/email-verification           │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Authentifié sans username              │
│  → /(auth)/username-setup               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Authentifié avec username              │
│  → /(tabs)                              │
│     ├─ index (Accueil)                  │
│     ├─ analytics (Analyses)             │
│     └─ scanner (Scanner)                │
└─────────────────────────────────────────┘
```

### Structure des Fichiers

```
app/
├── (auth)/                    # 🔐 Authentification
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── signup.tsx
│   ├── email-verification.tsx
│   └── username-setup.tsx
│
├── (tabs)/                    # 📱 Navigation principale
│   ├── _layout.tsx
│   ├── index.tsx             # Accueil
│   ├── analytics.tsx         # Analyses
│   └── scanner.tsx           # Scanner
│
├── _layout.tsx               # Layout racine
├── settings.tsx              # ⚙️ Paramètres
├── premium-upgrade.tsx       # 👑 Upgrade Premium
├── premium-plan.tsx          # 💎 Plan Premium
├── notifications.tsx         # 🔔 Notifications
├── notification-settings.tsx # 🔔 Paramètres notifications
├── scan-detail.tsx           # 📊 Détail d'un scan
├── scan-history.tsx          # 📜 Historique des scans
├── scan-preview.tsx          # 👁️ Aperçu scan
├── scan-results.tsx          # 📈 Résultats scan
├── recipes.tsx               # 🍽️ Recettes
├── exercises.tsx             # 🏃 Exercices
├── privacy-policy.tsx        # 📄 Politique de confidentialité
├── trusted-devices.tsx       # 🔐 Appareils de confiance
└── +not-found.tsx            # 404
```

---

## Tests Recommandés

### ✅ Checklist de Tests

- [ ] L'application démarre sans crash
- [ ] Les animations des tabs fonctionnent
- [ ] La connexion/inscription fonctionne
- [ ] La navigation entre les écrans est fluide
- [ ] Les écrans modaux s'ouvrent correctement
- [ ] Le scanner de caméra fonctionne
- [ ] Les notifications apparaissent
- [ ] L'upgrade premium est accessible

---

## Informations Importantes

### Variables d'Environnement

Assurez-vous que votre fichier `.env` contient:

```env
EXPO_PUBLIC_SUPABASE_URL=votre_url_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_cle_supabase
```

### Versions Requises

- Node.js: v18 ou supérieur
- npm: v8 ou supérieur
- iOS: macOS avec Xcode 14+
- Android: Android Studio avec SDK 31+

---

## Support

Si vous rencontrez des problèmes:

1. **Vérifiez les logs**
   ```bash
   npx expo start
   ```
   Les erreurs apparaîtront dans le terminal

2. **Consultez le fichier FIXES_APPLIED.md** pour voir tous les changements appliqués

3. **Validez votre configuration**
   ```bash
   ./validate-setup.sh
   ```

4. **Problèmes courants:**
   - **"Module not found"**: Exécutez `npm install`
   - **"Pod install failed"**: Supprimez `ios/Podfile.lock` et réessayez
   - **Cache Metro**: Utilisez `npx expo start --clear`
   - **Animations ne fonctionnent pas**: Le fallback statique devrait s'activer automatiquement

---

## Prochaines Étapes

1. Testez l'application sur toutes les plateformes
2. Vérifiez que tous les flux utilisateur fonctionnent
3. Testez les fonctionnalités premium
4. Vérifiez les notifications push
5. Testez les animations et transitions

---

**Bon développement! 🚀**
