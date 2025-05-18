// src/screens/ProfileScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { auth } from '../../firebaseConfig';

export default function ProfileScreen() {
  const user = auth.currentUser;

  const handleSignOut = () => {
    auth.signOut().catch(error => {
      Alert.alert('Sign Out Error', error.message);
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.info}>{user?.email || 'No email found'}</Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,  // <-- Added more space at top here
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5c6bc0',
    marginBottom: 30,
    alignSelf: 'center',
  },
  infoBox: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 8,
    marginBottom: 40,
  },
  label: {
    fontWeight: '600',
    color: '#333',
    fontSize: 16,
    marginBottom: 8,
  },
  info: {
    fontSize: 18,
    color: '#000',
  },
  signOutButton: {
    backgroundColor: '#5c6bc0',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
