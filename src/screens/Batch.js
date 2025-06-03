//SANIA
// Batch.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Calendar,
  Droplet,
  AlertTriangle,
  BarChart2,
  Users,
  Clock,
  Wind,
  Egg,
  Syringe,
} from 'lucide-react-native';
import styles from '../../styles';
import {
  doc,
  collection,
  onSnapshot,
  query,
  getDocs,
  where,
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

const Batch = ({ route, navigation }) => {
  const { batchId } = route.params;

  const [batchData, setBatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalFeed, setTotalFeed] = useState(0);

  // Static images based on batch type
  const getBatchImage = (batchType) => {
    const imageMap = {
      'Layer': 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&h=300&fit=crop&crop=center', // Brown hen laying eggs
      'Broiler': 'https://images.unsplash.com/photo-1598016717029-026340d417d4?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // White broiler chickens
      'Other': 'data:image/jpeg;base64,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'
    };
    
    return imageMap[batchType] || imageMap['Other'];
  };

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

    // Updated path: batches collection is now separate, not nested under users
    const docRef = doc(db, 'batches', batchId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Check if this batch belongs to current user
          if (data.userId !== user.uid) {
            console.error('Unauthorized access to batch');
            setBatchData(null);
            setLoading(false);
            return;
          }

          const formattedData = {
            ...data,
            // Map new field names to old ones for display
            startDate: data.placementDate ? formatTimestamp(data.placementDate) : '',
            lastUpdate: data.lastUpdate ? formatTimestamp(data.lastUpdate) : '',
            birds: data.currentCount || data.initialCount || 0,
            // Add default values for fields that might not exist in new structure
            age: calculateAge(data.placementDate),
            breed: data.breed || 'Not specified',
            location: data.location || 'Not specified',
            healthStatus: data.healthStatus || 'Healthy',
            // Use static image based on batch type
            image: getBatchImage(data.type),
          };
          setBatchData({ id: batchId, ...formattedData });
        } else {
          console.error('No such batch!');
          setBatchData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching batch in realtime:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [batchId]);

  useEffect(() => {
    const fetchFeedLogs = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Updated path: feed collection is now separate
      const feedRef = collection(db, 'feed');
      const feedQuery = query(feedRef, where('batchId', '==', batchId));
      
      try {
        const snapshot = await getDocs(feedQuery);

        let total = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Updated field name from 'quantity' to 'grams'
          if (data.grams) {
            total += Number(data.grams);
          }
        });

        setTotalFeed(total);
      } catch (error) {
        console.error('Error fetching feed logs:', error);
      }
    };

    fetchFeedLogs();
  }, [batchId]);

  // Helper function to calculate age from placement date
  const calculateAge = (placementDate) => {
    if (!placementDate) return 'Unknown';
    
    const now = new Date();
    const placement = placementDate.toDate();
    const diffTime = Math.abs(now - placement);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays} days`;
    } else {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#5c6bc0" style={{ marginTop: 50 }} />
    );
  }

  if (!batchData) {
    return <Text style={{ textAlign: 'center', marginTop: 50 }}>Batch not found.</Text>;
  }

  const healthColors = {
    Healthy: '#4caf50',
    Warning: '#ff9800',
    Critical: '#f44336',
  };
  const statusColor = healthColors[batchData.healthStatus] || '#4caf50';

  return (
    <ScrollView style={styles.batchContainer}>
      <View style={styles.headerSection}>
        <Image 
          source={{ uri: batchData.image }} 
          style={styles.batchImage}
          defaultSource={{ uri: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=400&h=300&fit=crop&crop=center' }}
        />
        <View style={styles.batchHeaderInfo}>
          <Text style={styles.batchName}>{batchData.name}</Text>
          <Text style={styles.batchType}>
            {batchData.type} • {batchData.breed}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Users size={16} color="#5c6bc0" />
              <Text style={styles.statText}>{batchData.birds} birds</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={16} color="#5c6bc0" />
              <Text style={styles.statText}>{batchData.age}</Text>
            </View>
          </View>
          <View style={styles.badgeContainer}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={styles.statusText}>{batchData.healthStatus || 'Healthy'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location:</Text>
          <Text style={styles.infoValue}>{batchData.location}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Start Date:</Text>
          <Text style={styles.infoValue}>{batchData.startDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Updated:</Text>
          <Text style={styles.infoValue}>{batchData.lastUpdate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Initial Count:</Text>
          <Text style={styles.infoValue}>{batchData.initialCount || 0}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Current Count:</Text>
          <Text style={styles.infoValue}>{batchData.currentCount || 0}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total Feed Used:</Text>
          <Text style={styles.infoValue}>{totalFeed} grams</Text>
        </View>
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.managementButton}
          onPress={() => navigation.navigate('ManageBatch', { batchId: batchData.id })}
        >
          <Text style={styles.managementButtonText}>Manage Batch</Text>
        </TouchableOpacity>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('FeedLog', {
                batchId: batchData.id,
                batchName: batchData.name,
              })
            }
          >
            <Calendar size={20} color="#5c6bc0" />
            <Text style={styles.actionButtonText}>Feed Log</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('EggProductionLog', {
                batchId: batchData.id,
              })
            }
          >
            <Egg size={20} color="#5c6bc0" />
            <Text style={styles.actionButtonText}>Egg Log</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('VaccinationSchedule', {
                batchId: batchData.id,
              })
            }
          >
            <Syringe size={20} color="#5c6bc0" />
            <Text style={styles.actionButtonText}>Vaccines</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Mortality', { batchId: batchData.id })}
          >
            <AlertTriangle size={20} color="#5c6bc0" />
            <Text style={styles.actionButtonText}>Mortality</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default Batch;