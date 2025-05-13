import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import styles from '../../styles';

const Flocks = ({ navigation }) => {
  // Mock data for flocks
  const flocks = [
    { id: 1, name: 'Layer Flock A', type: 'Layer', birds: 150, age: '32 weeks', image: 'https://via.placeholder.com/50' },
    { id: 2, name: 'Broiler Flock B', type: 'Broiler', birds: 200, age: '5 weeks', image: 'https://via.placeholder.com/50' },
    { id: 3, name: 'Layer Flock C', type: 'Layer', birds: 125, age: '45 weeks', image: 'https://via.placeholder.com/50' },
    { id: 4, name: 'Heritage Breed', type: 'Mixed', birds: 50, age: '28 weeks', image: 'https://via.placeholder.com/50' },
    { id: 5, name: 'Turkey Flock', type: 'Turkey', birds: 75, age: '15 weeks', image: 'https://via.placeholder.com/50' },
  ];

  return (
    <View style={styles.flocksContainer}>
      <Text style={styles.screenTitle}>My Flocks</Text>
      
      <View style={styles.searchBarContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search flocks..."
          placeholderTextColor="#999"
        />
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity style={[styles.filterButton, styles.activeFilter]}>
          <Text style={styles.activeFilterText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Layers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Broilers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Other</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.flockList}>
        {flocks.map((flock) => (
          <TouchableOpacity 
            key={flock.id} 
            style={styles.flockItem}
            onPress={() => navigation.navigate('FlockDetails', { 
              flockId: flock.id,
              flockName: flock.name
            })}
          >
            <Image
              source={{ uri: flock.image }}
              style={styles.flocksImage}
            />
            <View style={styles.flockInfo}>
              <Text style={styles.flocksName}>{flock.name}</Text>
              <Text style={styles.flockDetails}>{flock.type} • {flock.birds} birds</Text>
              <Text style={styles.flockAge}>Age: {flock.age}</Text>
            </View>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: '#4caf50' }]} />
              <Text style={styles.statusText}>Healthy</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Add New Flock</Text>
      </TouchableOpacity>
    </View>
  );
};


 


export default Flocks;