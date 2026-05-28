import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert, Platform } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import * as Notifications from 'expo-notifications';
import LottieView from 'lottie-react-native';

const GARMENTS = [
  { id: 'kurti', name: 'Kurti' },
  { id: 'lehenga', name: 'Lehenga' },
  { id: 'saree', name: 'Saree' },
  { id: 'shirt', name: 'Shirt' },
];

export default function NewTrialScreen() {
  const [step, setStep] = useState(1);
  const [fabricUri, setFabricUri] = useState<string | null>(null);
  const [customerUri, setCustomerUri] = useState<string | null>(null);
  const [garmentType, setGarmentType] = useState('kurti');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

  const pickImage = async (setImage: (uri: string) => void, useCamera: boolean) => {
    let result;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission needed');
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission needed');
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0].uri) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string, bucket: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, decode(base64), { contentType: `image/${ext}` });
      
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  };

  const scheduleNotification = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Your trial is ready! 👗",
        body: "Tap here to view the generated AI trial room result.",
      },
      trigger: null,
    });
  };

  const handleGenerate = async () => {
    if (!fabricUri || !customerUri) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      const fabricUrl = await uploadImage(fabricUri, 'fabric-images');
      const customerUrl = await uploadImage(customerUri, 'customer-images');

      // Create trial first
      const { data: trialData, error: trialError } = await supabase.from('trials').insert({
        shop_id: session.user.id,
        customer_name: "Mobile Customer",
        fabric_type: "Custom Fabric",
        garment_type: garmentType,
        fabric_image_url: fabricUrl,
        customer_image_url: customerUrl,
        status: "processing"
      }).select().single();

      if (trialError || !trialData) {
        throw new Error("Failed to create trial in database");
      }

      // Call API (fire and forget for background processing)
      fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          trialId: trialData.id,
          fabricImageUrl: fabricUrl,
          customerImageUrl: customerUrl,
          garmentType: garmentType,
        }),
      }).catch(console.error);

      await scheduleNotification();
      
      // Reset state and navigate to result
      setFabricUri(null);
      setCustomerUri(null);
      setStep(1);
      
      router.push(`/result/${trialData.id}`);

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {/* Placeholder for Lottie - Using ActivityIndicator if Lottie isn't immediately configured */}
        <ActivityIndicator size="large" color="#1A1A2E" />
        <Text style={styles.loadingText}>Sewing your AI trial...</Text>
      </View>
    );
  }

  const renderImagePicker = (
    title: string, 
    uri: string | null, 
    setUri: (u: string) => void, 
    nextStep: number
  ) => (
    <View style={styles.stepContainer}>
      <Text variant="headlineSmall" style={styles.stepTitle}>{title}</Text>
      
      {uri ? (
        <View>
          <Image source={{ uri }} style={styles.previewImage} />
          <View style={styles.rowButtons}>
            <Button mode="outlined" onPress={() => setUri('')}>Retake</Button>
            <Button mode="contained" onPress={() => setStep(nextStep)}>Use Photo</Button>
          </View>
        </View>
      ) : (
        <View style={styles.rowButtons}>
          <Button icon="camera" mode="contained" onPress={() => pickImage(setUri, true)}>Camera</Button>
          <Button icon="image" mode="outlined" onPress={() => pickImage(setUri, false)}>Gallery</Button>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.stepIndicator}>Step {step} of 4</Text>

      {step === 1 && renderImagePicker("1. Upload Fabric", fabricUri, setFabricUri, 2)}
      
      {step === 2 && renderImagePicker("2. Upload Customer Photo", customerUri, setCustomerUri, 3)}

      {step === 3 && (
        <View style={styles.stepContainer}>
          <Text variant="headlineSmall" style={styles.stepTitle}>3. Select Garment</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {GARMENTS.map(g => (
              <Card 
                key={g.id} 
                style={[styles.garmentCard, garmentType === g.id && styles.garmentCardSelected]}
                onPress={() => setGarmentType(g.id)}
              >
                <Card.Content>
                  <Text style={[styles.garmentText, garmentType === g.id && styles.garmentTextSelected]}>
                    {g.name}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
          <Button mode="contained" onPress={() => setStep(4)} style={styles.nextBtn}>Next</Button>
        </View>
      )}

      {step === 4 && (
        <View style={styles.stepContainer}>
          <Text variant="headlineSmall" style={styles.stepTitle}>4. Confirm Details</Text>
          <Text>Fabric uploaded</Text>
          <Text>Customer photo uploaded</Text>
          <Text style={{ marginBottom: 20 }}>Style: {garmentType}</Text>
          
          <Button mode="contained" onPress={handleGenerate} style={styles.nextBtn}>
            Generate AI Trial
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  stepIndicator: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  horizontalScroll: {
    flexGrow: 0,
    marginBottom: 20,
  },
  garmentCard: {
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  garmentCardSelected: {
    backgroundColor: '#1A1A2E',
  },
  garmentText: {
    color: '#1A1A2E',
  },
  garmentTextSelected: {
    color: '#fff',
  },
  nextBtn: {
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 20,
    color: '#1A1A2E',
    fontWeight: 'bold',
  },
});
