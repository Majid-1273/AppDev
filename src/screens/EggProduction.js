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
} from 'firebase/firestore';

const EggProduction = ({ route, navigation }) => {
  const { batchId } = route.params;
  const user = auth.currentUser;

  const [loading, setLoading] = useState(false);
  const [eggProductions, setEggProductions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [batchData, setBatchData] = useState(null);

  // Form states
  const [broken, setBroken] = useState('');
  const [total, setTotal] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format

  // Calculate remaining eggs automatically
  const calculateRemaining = () => {
    const totalNum = Number(total) || 0;
    const brokenNum = Number(broken) || 0;
    return Math.max(0, totalNum - brokenNum);
  };

  const remaining = calculateRemaining();

  useEffect(() => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      navigation.goBack();
      return;
    }

    // Fetch batch data to get placement date for validation
    const fetchBatchData = async () => {
      try {
        const batchDoc = await getDoc(doc(db, 'batches', batchId));
        if (batchDoc.exists()) {
          setBatchData(batchDoc.data());
        }
      } catch (error) {
        console.error('Error fetching batch data:', error);
      }
    };

    fetchBatchData();

    // Query egg-production collection filtered by batchId
    const eggProductionQuery = query(
      collection(db, 'egg-production'),
      where('batchId', '==', batchId)
    );

    const unsubscribe = onSnapshot(eggProductionQuery, (snapshot) => {
      const fetchedEggProductions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Sort in JavaScript instead of Firestore
      fetchedEggProductions.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.seconds - a.createdAt.seconds;
      });
      setEggProductions(fetchedEggProductions);
    });

    return unsubscribe;
  }, [batchId, user]);

  const validateForm = () => {
    const brokenNum = Number(broken);
    const totalNum = Number(total);

    if (isNaN(totalNum) || totalNum <= 0) {
      Alert.alert('Validation Error', 'Total eggs must be a valid positive number');
      return false;
    }

    if (isNaN(brokenNum) || brokenNum < 0) {
      Alert.alert('Validation Error', 'Broken eggs must be a valid non-negative number');
      return false;
    }

    if (brokenNum > totalNum) {
      Alert.alert('Validation Error', 'Broken eggs cannot exceed total eggs');
      return false;
    }

    // Date validation
    const today = new Date();
    const inputDate = new Date(selectedDate);
    
    // Check if date is in the past (before today)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const inputDateStart = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
    
    if (inputDateStart < todayStart) {
      Alert.alert('Validation Error', 'Date cannot be in the past');
      return false;
    }

    // Check if date is before batch placement date
    if (batchData && batchData.placementDate) {
      const placementDate = new Date(batchData.placementDate.seconds * 1000);
      const placementDateStart = new Date(placementDate.getFullYear(), placementDate.getMonth(), placementDate.getDate());
      
      if (inputDateStart < placementDateStart) {
        Alert.alert('Validation Error', 'Date cannot be before batch placement date');
        return false;
      }
    }

    // Check for duplicate date (only for new entries or when editing and date is changed)
    const duplicateDate = eggProductions.find(item => {
      if (editingId && item.id === editingId) {
        // When editing, allow same date only if it's the same record
        return false;
      }
      
      if (item.date && item.date.seconds) {
        const existingDate = new Date(item.date.seconds * 1000);
        const existingDateStart = new Date(existingDate.getFullYear(), existingDate.getMonth(), existingDate.getDate());
        return existingDateStart.getTime() === inputDateStart.getTime();
      }
      return false;
    });

    if (duplicateDate) {
      Alert.alert('Validation Error', 'An entry for this date already exists');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Convert date to timestamp
      const dateTimestamp = new Date(selectedDate);

      if (editingId) {
        // Update existing record
        const updateData = {
          batchId,
          broken: Number(broken),
          remaining: remaining,
          total: Number(total),
          date: dateTimestamp,
          updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, 'egg-production', editingId), updateData);
        Alert.alert('Success', 'Egg production record updated successfully');
        setEditingId(null);
      } else {
        // Add new record
        const eggProductionData = {
          batchId,
          broken: Number(broken),
          remaining: remaining,
          total: Number(total),
          date: dateTimestamp,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'egg-production'), eggProductionData);
        Alert.alert('Success', 'Egg production record added successfully');
      }

      // Reset form
      setBroken('');
      setTotal('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error saving egg production:', error);
      Alert.alert('Error', 'Failed to save egg production record');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setTotal(String(item.total));
    setBroken(String(item.broken));
    
    // Set the date for editing
    if (item.date && item.date.seconds) {
      const date = new Date(item.date.seconds * 1000);
      setSelectedDate(date.toISOString().split('T')[0]);
    }
    
    setEditingId(item.id);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this egg production record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'egg-production', id));
              Alert.alert('Success', 'Egg production record deleted successfully');
            } catch (error) {
              console.error('Error deleting egg production:', error);
              Alert.alert('Error', 'Failed to delete egg production record');
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setBroken('');
    setTotal('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setEditingId(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'Today';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  const renderEggProductionItem = ({ item }) => (
    <View style={styles.recordItem}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordDate}>
          {formatDate(item.date)}
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
          <Text style={styles.detailLabel}>Total Eggs:</Text>
          <Text style={styles.detailValue}>{item.total}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Broken:</Text>
          <Text style={styles.detailValue}>{item.broken}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Remaining:</Text>
          <Text style={styles.detailValue}>{item.remaining}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Form Section */}
      <View style={styles.formContainer}>
        <Text style={styles.title}>
          {editingId ? 'Edit Egg Production' : 'Add Egg Production'}
        </Text>

        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={styles.input}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>Total Eggs *</Text>
        <TextInput
          style={styles.input}
          value={total}
          onChangeText={setTotal}
          keyboardType="numeric"
          placeholder="Enter total eggs produced"
        />

        <Text style={styles.label}>Broken Eggs *</Text>
        <TextInput
          style={styles.input}
          value={broken}
          onChangeText={setBroken}
          keyboardType="numeric"
          placeholder="Enter number of broken eggs"
        />

        <View style={styles.calculatedContainer}>
          <Text style={styles.calculatedLabel}>Remaining Eggs:</Text>
          <Text style={styles.calculatedValue}>{remaining}</Text>
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
        <Text style={styles.recordsTitle}>Egg Production Records</Text>
        {eggProductions.length === 0 ? (
          <Text style={styles.emptyText}>No egg production records found</Text>
        ) : (
          eggProductions.map(item => (
            <View key={item.id}>
              {renderEggProductionItem({ item })}
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
  calculatedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  calculatedLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  calculatedValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5c6bc0',
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
  recordItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5c6bc0',
  },
  recordActions: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
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
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default EggProduction;