import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import AppButton from '../components/AppButton';
import { router } from 'expo-router';

export default function ForgotPasswordScreen() {
  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Forgot Password</Text>

        <TextInput placeholder="Gmail" style={styles.input} />
        <TextInput placeholder="Verification code" style={styles.input} />
        <TextInput placeholder="New password" secureTextEntry style={styles.input} />
        <TextInput placeholder="Password again" secureTextEntry style={styles.input} />

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
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 30,
    padding: 25,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.inputBackground,
    height: layout.inputHeight,
    borderRadius: layout.radius,
    paddingHorizontal: 15,
    marginBottom: 12,
  },
});
