//SANIA
//ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { deleteUser } from 'firebase/auth'; 
import { Feather } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const user = auth.currentUser;
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newPhoto, setNewPhoto] = useState('');
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
            console.log('Fetched user data:', data); // Debug log
          } else {
            console.log('No such user document');
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
              // Delete user data (Firestore subcollections)
              await deleteUserData();
  
              // Delete the auth user
              await deleteUser(user);
  
              // Sign out the user (usually not necessary as user is deleted, but for safety)
              await auth.signOut();
  
              // Navigate back to Login screen
              navigation.replace('Login'); // Replace 'Login' with your actual login screen name
  
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
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: newPhoto,
      });
      setEditMode(false);
      Alert.alert('Profile Updated');
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
        source={
          newPhoto
            ? { uri: newPhoto }
            : { uri: 'https://via.placeholder.com/120.png?text=Profile' }
        }
        style={styles.profileImage}
      />
      <Text style={styles.nameText}>{userData?.name ?? 'No Name'}</Text>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{userData?.email ?? 'Not available'}</Text>
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.label}>Contact:</Text>
        <Text style={styles.value}>{userData?.contact ?? 'Not available'}</Text>
      </View>

      {editMode && (
        <>
          <TouchableOpacity style={styles.editPhotoBtn} onPress={pickImage}>
            <Text style={styles.editPhotoText}>Change Profile Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}>
            <Text style={styles.saveText}>Save Changes</Text>
          </TouchableOpacity>
        </>
      )}

      {!editMode && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionRow} onPress={() => setEditMode(true)}>
            <Feather name="edit" size={20} color="#333" />
            <Text style={styles.actionText}>Edit Profile</Text>
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
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    backgroundColor: '#e0e0e0',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
  },
  infoBox: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#000',
    marginTop: 2,
  },
  editPhotoBtn: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  editPhotoText: {
    color: '#333',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 15,
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  actionsContainer: {
    marginTop: 30,
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  actionText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
});
