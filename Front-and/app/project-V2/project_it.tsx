import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { layout } from '../../src/theme/layout';
import AppButton from '../../src/components/AppButton';
import { useColors } from '../../src/theme/ColorsProvider';

/**
 * PROJECT INFO PAGE V2 - Informácie o projekte a tutoriál (V2 verzia)
 */
export default function ProjectInfoScreenV2() {
  const { colors } = useColors();
  const screenWidth = Dimensions.get('window').width;
  const isWeb = Platform.OS === 'web';

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>

          {/* HEADER */}
          <View style={styles.headerRow}>
            <Text style={[styles.logoIcon, { color: colors.textPrimary }]}>ℹ️</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Informácie o projekte</Text>
            <Text style={[styles.versionBadge, { color: colors.accent }]}> V2</Text>
          </View>

          {/* INFO SECTIONS */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Čo je to projekt?
            </Text>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              Projekt predstavuje 3D rekonštrukciu miestnosti vytvorenú z množstva fotografií. Každý projekt obsahuje videá, 3D modely a ďalšie médiá.
            </Text>
          </View>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Ako pracovať s projektom?
            </Text>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              1. Premenný na domovskú stránku a vyberte projekt{'\n'}
              2. Prehliadajte 3D model a videá{'\n'}
              3. Upravujte informácie projektu (popis, objekty){'\n'}
              4. Stiahnite si 3D model v ZIP formáte
            </Text>
          </View>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Dostupné funkcie
            </Text>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              📹 Prehliadač videí a 3D modelov{'\n'}
              ✏️ Úprava popisu a objektov{'\n'}
              📥 Stiahnutie 3D modelu{'\n'}
              👁️ Pohlady V1 a V2{'\n'}
              🏠 Rýchly návrat na domovskú stránku
            </Text>
          </View>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              V2 Vylepšenia
            </Text>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              🎨 Vylepšené rozhranie{'\n'}
              ⚡ Rýchlejšia výkonnosť{'\n'}
              🔧 Dodatočné možnosti úprav{'\n'}
              📊 Lepšie informácie o projekte{'\n'}
              🚀 Modernejší dizajn
            </Text>
          </View>

          {/* BUTTONS */}
          <View style={styles.buttonRow}>
            <AppButton
              icon="home"
              title="Domov"
              onPress={() => router.replace('/main')}
              style={{ flex: 0.6, minWidth: 65 }}
            />
          </View>

        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    padding: layout.padding,
    alignItems: 'center',
  },

  content: {
    width: '100%',
    maxWidth: 800,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 8,
  },

  logoIcon: {
    fontSize: 32,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
  },

  versionBadge: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },

  sectionText: {
    fontSize: 14,
    lineHeight: 22,
  },

  infoCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    width: '100%',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    marginTop: 20,
    width: '100%',
  },
});
