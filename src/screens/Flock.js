import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Calendar, Droplet, AlertTriangle, BarChart2, Users, Clock, Wind } from 'lucide-react-native';
import styles from '../../styles';

const Flock = ({ route, navigation }) => {
  const { flockId, flockName } = route.params;
  
  // Mock data for the selected flock
  const flockData = {
    id: flockId,
    name: flockName,
    type: 'Layer',
    breed: 'Rhode Island Red',
    birds: 150,
    ageWeeks: 32,
    location: 'Barn 2',
    startDate: '2024-10-15',
    healthStatus: 'Healthy',
    lastUpdate: '2025-05-12',
    houseTempC: 23,
    humidity: 65,
    feedConsumption: '18kg',
    waterConsumption: '32L',
    eggProduction: 138,
    mortalityRate: '0.5%',
    image: 'https://via.placeholder.com/150',
  };

  return (
    <ScrollView style={styles.flockContainer}>
      <View style={styles.headerSection}>
        <Image 
          source={{ uri: flockData.image }}
          style={styles.flockImage}
        />
        <View style={styles.flockHeaderInfo}>
          <Text style={styles.flockName}>{flockData.name}</Text>
          <Text style={styles.flockType}>{flockData.type} • {flockData.breed}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Users size={16} color="#5c6bc0" />
              <Text style={styles.statText}>{flockData.birds} birds</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={16} color="#5c6bc0" />
              <Text style={styles.statText}>{flockData.ageWeeks} weeks</Text>
            </View>
          </View>
          <View style={styles.badgeContainer}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{flockData.healthStatus}</Text>
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
          onPress={() => navigation.navigate('FlockTabs', { 
            flockId: flockData.id,
            flockName: flockData.name
          })}
        >
          <Text style={styles.managementButtonText}>Manage Flock</Text>
        </TouchableOpacity>
        
        <View style={styles.actionButtonsRow}>
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