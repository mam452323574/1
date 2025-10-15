import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS, SIZES, SPACING, FONT_WEIGHTS } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ChevronLeft color={COLORS.primaryText} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Politique de Confidentialité</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Dernière mise à jour : 15 octobre 2025</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Bienvenue sur Health Scan. Nous nous engageons à protéger votre vie privée et vos données personnelles.
          Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons
          vos informations lorsque vous utilisez notre application.
        </Text>

        <Text style={styles.sectionTitle}>2. Données Collectées</Text>
        <Text style={styles.paragraph}>
          Nous collectons les types de données suivants :
        </Text>
        <Text style={styles.bulletPoint}>• Informations de compte : email, nom d'utilisateur, photo de profil</Text>
        <Text style={styles.bulletPoint}>• Données de santé : scans corporels, scans faciaux, scans nutritionnels</Text>
        <Text style={styles.bulletPoint}>• Métriques de santé : score de santé, calories, composition corporelle</Text>
        <Text style={styles.bulletPoint}>• Données d'utilisation : interactions avec l'application, préférences</Text>
        <Text style={styles.bulletPoint}>• Informations techniques : type d'appareil, système d'exploitation</Text>

        <Text style={styles.sectionTitle}>3. Utilisation des Données</Text>
        <Text style={styles.paragraph}>
          Nous utilisons vos données pour :
        </Text>
        <Text style={styles.bulletPoint}>• Fournir et améliorer nos services</Text>
        <Text style={styles.bulletPoint}>• Personnaliser votre expérience utilisateur</Text>
        <Text style={styles.bulletPoint}>• Générer des analyses et des recommandations de santé</Text>
        <Text style={styles.bulletPoint}>• Assurer la sécurité et l'authentification</Text>
        <Text style={styles.bulletPoint}>• Envoyer des notifications importantes (si activées)</Text>
        <Text style={styles.bulletPoint}>• Analyser l'utilisation de l'application pour l'améliorer</Text>

        <Text style={styles.sectionTitle}>4. Stockage et Sécurité</Text>
        <Text style={styles.paragraph}>
          Vos données sont stockées de manière sécurisée sur des serveurs Supabase avec les mesures suivantes :
        </Text>
        <Text style={styles.bulletPoint}>• Chiffrement des données en transit (HTTPS/TLS)</Text>
        <Text style={styles.bulletPoint}>• Chiffrement des données au repos</Text>
        <Text style={styles.bulletPoint}>• Contrôles d'accès stricts (Row Level Security)</Text>
        <Text style={styles.bulletPoint}>• Sauvegardes régulières</Text>
        <Text style={styles.bulletPoint}>• Surveillance continue de la sécurité</Text>

        <Text style={styles.sectionTitle}>5. Partage des Données</Text>
        <Text style={styles.paragraph}>
          Nous ne vendons ni ne partageons vos données personnelles avec des tiers à des fins commerciales.
          Vos données de santé sont strictement confidentielles et ne sont partagées qu'avec votre consentement explicite.
        </Text>

        <Text style={styles.sectionTitle}>6. Vos Droits (RGPD)</Text>
        <Text style={styles.paragraph}>
          Conformément au RGPD, vous avez les droits suivants :
        </Text>
        <Text style={styles.bulletPoint}>• Droit d'accès : consulter vos données personnelles</Text>
        <Text style={styles.bulletPoint}>• Droit de rectification : corriger vos données inexactes</Text>
        <Text style={styles.bulletPoint}>• Droit à l'effacement : supprimer votre compte et vos données</Text>
        <Text style={styles.bulletPoint}>• Droit à la portabilité : exporter vos données</Text>
        <Text style={styles.bulletPoint}>• Droit d'opposition : refuser certains traitements</Text>
        <Text style={styles.bulletPoint}>• Droit de limitation : limiter l'utilisation de vos données</Text>

        <Text style={styles.sectionTitle}>7. Conservation des Données</Text>
        <Text style={styles.paragraph}>
          Nous conservons vos données aussi longtemps que votre compte est actif. Si vous supprimez votre compte,
          toutes vos données personnelles seront définitivement effacées dans un délai de 30 jours,
          sauf obligations légales contraires.
        </Text>

        <Text style={styles.sectionTitle}>8. Cookies et Technologies Similaires</Text>
        <Text style={styles.paragraph}>
          Health Scan utilise des technologies de stockage local pour améliorer votre expérience,
          notamment pour mémoriser vos préférences et maintenir votre session de connexion.
          Vous pouvez les gérer via les paramètres de votre appareil.
        </Text>

        <Text style={styles.sectionTitle}>9. Modifications de la Politique</Text>
        <Text style={styles.paragraph}>
          Nous nous réservons le droit de modifier cette politique de confidentialité.
          Toute modification importante vous sera notifiée via l'application ou par email.
          La date de la dernière mise à jour est indiquée en haut de ce document.
        </Text>

        <Text style={styles.sectionTitle}>10. Contact</Text>
        <Text style={styles.paragraph}>
          Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits,
          vous pouvez nous contacter à :
        </Text>
        <Text style={styles.contactInfo}>Email : privacy@healthscan.app</Text>
        <Text style={styles.contactInfo}>Support : support@healthscan.app</Text>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.page,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryText,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.lg,
  },
  lastUpdated: {
    fontSize: SIZES.text12,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryText,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  paragraph: {
    fontSize: SIZES.text16,
    color: COLORS.primaryText,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  bulletPoint: {
    fontSize: SIZES.text14,
    color: COLORS.primaryText,
    lineHeight: 22,
    marginBottom: SPACING.xs,
    paddingLeft: SPACING.md,
  },
  contactInfo: {
    fontSize: SIZES.text16,
    color: COLORS.primary,
    lineHeight: 24,
    marginBottom: SPACING.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  bottomSpacing: {
    height: SPACING.xxxl,
  },
});
