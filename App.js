import React, { useState, useEffect } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Users, MessageCircle, MapPin, FileText } from 'lucide-react-native';

import Chatbot from './src/screens/Chatbot';
import VetLocator from './src/screens/VetLocator';
import Reports from './src/screens/Reports';
import ProfileScreen from './src/screens/ProfileScreen';
import BatchListScreen from './src/screens/Batches';
import BatchDetailsScreen from './src/screens/Batch';
import CreateBatchScreen from './src/screens/CreateBatch';
import Feed from './src/screens/Feed';
import Mortality from './src/screens/Mortality';
import ManageBatchScreen from './src/screens/ManageBatchScreen';
import EggProduction from './src/screens/EggProduction';
import Vaccination from './src/screens/Vaccination';

import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

const Batches = createStackNavigator();
const Batch = createMaterialTopTabNavigator();

const BatchDetailsTabNavigator = () => {
  return (
    <Batch.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#5c6bc0',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: '#f5f5f5' },
        tabBarIndicatorStyle: { backgroundColor: '#5c6bc0' },
      }}
    >
      {/* Placeholder tabs */}
    </Batch.Navigator>
  );
};

const BatchesNavigator = ({ batches, setBatches }) => {
  return (
    <Batches.Navigator>
      <Batches.Screen
        name="BatchList"
        children={(props) => <BatchListScreen {...props} batches={batches} setBatches={setBatches} />}
        options={{ headerShown: false }}
      />
      <Batches.Screen
        name="BatchDetails"
        component={BatchDetailsScreen}
        options={({ route }) => ({
          title: route.params?.batchName || 'Batch Details',
          headerStyle: { backgroundColor: '#5c6bc0' },
          headerTintColor: '#fff',
        })}
      />
      <Batches.Screen 
        name="FeedLog" 
        component={Feed} 
        options={{ 
          title: 'Feed Logs',
          headerStyle: { backgroundColor: '#5c6bc0' },
          headerTintColor: '#fff',
        }} 
      />
      <Batches.Screen
        name="CreateBatch"
        children={(props) => <CreateBatchScreen {...props} batches={batches} setBatches={setBatches} />}
        options={{
          title: 'Create New Batch',
          headerStyle: { backgroundColor: '#5c6bc0' },
          headerTintColor: '#fff',
        }}
      />
      <Batches.Screen
        name="BatchTabs"
        component={BatchDetailsTabNavigator}
        options={({ route }) => ({
          title: route.params?.batchName || 'Batch Management',
          headerStyle: { backgroundColor: '#5c6bc0' },
          headerTintColor: '#fff',
        })}
      />
      <Batches.Screen 
        name="Mortality" 
        component={Mortality} 
        options={{ 
          title: 'Log Mortality',
          headerStyle: { backgroundColor: '#5c6bc0' },
          headerTintColor: '#fff',
        }} 
      />
      <Batches.Screen 
        name="ManageBatch" 
        component={ManageBatchScreen} 
        options={{ 
          title: 'Manage Batch', 
          headerStyle: { backgroundColor: '#5c6bc0' }, 
          headerTintColor: '#fff' 
        }} 
      />
      <Batches.Screen 
        name="EggProduction" 
        component={EggProduction} 
        options={{ 
          title: 'Egg Production',
          headerStyle: { backgroundColor: '#5c6bc0' },
          headerTintColor: '#fff',
        }} 
      />
      <Batches.Screen 
        name="Vaccination" 
        component={Vaccination} 
        options={{ 
          title: 'Vaccination Records',
          headerStyle: { backgroundColor: '#5c6bc0' },
          headerTintColor: '#fff',
        }} 
      />
    </Batches.Navigator>
  );
};

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authenticatedUser) => {
      if (authenticatedUser) {
        setUser(authenticatedUser);

        // Updated: Query the top-level 'batches' collection filtered by userId
        const batchesQuery = query(
          collection(db, 'batches'),
          where('userId', '==', authenticatedUser.uid)
        );

        const unsubscribeBatches = onSnapshot(batchesQuery, (snapshot) => {
          const fetchedBatches = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setBatches(fetchedBatches);
        });

        return () => unsubscribeBatches(); // Clean up batches listener
      } else {
        setUser(null);
        setBatches([]);
      }
    });

    return unsubscribeAuth; // Clean up auth listener
  }, []);

  const Stack = createStackNavigator();

  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Batch') return <Users size={size} color={color} />;
            if (route.name === 'Chatbot') return <MessageCircle size={size} color={color} />;
            if (route.name === 'VetLocator') return <MapPin size={size} color={color} />;
            if (route.name === 'Reports') return <FileText size={size} color={color} />;
            if (route.name === 'Profile') return <Users size={size} color={color} />;
            return null;
          },
          tabBarActiveTintColor: '#5c6bc0',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Batch">
          {(props) => <BatchesNavigator {...props} batches={batches} setBatches={setBatches} />}
        </Tab.Screen>
        <Tab.Screen name="Chatbot" component={Chatbot} />
        <Tab.Screen name="VetLocator" component={VetLocator} />
        <Tab.Screen name="Reports" component={Reports} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}