import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('shops')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setShopName(data.shop_name || '');
          setOwnerName(data.owner_name || '');
          setMobile(data.mobile || '');
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('shops')
      .update({ shop_name: shopName, owner_name: ownerName, mobile: mobile })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Profile updated successfully');
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Shop Profile</Text>

      <View style={styles.form}>
        <TextInput
          label="Shop Name"
          value={shopName}
          onChangeText={setShopName}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Owner Name"
          value={ownerName}
          onChangeText={setOwnerName}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Mobile Number"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          mode="outlined"
          style={styles.input}
        />

        <Button 
          mode="contained" 
          onPress={handleSave} 
          disabled={saving} 
          style={styles.button}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>

        <Button 
          mode="outlined" 
          onPress={handleLogout} 
          style={[styles.button, styles.logoutButton]}
          textColor="#d32f2f"
        >
          Log Out
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 20,
    marginTop: 10,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  logoutButton: {
    borderColor: '#d32f2f',
    marginTop: 20,
  },
});
