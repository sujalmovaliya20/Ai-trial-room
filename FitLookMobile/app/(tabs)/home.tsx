import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, useTheme, Button } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [trialsToday, setTrialsToday] = useState(0);
  const [trialsThisMonth, setTrialsThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const router = useRouter();

  async function fetchStats() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Fetch today's trials
    const { count: countToday } = await supabase
      .from('trials')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', user.id)
      .gte('created_at', today.toISOString());

    // Fetch this month's trials
    const { count: countMonth } = await supabase
      .from('trials')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', user.id)
      .gte('created_at', firstDayOfMonth.toISOString());

    setTrialsToday(countToday || 0);
    setTrialsThisMonth(countMonth || 0);
    setLoading(false);
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} />}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Dashboard</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Welcome to FitLook Mobile</Text>
      </View>

      <View style={styles.statsContainer}>
        <Card style={[styles.card, { backgroundColor: theme.colors.secondary }]}>
          <Card.Content>
            <Title>Today</Title>
            <Paragraph style={styles.statValue}>{trialsToday}</Paragraph>
            <Paragraph>Trials Generated</Paragraph>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.secondary }]}>
          <Card.Content>
            <Title>This Month</Title>
            <Paragraph style={styles.statValue}>{trialsThisMonth}</Paragraph>
            <Paragraph>Trials Generated</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <Button 
        mode="contained" 
        style={styles.actionButton}
        onPress={() => router.push('/(tabs)/new-trial')}
      >
        Start New Trial
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  subtitle: {
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginVertical: 10,
  },
  actionButton: {
    margin: 20,
    paddingVertical: 8,
  },
});
