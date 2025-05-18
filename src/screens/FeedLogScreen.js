import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';

const FeedLogScreen = ({ route, navigation }) => {
  const { batchId, batchName } = route.params;

  // Local state to hold feed logs for this batch
  const [feedLogs, setFeedLogs] = useState([]);

  // Form state
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState('');
  const [cost, setCost] = useState('');

  const addFeedLog = () => {
    if (!quantity || !date || !cost) {
      Alert.alert('Please fill all fields');
      return;
    }

    const newLog = {
      id: Date.now().toString(),
      quantity,
      date,
      cost,
    };

    setFeedLogs([...feedLogs, newLog]);

    // Clear form fields
    setQuantity('');
    setDate('');
    setCost('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feed Log for {batchName}</Text>

      <View style={styles.form}>
        <TextInput
          placeholder="Feed Quantity (kg)"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          placeholder="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          style={styles.input}
        />
        <TextInput
          placeholder="Cost"
          value={cost}
          onChangeText={setCost}
          keyboardType="numeric"
          style={styles.input}
        />
        <Button title="Add Feed Log" onPress={addFeedLog} />
      </View>

      <Text style={styles.subtitle}>Feed Logs</Text>
      <FlatList
        data={feedLogs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <Text>Date: {item.date}</Text>
            <Text>Quantity: {item.quantity} kg</Text>
            <Text>Cost: ${item.cost}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No feed logs yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  form: { marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderRadius: 6,
  },
  subtitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  logItem: {
    padding: 12,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
    marginBottom: 8,
  },
});

export default FeedLogScreen;
