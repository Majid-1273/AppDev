//SANIA
// src/screens/Mortality.js
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
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
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this mortality log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const docRef = doc(db, 'mortality', id);
              await deleteDoc(docRef);
              Alert.alert('Success', 'Mortality log deleted');
            } catch (error) {
              Alert.alert('Error', 'Error deleting mortality log: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleEditMortality = (log) => {
    setEditingLog(log);
    setDeaths(log.deaths.toString());
    setCauseOfDeath(log.causeOfDeath || '');
    setRemaining(log.remaining.toString());
    setSelectedDate(log.date);
    setEditModalVisible(true);
    setShowMenuId(null); // Close menu when editing
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

    setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditModalVisible(false);
    setEditingLog(null);
    setDeaths('');
    setCauseOfDeath('');
    setRemaining('');
    setSelectedDate(new Date());
  };

  const renderMortalityLog = ({ item }) => (
    <View style={styles.recordItem}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordDate}>
          {item.date.toISOString().split('T')[0]}
        </Text>
        <TouchableOpacity
          onPress={() => setShowMenuId(showMenuId === item.id ? null : item.id)}
          style={styles.menuButton}
        >
          <MaterialIcons name="more-vert" size={24} color="#5c6bc0" />
        </TouchableOpacity>
      </View>

      <View style={styles.recordDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Deaths:</Text>
          <Text style={styles.detailValue}>{item.deaths}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cause:</Text>
          <Text style={styles.detailValue}>{item.causeOfDeath || 'Not specified'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Remaining:</Text>
          <Text style={styles.detailValue}>{item.remaining}</Text>
        </View>
      </View>

      {showMenuId === item.id && (
        <View style={styles.popupMenu}>
          <TouchableOpacity 
            onPress={() => handleEditMortality(item)}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeleteMortality(item.id)}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5c6bc0" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Form Section */}
      <View style={styles.formContainer}>
        <Text style={styles.title}>
          {editingLog ? 'Edit Mortality Log' : 'Add Mortality Log'}
        </Text>
        <Text style={styles.subtitle}>Current Batch Count: {currentBatchCount}</Text>

        <Text style={styles.label}>Mortality Date *</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}
        >
          <Text style={styles.dateButtonText}>
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

        <Text style={styles.label}>Number of Deaths *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter number of deaths" 
          value={deaths} 
          onChangeText={handleDeathsChange} 
          keyboardType="numeric" 
        />

        <Text style={styles.label}>Cause of Death *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={causeOfDeath}
            onValueChange={(itemValue) => setCauseOfDeath(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select cause of death..." value="" />
            {causeOfDeathOptions.map((cause, index) => (
              <Picker.Item key={index} label={cause} value={cause} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Remaining Birds</Text>
        <TextInput 
          style={[styles.input, styles.disabledInput]} 
          placeholder="Remaining birds (auto-calculated)" 
          value={remaining} 
          editable={false}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleAddMortality}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Add Mortality Log</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Records Section */}
      <View style={styles.recordsContainer}>
        <Text style={styles.recordsTitle}>Mortality Logs</Text>
        {mortalityLogs.length === 0 ? (
          <Text style={styles.emptyText}>No mortality logs found</Text>
        ) : (
          <FlatList 
            data={mortalityLogs} 
            keyExtractor={(item) => item.id} 
            renderItem={renderMortalityLog}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Mortality Log</Text>

            <Text style={styles.label}>Mortality Date *</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              <Text style={styles.dateButtonText}>
                {selectedDate.toISOString().split('T')[0]}
              </Text>
              <FontAwesome name="calendar" size={20} color="#666" />
            </TouchableOpacity>
            
            <Text style={styles.label}>Number of Deaths *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter number of deaths"
              value={deaths} 
              onChangeText={setDeaths} 
              keyboardType="numeric" 
            />

            <Text style={styles.label}>Cause of Death *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={causeOfDeath}
                onValueChange={(itemValue) => setCauseOfDeath(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select cause of death..." value="" />
                {causeOfDeathOptions.map((cause, index) => (
                  <Picker.Item key={index} label={cause} value={cause} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Remaining Birds</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter remaining birds"
              value={remaining} 
              onChangeText={setRemaining} 
              keyboardType="numeric" 
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={saveEditedLog}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Log</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Mortality;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  formContainer: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#5c6bc0',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
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
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#5c6bc0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#5c6bc0',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#5c6bc0',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  recordsContainer: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: 'white',
    marginTop: 10,
  },
  recordsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#5c6bc0',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 20,
  },
  recordItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#5c6bc0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    position: 'relative',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recordDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5c6bc0',
  },
  menuButton: {
    padding: 5,
  },
  recordDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
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
    minWidth: 100,
  },
  editButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#5c6bc0',
  },
  modalButtonContainer: {
    marginTop: 20,
    gap: 10,
  },
});