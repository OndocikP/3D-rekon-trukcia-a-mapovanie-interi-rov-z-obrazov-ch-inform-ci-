import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import AppButton from '../components/AppButton';
import { router } from 'expo-router';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');

  const handleRegister = () => {
    if (!username || !email || !password || !passwordAgain) {
      Alert.alert('Chyba', 'Vyplň všetky polia.');
      return;
    }

    if (password !== passwordAgain) {
      Alert.alert('Chyba', 'Heslá sa nezhodujú.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Chyba', 'Heslo musí mať aspoň 6 znakov.');
      return;
    }

    // Sem neskôr dáme call na backend / API
    Alert.alert('OK', 'Účet bol vytvorený (zatím len demo).');
    router.push('/main')
  };

  const handleBack = () => {
    router.back(); // vráti sa na predchádzajúcu obrazovku (Login)
  };

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      {/* Nadpisy */}
      <Text style={styles.appTitle}>Mapero Interier</Text>
      <Text style={styles.screenTitle}>Register</Text>

      {/* Karta s formulárom */}
      <View style={styles.card}>
        <TextInput
          placeholder="User name"
          placeholderTextColor="#888"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          placeholder="Password again"
          placeholderTextColor="#888"
          secureTextEntry
          style={styles.input}
          value={passwordAgain}
          onChangeText={setPasswordAgain}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        {/* Tlačidlá v strede */}
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
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  screenTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 30,
    padding: 25,
    width: '80%',        // cca polovica / dve tretiny šírky
    alignSelf: 'center', // karta v strede obrazovky
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
    alignItems: 'center',
    gap: 10,
    marginTop: 15,
  },
});
