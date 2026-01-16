import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import client from '@/api/client';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';

// Simple card component
const SummaryCard = ({ title, amount, icon: Icon, type, colors }: any) => (
  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.cardHeader}>
      <Text style={[styles.cardTitle, { color: colors.muted }]}>{title}</Text>
      <View style={[styles.iconContainer, { backgroundColor: type === 'positive' ? '#dcfce7' : type === 'negative' ? '#fee2e2' : '#e0f2fe' }]}>
        <Icon size={20} color={type === 'positive' ? '#16a34a' : type === 'negative' ? '#dc2626' : '#0284c7'} />
      </View>
    </View>
    <Text style={[styles.cardAmount, { color: colors.text }]}>
      ${amount?.toLocaleString() || '0'}
    </Text>
  </View>
);

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch dashboard metrics
      // Using generic endpoints for now, assumes backend structure
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const response = await client.get('/analytics/kpis', {
        params: {
          start_date: startOfMonth,
          end_date: endOfMonth,
        }
      });

      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.welcomeText, { color: colors.muted }]}>Welcome back,</Text>
        <Text style={[styles.userName, { color: colors.text }]}>{user?.full_name || 'User'}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>This Month</Text>

        <View style={styles.cardsContainer}>
          <SummaryCard
            title="Total Revenue"
            amount={data?.current_period?.revenue}
            icon={TrendingUp}
            type="positive"
            colors={colors}
          />
          <SummaryCard
            title="Total Expenses"
            amount={data?.current_period?.expenses}
            icon={TrendingDown}
            type="negative"
            colors={colors}
          />
          <SummaryCard
            title="Net Profit"
            amount={data?.current_period?.profit}
            icon={DollarSign}
            type="neutral"
            colors={colors}
          />
        </View>

        {/* Recent Activity Section could go here */}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  welcomeText: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
