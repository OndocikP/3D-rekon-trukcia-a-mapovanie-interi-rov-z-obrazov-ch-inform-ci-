import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Image, Modal, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { layout } from '../theme/layout';
import AppButton from '../components/AppButton';
import { router } from 'expo-router';

// ✅ COLORS Z PROVIDERU (nie statický colors.ts)
import { useColors } from '../theme/ColorsProvider';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'code'>('email'); // 'email' or 'code'
  
  // Step 1: Email
  const [email, setEmail] = useState('');
  
  // Step 2: Code and Password
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { colors, themeName } = useColors();
  const { login, forgotPassword, verifyResetCode, resetPassword, isLoggedIn, user } = useAuth();

  // Ak je user prihlásený, presmeruj na admin alebo main podľa role
  useEffect(() => {
    if (isLoggedIn && user) {
      console.log('👤 User prihlásenný, role:', user.role);
      if (user.role === 'admin') {
        console.log('🔓 Navigovanie na admin panel');
        router.replace('/admin');
      } else {
        console.log('📱 Navigovanie na main');
        router.replace('/main');
      }
    }
  }, [isLoggedIn, user]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Prihlasovanie:', username);
      await login(username, password);
      console.log('✅ Login úspešný - routing sa stará AuthContext');
      // Routing sa automaticky zmení cez useEffect na isLoggedIn zmenu
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Login Error', 
        error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      Alert.alert('Success', 'Verification code sent to your email');
      setForgotStep('code'); // Move to step 2
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Verify the code first
      const isValid = await verifyResetCode(email, resetCode);
      if (!isValid) {
        Alert.alert('Error', 'Invalid or expired verification code');
        setLoading(false);
        return;
      }

      // Reset the password
      await resetPassword(email, resetCode, newPassword);
      Alert.alert('Success', 'Password reset successfully! Please login with your new password.');
      
      // Close modal and reset states
      setForgotVisible(false);
      setForgotStep('email');
      setEmail('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const closeForgotModal = () => {
    setForgotVisible(false);
    setForgotStep('email');
    setEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      {/* LOGO */}
      <Image
        source={require('../assets/logo.png')}
        style={[
          styles.logoImage,
          themeName === 'black' && styles.logoInverted,
        ]}
        resizeMode="contain"
      />

      {/* Card s formulárom */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Sign In</Text>

        <TextInput
          placeholder="Username"
          placeholderTextColor={colors.placeholder}
          autoComplete="username"
          textContentType="username"
          style={[
            styles.input,
            { 
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.textTertiary,
            }
          ]}
          value={username}
          onChangeText={setUsername}
          editable={!loading}
        />

        {/* Password Input with Eye Icon */}
        <View style={[
          styles.passwordContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
          }
        ]}>
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={!showPassword}
            autoComplete="password"
            textContentType="password"
            style={[
              styles.passwordInput,
              { 
                color: colors.textTertiary,
              }
            ]}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
          <Pressable 
            onPress={() => setShowPassword(!showPassword)}
            disabled={loading}
            style={styles.eyeIcon}
          >
            <Feather 
              name={showPassword ? 'eye' : 'eye-off'} 
              size={20} 
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        <View style={styles.buttons}>
          <AppButton
            title="Register"
            variant="secondary"
            onPress={() => router.push('/register')}
            disabled={loading}
          />
          <AppButton
            title={loading ? "Signing in..." : "Login"}
            onPress={handleLogin}
            disabled={loading}
          />
        </View>

        {/* Forgot password link */}
        <View style={styles.linksContainer}>
          <Pressable onPress={() => setForgotVisible(true)} disabled={loading}>
            <Text
              style={[styles.forgot, { color: colors.primary }]}
            >
              Forgot password?
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotVisible}
        transparent
        animationType="fade"
        onRequestClose={closeForgotModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={[styles.modalCard, { backgroundColor: colors.modalCard }]}>
              
              {/* STEP 1: EMAIL */}
              {forgotStep === 'email' && (
                <>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    Forgot Password
                  </Text>

                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    Enter your email and we'll send you a verification code
                  </Text>

                  <TextInput
                    placeholder="Email"
                    placeholderTextColor={colors.placeholder}
                    style={[
                      styles.input,
                      { 
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        color: colors.textTertiary,
                      }
                    ]}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />

                  <AppButton
                    title={loading ? "Sending..." : "Send Verification Code"}
                    onPress={handleSendVerificationCode}
                    disabled={loading}
                  />

                  <Pressable onPress={closeForgotModal} disabled={loading}>
                    <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
                  </Pressable>
                </>
              )}

              {/* STEP 2: CODE + NEW PASSWORD */}
              {forgotStep === 'code' && (
                <>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    Reset Password
                  </Text>

                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    Enter the verification code and your new password
                  </Text>

                  <TextInput
                    placeholder="Verification Code"
                    placeholderTextColor={colors.placeholder}
                    style={[
                      styles.input,
                      { 
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        color: colors.textTertiary,
                      }
                    ]}
                    value={resetCode}
                    onChangeText={setResetCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                  />

                  {/* New Password Input with Eye Icon */}
                  <View style={[
                    styles.passwordContainer,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                    }
                  ]}>
                    <TextInput
                      placeholder="New Password"
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={!showNewPassword}
                      style={[
                        styles.passwordInput,
                        { 
                          color: colors.textTertiary,
                        }
                      ]}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      editable={!loading}
                    />
                    <Pressable 
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      disabled={loading}
                      style={styles.eyeIcon}
                    >
                      <Feather 
                        name={showNewPassword ? 'eye' : 'eye-off'} 
                        size={20} 
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </View>

                  {/* Confirm Password Input with Eye Icon */}
                  <View style={[
                    styles.passwordContainer,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                    }
                  ]}>
                    <TextInput
                      placeholder="Confirm New Password"
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={!showConfirmPassword}
                      style={[
                        styles.passwordInput,
                        { 
                          color: colors.textTertiary,
                        }
                      ]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      editable={!loading}
                    />
                    <Pressable 
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                      style={styles.eyeIcon}
                    >
                      <Feather 
                        name={showConfirmPassword ? 'eye' : 'eye-off'} 
                        size={20} 
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </View>

                  <AppButton
                    title={loading ? "Resetting..." : "Reset Password"}
                    onPress={handleResetPassword}
                    disabled={loading}
                  />

                  <Pressable onPress={() => setForgotStep('email')} disabled={loading}>
                    <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Back</Text>
                  </Pressable>

                  <Pressable onPress={closeForgotModal} disabled={loading}>
                    <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
                  </Pressable>
                </>
              )}

            </View>
          </ScrollView>
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
    marginBottom: 20,
  },

  
  card: {
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 28,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  input: {
    height: layout.inputHeight,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 15,
    borderWidth: 1,
  },

  passwordContainer: {
    height: layout.inputHeight,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  passwordInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },

  eyeIcon: {
    padding: 8,
    marginRight: -8,
  },

  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },

  forgot: {
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 18,
    fontSize: 13,
    fontWeight: '500',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    padding: 28,
    borderRadius: 20,
    width: '85%',
    maxWidth: 520,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.3,
  },

  modalSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
    fontWeight: '400',
    lineHeight: 18,
  },

  modalCancel: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },

  logoInverted: {
    tintColor: '#fff',
  },

  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    gap: 10,
  },

  divider: {
    fontSize: 16,
    fontWeight: '300',
  },
});