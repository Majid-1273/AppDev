//SANIA
//Flocks.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Search } from 'lucide-react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Trash2 } from 'lucide-react-native';
import { db, auth } from '../../firebaseConfig';
import { doc, deleteDoc } from 'firebase/firestore';
import styles from '../../styles';

const Flocks = ({ navigation, flocks }) => {
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState('All');
  const [filteredFlocks, setFilteredFlocks] = useState(flocks);

  useEffect(() => {
    let updated = flocks;

    if (filter !== 'All') {
      updated = updated.filter(
        (f) => f.type.toLowerCase() === filter.toLowerCase()
      );
    }

    if (searchText.trim() !== '') {
      updated = updated.filter((f) =>
        f.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredFlocks(updated);
  }, [filter, searchText, flocks]);

  const handleDeleteBatch = (batchId) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this batch?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', user.uid, 'batches', batchId));
              Alert.alert('Batch deleted');
              setFilteredFlocks((prev) =>
                prev.filter((batch) => batch.id !== batchId)
              );
            } catch (error) {
              Alert.alert('Error deleting batch', error.message);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.flockItem}
      onPress={() =>
        navigation.navigate('FlockDetails', {
          flockId: item.id,
          flockName: item.name,
        })
      }
    >
      <Image source={{ uri: item.image }} style={styles.flocksImage} />
      <View style={styles.flockInfo}>
        <Text style={styles.flocksName}>{item.name}</Text>
        <Text style={styles.flockDetails}>
          {item.type} • {item.birds} birds
        </Text>
        <Text style={styles.flockAge}>Age: {item.age}</Text>
      </View>
      <View style={styles.statusIndicator}>
        <View style={[styles.statusDot, { backgroundColor: '#4caf50' }]} />
        <Text style={styles.statusText}>Healthy</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHiddenItem = ({ item }) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteBatch(item.id)}
      >
        <Trash2 color="white" size={24} />
      </TouchableOpacity>
    </View>
  );

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
        {['All', 'Layer', 'Broiler', 'Other'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              filter === type ? styles.activeFilter : null,
            ]}
            onPress={() => setFilter(type)}
          >
            <Text
              style={filter === type ? styles.activeFilterText : styles.filterText}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredFlocks.length > 0 ? (
        <SwipeListView
          data={filteredFlocks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-75}
          disableRightSwipe
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : (
        <Text style={{ padding: 20, color: '#999', textAlign: 'center' }}>
          No flocks found.
        </Text>
      )}

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
