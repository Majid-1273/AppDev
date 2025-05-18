// Flock.js
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Calendar, Droplet, AlertTriangle, BarChart2, Users, Clock, Wind } from 'lucide-react-native';
import styles from '../../styles';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

const Flock = ({ route, navigation }) => {
  const { flockId } = route.params;

  const [flockData, setFlockData] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      console.error('User not authenticated');
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'users', user.uid, 'batches', flockId);

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const formattedData = {
          ...data,
          startDate: data.createdAt ? formatTimestamp(data.createdAt) : '',
          lastUpdate: data.lastUpdate ? formatTimestamp(data.lastUpdate) : '',
        };
        setFlockData({ id: flockId, ...formattedData });
      } else {
        console.error('No such flock!');
        setFlockData(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching flock in realtime:', error);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [flockId]);

  if (loading) {
    return <ActivityIndicator size="large" color="#5c6bc0" style={{ marginTop: 50 }} />;
  }

  if (!flockData) {
    return <Text style={{ textAlign: 'center', marginTop: 50 }}>Flock not found.</Text>;
  }

  const healthColors = {
    Healthy: '#4caf50',
    Warning: '#ff9800',
    Critical: '#f44336',
  };
  const statusColor = healthColors[flockData.healthStatus] || '#4caf50';

  return (
    <ScrollView style={styles.flockContainer}>
      <View style={styles.headerSection}>
        <Image source={{ uri: flockData.image }} style={styles.flockImage} />
        <View style={styles.flockHeaderInfo}>
          <Text style={styles.flockName}>{flockData.name}</Text>
          <Text style={styles.flockType}>
            {flockData.type} • {flockData.breed}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Users size={16} color="#5c6bc0" />
              <Text style={styles.statText}>{flockData.birds} birds</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={16} color="#5c6bc0" />
              <Text style={styles.statText}>{flockData.age}</Text>
            </View>
          </View>
          <View style={styles.badgeContainer}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={styles.statusText}>{flockData.healthStatus || 'Healthy'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location:</Text>
          <Text style={styles.infoValue}>{flockData.location}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Start Date:</Text>
          <Text style={styles.infoValue}>{flockData.startDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Updated:</Text>
          <Text style={styles.infoValue}>{flockData.lastUpdate}</Text>
        </View>
      </View>

      <View style={styles.environmentSection}>
        <Text style={styles.sectionTitle}>Environment</Text>
        <View style={styles.environmentCards}>
          <View style={styles.environmentCard}>
            <Wind size={24} color="#5c6bc0" />
            <Text style={styles.environmentValue}>{flockData.houseTempC}°C</Text>
            <Text style={styles.environmentLabel}>Temperature</Text>
          </View>
          <View style={styles.environmentCard}>
            <Droplet size={24} color="#5c6bc0" />
            <Text style={styles.environmentValue}>{flockData.humidity}%</Text>
            <Text style={styles.environmentLabel}>Humidity</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickStatsSection}>
        <Text style={styles.sectionTitle}>Today's Stats</Text>
        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{flockData.feedConsumption}</Text>
            <Text style={styles.quickStatLabel}>Feed</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{flockData.waterConsumption}</Text>
            <Text style={styles.quickStatLabel}>Water</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{flockData.eggProduction}</Text>
            <Text style={styles.quickStatLabel}>Eggs</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{flockData.mortalityRate}</Text>
            <Text style={styles.quickStatLabel}>Mortality</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.managementButton}
          onPress={() => navigation.navigate('FlockTabs', { flockId: flockData.id, flockName: flockData.name })}
        >
          <Text style={styles.managementButtonText}>Manage Flock</Text>
        </TouchableOpacity>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => navigation.navigate('FeedLog', { flockId: flockData.id, flockName: flockData.name })}
          >
            <Text style={styles.managementButtonText}>Add Feed Log</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Calendar size={20} color="#5c6bc0" />
            <Text style={styles.actionButtonText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <BarChart2 size={20} color="#5c6bc0" />
            <Text style={styles.actionButtonText}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <AlertTriangle size={20} color="#5c6bc0" />
            <Text style={styles.actionButtonText}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default Flock;
