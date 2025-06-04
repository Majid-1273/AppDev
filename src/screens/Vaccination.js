import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, onSnapshot, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const Vaccination = ({ route }) => {
  const { batchId, batchName, placementDate } = route.params;
  
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vaccinationType, setVaccinationType] = useState('');
  const [price, setPrice] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Vaccination types dropdown options
  const vaccinationTypes = [
    'Newcastle Disease',
    'Infectious Bronchitis',
    'Gumboro Disease',
    'Fowl Pox',
    'Avian Influenza',
    'Marek\'s Disease',
    'Infectious Laryngotracheitis',
    'Egg Drop Syndrome',
    'Other'
  ];

  useEffect(() => {
    // Fetch vaccination records for this batch
    const vaccinationQuery = query(
      collection(db, 'vaccination'),
      where('batchId', '==', batchId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(vaccinationQuery, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVaccinations(records);
      setLoading(false);
    });

    return unsubscribe;
  }, [batchId]);

  const validateForm = () => {
    if (!vaccinationType || !price) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    const priceNum = parseFloat(price);
    if (priceNum < 0 || isNaN(priceNum)) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }

    // Check if date is not before placement date
    const placement = new Date(placementDate.toDate ? placementDate.toDate() : placementDate);
    if (selectedDate < placement) {
      Alert.alert('Error', 'Vaccination date cannot be before batch placement date');
      return false;
    }

    // Check if date is not in the past (except today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      Alert.alert('Error', 'Vaccination date cannot be in the past');
      return false;
    }

    // Check for duplicate dates
    const selectedDateString = selectedDate.toDateString();
    const duplicateDate = vaccinations.some(vaccination => {
      const vaccinationDate = vaccination.date.toDate ? vaccination.date.toDate() : new Date(vaccination.date);
      return vaccinationDate.toDateString() === selectedDateString;
    });

    if (duplicateDate) {
      Alert.alert('Error', 'A vaccination record already exists for this date');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'vaccination'), {
        batchId,
        date: selectedDate,
        type: vaccinationType,
        price: parseFloat(price),
        done: false,
        reminderCount: 0,
        createdAt: new Date(),
      });

      // Reset form
      setSelectedDate(new Date());
      setVaccinationType('');
      setPrice('');
      
      Alert.alert('Success', 'Vaccination scheduled successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule vaccination: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsDone = async (vaccinationId) => {
    try {
      await updateDoc(doc(db, 'vaccination', vaccinationId), {
        done: true,
      });
      Alert.alert('Success', 'Vaccination marked as completed');
    } catch (error) {
      Alert.alert('Error', 'Failed to update vaccination: ' + error.message);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const isUpcoming = (date) => {
    const vaccinationDate = date.toDate ? date.toDate() : new Date(date);
    const today = new Date();
    return vaccinationDate >= today;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vaccination Schedule</Text>
        <Text style={styles.subtitle}>{batchName}</Text>
      </View>

      {/* Add New Vaccination Form */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Schedule New Vaccination</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vaccination Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
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
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vaccination Type</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowTypePicker(true)}
          >
            <Text style={[styles.pickerButtonText, !vaccinationType && styles.placeholder]}>
              {vaccinationType || 'Select vaccination type'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="Enter vaccination cost"
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Schedule Vaccination</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Vaccination Records */}
      <View style={styles.recordsContainer}>
        <Text style={styles.recordsTitle}>Vaccination Records</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#5c6bc0" style={styles.loader} />
        ) : vaccinations.length === 0 ? (
          <Text style={styles.noRecords}>No vaccination records yet</Text>
        ) : (
          vaccinations.map((vaccination) => (
            <View key={vaccination.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordDate}>{formatDate(vaccination.date)}</Text>
                <View style={[
                  styles.statusBadge,
                  vaccination.done ? styles.doneBadge : 
                  isUpcoming(vaccination.date) ? styles.upcomingBadge : styles.overdueBadge
                ]}>
                  <Text style={styles.statusText}>
                    {vaccination.done ? 'Completed' : 
                     isUpcoming(vaccination.date) ? 'Upcoming' : 'Overdue'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.vaccinationType}>{vaccination.type}</Text>
              <Text style={styles.price}>Cost: ${vaccination.price}</Text>
              
              {vaccination.reminderCount > 0 && (
                <Text style={styles.reminderText}>
                  Reminders sent: {vaccination.reminderCount}/3
                </Text>
              )}
              
              {!vaccination.done && (
                <TouchableOpacity
                  style={styles.markDoneButton}
                  onPress={() => handleMarkAsDone(vaccination.id)}
                >
                  <Text style={styles.markDoneButtonText}>Mark as Done</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>

      {/* Type Picker Modal */}
      <Modal
        visible={showTypePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Vaccination Type</Text>
            <ScrollView style={styles.optionsList}>
              {vaccinationTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.optionItem}
                  onPress={() => {
                    setVaccinationType(type);
                    setShowTypePicker(false);
                  }}
                >
                  <Text style={styles.optionText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowTypePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#5c6bc0',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#5c6bc0',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#9e9e9e',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordsContainer: {
    margin: 15,
  },
  recordsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  loader: {
    marginTop: 20,
  },
  noRecords: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  recordCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recordDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  doneBadge: {
    backgroundColor: '#4caf50',
  },
  upcomingBadge: {
    backgroundColor: '#2196f3',
  },
  overdueBadge: {
    backgroundColor: '#f44336',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vaccinationType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  price: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  reminderText: {
    fontSize: 12,
    color: '#ff9800',
    marginBottom: 10,
  },
  markDoneButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  markDoneButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '80%',
    maxHeight: '70%',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 15,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Vaccination;