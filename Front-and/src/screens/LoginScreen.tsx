import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import AppButton from '../components/AppButton';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [forgotVisible, setForgotVisible] = useState(false);
  const [email, setEmail] = useState('');

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      {/* LOGO */}
      <Image
        source={require('../assets/logo.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />

      {/* Card s formulárom */}
      <View style={styles.card}>
        <TextInput
          placeholder="User name"
          placeholderTextColor="#888"
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          style={styles.input}
        />

        <View style={styles.buttons}>
          <AppButton
            title="Register"
            variant="secondary"
            onPress={() => router.push('/register')}
          />
          <AppButton
            title="Login"
            onPress={() => router.push('/main')}
          />
        </View>

        {/* Forgot password link */}
        <Text
          style={styles.forgot}
          onPress={() => setForgotVisible(true)}
        >
          Forgot password?
        </Text>
      </View>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Forgot password</Text>

            <TextInput
              placeholder="Gmail"
              placeholderTextColor="#888"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AppButton
              title="Send verification code"
              onPress={() => {
                // TODO: tu neskôr doplníme reálne odoslanie kódu
                setForgotVisible(false);
                router.push('/forgotPassword');
              }}
            />

            <Pressable onPress={() => setForgotVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: layout.padding,
  },
  logoImage: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 30,
    padding: 25,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: colors.inputBackground,
    height: layout.inputHeight,
    borderRadius: layout.radius,
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  forgot: {
    color: colors.textSecondary,
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 13,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 25,
    borderRadius: 25,
    width: '85%',
    maxWidth: 520,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalCancel: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 15,
    fontSize: 13,
  },
});
