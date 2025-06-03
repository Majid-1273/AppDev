//SANIA
//ManageBatchScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const ManageBatchScreen = ({ route, navigation }) => {
  const { batchId } = route.params;
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState(null);

  // Form states - only name and currentCount are editable
  const [name, setName] = useState('');
  const [currentCount, setCurrentCount] = useState('');
  
  // Store original values for validation
  const [originalCurrentCount, setOriginalCurrentCount] = useState(0);
  const [originalInitialCount, setOriginalInitialCount] = useState(0);

  useEffect(() => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      navigation.goBack();
      return;
    }

    const fetchBatch = async () => {
      try {
        const docRef = doc(db, 'batches', batchId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setBatch(data);
          setName(data.name || '');
          setCurrentCount(String(data.currentCount || '0'));
          setOriginalCurrentCount(data.currentCount || 0);
          setOriginalInitialCount(data.initialCount || 0);
        } else {
          Alert.alert('Error', 'Batch not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error fetching batch:', error);
        Alert.alert('Error', 'Failed to load batch data');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
  }, [batchId]);

  const handleCurrentCountChange = (value) => {
    const numValue = Number(value);
    
    // Only allow numbers
    if (value === '' || !isNaN(numValue)) {
      setCurrentCount(value);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a batch name');
      return;
    }

    const newCurrentCount = Number(currentCount);
    
    if (isNaN(newCurrentCount) || newCurrentCount < 0) {
      Alert.alert('Validation', 'Current count must be a valid non-negative number');
      return;
    }

    // Check if user is trying to decrease the current count
    if (newCurrentCount < originalCurrentCount) {
      Alert.alert(
        'Invalid Operation', 
        `Current count cannot be decreased. Current count is ${originalCurrentCount}, you cannot set it to ${newCurrentCount}.`
      );
      return;
    }

    try {
      setLoading(true);
      const docRef = doc(db, 'batches', batchId);

      // Calculate new initial count if current count increased
      let newInitialCount = originalInitialCount;
      if (newCurrentCount > originalCurrentCount) {
        const increase = newCurrentCount - originalCurrentCount;
        newInitialCount = originalInitialCount + increase;
      }

      // Update batch with only editable fields
      await updateDoc(docRef, {
        name: name.trim(),
        currentCount: newCurrentCount,
        initialCount: newInitialCount,
        lastUpdate: serverTimestamp(),
      });

      Alert.alert('Success', 'Batch updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating batch:', error);
      Alert.alert('Error', 'Failed to update batch');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#5c6bc0" style={{ marginTop: 50 }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Manage Batch</Text>
      
      <Text style={styles.label}>Batch Name *</Text>
      <TextInput 
        style={styles.input} 
        value={name} 
        onChangeText={setName}
        placeholder="Enter batch name"
      />

      <Text style={styles.label}>Current Count *</Text>
      <TextInput
        style={styles.input}
        value={currentCount}
        onChangeText={handleCurrentCountChange}
        keyboardType="numeric"
        placeholder="Current live birds"
      />
      <Text style={styles.helperText}>
        Note: You can only increase the count (from {originalCurrentCount})
      </Text>

      {/* Display read-only info */}
      <View style={styles.readOnlySection}>
        <Text style={styles.sectionTitle}>Batch Information</Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Type:</Text>
          <Text style={styles.infoValue}>{batch?.type || 'Not set'}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Breed:</Text>
          <Text style={styles.infoValue}>{batch?.breed || 'Not set'}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Original Initial Count:</Text>
          <Text style={styles.infoValue}>{originalInitialCount}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Current Initial Count:</Text>
          <Text style={styles.infoValue}>
            {Number(currentCount) > originalCurrentCount 
              ? originalInitialCount + (Number(currentCount) - originalCurrentCount)
              : originalInitialCount
            }
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Price:</Text>
          <Text style={styles.infoValue}>{batch?.price || 0}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Placement Date:</Text>
          <Text style={styles.infoValue}>
            {batch?.placementDate ? 
              new Date(batch.placementDate.seconds * 1000).toLocaleDateString() : 
              'Not set'
            }
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Mortality:</Text>
          <Text style={styles.infoValue}>
            {(Number(currentCount) > originalCurrentCount 
              ? originalInitialCount + (Number(currentCount) - originalCurrentCount)
              : originalInitialCount
            ) - Number(currentCount)} birds
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>

      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Feed', { batchId })}
        >
          <Text style={styles.navButtonText}>Manage Feed</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Mortality', { batchId })}
        >
          <Text style={styles.navButtonText}>Manage Mortality</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('EggProduction', { batchId })}
        >
          <Text style={styles.navButtonText}>Egg Production</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Vaccination', { batchId })}
        >
          <Text style={styles.navButtonText}>Vaccination</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ManageBatchScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#5c6bc0',
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#5c6bc0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  readOnlySection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5c6bc0',
    marginBottom: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#5c6bc0',
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
  navigationContainer: {
    marginTop: 30,
    borderTopWidth: 2,
    borderTopColor: '#eee',
    paddingTop: 20,
  },
  navButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#5c6bc0',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  navButtonText: {
    color: '#5c6bc0',
    fontWeight: '600',
    fontSize: 16,
  },
});