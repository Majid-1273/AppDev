import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, auth } from '../../firebaseConfig';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  getDoc,
  Timestamp,
} from 'firebase/firestore';

const Vaccination = ({ route, navigation }) => {
  const { batchId } = route.params;
  const user = auth.currentUser;

  const [loading, setLoading] = useState(false);
  const [vaccinations, setVaccinations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [batchPlacementDate, setBatchPlacementDate] = useState(null);

  // Form states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vaccinationType, setVaccinationType] = useState('');
  const [price, setPrice] = useState('');
  const [done, setDone] = useState(false);

  // Vaccination types
  const vaccinationTypes = [
    'Newcastle Disease',
    'Infectious Bronchitis',
    'Marek Disease',
    'Infectious Bursal Disease',
    'Fowl Pox',
    'Avian Influenza',
    'Salmonella',
    'Other',
  ];

  useEffect(() => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      navigation.goBack();
      return;
    }

    // Fetch batch placement date for validation
    const fetchBatchData = async () => {
      try {
        const batchDoc = await getDoc(doc(db, 'batches', batchId));
        if (batchDoc.exists()) {
          const batchData = batchDoc.data();
          setBatchPlacementDate(batchData.placementDate);
        }
      } catch (error) {
        console.error('Error fetching batch data:', error);
      }
    };

    fetchBatchData();

    // Query vaccination collection filtered by batchId
    const vaccinationQuery = query(
      collection(db, 'vaccination'),
      where('batchId', '==', batchId)
    );

    const unsubscribe = onSnapshot(vaccinationQuery, (snapshot) => {
      const fetchedVaccinations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    fetchedVaccinations.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.seconds - a.date.seconds;
  });
      setVaccinations(fetchedVaccinations);
    });

    return unsubscribe;
  }, [batchId, user]);

  const validateForm = () => {
    if (!vaccinationType) {
      Alert.alert('Validation Error', 'Please select a vaccination type');
      return false;
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert('Validation Error', 'Price must be a valid non-negative number');
      return false;
    }

    // Check if date is not before placement date
    if (batchPlacementDate) {
      const placementDateObj = new Date(batchPlacementDate.seconds * 1000);
      const selectedDateObj = new Date(selectedDate);
      
      // Reset time to compare only dates
      placementDateObj.setHours(0, 0, 0, 0);
      selectedDateObj.setHours(0, 0, 0, 0);

      if (selectedDateObj < placementDateObj) {
        Alert.alert(
          'Validation Error',
          'Vaccination date cannot be before the batch placement date'
        );
        return false;
      }
    }

    // Check for duplicate dates (excluding current editing record)
    const dateString = selectedDate.toDateString();
    const duplicateDate = vaccinations.find(
      vaccination => 
        vaccination.id !== editingId &&
        new Date(vaccination.date.seconds * 1000).toDateString() === dateString
    );

    if (duplicateDate) {
      Alert.alert('Validation Error', 'A vaccination record already exists for this date');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      if (editingId) {
        // Update existing record - DON'T include createdAt
        const existingVaccination = vaccinations.find(v => v.id === editingId);
        const updateData = {
          batchId,
          date: Timestamp.fromDate(selectedDate),
          type: vaccinationType,
          price: Number(price),
          done: done,
          reminderCount: existingVaccination?.reminderCount || 0, // Preserve existing reminder count
          updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, 'vaccination', editingId), updateData);
        Alert.alert('Success', 'Vaccination record updated successfully');
        setEditingId(null);
      } else {
        // Add new record - INCLUDE createdAt
        const newVaccinationData = {
          batchId,
          date: Timestamp.fromDate(selectedDate),
          type: vaccinationType,
          price: Number(price),
          done: done,
          reminderCount: 0, // Initialize reminder count
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'vaccination'), newVaccinationData);
        Alert.alert('Success', 'Vaccination record added successfully');
      }

      // Reset form
      setSelectedDate(new Date());
      setVaccinationType('');
      setPrice('');
      setDone(false);
    } catch (error) {
      console.error('Error saving vaccination:', error);
      Alert.alert('Error', 'Failed to save vaccination record');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setSelectedDate(new Date(item.date.seconds * 1000));
    setVaccinationType(item.type);
    setPrice(String(item.price));
    setDone(item.done);
    setEditingId(item.id);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this vaccination record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'vaccination', id));
              Alert.alert('Success', 'Vaccination record deleted successfully');
            } catch (error) {
              console.error('Error deleting vaccination:', error);
              Alert.alert('Error', 'Failed to delete vaccination record');
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setSelectedDate(new Date());
    setVaccinationType('');
    setPrice('');
    setDone(false);
    setEditingId(null);
  };

  const toggleDone = async (id, currentDone) => {
    try {
      await updateDoc(doc(db, 'vaccination', id), {
        done: !currentDone,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating vaccination status:', error);
      Alert.alert('Error', 'Failed to update vaccination status');
    }
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const renderVaccinationItem = ({ item }) => (
    <View style={styles.recordItem}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordDate}>
          {new Date(item.date.seconds * 1000).toLocaleDateString()}
        </Text>
        <View style={styles.recordActions}>
          <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.recordDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{item.type}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price:</Text>
          <Text style={styles.detailValue}>${item.price}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <TouchableOpacity
            style={[styles.statusButton, item.done ? styles.doneButton : styles.pendingButton]}
            onPress={() => toggleDone(item.id, item.done)}
          >
            <Text style={styles.statusButtonText}>
              {item.done ? 'Completed' : 'Pending'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reminders Sent:</Text>
          <Text style={styles.detailValue}>{item.reminderCount || 0}/3</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Form Section */}
      <View style={styles.formContainer}>
        <Text style={styles.title}>
          {editingId ? 'Edit Vaccination' : 'Add Vaccination'}
        </Text>

        <Text style={styles.label}>Vaccination Date *</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateButtonText}>
            {selectedDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        <Text style={styles.label}>Vaccination Type *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={vaccinationType}
            onValueChange={setVaccinationType}
            style={styles.picker}
          >
            <Picker.Item label="Select vaccination type..." value="" />
            {vaccinationTypes.map((type) => (
              <Picker.Item key={type} label={type} value={type} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Price *</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          placeholder="Enter vaccination cost"
        />

        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={[styles.checkbox, done && styles.checkboxChecked]}
            onPress={() => setDone(!done)}
          >
            {done && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>Mark as completed</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {editingId ? 'Update Record' : 'Add Record'}
              </Text>
            )}
          </TouchableOpacity>

          {editingId && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Records Section */}
      <View style={styles.recordsContainer}>
        <Text style={styles.recordsTitle}>Vaccination Records</Text>
        {vaccinations.length === 0 ? (
          <Text style={styles.emptyText}>No vaccination records found</Text>
        ) : (
          vaccinations.map(item => (
            <View key={item.id}>
              {renderVaccinationItem({ item })}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
 container: {
   flex: 1,
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
 dateButton: {
   borderWidth: 1,
   borderColor: '#5c6bc0',
   borderRadius: 6,
   paddingHorizontal: 12,
   paddingVertical: 12,
   backgroundColor: '#fff',
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
 checkboxContainer: {
   flexDirection: 'row',
   alignItems: 'center',
   marginTop: 15,
 },
 checkbox: {
   width: 24,
   height: 24,
   borderWidth: 2,
   borderColor: '#5c6bc0',
   borderRadius: 4,
   marginRight: 10,
   alignItems: 'center',
   justifyContent: 'center',
 },
 checkboxChecked: {
   backgroundColor: '#5c6bc0',
 },
 checkmark: {
   color: 'white',
   fontWeight: 'bold',
   fontSize: 16,
 },
 checkboxLabel: {
   fontSize: 16,
   color: '#333',
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
   elevation: 2,
   shadowColor: '#000',
   shadowOffset: {
     width: 0,
     height: 1,
   },
   shadowOpacity: 0.22,
   shadowRadius: 2.22,
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
 recordActions: {
   flexDirection: 'row',
   gap: 8,
 },
 editButton: {
   backgroundColor: '#28a745',
   paddingHorizontal: 12,
   paddingVertical: 6,
   borderRadius: 4,
 },
 editButtonText: {
   color: 'white',
   fontSize: 12,
   fontWeight: '600',
 },
 deleteButton: {
   backgroundColor: '#dc3545',
   paddingHorizontal: 12,
   paddingVertical: 6,
   borderRadius: 4,
 },
 deleteButtonText: {
   color: 'white',
   fontSize: 12,
   fontWeight: '600',
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
 statusButton: {
   paddingHorizontal: 12,
   paddingVertical: 4,
   borderRadius: 12,
   minWidth: 80,
   alignItems: 'center',
 },
 doneButton: {
   backgroundColor: '#28a745',
 },
 pendingButton: {
   backgroundColor: '#ffc107',
 },
 statusButtonText: {
   color: 'white',
   fontSize: 12,
   fontWeight: '600',
 },
});

export default Vaccination;