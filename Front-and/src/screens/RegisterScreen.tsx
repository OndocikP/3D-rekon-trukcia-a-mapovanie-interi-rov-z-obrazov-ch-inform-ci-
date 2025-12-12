import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { layout } from '../theme/layout';
import AppButton from '../components/AppButton';
import { router } from 'expo-router';

// ✅ COLORS Z PROVIDERU
import { useColors } from '../theme/ColorsProvider';

export default function RegisterScreen() {
  const { colors } = useColors();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');

  const handleRegister = () => {
    if (!username || !email || !password || !passwordAgain) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password !== passwordAgain) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    Alert.alert('OK', 'Account created (demo).');
    router.push('/main');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      {/* Titles */}
      <Text style={[styles.appTitle, { color: colors.textPrimary }]}>
        Mapero Interier
      </Text>
      <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
        Register
      </Text>

      {/* Form card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <TextInput
          placeholder="User name"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          placeholder="Password again"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          value={passwordAgain}
          onChangeText={setPasswordAgain}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.buttons}>
          <AppButton title="Back" variant="secondary" onPress={handleBack} />
          <AppButton title="Register" onPress={handleRegister} />
        </View>
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

  appTitle: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },

  screenTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
  },

  card: {
    borderRadius: 30,
    padding: 25,
    width: '80%',
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
    alignItems: 'center',
    gap: 10,
    marginTop: 15,
  },
});
