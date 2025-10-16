# Configuration Google Play Console pour Health Scan

Ce guide vous accompagne pas à pas dans la configuration du système d'achats in-app sur Google Play Console pour l'abonnement Premium de Health Scan.

## Prérequis

- Un compte Google Play Developer actif
- L'application Health Scan créée dans la Google Play Console
- Package name: `com.healthscan.app`

## Étape 1: Accéder à la Section Monétisation

1. Connectez-vous à [Google Play Console](https://play.google.com/console)
2. Sélectionnez votre application "Health Scan"
3. Dans le menu latéral gauche, cliquez sur **"Monétisation"** puis **"Produits"**
4. Sélectionnez l'onglet **"Abonnements"**

## Étape 2: Créer le Produit d'Abonnement Premium

1. Cliquez sur **"Créer un abonnement"**
2. Remplissez les informations suivantes:

   **ID du produit:** `health_scan_premium_monthly`
   ⚠️ IMPORTANT: Notez cet ID exactement, il sera utilisé dans le code

   **Nom:** Health Scan Premium

   **Description:** Accès illimité à toutes les fonctionnalités premium de Health Scan

3. Dans la section **"Prix et disponibilité"**:
   - Cliquez sur **"Ajouter un prix de base"**
   - Sélectionnez **EUR (Euro)** comme devise
   - Entrez **9.99** comme prix
   - Définissez la période de renouvellement: **Mensuelle (1 mois)**

4. Dans la section **"Avantages de l'abonnement"**:
   - Listez les fonctionnalités premium:
     - Scans illimités
     - Analyses avancées
     - Recommandations personnalisées
     - Support prioritaire

5. Cliquez sur **"Enregistrer"** puis **"Activer"**

## Étape 3: Configurer les Tests d'Achat

Pour tester les achats sans payer réellement:

1. Dans le menu, allez dans **"Configuration"** → **"Paramètres"**
2. Sélectionnez **"Licence et tests"**
3. Dans la section **"Testeurs de licence"**, ajoutez vos comptes Google de test:
   - Cliquez sur **"Créer une liste de testeurs"**
   - Donnez un nom: "Health Scan Testers"
   - Ajoutez votre adresse email Google
   - Sauvegardez

4. Remontez à **"Testeurs de licence"** et sélectionnez votre liste créée

## Étape 4: Créer un Compte de Service pour l'API

Pour que votre backend puisse valider les achats:

1. Allez dans **"Configuration"** → **"Accès à l'API"**
2. Si ce n'est pas déjà fait, activez l'accès à l'API en suivant les instructions
3. Cliquez sur **"Créer un compte de service"**
4. Vous serez redirigé vers Google Cloud Console

### Dans Google Cloud Console:

5. Cliquez sur **"+ Créer un compte de service"**
6. Remplissez:
   - Nom: `health-scan-billing-validator`
   - Description: `Service account for validating in-app purchases`
7. Cliquez sur **"Créer et continuer"**

8. Accordez le rôle:
   - Recherchez et sélectionnez **"Service Usage Consumer"**
   - Cliquez sur **"Continuer"** puis **"Terminé"**

9. Dans la liste des comptes de service, cliquez sur celui que vous venez de créer
10. Allez dans l'onglet **"Clés"**
11. Cliquez sur **"Ajouter une clé"** → **"Créer une clé"**
12. Sélectionnez le format **JSON**
13. La clé sera téléchargée automatiquement

⚠️ **CRITICAL:** Conservez ce fichier JSON en sécurité, vous en aurez besoin pour la configuration Supabase

### Retour dans Google Play Console:

14. Revenez à la page **"Accès à l'API"** dans Google Play Console
15. Cliquez sur **"Actualiser les comptes de service"**
16. Trouvez votre compte de service et cliquez sur **"Accorder l'accès"**
17. Dans les permissions, cochez:
    - **"Afficher les données financières"**
    - **"Gérer les commandes et les abonnements"**
18. Cliquez sur **"Inviter l'utilisateur"**

## Étape 5: Configuration dans Supabase

1. Connectez-vous à votre [projet Supabase](https://supabase.com/dashboard)
2. Allez dans **"Edge Functions"** → **"upgrade-to-premium"**
3. Cliquez sur **"Settings"** ou **"Secrets"**
4. Ajoutez les secrets suivants:

   **GOOGLE_PLAY_PACKAGE_NAME**
   Valeur: `com.healthscan.app`

   **GOOGLE_PLAY_SERVICE_ACCOUNT_KEY**
   Valeur: Copiez TOUT le contenu du fichier JSON téléchargé à l'étape 4
   (Doit commencer par `{"type":"service_account",...}`)

## Étape 6: Tester l'Intégration

1. Assurez-vous que votre application est en mode **"Test fermé"** ou **"Test interne"** sur Google Play
2. Installez l'application via Google Play (pas en sideload)
3. Connectez-vous avec un compte testeur configuré à l'étape 3
4. Essayez d'effectuer un achat premium
5. L'achat ne débitera pas votre carte car vous êtes testeur
6. Vérifiez que le statut premium s'active dans l'application

## Résolution de Problèmes

### "Cet article n'est pas disponible"
- Vérifiez que le produit est activé dans Google Play Console
- Assurez-vous que l'app est publiée en test (interne/fermé/ouvert)
- Attendez 2-3 heures après l'activation du produit

### "Échec de validation du token"
- Vérifiez que la clé JSON du compte de service est correctement copiée
- Confirmez que le compte de service a les bonnes permissions
- Vérifiez que l'API est bien activée dans Google Cloud Console

### "Vous êtes déjà abonné"
- Dans Google Play Console → Commandes → Abonnements
- Trouvez votre abonnement de test et annulez-le
- Attendez quelques minutes avant de réessayer

## Liens Utiles

- [Documentation Google Play Billing](https://developer.android.com/google/play/billing)
- [Guide des Tests d'Achat](https://developer.android.com/google/play/billing/test)
- [API Google Play Developer](https://developers.google.com/android-publisher)

## Notes Importantes

- Les produits peuvent prendre jusqu'à 24h pour être disponibles en production
- En mode test, les abonnements expirent après quelques minutes (pas un mois complet)
- N'utilisez JAMAIS la clé de compte de service côté client, uniquement côté serveur
- Conservez une copie de sauvegarde de la clé JSON du compte de service

---

✅ Une fois ces étapes complétées, votre système de paiement Google Play est configuré et prêt à fonctionner!
