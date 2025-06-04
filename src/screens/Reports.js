import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../..//firebaseConfig'; // Adjust path as needed
import Icon from 'react-native-vector-icons/MaterialIcons';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    totalBatches: 0,
    totalInvestment: 0,
    totalRevenue: 0,
    totalLoss: 0,
    netProfit: 0,
    roi: 0,
    breakdown: {
      batchCosts: 0,
      feedCosts: 0,
      vaccinationCosts: 0,
      eggRevenue: 0,
      eggLoss: 0,
      mortalityLoss: 0,
    }
  });

  const EGG_PRICE = 1; // $1 per egg - you can make this configurable

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Fetch all data in parallel
      const [batchesData, feedData, vaccinationData, eggData, mortalityData] = await Promise.all([
        fetchBatches(userId),
        fetchFeed(userId),
        fetchVaccinations(userId),
        fetchEggProduction(userId),
        fetchMortality(userId)
      ]);

      // Calculate ROI
      const calculations = calculateROI(batchesData, feedData, vaccinationData, eggData, mortalityData);
      setReportData(calculations);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      Alert.alert('Error', 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async (userId) => {
    const q = query(collection(db, 'batches'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const fetchFeed = async (userId) => {
    // Get all batches for this user first
    const batches = await fetchBatches(userId);
    const batchIds = batches.map(batch => batch.id);
    
    if (batchIds.length === 0) return [];
    
    const feedPromises = batchIds.map(async (batchId) => {
      const q = query(collection(db, 'feed'), where('batchId', '==', batchId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    });
    
    const feedArrays = await Promise.all(feedPromises);
    return feedArrays.flat();
  };

  const fetchVaccinations = async (userId) => {
    const batches = await fetchBatches(userId);
    const batchIds = batches.map(batch => batch.id);
    
    if (batchIds.length === 0) return [];
    
    const vaccinationPromises = batchIds.map(async (batchId) => {
      const q = query(collection(db, 'vaccination'), where('batchId', '==', batchId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    });
    
    const vaccinationArrays = await Promise.all(vaccinationPromises);
    return vaccinationArrays.flat();
  };

  const fetchEggProduction = async (userId) => {
    const batches = await fetchBatches(userId);
    const batchIds = batches.map(batch => batch.id);
    
    if (batchIds.length === 0) return [];
    
    const eggPromises = batchIds.map(async (batchId) => {
      const q = query(collection(db, 'egg-production'), where('batchId', '==', batchId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    });
    
    const eggArrays = await Promise.all(eggPromises);
    return eggArrays.flat();
  };

  const fetchMortality = async (userId) => {
    const batches = await fetchBatches(userId);
    const batchIds = batches.map(batch => batch.id);
    
    if (batchIds.length === 0) return [];
    
    const mortalityPromises = batchIds.map(async (batchId) => {
      const q = query(collection(db, 'mortality'), where('batchId', '==', batchId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    });
    
    const mortalityArrays = await Promise.all(mortalityPromises);
    return mortalityArrays.flat();
  };

  const calculateROI = (batches, feed, vaccinations, eggs, mortality) => {
    // Calculate costs
    const batchCosts = batches.reduce((sum, batch) => sum + (batch.price || 0), 0);
    const feedCosts = feed.reduce((sum, item) => sum + (item.price || 0), 0);
    const vaccinationCosts = vaccinations
      .filter(vac => vac.done === true)
      .reduce((sum, vac) => sum + (vac.price || 0), 0);
    
    // Calculate revenue and losses
    const eggRevenue = eggs.reduce((sum, item) => sum + ((item.remaining || 0) * EGG_PRICE), 0);
    const eggLoss = eggs.reduce((sum, item) => sum + ((item.broken || 0) * EGG_PRICE), 0);
    
    // Mortality loss (loss of potential revenue, not monetary loss)
    const totalDeaths = mortality.reduce((sum, item) => sum + (item.deaths || 0), 0);
    const avgEggsPerChicken = 25; // Assume 25 eggs per chicken lifetime
    const mortalityLoss = totalDeaths * avgEggsPerChicken * EGG_PRICE;
    
    // Calculate totals
    const totalInvestment = batchCosts + feedCosts + vaccinationCosts;
    const totalRevenue = eggRevenue;
    const totalLoss = eggLoss + mortalityLoss;
    const netProfit = totalRevenue - totalInvestment - totalLoss;
    const roi = totalInvestment > 0 ? ((netProfit / totalInvestment) * 100) : 0;

    return {
      totalBatches: batches.length,
      totalInvestment,
      totalRevenue,
      totalLoss,
      netProfit,
      roi,
      breakdown: {
        batchCosts,
        feedCosts,
        vaccinationCosts,
        eggRevenue,
        eggLoss,
        mortalityLoss,
      }
    };
  };

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const BreakdownItem = ({ label, value, color }) => (
    <View style={styles.breakdownItem}>
      <View style={styles.breakdownLabel}>
        <View style={[styles.colorDot, { backgroundColor: color }]} />
        <Text style={styles.breakdownText}>{label}</Text>
      </View>
      <Text style={[styles.breakdownValue, { color }]}>{formatCurrency(value)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Calculating your ROI...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Reports</Text>
        <TouchableOpacity onPress={fetchReportData} style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* ROI Overview */}
      <View style={styles.roiCard}>
        <Text style={styles.roiTitle}>Return on Investment</Text>
        <Text style={[
          styles.roiValue,
          { color: reportData.roi >= 0 ? '#4CAF50' : '#F44336' }
        ]}>
          {reportData.roi.toFixed(1)}%
        </Text>
        <Text style={styles.roiSubtitle}>
          {reportData.roi >= 0 ? 'Profitable' : 'Loss'}
        </Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <StatCard
          title="Total Investment"
          value={formatCurrency(reportData.totalInvestment)}
          icon="trending-down"
          color="#FF5722"
          subtitle={`Across ${reportData.totalBatches} batches`}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(reportData.totalRevenue)}
          icon="trending-up"
          color="#4CAF50"
          subtitle="From egg sales"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(reportData.netProfit)}
          icon={reportData.netProfit >= 0 ? "attach-money" : "money-off"}
          color={reportData.netProfit >= 0 ? "#4CAF50" : "#F44336"}
          subtitle={reportData.netProfit >= 0 ? "Profit made" : "Loss incurred"}
        />
        <StatCard
          title="Total Losses"
          value={formatCurrency(reportData.totalLoss)}
          icon="warning"
          color="#FF9800"
          subtitle="Eggs + Mortality"
        />
      </View>

      {/* Cost Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.sectionTitle}>Cost Breakdown</Text>
        <BreakdownItem
          label="Batch Purchases"
          value={reportData.breakdown.batchCosts}
          color="#2196F3"
        />
        <BreakdownItem
          label="Feed Costs"
          value={reportData.breakdown.feedCosts}
          color="#FF9800"
        />
        <BreakdownItem
          label="Vaccination Costs"
          value={reportData.breakdown.vaccinationCosts}
          color="#9C27B0"
        />
      </View>

      {/* Revenue Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.sectionTitle}>Revenue & Losses</Text>
        <BreakdownItem
          label="Egg Revenue"
          value={reportData.breakdown.eggRevenue}
          color="#4CAF50"
        />
        <BreakdownItem
          label="Broken Eggs Loss"
          value={reportData.breakdown.eggLoss}
          color="#F44336"
        />
        <BreakdownItem
          label="Mortality Loss"
          value={reportData.breakdown.mortalityLoss}
          color="#FF5722"
        />
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.summaryText}>
          You have invested a total of {formatCurrency(reportData.totalInvestment)} across {reportData.totalBatches} batches. 
          Your current revenue from egg sales is {formatCurrency(reportData.totalRevenue)}, 
          with total losses of {formatCurrency(reportData.totalLoss)}. 
          This results in a net {reportData.netProfit >= 0 ? 'profit' : 'loss'} of{' '}
          <Text style={{ color: reportData.netProfit >= 0 ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
            {formatCurrency(Math.abs(reportData.netProfit))}
          </Text> and an ROI of{' '}
          <Text style={{ color: reportData.roi >= 0 ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
            {reportData.roi.toFixed(1)}%
          </Text>.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop:40
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  roiCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  roiTitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  roiValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roiSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  breakdownCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  breakdownText: {
    fontSize: 16,
    color: '#333',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 32,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});

export default Reports;