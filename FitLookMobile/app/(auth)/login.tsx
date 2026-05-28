import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { Link } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert('Login Failed', error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>FitLook</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>Welcome back</Text>

      <TextInput
        label="Email"
        onChangeText={(text) => setEmail(text)}
        value={email}
        placeholder="email@address.com"
        autoCapitalize={'none'}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Password"
        onChangeText={(text) => setPassword(text)}
        value={password}
        secureTextEntry={true}
        autoCapitalize={'none'}
        mode="outlined"
        style={styles.input}
      />
      
      <Button mode="contained" onPress={() => signInWithEmail()} disabled={loading} style={styles.button}>
        {loading ? <ActivityIndicator color="white" /> : 'Sign In'}
      </Button>

      <Link href="/(auth)/signup" asChild>
        <Button mode="text" style={styles.link}>Don't have an account? Sign up</Button>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 10,
    paddingVertical: 4,
  },
  link: {
    marginTop: 20,
  },
});
