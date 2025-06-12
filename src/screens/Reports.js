import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../..//firebaseConfig'; // Adjust path as needed
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

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
    },
    monthlyData: [],
    batchPerformance: [],
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

      // Calculate ROI and generate chart data
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
    const batches = await fetchBatches(userId);
    const batchIds = batches.map(batch => batch.id);
    
    if (batchIds.length === 0) return [];
    
    const feedPromises = batchIds.map(async (batchId) => {
      const q = query(collection(db, 'feed'), where('batchId', '==', batchId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), batchId }));
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
      return snapshot.docs.map(doc => ({ ...doc.data(), batchId }));
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
      return snapshot.docs.map(doc => ({ ...doc.data(), batchId }));
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
      return snapshot.docs.map(doc => ({ ...doc.data(), batchId }));
    });
    
    const mortalityArrays = await Promise.all(mortalityPromises);
    return mortalityArrays.flat();
  };

  const generateMonthlyData = (batches, feed, vaccinations, eggs, mortality) => {
    const monthlyStats = {};
    
    // Process batches
    batches.forEach(batch => {
      if (batch.createdAt) {
        const date = new Date(batch.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = { investment: 0, revenue: 0, profit: 0 };
        }
        monthlyStats[monthKey].investment += batch.price || 0;
      }
    });

    // Process egg revenue
    eggs.forEach(egg => {
      if (egg.date) {
        const date = new Date(egg.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = { investment: 0, revenue: 0, profit: 0 };
        }
        monthlyStats[monthKey].revenue += (egg.remaining || 0) * EGG_PRICE;
      }
    });

    // Calculate profit
    Object.keys(monthlyStats).forEach(month => {
      monthlyStats[month].profit = monthlyStats[month].revenue - monthlyStats[month].investment;
    });

    // Convert to array and sort by month
    const sortedMonths = Object.keys(monthlyStats).sort();
    return sortedMonths.slice(-6).map(month => ({
      month: month.split('-')[1],
      ...monthlyStats[month]
    }));
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
    
    // Mortality loss
    const totalDeaths = mortality.reduce((sum, item) => sum + (item.deaths || 0), 0);
    const avgEggsPerChicken = 25;
    const mortalityLoss = totalDeaths * avgEggsPerChicken * EGG_PRICE;
    
    // Calculate totals
    const totalInvestment = batchCosts + feedCosts + vaccinationCosts;
    const totalRevenue = eggRevenue;
    const totalLoss = eggLoss + mortalityLoss;
    const netProfit = totalRevenue - totalInvestment - totalLoss;
    const roi = totalInvestment > 0 ? ((netProfit / totalInvestment) * 100) : 0;

    // Generate monthly data
    const monthlyData = generateMonthlyData(batches, feed, vaccinations, eggs, mortality);

    // Generate batch performance data
    const batchPerformance = batches.map(batch => ({
      name: `B${batch.id?.slice(-4) || 'atch'}`,
      investment: batch.price || 0,
      revenue: eggs.filter(e => e.batchId === batch.id).reduce((sum, e) => sum + (e.remaining || 0) * EGG_PRICE, 0),
    }));

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
      },
      monthlyData,
      batchPerformance: batchPerformance.slice(0, 5), // Limit to 5 batches for display
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

  // Chart configurations
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#4CAF50',
    },
  };

  // Prepare pie chart data
  const costPieData = [
    {
      name: 'Batches',
      population: reportData.breakdown.batchCosts,
      color: '#2196F3',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'Feed',
      population: reportData.breakdown.feedCosts,
      color: '#FF9800',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'Vaccination',
      population: reportData.breakdown.vaccinationCosts,
      color: '#9C27B0',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
  ].filter(item => item.population > 0);

  const revenueLossPieData = [
    {
      name: 'Revenue',
      population: reportData.breakdown.eggRevenue,
      color: '#4CAF50',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'Egg Loss',
      population: reportData.breakdown.eggLoss,
      color: '#F44336',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'Mortality Loss',
      population: reportData.breakdown.mortalityLoss,
      color: '#FF5722',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
  ].filter(item => item.population > 0);

  // Prepare line chart data
  const monthlyLineData = {
    labels: reportData.monthlyData.map(item => `M${item.month}`),
    datasets: [
      {
        data: reportData.monthlyData.map(item => item.profit),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  // Prepare bar chart data
  const batchBarData = {
    labels: reportData.batchPerformance.map(item => item.name),
    datasets: [
      {
        data: reportData.batchPerformance.map(item => item.revenue - item.investment),
      },
    ],
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Calculating your ROI...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Reports</Text>
        <TouchableOpacity onPress={fetchReportData} style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* ROI Overview */}
      <View style={styles.roiCard}>
        <Icon name="trending-up" size={32} color={reportData.roi >= 0 ? '#4CAF50' : '#F44336'} />
        <Text style={styles.roiTitle}>Return on Investment</Text>
        <Text style={[
          styles.roiValue,
          { color: reportData.roi >= 0 ? '#4CAF50' : '#F44336' }
        ]}>
          {reportData.roi.toFixed(1)}%
        </Text>
        <View style={styles.roiIndicator}>
          <View style={[
            styles.roiDot,
            { backgroundColor: reportData.roi >= 0 ? '#4CAF50' : '#F44336' }
          ]} />
          <Text style={styles.roiSubtitle}>
            {reportData.roi >= 0 ? 'Profitable Business' : 'Needs Improvement'}
          </Text>
        </View>
      </View>



      {/* Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        <StatCard
          title="Total Investment"
          value={formatCurrency(reportData.totalInvestment)}
          icon="account-balance-wallet"
          color="#FF5722"
          subtitle={`Across ${reportData.totalBatches} batches`}
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(reportData.netProfit)}
          icon={reportData.netProfit >= 0 ? "attach-money" : "money-off"}
          color={reportData.netProfit >= 0 ? "#4CAF50" : "#F44336"}
          subtitle={reportData.netProfit >= 0 ? "Profit made" : "Loss incurred"}
        />
      </View>


      {/* Cost Distribution Pie Chart */}
      {costPieData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Cost Distribution</Text>
          <PieChart
            data={costPieData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </View>
      )}

      {/* Revenue vs Losses */}
      {revenueLossPieData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Revenue vs Losses</Text>
          <PieChart
            data={revenueLossPieData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </View>
      )}

      {/* Enhanced Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Icon name="assessment" size={24} color="#4CAF50" />
          <Text style={styles.sectionTitle}>Business Summary</Text>
        </View>
        <View style={styles.summaryContent}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Investment:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(reportData.totalInvestment)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Revenue:</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
              {formatCurrency(reportData.totalRevenue)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Losses:</Text>
            <Text style={[styles.summaryValue, { color: '#F44336' }]}>
              {formatCurrency(reportData.totalLoss)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalLabel}>Net Result:</Text>
            <Text style={[
              styles.summaryTotalValue,
              { color: reportData.netProfit >= 0 ? '#4CAF50' : '#F44336' }
            ]}>
              {formatCurrency(Math.abs(reportData.netProfit))} 
              {reportData.netProfit >= 0 ? ' Profit' : ' Loss'}
            </Text>
          </View>
        </View>
        
        <View style={styles.insightCard}>
          <Icon name="lightbulb-outline" size={20} color="#FF9800" />
          <Text style={styles.insightText}>
            {reportData.roi >= 20 ? 
              "Excellent performance! Your business is highly profitable." :
              reportData.roi >= 10 ?
              "Good performance! Consider optimizing costs for better returns." :
              reportData.roi >= 0 ?
              "Break-even achieved. Focus on increasing revenue and reducing losses." :
              "Business needs attention. Review costs and improve egg production efficiency."
            }
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
  },
  roiCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  roiTitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
    fontWeight: '500',
  },
  roiValue: {
    fontSize: 52,
    fontWeight: '800',
    marginBottom: 8,
  },
  roiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  roiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  roiSubtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  chartCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flex: 1,
    minWidth: '45%',
    borderLeftWidth: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  summaryContent: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryTotalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
    marginTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff8e1',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default Reports;