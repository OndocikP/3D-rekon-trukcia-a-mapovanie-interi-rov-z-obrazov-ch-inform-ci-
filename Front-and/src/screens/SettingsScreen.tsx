import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { useColors } from '../theme/ColorsProvider';
import { layout } from '../theme/layout';
import { useAuth } from '../context/AuthContext';
import AppButton from '../components/AppButton';

export default function SettingsScreen() {
  const { colors, themeName, setTheme } = useColors();
  const { user, logout } = useAuth();
  const [modelQuality, setModelQuality] = useState<'medium' | 'high'>('medium');
  const [editingEmail, setEditingEmail] = useState(false);

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Settings
        </Text>

        {/* COLOR THEME CARD */}
        <View
          style={[
            styles.card,
            styles.highlightedCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.primary,
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

        {/* MODEL QUALITY CARD */}
        <View
          style={[
            styles.card,
            styles.highlightedCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.primary,
            },
          ]}
        >
          {/* TITLE */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Model Quality
          </Text>

          {/* OPTIONS GRID */}
          <View style={styles.optionsGrid}>
            <Option
              label="Low"
              active={modelQuality === 'low'}
              onPress={() => {}}
              colors={colors}
              disabled
            />
            <Option
              label="Medium"
              active={modelQuality === 'medium'}
              onPress={() => setModelQuality('medium')}
              colors={colors}
            />
            <Option
              label="High"
              active={modelQuality === 'high'}
              onPress={() => setModelQuality('high')}
              colors={colors}
            />
          </View>
        </View>

        {/* USER DATA CARD */}
        <View
          style={[
            styles.card,
            styles.highlightedCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.primary,
            },
          ]}
        >
          {/* TITLE */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            User Data
          </Text>

          {/* USERNAME SECTION */}
          <View style={styles.dataSection}>
            <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>
              Username
            </Text>
            <Text style={[styles.dataValue, { color: colors.textPrimary }]}>
              {user?.username || 'N/A'}
            </Text>
          </View>

          {/* EMAIL SECTION */}
          <View style={styles.dataSection}>
            <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>
              Email
            </Text>
            <Text style={[styles.dataValue, { color: colors.textPrimary }]}>
              {user?.email || 'N/A'}
            </Text>
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionGrid}>
            <Pressable
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.primary + '20',
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setEditingEmail(!editingEmail)}
            >
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                {editingEmail ? 'Done' : 'Change Email'}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.actionButton,
                styles.dangerButton,
                {
                  backgroundColor: colors.warning + '30',
                  borderColor: colors.warning,
                },
              ]}
              onPress={() => {
                if (confirm('Delete account? This will remove all models and data.')) {
                  // Handle account deletion
                  alert('Account deletion - to be implemented with backend');
                }
              }}
            >
              <Text style={[styles.actionButtonText, { color: colors.warning }]}>
                Delete Account
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <AppButton
          title="Main"
          variant="secondary"
          onPress={() => router.push('/main')}
        />
      </View>
    </LinearGradient>
  );
}

function Option({
  label,
  active,
  onPress,
  colors,
  disabled = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
  disabled?: boolean;
}) {
  const isDisabled = disabled;
  
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.option,
        {
          backgroundColor: active
            ? colors.primary
            : isDisabled
            ? 'rgba(0,0,0,0.3)'
            : 'rgba(255,255,255,0.1)',
          borderColor: isDisabled
            ? 'rgba(255,255,255,0.2)'
            : active
            ? colors.primary
            : colors.cardBorder,
          opacity: isDisabled ? 0.5 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.optionText,
          {
            color: active
              ? colors.buttonText
              : isDisabled
              ? 'rgba(255,255,255,0.4)'
              : colors.textPrimary,
          },
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
    paddingHorizontal: 80,
    paddingVertical: 20,
    paddingTop: 42,
  },

  content: {
    flex: 1,
    gap: 18,
  },

  footer: {
    position: 'absolute',
    bottom: 30,
    left: 80,
    right: 80,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
    borderWidth: 2,
    gap: 14,
  },

  highlightedCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },

  optionText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
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

  dataSection: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
  },

  dataLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  dataValue: {
    fontSize: 14,
    fontWeight: '500',
  },

  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },

  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dangerButton: {
    // Additional styling for danger actions
  },

  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
