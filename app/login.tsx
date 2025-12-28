import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useAlert } from '@/template';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { CommonStyles } from '../constants/styles';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithPassword, signUpWithPassword, sendOTP, verifyOTPAndLogin, operationLoading } =
    useAuth();
  const { showAlert } = useAlert();

  const [mode, setMode] = useState<'login' | 'signup' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please enter email and password');
      return;
    }

    const { error } = await signInWithPassword(email, password);
    if (error) {
      showAlert('Login Failed', error);
    }
  };

  const handleSignup = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please enter email and password');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    const { error } = await sendOTP(email);
    if (error) {
      showAlert('Error', error);
      return;
    }

    setMode('otp');
    showAlert('Success', 'Verification code sent to your email');
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      showAlert('Error', 'Please enter verification code');
      return;
    }

    const { error } = await verifyOTPAndLogin(email, otp, { password });
    if (error) {
      showAlert('Error', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[CommonStyles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>✈️</Text>
          <Text style={styles.title}>Atlas Concierge</Text>
          <Text style={styles.subtitle}>Your AI Travel Assistant</Text>
        </View>

        <View style={styles.form}>
          {mode === 'otp' ? (
            <>
              <Text style={styles.otpInstructions}>
                Enter the 6-digit code sent to {email}
              </Text>
              <Input
                label="Verification Code"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
              />
              <Button
                title="Verify & Create Account"
                onPress={handleVerifyOTP}
                loading={operationLoading}
                style={styles.button}
              />
              <TouchableOpacity onPress={() => setMode('signup')}>
                <Text style={styles.link}>Send code again</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
              />

              {mode === 'signup' ? (
                <Input
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="••••••••"
                />
              ) : null}

              <Button
                title={mode === 'login' ? 'Sign In' : 'Continue'}
                onPress={mode === 'login' ? handleLogin : handleSignup}
                loading={operationLoading}
                style={styles.button}
              />

              <View style={styles.switchMode}>
                <Text style={styles.switchText}>
                  {mode === 'login'
                    ? 'Do not have an account?'
                    : 'Already have an account?'}
                </Text>
                <TouchableOpacity
                  onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
                >
                  <Text style={styles.link}>
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },

  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },

  logo: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },

  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },

  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  },

  form: {
    gap: Spacing.lg,
  },

  otpInstructions: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  button: {
    marginTop: Spacing.md,
  },

  switchMode: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },

  switchText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },

  link: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary.main,
    fontWeight: '600',
  },
});
