//SANIA
// src/screens/Mortality.js
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  where,
  getDoc,
} from 'firebase/firestore';

import { db, auth } from '../../firebaseConfig';

const Mortality = ({ route, navigation }) => {
  const { batchId } = route.params;
  const [mortalityLogs, setMortalityLogs] = useState([]);
  const [deaths, setDeaths] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [remaining, setRemaining] = useState('');
  const [currentBatchCount, setCurrentBatchCount] = useState(0);
  const [editingLog, setEditingLog] = useState(null);
  const [showMenuId, setShowMenuId] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [batchPlacementDate, setBatchPlacementDate] = useState(null);
  const [loading, setLoading] = useState(false);

  // Predefined causes of death options
  const causeOfDeathOptions = [
    'Disease',
    'Predator Attack',
    'Natural Death',
    'Accident',
    'Heat Stress',
    'Cold Stress',
    'Nutritional Deficiency',
    'Other'
  ];

  // Get batch placement date and current count for validation
  const fetchBatchDetails = useCallback(async () => {
    try {
      const batchDoc = await getDoc(doc(db, 'batches', batchId));
      if (batchDoc.exists()) {
        const batchData = batchDoc.data();
        setBatchPlacementDate(batchData.placementDate?.toDate());
        setCurrentBatchCount(batchData.currentCount || 0);
      }
    } catch (error) {
      console.error('Error fetching batch details:', error);
    }
  }, [batchId]);

  useFocusEffect(
    useCallback(() => {
      fetchBatchDetails();

      // Query mortality collection with batchId filter
      const mortalityRef = collection(db, 'mortality');
      const q = query(
        mortalityRef, 
        where('batchId', '==', batchId),
        orderBy('date', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamp to Date if needed
          date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
        }));
        setMortalityLogs(logs);
      });

      return () => unsubscribe();
    }, [batchId, fetchBatchDetails])
  );

  // Calculate remaining birds automatically when deaths change
  const handleDeathsChange = (deathsText) => {
    setDeaths(deathsText);
    const deathsCount = parseInt(deathsText, 10);
    if (!isNaN(deathsCount) && deathsCount >= 0) {
      const newRemaining = Math.max(0, currentBatchCount - deathsCount);
      setRemaining(newRemaining.toString());
    } else {
      setRemaining('');
    }
  };

  // Validate date - must be today or future, and after placement date
  const validateDate = (dateToValidate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDateOnly = new Date(dateToValidate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    // Check if date is in the past
    if (selectedDateOnly < today) {
      Alert.alert('Invalid Date', 'Date cannot be in the past');
      return false;
    }
    
    // Check if date is before placement date
    if (batchPlacementDate) {
      const placementDateOnly = new Date(batchPlacementDate);
      placementDateOnly.setHours(0, 0, 0, 0);
      
      if (selectedDateOnly < placementDateOnly) {
        Alert.alert('Invalid Date', 'Date cannot be before batch placement date');
        return false;
      }
    }
    
    return true;
  };

  // Check for duplicate date entries
  const checkDuplicateDate = (dateToCheck, excludeId = null) => {
    const dateString = dateToCheck.toISOString().split('T')[0];
    return mortalityLogs.some(log => {
      if (excludeId && log.id === excludeId) return false;
      const logDateString = log.date.toISOString().split('T')[0];
      return logDateString === dateString;
    });
  };

  const handleAddMortality = async () => {
    if (!deaths.trim() || !causeOfDeath.trim() || !selectedDate) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const deathsCount = parseInt(deaths, 10);

    if (isNaN(deathsCount) || deathsCount < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of deaths');
      return;
    }

    if (deathsCount > currentBatchCount) {
      Alert.alert('Invalid Input', `Number of deaths cannot exceed current batch count (${currentBatchCount})`);
      return;
    }

    if (!validateDate(selectedDate)) {
      return;
    }

    if (checkDuplicateDate(selectedDate)) {
      Alert.alert('Duplicate Entry', 'Mortality log for this date already exists');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const remainingCount = parseInt(remaining, 10);

      // Reference to the new flat 'mortality' collection
      const mortalityRef = collection(db, 'mortality');

      await addDoc(mortalityRef, {
        batchId,
        date: selectedDate,
        deaths: deathsCount,
        causeOfDeath: causeOfDeath,
        remaining: remainingCount,
        createdAt: serverTimestamp(),
      });

      // Update batch current count
      const batchRef = doc(db, 'batches', batchId);
      await updateDoc(batchRef, {
        currentCount: remainingCount
      });

      // Reset form
      setDeaths('');
      setCauseOfDeath('');
      setRemaining('');
      setSelectedDate(new Date());
      
      Alert.alert('Success', 'Mortality log added successfully');
    } catch (error) {
      console.error('Error adding mortality:', error);
      Alert.alert('Error', 'Error adding mortality log: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMortality = async (id) => {
    try {
      const docRef = doc(db, 'mortality', id);
      await deleteDoc(docRef);
      Alert.alert('Success', 'Mortality log deleted');
    } catch (error) {
      Alert.alert('Error', 'Error deleting mortality log: ' + error.message);
    }
  };

  const handleEditMortality = (log) => {
    setEditingLog(log);
    setDeaths(log.deaths.toString());
    setCauseOfDeath(log.causeOfDeath || '');
    setRemaining(log.remaining.toString());
    setSelectedDate(log.date);
    setEditModalVisible(true);
  };

  const saveEditedLog = async () => {
    if (!deaths.trim() || !causeOfDeath.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const deathsCount = parseInt(deaths, 10);
    const remainingCount = parseInt(remaining, 10);

    if (isNaN(deathsCount) || deathsCount < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of deaths');
      return;
    }

    if (isNaN(remainingCount) || remainingCount < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of remaining birds');
      return;
    }

    if (!validateDate(selectedDate)) {
      return;
    }

    if (checkDuplicateDate(selectedDate, editingLog.id)) {
      Alert.alert('Duplicate Entry', 'Mortality log for this date already exists');
      return;
    }

    try {
      const docRef = doc(db, 'mortality', editingLog.id);
      await updateDoc(docRef, {
        date: selectedDate,
        deaths: deathsCount,
        causeOfDeath: causeOfDeath,
        remaining: remainingCount,
      });

      setEditModalVisible(false);
      setEditingLog(null);
      setDeaths('');
      setCauseOfDeath('');
      setRemaining('');
      setSelectedDate(new Date());
      
      Alert.alert('Success', 'Mortality log updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Error updating log: ' + error.message);
    }
  };

  const renderMortalityLog = ({ item }) => (
    <View style={styles.logItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.logText}>Date: {item.date.toISOString().split('T')[0]}</Text>
        <Text style={styles.logText}>Deaths: {item.deaths}</Text>
        <Text style={styles.logText}>Cause: {item.causeOfDeath || 'Not specified'}</Text>
        <Text style={styles.logText}>Remaining: {item.remaining}</Text>
      </View>

      <TouchableOpacity
        onPress={() => setShowMenuId(showMenuId === item.id ? null : item.id)}
        style={{ padding: 5 }}
      >
        <MaterialIcons name="more-vert" size={24} color="black" />
      </TouchableOpacity>

      {showMenuId === item.id && (
        <View style={styles.popupMenu}>
          <TouchableOpacity onPress={() => handleEditMortality(item)}>
            <Text style={styles.popupItem}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteMortality(item.id)}>
            <Text style={[styles.popupItem, { color: 'red' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#5c6bc0" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Mortality Log</Text>
      <Text style={styles.subtitle}>Current Batch Count: {currentBatchCount}</Text>

      <View style={styles.dateInputContainer}>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.dateInputTouchable}
        >
          <Text style={styles.dateText}>
            {selectedDate.toISOString().split('T')[0]}
          </Text>
          <FontAwesome name="calendar" size={20} color="#666" />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            minimumDate={new Date()} // Prevent past dates
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (event.type === 'set' && date) {
                setSelectedDate(date);
              }
            }}
          />
        )}
      </View>

      <TextInput 
        style={styles.input} 
        placeholder="Number of Deaths" 
        value={deaths} 
        onChangeText={handleDeathsChange} 
        keyboardType="numeric" 
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={causeOfDeath}
          onValueChange={(itemValue) => setCauseOfDeath(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Cause of Death" value="" />
          {causeOfDeathOptions.map((cause, index) => (
            <Picker.Item key={index} label={cause} value={cause} />
          ))}
        </Picker>
      </View>

      <TextInput 
        style={[styles.input, styles.disabledInput]} 
        placeholder="Remaining Birds (Auto-calculated)" 
        value={remaining} 
        editable={false}
      />

      <Button 
        title={editingLog ? 'Save Changes' : 'Add Mortality Log'} 
        onPress={editingLog ? saveEditedLog : handleAddMortality} 
      />

      <Text style={styles.title}>Mortality Logs</Text>
      <FlatList 
        data={mortalityLogs} 
        keyExtractor={(item) => item.id} 
        renderItem={renderMortalityLog} 
        ListEmptyComponent={<Text>No mortality logs yet.</Text>} 
      />

      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Edit Mortality Log</Text>

            <View style={styles.dateInputContainer}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.dateInputTouchable}
              >
                <Text style={styles.dateText}>
                  {selectedDate.toISOString().split('T')[0]}
                </Text>
                <FontAwesome name="calendar" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TextInput 
              style={styles.input} 
              placeholder="Number of Deaths"
              value={deaths} 
              onChangeText={setDeaths} 
              keyboardType="numeric" 
            />

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={causeOfDeath}
                onValueChange={(itemValue) => setCauseOfDeath(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select Cause of Death" value="" />
                {causeOfDeathOptions.map((cause, index) => (
                  <Picker.Item key={index} label={cause} value={cause} />
                ))}
              </Picker>
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="Remaining Birds"
              value={remaining} 
              onChangeText={setRemaining} 
              keyboardType="numeric" 
            />

            <Button title="Save" onPress={saveEditedLog} />
            <Button title="Cancel" onPress={() => setEditModalVisible(false)} color="gray" />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Mortality;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderRadius: 5,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  pickerContainer: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
  picker: {
    height: 50,
  },
  logItem: {
    backgroundColor: '#f1f1f1',
    padding: 15,
    borderRadius: 5,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  logText: {
    fontSize: 16,
  },
  popupMenu: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    zIndex: 1,
    elevation: 5,
    padding: 5,
  },
  popupItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  dateInputContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  dateInputTouchable: {
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
});