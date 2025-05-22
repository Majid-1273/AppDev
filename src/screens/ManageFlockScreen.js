//SANIA
//ManageFlockScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

const ManageFlockScreen = ({ route, navigation }) => {
  const { flockId } = route.params;
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [flock, setFlock] = useState(null);

  // Form states for editable fields
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [breed, setBreed] = useState('');
  const [location, setLocation] = useState('');
  const [birds, setBirds] = useState('');
  const [mortalityToAdd, setMortalityToAdd] = useState('');
  const [feedToAdd, setFeedToAdd] = useState('');

  useEffect(() => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      navigation.goBack();
      return;
    }

    const fetchFlock = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'batches', flockId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFlock(data);
          setName(data.name || '');
          setType(data.type || '');
          setBreed(data.breed || '');
          setLocation(data.location || '');
          setBirds(String(data.birds || '0'));
        } else {
          Alert.alert('Error', 'Flock not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error fetching flock:', error);
        Alert.alert('Error', 'Failed to load flock data');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchFlock();
  }, [flockId]);

  const handleSave = async () => {
    if (!name.trim() || !type.trim() || !breed.trim() || !location.trim()) {
      Alert.alert('Validation', 'Please fill in all fields');
      return;
    }

    if (isNaN(Number(birds)) || Number(birds) < 0) {
      Alert.alert('Validation', 'Bird count must be a non-negative number');
      return;
    }

    if (mortalityToAdd && (isNaN(Number(mortalityToAdd)) || Number(mortalityToAdd) < 0)) {
      Alert.alert('Validation', 'Mortality to add must be a non-negative number');
      return;
    }

    if (feedToAdd && (isNaN(Number(feedToAdd)) || Number(feedToAdd) < 0)) {
      Alert.alert('Validation', 'Feed to add must be a non-negative number');
      return;
    }

    try {
      setLoading(true);
      const docRef = doc(db, 'users', user.uid, 'batches', flockId);

      // Update basic info and birds count
      await updateDoc(docRef, {
        name,
        type,
        breed,
        location,
        birds: Number(birds),
        lastUpdate: serverTimestamp(),
      });

      // If mortality to add exists, increment mortality and subtract birds
      if (mortalityToAdd && Number(mortalityToAdd) > 0) {
        await updateDoc(docRef, {
          mortalityRate: increment(Number(mortalityToAdd)),
          birds: increment(-Number(mortalityToAdd)),
          lastUpdate: serverTimestamp(),
        });
      }
      
      

      // If feed consumption to add exists, increment feedConsumption
      if (feedToAdd && Number(feedToAdd) > 0) {
        await updateDoc(docRef, {
          feedConsumption: increment(Number(feedToAdd)),
          lastUpdate: serverTimestamp(),
        });
      }

      Alert.alert('Success', 'Flock updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating flock:', error);
      Alert.alert('Error', 'Failed to update flock');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#5c6bc0" style={{ marginTop: 50 }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Type</Text>
      <TextInput style={styles.input} value={type} onChangeText={setType} />

      <Text style={styles.label}>Breed</Text>
      <TextInput style={styles.input} value={breed} onChangeText={setBreed} />

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} />

      <Text style={styles.label}>Bird Count</Text>
      <TextInput
        style={styles.input}
        value={birds}
        onChangeText={setBirds}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Add Mortality (Deaths)</Text>
      <TextInput
        style={styles.input}
        value={mortalityToAdd}
        onChangeText={setMortalityToAdd}
        keyboardType="numeric"
        placeholder="0"
      />

      <Text style={styles.label}>Add Feed Consumption (kg)</Text>
      <TextInput
        style={styles.input}
        value={feedToAdd}
        onChangeText={setFeedToAdd}
        keyboardType="numeric"
        placeholder="0"
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ManageFlockScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#5c6bc0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
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
});
