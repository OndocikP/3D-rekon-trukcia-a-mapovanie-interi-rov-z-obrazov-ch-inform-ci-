import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { layout } from '../theme/layout';
import AppButton from '../components/AppButton';
import { router } from 'expo-router';

// ✅ COLORS Z PROVIDERU (nie statický colors.ts)
import { useColors } from '../theme/ColorsProvider';

export default function LoginScreen() {
  const [forgotVisible, setForgotVisible] = useState(false);
  const [email, setEmail] = useState('');

  const { colors } = useColors();

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
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <TextInput
          placeholder="Username"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
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
          style={[styles.forgot, { color: colors.textSecondary }]}
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
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.modalCard }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Forgot password
            </Text>

            <TextInput
              placeholder="Email"
              placeholderTextColor={colors.placeholder}
              style={[styles.input, { backgroundColor: colors.inputBackground }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AppButton
              title="Send verification code"
              onPress={() => {
                setForgotVisible(false);
                router.push('/forgotPassword');
              }}
            />

            <Pressable onPress={() => setForgotVisible(false)}>
              <Text style={[styles.forgot, { color: colors.textSecondary }]}>Cancel</Text>
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
    borderRadius: 30,
    padding: 25,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderWidth: 1,
  },

  input: {
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
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 13,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    padding: 25,
    borderRadius: 25,
    width: '85%',
    maxWidth: 520,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
  },

  modalCancel: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
