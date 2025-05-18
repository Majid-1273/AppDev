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
import FlockListScreen from './src/screens/Flocks';
import FlockDetailsScreen from './src/screens/Flock';
import CreateBatchScreen from './src/screens/CreateBatch';
import FeedLogScreen from './src/screens/FeedLogScreen';

import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

const Flocks = createStackNavigator();
const Flock = createMaterialTopTabNavigator();

const FlockDetailsTabNavigator = () => {
  return (
    <Flock.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#5c6bc0',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: '#f5f5f5' },
        tabBarIndicatorStyle: { backgroundColor: '#5c6bc0' },
      }}
    >
      {/* Placeholder tabs */}
    </Flock.Navigator>
  );
};

const FlocksNavigator = ({ flocks, setFlocks }) => {
  return (
    <Flocks.Navigator>
      <Flocks.Screen
        name="FlockList"
        children={(props) => <FlockListScreen {...props} flocks={flocks} setFlocks={setFlocks} />}
        options={{ headerShown: false }}
      />
      <Flocks.Screen
        name="FlockDetails"
        component={FlockDetailsScreen}
        options={({ route }) => ({
          title: route.params?.flockName || 'Flock Details',
          headerStyle: { backgroundColor: '#5c6bc0' },
          headerTintColor: '#fff',
        })}
      />
      <Flocks.Screen 
        name="FeedLog" 
        component={FeedLogScreen} 
        options={{ title: 'Feed Logs' }} 
      />
      <Flocks.Screen
        name="CreateBatch"
        children={(props) => <CreateBatchScreen {...props} flocks={flocks} setFlocks={setFlocks} />}
        options={{
          title: 'Create New Batch',
          headerStyle: { backgroundColor: '#5c6bc0' },
          headerTintColor: '#fff',
        }}
      />
      <Flocks.Screen
        name="FlockTabs"
        component={FlockDetailsTabNavigator}
        options={({ route }) => ({
          title: route.params?.flockName || 'Flock Management',
          headerStyle: { backgroundColor: '#5c6bc0' },
          headerTintColor: '#fff',
        })}
      />
    </Flocks.Navigator>
  );
};

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [flocks, setFlocks] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authenticatedUser) => {
      if (authenticatedUser) {
        setUser(authenticatedUser);

        const flocksRef = collection(db, 'users', authenticatedUser.uid, 'batches');

        const unsubscribeFlocks = onSnapshot(flocksRef, (snapshot) => {
          const fetchedFlocks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setFlocks(fetchedFlocks);
        });

        return () => unsubscribeFlocks(); // Clean up flocks listener
      } else {
        setUser(null);
        setFlocks([]);
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
            if (route.name === 'Flock') return <Users size={size} color={color} />;
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
        <Tab.Screen name="Flock">
          {(props) => <FlocksNavigator {...props} flocks={flocks} setFlocks={setFlocks} />}
        </Tab.Screen>
        <Tab.Screen name="Chatbot" component={Chatbot} />
        <Tab.Screen name="VetLocator" component={VetLocator} />
        <Tab.Screen name="Reports" component={Reports} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
