import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { layout } from '../theme/layout';
import AppButton from '../components/AppButton';
import { router } from 'expo-router';

// ✅ COLORS Z PROVIDERU
import { useColors } from '../theme/ColorsProvider';

export default function ForgotPasswordScreen() {
  const { colors } = useColors();

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Forgot Password
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
        />

        <TextInput
          placeholder="Verification code"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
        />

        <TextInput
          placeholder="New password"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
        />

        <TextInput
          placeholder="New password again"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
        />

        <AppButton
          title="Change password"
          onPress={() => router.replace('/login')}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: layout.padding,
  },

  card: {
    borderRadius: 30,
    padding: 25,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderWidth: 1,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },

  input: {
    height: layout.inputHeight,
    borderRadius: layout.radius,
    paddingHorizontal: 15,
    marginBottom: 12,
  },
});
