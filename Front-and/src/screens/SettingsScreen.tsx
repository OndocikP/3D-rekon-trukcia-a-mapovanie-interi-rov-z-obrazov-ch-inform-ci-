import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { useColors } from '../theme/ColorsProvider';
import { layout } from '../theme/layout';
import AppButton from '../components/AppButton';

export default function SettingsScreen() {
  const { colors, themeName, setTheme } = useColors();

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Settings
      </Text>

      <View
  style={[
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: colors.cardBorder,
    },
  ]}
>
  {/* TITLE */}
  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
    Color Theme
  </Text>

    {/* OPTIONS GRID */}
    <View style={styles.optionsGrid}>
      <Option
        label="Purple"
        active={themeName === 'purple'}
        onPress={() => setTheme('purple')}
        colors={colors}
      />
      <Option
        label="Light"
        active={themeName === 'light'}
        onPress={() => setTheme('light')}
        colors={colors}
      />
      <Option
        label="Black"
        active={themeName === 'black'}
        onPress={() => setTheme('black')}
        colors={colors}
      />
      <Option
        label="Blue"
        active={themeName === 'blue'}
        onPress={() => setTheme('blue')}
        colors={colors}
      />
    </View>
  </View>


      <AppButton
                title="Main"
                variant="secondary"
                onPress={() => router.push('/main')}
                //onPress={() => //console.log('Settings')}
              />
      
    </LinearGradient>
  );
}

function Option({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        {
          backgroundColor: active
            ? colors.primary
            : 'rgba(255,255,255,0.1)',
          borderColor: active ? colors.primary : colors.cardBorder,
        },
      ]}
    >
      <Text
        style={[
          styles.optionText,
          { color: active ? colors.buttonText : colors.textPrimary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: layout.padding,
    paddingTop: 42,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    color: '#fff',
  },

  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    color: 'rgba(255,255,255,0.85)',
  },

  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },

  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },

  optionText: {
    fontSize: 15,
    fontWeight: '700',
  },

  backBtn: {
    marginTop: 20,
    alignSelf: 'center',
    padding: 10,
  },

  backText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
