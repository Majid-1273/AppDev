//CreateBatch.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CreateBatch = ({ navigation }) => {
  const [batchName, setBatchName] = useState('');
  const [batchType, setBatchType] = useState('');
  const [birdCount, setBirdCount] = useState('');
  const [breed, setBreed] = useState('');
  const [location, setLocation] = useState('');

  const getCurrentDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const handleCreateBatch = async () => {
    if (!batchName || !batchType || !birdCount) {
      Alert.alert('Please fill in all required fields');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      await addDoc(collection(db, 'users', user.uid, 'batches'), {
        name: batchName,
        type: batchType,
        birds: parseInt(birdCount, 10),
        breed,
        location,
        age: '0 weeks',
        image: 'https://via.placeholder.com/50',
        createdAt: serverTimestamp(),
        startDate: getCurrentDate(), // Add human-readable date
      });

      Alert.alert('Batch created successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error creating batch', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Batch Name *</Text>
      <TextInput
        style={styles.input}
        value={batchName}
        onChangeText={setBatchName}
        placeholder="Enter batch name"
      />

      <Text style={styles.label}>Batch Type *</Text>
      <TextInput
        style={styles.input}
        value={batchType}
        onChangeText={setBatchType}
        placeholder="e.g., Layer, Broiler"
      />

      <Text style={styles.label}>Number of Birds *</Text>
      <TextInput
        style={styles.input}
        value={birdCount}
        onChangeText={setBirdCount}
        placeholder="Enter number of birds"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Breed</Text>
      <TextInput
        style={styles.input}
        value={breed}
        onChangeText={setBreed}
        placeholder="Enter breed (optional)"
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Enter location (optional)"
      />

      <View style={styles.buttonContainer}>
        <Button title="Create Batch" onPress={handleCreateBatch} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  label: {
    marginTop: 15,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    padding: 10,
    borderRadius: 6,
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 30,
  },
});

export default CreateBatch;
