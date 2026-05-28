import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Alert, Share } from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';

export default function ResultScreen() {
  const { trialId } = useLocalSearchParams();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchResult() {
      if (!trialId) return;
      const { data, error } = await supabase
        .from('trials')
        .select('result_image_url')
        .eq('id', trialId)
        .single();
      
      if (error) {
        Alert.alert('Error', 'Failed to load trial result');
      } else if (data) {
        setImageUrl(data.result_image_url);
      }
      setLoading(false);
    }
    fetchResult();
  }, [trialId]);

  const handleShare = async () => {
    if (!imageUrl) return;
    try {
      await Share.share({
        message: `Check how I look in this fabric! ${imageUrl}`,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const fileUri = `${FileSystem.documentDirectory}${trialId}.jpg`;
      const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
      Alert.alert('Success', `Image saved to ${uri}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to download image');
    }
  };

  if (loading) {
    return <ActivityIndicator style={styles.loading} />;
  }

  if (!imageUrl) {
    return (
      <View style={styles.container}>
        <Text>Trial not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
      
      <View style={styles.actions}>
        <Button icon="share-variant" mode="contained" onPress={handleShare} style={styles.button}>
          Share
        </Button>
        <Button icon="download" mode="outlined" onPress={handleDownload} style={styles.button}>
          Download
        </Button>
      </View>
      
      <Button mode="text" onPress={() => router.replace('/(tabs)/home')} style={styles.homeBtn}>
        Back to Dashboard
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  image: {
    flex: 1,
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    padding: 20,
    paddingBottom: 0,
    backgroundColor: '#000',
  },
  button: {
    flex: 1,
  },
  homeBtn: {
    marginVertical: 20,
    marginHorizontal: 20,
  },
});
