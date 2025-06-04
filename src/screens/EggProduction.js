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
} from 'react-native';
import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const EggProduction = ({ route }) => {
  const { batchId, batchName } = route.params;
  
  const [eggRecords, setEggRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [broken, setBroken] = useState('');
  const [remaining, setRemaining] = useState('');
  const [total, setTotal] = useState('');

  useEffect(() => {
    // Fetch egg production records for this batch
    const eggQuery = query(
      collection(db, 'egg-production'),
      where('batchId', '==', batchId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(eggQuery, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEggRecords(records);
      setLoading(false);
    });

    return unsubscribe;
  }, [batchId]);

  const validateForm = () => {
    if (!broken || !remaining || !total) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    const brokenNum = parseInt(broken);
    const remainingNum = parseInt(remaining);
    const totalNum = parseInt(total);

    if (brokenNum < 0 || remainingNum < 0 || totalNum < 0) {
      Alert.alert('Error', 'Values cannot be negative');
      return false;
    }

    if (brokenNum + remainingNum !== totalNum) {
      Alert.alert('Error', 'Broken + Remaining should equal Total');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'egg-production'), {
        batchId,
        broken: parseInt(broken),
        remaining: parseInt(remaining),
        total: parseInt(total),
        createdAt: new Date(),
      });

      // Clear form
      setBroken('');
      setRemaining('');
      setTotal('');
      
      Alert.alert('Success', 'Egg production record added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add record: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Egg Production</Text>
        <Text style={styles.subtitle}>{batchName}</Text>
      </View>

      {/* Add New Record Form */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Add New Record</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total Eggs</Text>
          <TextInput
            style={styles.input}
            value={total}
            onChangeText={setTotal}
            placeholder="Enter total eggs collected"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Broken Eggs</Text>
          <TextInput
            style={styles.input}
            value={broken}
            onChangeText={setBroken}
            placeholder="Enter broken eggs count"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Good Eggs (Remaining)</Text>
          <TextInput
            style={styles.input}
            value={remaining}
            onChangeText={setRemaining}
            placeholder="Enter good eggs count"
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
            <Text style={styles.submitButtonText}>Add Record</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Records List */}
      <View style={styles.recordsContainer}>
        <Text style={styles.recordsTitle}>Previous Records</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#5c6bc0" style={styles.loader} />
        ) : eggRecords.length === 0 ? (
          <Text style={styles.noRecords}>No egg production records yet</Text>
        ) : (
          eggRecords.map((record) => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordDate}>{formatDate(record.createdAt)}</Text>
              </View>
              <View style={styles.recordStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total</Text>
                  <Text style={styles.statValue}>{record.total}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Good</Text>
                  <Text style={[styles.statValue, styles.goodValue]}>{record.remaining}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Broken</Text>
                  <Text style={[styles.statValue, styles.brokenValue]}>{record.broken}</Text>
                </View>
              </View>
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
    marginBottom: 10,
  },
  recordDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  recordStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  goodValue: {
    color: '#4caf50',
  },
  brokenValue: {
    color: '#f44336',
  },
});

export default EggProduction;