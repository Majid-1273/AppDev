import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { User, Users, MessageCircle, MapPin, FileText } from 'lucide-react-native';
import styles from './styles'; 

// Import existing screens

// import Profile from './src/screens/Profile';
import Chatbot from './src/screens/Chatbot';
import VetLocator from './src/screens/VetLocator';
import Reports from './src/screens/Reports';


// Import new flock-related screens

import FlockListScreen from './src/screens/Flocks';
import FlockDetailsScreen from './src/screens/Flock';
// import Feed from './src/screens/Feed';
// import EggProduction from './src/screens/EggProduction';
// import Vaccination from './src/screens/Vaccination';
// import Mortality from './src/screens/Mortality';


// Create the stack navigator for Flock screens

const Flocks = createStackNavigator();
const Flock = createMaterialTopTabNavigator();

// Flock Details Tab Navigator
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
      {/* <Flock.Screen name="Daily Feed" component={Feed} />
      <Flock.Screen name="Egg Production" component={EggProduction} />
      <Flock.Screen name="Vaccination" component={Vaccination} />
      <Flock.Screen name="Mortality" component={Mortality} /> */}
    </Flock.Navigator>
  );
};

// Flock Stack Navigator
const FlocksNavigator = () => {
  return (
    <Flocks.Navigator>
      <Flocks.Screen 
        name="FlockList" 
        component={FlockListScreen}
        options={{ headerShown: false }}
      />
      <Flocks.Screen 
        name="FlockDetails" 
        component={FlockDetailsScreen}
        options={({ route }) => ({ 
          title: route.params?.flockName || 'Flock Details',
          headerStyle: {
            backgroundColor: '#5c6bc0',
          },
          headerTintColor: '#fff',
        })}
      />
      <Flocks.Screen 
        name="FlockTabs" 
        component={FlockDetailsTabNavigator}
        options={({ route }) => ({ 
          title: route.params?.flockName || 'Flock Management',
          headerStyle: {
            backgroundColor: '#5c6bc0',
          },
          headerTintColor: '#fff',
        })}
      />
    </Flocks.Navigator>
  );
};

// Create the bottom tab navigator
const Tab = createBottomTabNavigator();

// Main App Component
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let icon;

            // if (route.name === 'Profile') {
            //   icon = <User size={size} color={color} />;
            // } else 
            if (route.name === 'Flock') {
              icon = <Users size={size} color={color} />;
            } else if (route.name === 'Chatbot') {
              icon = <MessageCircle size={size} color={color} />;
            } else if (route.name === 'VetLocator') {
              icon = <MapPin size={size} color={color} />;
            } else if (route.name === 'Reports') {
              icon = <FileText size={size} color={color} />;
            }

            return icon;
          },
          tabBarActiveTintColor: '#5c6bc0',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        {/* <Tab.Screen name="Profile" component={Profile} /> */}
        <Tab.Screen name="Flock" component={FlocksNavigator} />
        <Tab.Screen name="Chatbot" component={Chatbot} />
        <Tab.Screen name="VetLocator" component={VetLocator} />
        <Tab.Screen name="Reports" component={Reports} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}