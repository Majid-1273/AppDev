//Flocks.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import styles from '../../styles';

const Flocks = ({ navigation, flocks }) => {
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState('All');
  const [filteredFlocks, setFilteredFlocks] = useState(flocks);

  useEffect(() => {
    let updated = flocks;

    if (filter !== 'All') {
      updated = updated.filter(f => f.type.toLowerCase() === filter.toLowerCase());
    }

    if (searchText.trim() !== '') {
      updated = updated.filter(f => f.name.toLowerCase().includes(searchText.toLowerCase()));
    }

    setFilteredFlocks(updated);
  }, [filter, searchText, flocks]);

  return (
    <View style={styles.flocksContainer}>
      <Text style={styles.screenTitle}>My Flocks</Text>

      <View style={styles.searchBarContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search flocks..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.filterContainer}>
        {['All', 'Layers', 'Broilers', 'Other'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterButton, filter === type ? styles.activeFilter : null]}
            onPress={() => setFilter(type)}
          >
            <Text style={filter === type ? styles.activeFilterText : styles.filterText}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.flockList}>
        {filteredFlocks.length > 0 ? (
          filteredFlocks.map((flock) => (
            <TouchableOpacity
              key={flock.id}
              style={styles.flockItem}
              onPress={() => navigation.navigate('FlockDetails', { 
                flockId: flock.id,
                flockName: flock.name
              })}
            >
              <Image source={{ uri: flock.image }} style={styles.flocksImage} />
              <View style={styles.flockInfo}>
                <Text style={styles.flocksName}>{flock.name}</Text>
                <Text style={styles.flockDetails}>
                  {flock.type} • {flock.birds} birds
                </Text>
                <Text style={styles.flockAge}>Age: {flock.age}</Text>
              </View>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: '#4caf50' }]} />
                <Text style={styles.statusText}>Healthy</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ padding: 20, color: '#999', textAlign: 'center' }}>No flocks found.</Text>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('CreateBatch')}
      >
        <Text style={styles.addButtonText}>+ Add New Flock</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Flocks;
