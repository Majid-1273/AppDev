// SANIA - ProfileScreen with Name/Email Editing + Password Reset
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  TextInput, Image, ActivityIndicator
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import {
  doc, getDoc, updateDoc, collection, getDocs, deleteDoc,
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { deleteUser, updateEmail, sendPasswordResetEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const user = auth.currentUser;
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newPhoto, setNewPhoto] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [passwordForReauth, setPasswordForReauth] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            setNewPhoto(data.photoURL || '');
            setNewName(data.name || '');
            setNewEmail(data.email || '');
          }
        } catch (error) {
          console.error('Error fetching profile:', error.message);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [user]);

  const handleSignOut = () => {
    auth.signOut().catch((error) => {
      Alert.alert('Sign Out Error', error.message);
    });
  };

  const deleteUserData = async () => {
    const batchesRef = collection(db, 'users', user.uid, 'batches');
    const snapshot = await getDocs(batchesRef);
    const batchDeletionPromises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, 'users', user.uid, 'batches', docSnap.id))
    );
    await Promise.all(batchDeletionPromises);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserData();
              await deleteUser(user);
              await auth.signOut();
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      if (newEmail !== user.email) {
        if (!passwordForReauth) {
          Alert.alert('Error', 'Please enter current password to change email.');
          return;
        }

        const credential = EmailAuthProvider.credential(user.email, passwordForReauth);
        await reauthenticateWithCredential(user, credential);
        await updateEmail(user, newEmail);
      }

      await updateDoc(doc(db, 'users', user.uid), {
        name: newName,
        email: newEmail,
        photoURL: newPhoto,
      });

      Alert.alert('Profile Updated');
      setEditMode(false);
    } catch (error) {
      Alert.alert('Update Error', error.message);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setNewPhoto(result.assets[0].uri);
    }
  };

  const handleResetPassword = () => {
    sendPasswordResetEmail(auth, user.email)
      .then(() => {
        Alert.alert('Success', 'Password reset email sent.');
      })
      .catch((error) => {
        Alert.alert('Error', error.message);
      });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={newPhoto ? { uri: newPhoto } : { uri: 'https://via.placeholder.com/120.png?text=Profile' }}
        style={styles.profileImage}
      />

      {editMode ? (
        <>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="Full Name"
          />
          <TextInput
            style={styles.input}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="Email"
            autoCapitalize="none"
          />
          {newEmail !== user.email && (
            <TextInput
              style={styles.input}
              value={passwordForReauth}
              onChangeText={setPasswordForReauth}
              placeholder="Current Password (for email change)"
              secureTextEntry
            />
          )}
          <TouchableOpacity style={styles.editPhotoBtn} onPress={pickImage}>
            <Text style={styles.editPhotoText}>Change Profile Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}>
            <Text style={styles.saveText}>Save Changes</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.nameText}>{userData?.name ?? 'No Name'}</Text>
          <View style={styles.infoBox}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{userData?.email ?? 'Not available'}</Text>
          </View>
        </>
      )}

      {!editMode && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionRow} onPress={() => setEditMode(true)}>
            <Feather name="edit" size={20} color="#333" />
            <Text style={styles.actionText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleResetPassword}>
            <MaterialIcons name="lock-reset" size={20} color="#333" />
            <Text style={styles.actionText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleSignOut}>
            <MaterialIcons name="logout" size={20} color="#333" />
            <Text style={styles.actionText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={20} color="#B91C1C" />
            <Text style={[styles.actionText, { color: '#B91C1C' }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 25, backgroundColor: '#fff', alignItems: 'center' },
  profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 15, backgroundColor: '#e0e0e0' },
  nameText: { fontSize: 22, fontWeight: '700', marginBottom: 20, color: '#333' },
  infoBox: { width: '100%', marginBottom: 15 },
  label: { fontWeight: '600', fontSize: 14, color: '#666' },
  value: { fontSize: 16, color: '#000', marginTop: 2 },
  editPhotoBtn: { backgroundColor: '#f0f0f0', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 10 },
  editPhotoText: { color: '#333', fontSize: 14 },
  saveBtn: { backgroundColor: '#10B981', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8, marginTop: 15 },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  actionsContainer: { marginTop: 30, width: '100%' },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  actionText: { fontSize: 16, marginLeft: 10, color: '#333' },
  input: {
    height: 50, borderColor: '#999', borderWidth: 1, borderRadius: 8,
    marginBottom: 15, paddingHorizontal: 15, width: '100%'
  },
});
