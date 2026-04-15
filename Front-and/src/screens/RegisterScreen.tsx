import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Platform, Alert, ActivityIndicator } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { layout } from '../theme/layout';
import AppButton from '../components/AppButton';
import { router } from 'expo-router';

// ✅ COLORS Z PROVIDERU
import { useColors } from '../theme/ColorsProvider';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen() {
  const { colors } = useColors();
  const { register, login } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password || !passwordAgain) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== passwordAgain) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Registrácia
      await register(username, email, password);
      
      // Automatické prihlásenie po registrácii
      await login(username, password);
      
      Alert.alert('Úspech', 'Registrácia bola úspešná!');
      router.replace('/(tabs)');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Neznáma chyba';
      setError(errorMsg);
      Alert.alert('Chyba pri registrácii', errorMsg);
    } finally {
      setLoading(false);
    }
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
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <TextInput
          placeholder="User name"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          value={username}
          onChangeText={setUsername}
          editable={!loading}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <TextInput
          placeholder="Password again"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          value={passwordAgain}
          onChangeText={setPasswordAgain}
          editable={!loading}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        {/* ERROR MESSAGE */}
        {error ? (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {error}
          </Text>
        ) : null}

        <View style={styles.buttons}>
          <AppButton
            title="Back"
            variant="secondary"
            onPress={() => router.back()}
            disabled={loading}
          />
          <AppButton 
            title={loading ? "Registrujem..." : "Register"} 
            onPress={handleRegister}
            disabled={loading}
          />
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
  width: Platform.OS === 'web' ? '33%' : '80%', // 🔥 1/3 obrazovky
  maxWidth: Platform.OS === 'web' ? 480 : '100%', // 🔥 aby to nebolo obrie
  minWidth: Platform.OS === 'web' ? 360 : '80%',  // 🔥 aby to nebolo príliš úzke
  alignSelf: 'center',
  borderWidth: 1,
},


  input: {
    height: layout.inputHeight,
    borderRadius: layout.radius,
    paddingHorizontal: 15,
    marginBottom: 12,
  },

  errorText: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '500',
  },

  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
});
