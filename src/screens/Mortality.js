//SANIA
// src/screens/Mortality.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput,StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { doc, updateDoc, arrayUnion, getDoc, increment } from 'firebase/firestore';

const Mortality = ({ route, navigation }) => {
  const { flockId } = route.params;

  const [deaths, setDeaths] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMortality = async () => {
    const deathsCount = parseInt(deaths, 10);

    if (isNaN(deathsCount) || deathsCount <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of deaths.');
      return;
    }
    if (reason.trim() === '') {
      Alert.alert('Invalid Input', 'Please enter a reason for mortality.');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const batchDocRef = doc(db, 'users', user.uid, 'batches', flockId);
      const batchDocSnap = await getDoc(batchDocRef);

      if (!batchDocSnap.exists()) {
        Alert.alert('Error', 'Flock not found');
        setLoading(false);
        return;
      }

      const batchData = batchDocSnap.data();
      const currentBirds = batchData.birds || 0;
      const currentMortality = batchData.mortalityRate || 0;

      if (deathsCount > currentBirds) {
        Alert.alert('Error', 'Deaths cannot be more than the total birds in the flock');
        setLoading(false);
        return;
      }

      // Update batch document: subtract birds, add to mortalityRate
      await updateDoc(batchDocRef, {
        birds: currentBirds - deathsCount,
        mortalityRate: currentMortality + deathsCount,
        lastUpdate: new Date(),
        mortalityLogs: arrayUnion({
          deaths: deathsCount,
          reason: reason.trim(),
          timestamp: new Date(),
        }),
      });

      Alert.alert('Success', 'Mortality data added successfully');
      setDeaths('');
      setReason('');
      navigation.goBack();

    } catch (error) {
      console.error('Error updating mortality:', error);
      Alert.alert('Error', 'Could not update mortality data. Please try again.');
    }

    setLoading(false);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#5c6bc0" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Add Mortality</Text>

      <TextInput
        placeholder="Number of Deaths"
        keyboardType="numeric"
        value={deaths}
        onChangeText={setDeaths}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Reason for Mortality"
        value={reason}
        onChangeText={setReason}
        multiline
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
          height: 80,
          textAlignVertical: 'top',
        }}
      />

      <TouchableOpacity
        onPress={handleAddMortality}
        style={{
          backgroundColor: '#5c6bc0',
          padding: 15,
          borderRadius: 5,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16 }}>Add Mortality</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Mortality;


const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: '600', marginVertical: 10 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#5c6bc0',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});
