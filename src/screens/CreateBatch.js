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
  const [birdCount, setBirdCount] = useState('');
  const [breed, setBreed] = useState('');
  const [location, setLocation] = useState('');
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

      const normalizedType = batchType.trim().charAt(0).toUpperCase() + batchType.trim().slice(1).toLowerCase();

      await addDoc(collection(db, 'users', user.uid, 'batches'), {
        name: batchName,
        type: normalizedType,
        birds: parseInt(birdCount, 10),
        breed,
        location,
        age: '0 weeks',
        image: 'https://via.placeholder.com/50',
        createdAt: serverTimestamp(),
        startDate: getCurrentDate(),
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

      <Text style={styles.label}>Number of Birds *</Text>
      <TextInput
        style={styles.input}
        value={birdCount}
        onChangeText={setBirdCount}
        placeholder="Enter number of birds"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Breed</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={breed}
          onValueChange={(itemValue) => setBreed(itemValue)}
          enabled={availableBreeds.length > 0}
        >
          <Picker.Item label="Select breed (optional)" value="" />
          {availableBreeds.map((breedOption) => (
            <Picker.Item key={breedOption} label={breedOption} value={breedOption} />
          ))}
        </Picker>
      </View>


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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 6,
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 30,
  },
});

export default CreateBatch;
