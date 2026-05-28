import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

type Trial = {
  id: string;
  created_at: string;
  result_image_url: string;
  garment_type: string;
};

export default function HistoryScreen() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function fetchHistory() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('trials')
      .select('id, created_at, result_image_url, garment_type')
      .eq('shop_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setTrials(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  const renderItem = ({ item }: { item: Trial }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/result/${item.id}`)}
    >
      <Image source={{ uri: item.result_image_url }} style={styles.image} />
      <View style={styles.info}>
        <Text variant="titleMedium" style={styles.garmentType}>
          {item.garment_type.charAt(0).toUpperCase() + item.garment_type.slice(1)}
        </Text>
        <Text variant="bodySmall" style={styles.date}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={trials}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchHistory} />}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>No trials found. Generate one!</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    width: 100,
    height: 100,
    backgroundColor: '#e0e0e0',
  },
  info: {
    padding: 16,
    justifyContent: 'center',
  },
  garmentType: {
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  date: {
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
  },
});
