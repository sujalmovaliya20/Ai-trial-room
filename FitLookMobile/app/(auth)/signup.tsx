import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { Link, useRouter } from 'expo-router';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signUpWithEmail() {
    if (!email || !password || !shopName || !ownerName || !mobile) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    
    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      Alert.alert('Signup Failed', authError.message);
      setLoading(false);
      return;
    }

    // 2. Insert into shops table
    if (authData.user) {
      const { error: dbError } = await supabase.from('shops').insert({
        id: authData.user.id,
        shop_name: shopName,
        owner_name: ownerName,
        mobile: mobile,
        email: email,
      });

      if (dbError) {
        Alert.alert('Profile Error', 'Failed to create shop profile.');
      } else {
        Alert.alert('Success', 'Please check your email for confirmation (if enabled) or login.');
        router.replace('/(auth)/login');
      }
    }
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>Setup your FitLook shop</Text>

      <TextInput
        label="Shop Name"
        onChangeText={setShopName}
        value={shopName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Owner Name"
        onChangeText={setOwnerName}
        value={ownerName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Mobile Number"
        onChangeText={setMobile}
        value={mobile}
        keyboardType="phone-pad"
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Email"
        onChangeText={setEmail}
        value={email}
        placeholder="email@address.com"
        autoCapitalize={'none'}
        mode="outlined"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        label="Password"
        onChangeText={setPassword}
        value={password}
        secureTextEntry={true}
        autoCapitalize={'none'}
        mode="outlined"
        style={styles.input}
      />
      
      <Button mode="contained" onPress={signUpWithEmail} disabled={loading} style={styles.button}>
        {loading ? <ActivityIndicator color="white" /> : 'Sign Up'}
      </Button>

      <Link href="/(auth)/login" asChild>
        <Button mode="text" style={styles.link}>Already have an account? Sign in</Button>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginTop: 40,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
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
    marginBottom: 40,
  },
});
