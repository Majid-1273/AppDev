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
} from 'firebase/firestore';

import { db, auth } from '../../firebaseConfig';

export default function FeedLogScreen({ route }) {
  const { flockId } = route.params;
  const [feedLogs, setFeedLogs] = useState([]);
  const [feedType, setFeedType] = useState('');
  const [date, setDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [editingLog, setEditingLog] = useState(null);
  const [showMenuId, setShowMenuId] = useState(null); // Track which item shows menu
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());


  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user) return;

      const feedLogsRef = collection(db, 'users', user.uid, 'batches', flockId, 'feedLogs');
      const q = query(feedLogsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFeedLogs(logs);
      });

      return () => unsubscribe();
    }, [flockId])
  );

  const handleAddFeedLog = async () => {
    if (!feedType.trim() || !quantity.trim() || !selectedDate) {

      Alert.alert('Please fill all fields');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('User not authenticated');
      return;
    }

    const feedLogsRef = collection(db, 'users', user.uid, 'batches', flockId, 'feedLogs');

    try {
      await addDoc(feedLogsRef, {
        feedType,
        date: selectedDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
        quantity,
        createdAt: serverTimestamp(),
      });

      setFeedType('');
      
      setQuantity('');
    } catch (error) {
      Alert.alert('Error adding feed log:', error.message);
    }
  };

  const handleDeleteFeedLog = async (id) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('User not authenticated');
      return;
    }

    try {
      const docRef = doc(db, 'users', user.uid, 'batches', flockId, 'feedLogs', id);
      await deleteDoc(docRef);
      Alert.alert('Feed log deleted');
    } catch (error) {
      Alert.alert('Error deleting feed log:', error.message);
    }
  };

  const handleEditFeedLog = (log) => {
    setEditingLog(log);
    setFeedType(log.feedType);
    setDate(log.date);
    setQuantity(log.quantity);
    setEditModalVisible(true);
  };

  const saveEditedLog = async () => {
    const user = auth.currentUser;
    if (!user || !editingLog) return;

    try {
      const docRef = doc(db, 'users', user.uid, 'batches', flockId, 'feedLogs', editingLog.id);
      await updateDoc(docRef, {
        feedType,
        date,
        quantity,
      });

      setEditModalVisible(false);
      setEditingLog(null);
      setFeedType('');
      setDate('');
      setQuantity('');
    } catch (error) {
      Alert.alert('Error updating log:', error.message);
    }
  };

  const renderFeedLog = ({ item }) => (
    <View style={styles.feedLogItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.feedLogText}>Type: {item.feedType}</Text>
        <Text style={styles.feedLogText}>Date: {item.date}</Text>
        <Text style={styles.feedLogText}>Quantity: {item.quantity}</Text>
      </View>

      <TouchableOpacity
        onPress={() => setShowMenuId(showMenuId === item.id ? null : item.id)}
        style={{ padding: 5 }}
      >
        <MaterialIcons name="more-vert" size={24} color="black" />
      </TouchableOpacity>

      {showMenuId === item.id && (
        <View style={styles.popupMenu}>
          <TouchableOpacity onPress={() => handleEditFeedLog(item)}>
            <Text style={styles.popupItem}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteFeedLog(item.id)}>
            <Text style={[styles.popupItem, { color: 'red' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Feed Log</Text>

      <TextInput style={styles.input} placeholder="Feed Type" value={feedType} onChangeText={setFeedType} />
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
      onChange={(event, date) => {
        setShowDatePicker(false); // Always hide after selection
        if (event.type === 'set' && date) {
          setSelectedDate(date);
        }
      }}
    />
  )}
</View>



      <TextInput style={styles.input} placeholder="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />

      <Button title={editingLog ? 'Save Changes' : 'Add Feed Log'} onPress={editingLog ? saveEditedLog : handleAddFeedLog} />

      <Text style={styles.title}>Feed Logs</Text>
      <FlatList data={feedLogs} keyExtractor={(item) => item.id} renderItem={renderFeedLog} ListEmptyComponent={<Text>No feed logs yet.</Text>} />

      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Edit Feed Log</Text>

            <TextInput style={styles.input} value={feedType} onChangeText={setFeedType} />
            <TextInput style={styles.input} value={date} onChangeText={setDate} />
            <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />

            <Button title="Save" onPress={saveEditedLog} />
            <Button title="Cancel" onPress={() => setEditModalVisible(false)} color="gray" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderRadius: 5,
  },
  feedLogItem: {
    backgroundColor: '#f1f1f1',
    padding: 15,
    borderRadius: 5,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  feedLogText: {
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
  
  calendarIcon: {
    marginLeft: 10,
  },
  
});
