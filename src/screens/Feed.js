//SANIA
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

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

export default function Feed({ route }) {
  const { batchId } = route.params;
  const [feedLogs, setFeedLogs] = useState([]);
  const [feedType, setFeedType] = useState('');
  const [grams, setGrams] = useState('');
  const [price, setPrice] = useState('');
  const [editingLog, setEditingLog] = useState(null);
  const [showMenuId, setShowMenuId] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [batchPlacementDate, setBatchPlacementDate] = useState(null);

  // Get batch placement date for validation
  const fetchBatchDetails = useCallback(async () => {
    try {
      const batchDoc = await getDoc(doc(db, 'batches', batchId));
      if (batchDoc.exists()) {
        const batchData = batchDoc.data();
        setBatchPlacementDate(batchData.placementDate?.toDate());
      }
    } catch (error) {
      console.error('Error fetching batch details:', error);
    }
  }, [batchId]);

  useFocusEffect(
    useCallback(() => {
      fetchBatchDetails();

      // Query feed collection with batchId filter (removed orderBy to avoid index requirement)
      const feedRef = collection(db, 'feed');
      const q = query(
        feedRef, 
        where('batchId', '==', batchId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamp to Date if needed
          date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
        }));
        
        // Sort manually by date (newest first) instead of using orderBy
        logs.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setFeedLogs(logs);
      });

      return () => unsubscribe();
    }, [batchId, fetchBatchDetails])
  );

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
    return feedLogs.some(log => {
      if (excludeId && log.id === excludeId) return false;
      const logDateString = log.date.toISOString().split('T')[0];
      return logDateString === dateString;
    });
  };

  const handleAddFeedLog = async () => {
    if (!feedType.trim() || !grams.trim() || !price.trim() || !selectedDate) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!validateDate(selectedDate)) {
      return;
    }

    if (checkDuplicateDate(selectedDate)) {
      Alert.alert('Duplicate Entry', 'Feed log for this date already exists');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Reference to the new flat 'feed' collection
    const feedRef = collection(db, 'feed');

    try {
      await addDoc(feedRef, {
        batchId,
        feedType,
        date: selectedDate,
        grams: parseInt(grams),
        price: parseFloat(price),
        createdAt: serverTimestamp(),
      });

      // Reset form
      setFeedType('');
      setGrams('');
      setPrice('');
      setSelectedDate(new Date());
      
      Alert.alert('Success', 'Feed log added successfully');
    } catch (error) {
      Alert.alert('Error', 'Error adding feed log: ' + error.message);
    }
  };

  const handleDeleteFeedLog = async (id) => {
    try {
      const docRef = doc(db, 'feed', id);
      await deleteDoc(docRef);
      Alert.alert('Success', 'Feed log deleted');
    } catch (error) {
      Alert.alert('Error', 'Error deleting feed log: ' + error.message);
    }
  };

  const handleEditFeedLog = (log) => {
    setEditingLog(log);
    setFeedType(log.feedType);
    setGrams(log.grams.toString());
    setPrice(log.price.toString());
    setSelectedDate(log.date);
    setEditModalVisible(true);
  };

  const saveEditedLog = async () => {
    if (!feedType.trim() || !grams.trim() || !price.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!validateDate(selectedDate)) {
      return;
    }

    if (checkDuplicateDate(selectedDate, editingLog.id)) {
      Alert.alert('Duplicate Entry', 'Feed log for this date already exists');
      return;
    }

    try {
      const docRef = doc(db, 'feed', editingLog.id);
      await updateDoc(docRef, {
        feedType,
        date: selectedDate,
        grams: parseInt(grams),
        price: parseFloat(price),
      });

      setEditModalVisible(false);
      setEditingLog(null);
      setFeedType('');
      setGrams('');
      setPrice('');
      setSelectedDate(new Date());
      
      Alert.alert('Success', 'Feed log updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Error updating log: ' + error.message);
    }
  };

  const renderFeedLog = ({ item }) => (
    <View style={styles.feedLogItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.feedLogText}>Type: {item.feedType}</Text>
        <Text style={styles.feedLogText}>Date: {item.date.toISOString().split('T')[0]}</Text>
        <Text style={styles.feedLogText}>Grams: {item.grams}</Text>
        <Text style={styles.feedLogText}>Price: ${item.price}</Text>
      </View>

      <TouchableOpacity
        onPress={() => setShowMenuId(showMenuId === item.id ? null : item.id)}
        style={styles.menuButton}
      >
        <MaterialIcons name="more-vert" size={24} color="#5c6bc0" />
      </TouchableOpacity>

      {showMenuId === item.id && (
        <View style={styles.popupMenu}>
          <TouchableOpacity 
            onPress={() => handleEditFeedLog(item)}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeleteFeedLog(item.id)}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Add Feed Log</Text>

        <Text style={styles.label}>Feed Type *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter feed type" 
          value={feedType} 
          onChangeText={setFeedType} 
        />
        
        <Text style={styles.label}>Date *</Text>
        <View style={styles.dateInputContainer}>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.dateInputTouchable}
          >
            <Text style={styles.dateText}>
              {selectedDate.toISOString().split('T')[0]}
            </Text>
            <FontAwesome name="calendar" size={20} color="#5c6bc0" />
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

        <Text style={styles.label}>Grams *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter grams" 
          value={grams} 
          onChangeText={setGrams} 
          keyboardType="numeric" 
        />

        <Text style={styles.label}>Price *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter price" 
          value={price} 
          onChangeText={setPrice} 
          keyboardType="numeric" 
        />

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleAddFeedLog}
        >
          <Text style={styles.submitButtonText}>Add Feed Log</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recordsContainer}>
        <Text style={styles.recordsTitle}>Feed Logs</Text>
        <FlatList 
          data={feedLogs} 
          keyExtractor={(item) => item.id} 
          renderItem={renderFeedLog} 
          ListEmptyComponent={<Text style={styles.emptyText}>No feed logs yet.</Text>} 
        />
      </View>

      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Edit Feed Log</Text>

            <Text style={styles.label}>Feed Type *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter feed type"
              value={feedType} 
              onChangeText={setFeedType} 
            />
            
            <Text style={styles.label}>Date *</Text>
            <View style={styles.dateInputContainer}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.dateInputTouchable}
              >
                <Text style={styles.dateText}>
                  {selectedDate.toISOString().split('T')[0]}
                </Text>
                <FontAwesome name="calendar" size={20} color="#5c6bc0" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Grams *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter grams"
              value={grams} 
              onChangeText={setGrams} 
              keyboardType="numeric" 
            />

            <Text style={styles.label}>Price *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter price"
              value={price} 
              onChangeText={setPrice} 
              keyboardType="numeric" 
            />

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={saveEditedLog}
            >
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  dateInputContainer: {
    position: 'relative',
  },
  dateInputTouchable: {
    borderColor: '#5c6bc0',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#5c6bc0',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
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
    marginTop: 10,
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
  feedLogItem: {
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
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  feedLogText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  menuButton: {
    padding: 5,
  },
  popupMenu: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  editButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});