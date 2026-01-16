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

      const response = await client.get('/analytics/overview', {
        params: {
          period: 'month',
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

  const kpis = data?.kpis?.current_period;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.welcomeText, { color: colors.muted }]}>Welcome back,</Text>
        <Text style={[styles.userName, { color: colors.text }]}>{user?.full_name || user?.username || 'User'}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Overview</Text>
          <Text style={[styles.dateRange, { color: colors.muted }]}>
            {data?.period?.start_date ? new Date(data.period.start_date).toLocaleDateString() : ''} - {data?.period?.end_date ? new Date(data.period.end_date).toLocaleDateString() : ''}
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          <SummaryCard
            title="Revenue"
            amount={kpis?.revenue}
            icon={TrendingUp}
            type="positive"
            colors={colors}
          />
          <SummaryCard
            title="Expenses"
            amount={kpis?.expenses}
            icon={TrendingDown}
            type="negative"
            colors={colors}
          />
          <SummaryCard
            title="Net Profit"
            amount={kpis?.profit}
            icon={DollarSign}
            type="neutral"
            colors={colors}
          />
        </View>

        {/* Profit Margin Indicator */}
        <View style={[styles.marginCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.marginHeader}>
            <Text style={[styles.marginTitle, { color: colors.text }]}>Profit Margin</Text>
            <Text style={[styles.marginPercent, { color: colors.primary }]}>{kpis?.profit_margin?.toFixed(1) || 0}%</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.secondary }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(Math.max(kpis?.profit_margin || 0, 0), 100)}%`
                }
              ]}
            />
          </View>
        </View>

        {/* Trends Section */}
        {data?.trends?.profit && (
          <View style={styles.trendSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Profit Trend</Text>
            <View style={[styles.trendCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.trendText, { color: colors.muted }]}>
                Current trend is <Text style={{ color: data.trends.profit.trend.direction === 'increasing' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                  {data.trends.profit.trend.direction}
                </Text> with {data.trends.profit.trend.strength.toFixed(1)}% strength.
              </Text>
            </View>
          </View>
        )}

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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dateRange: {
    fontSize: 12,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
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
  marginCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  marginHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  marginTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  marginPercent: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  trendSection: {
    marginBottom: 24,
  },
  trendCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  trendText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
