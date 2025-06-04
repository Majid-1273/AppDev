//SANIA
//CreateBatch.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CreateBatch = ({ navigation }) => {
  const [batchName, setBatchName] = useState('');
  const [batchType, setBatchType] = useState('');
  const [initialCount, setInitialCount] = useState('');
  const [breed, setBreed] = useState('');
  const [price, setPrice] = useState('');
  const [availableBreeds, setAvailableBreeds] = useState([]);

  const breedOptions = {
    Broiler: ['Cobb 500', 'Ross 308', 'Arbor Acres'],
    Layer: ['Hy-Line Brown', 'Lohmann White', 'ISA Brown'],
    Other: ['Mixed Breed', 'Unknown'],
  };

  const handleBatchTypeChange = (selectedType) => {
    setBatchType(selectedType);
    setBreed(''); // Reset breed
    if (selectedType && breedOptions[selectedType]) {
      setAvailableBreeds(breedOptions[selectedType]);
    } else {
      setAvailableBreeds([]);
    }
  };

  const handleCreateBatch = async () => {
    // Validate all required fields
    if (!batchName.trim()) {
      Alert.alert('Validation Error', 'Please enter a batch name');
      return;
    }
    
    if (!batchType) {
      Alert.alert('Validation Error', 'Please select a batch type');
      return;
    }
    
    if (!initialCount || parseInt(initialCount, 10) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid number of birds');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid purchase price');
      return;
    }

    if (!breed) {
      Alert.alert('Validation Error', 'Please select a breed');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const normalizedType = batchType.trim().charAt(0).toUpperCase() + batchType.trim().slice(1).toLowerCase();
      const birdCount = parseInt(initialCount, 10);
      const batchPrice = parseFloat(price);

      // Create batch document with new structure
      const batchData = {
        name: batchName.trim(),
        type: normalizedType,
        initialCount: birdCount,
        currentCount: birdCount, // Initially same as initial count
        breed: breed,
        price: batchPrice,
        placementDate: serverTimestamp(), // Auto-set placement date
        userId: user.uid, // Reference to user
        // Optional fields for compatibility
        image: 'https://via.placeholder.com/150',
        healthStatus: 'Healthy',
        lastUpdate: serverTimestamp(),
      };

      // Add to the batches collection (not nested under users)
      await addDoc(collection(db, 'batches'), batchData);

      Alert.alert('Success', 'Batch created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating batch:', error);
      Alert.alert('Error', 'Failed to create batch: ' + error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create New Batch</Text>
      
      <Text style={styles.label}>Batch Name *</Text>
      <TextInput
        style={styles.input}
        value={batchName}
        onChangeText={setBatchName}
        placeholder="Enter batch name"
        maxLength={50}
      />

      <Text style={styles.label}>Batch Type *</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={batchType}
          onValueChange={handleBatchTypeChange}
        >
          <Picker.Item label="Select type" value="" />
          <Picker.Item label="Layer" value="Layer" />
          <Picker.Item label="Broiler" value="Broiler" />
          <Picker.Item label="Other" value="Other" />
        </Picker>
      </View>

      <Text style={styles.label}>Initial Number of Birds *</Text>
      <TextInput
        style={styles.input}
        value={initialCount}
        onChangeText={setInitialCount}
        placeholder="Enter initial number of birds"
        keyboardType="numeric"
        maxLength={6}
      />

      <Text style={styles.label}>Purchase Price *</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        placeholder="Enter total purchase price"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Breed *</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={breed}
          onValueChange={(itemValue) => setBreed(itemValue)}
          enabled={availableBreeds.length > 0}
        >
          <Picker.Item label="Select breed" value="" />
          {availableBreeds.map((breedOption) => (
            <Picker.Item key={breedOption} label={breedOption} value={breedOption} />
          ))}
        </Picker>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Create Batch" onPress={handleCreateBatch} color="#5c6bc0" />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Cancel" 
          onPress={() => navigation.goBack()} 
          color="#666"
        />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    marginTop: 15,
    fontWeight: '600',
    color: '#333',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: '#fafafa',
  },
  buttonContainer: {
    marginTop: 15,
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default CreateBatch;