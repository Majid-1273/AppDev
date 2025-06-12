import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Linking } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import styles from '../../styles';

const VetLocator = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVet, setSelectedVet] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(loc);
        // Auto-search for veterinary places once location is obtained
        searchNearbyVets(loc.coords.latitude, loc.coords.longitude);
      } catch (error) {
        setErrorMsg('Error getting location: ' + error.message);
      }
    })();
  }, []);

  // Search nearby veterinary places using Google Places API
  const searchNearbyVets = async (lat, lon, radius = 5000) => {
    setLoading(true);
    
    
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=veterinary_care&key=${GOOGLE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const googleVets = data.results.map((place, index) => ({
          id: place.place_id || `google_${index}`,
          name: place.name,
          address: place.vicinity || 'Address not available',
          phone: null, // Would need Place Details API call for phone
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          distance: calculateDistance(lat, lon, place.geometry.location.lat, place.geometry.location.lng),
          type: 'veterinary',
          rating: place.rating || null,
          priceLevel: place.price_level || null,
          isOpen: place.opening_hours?.open_now || null
        })).sort((a, b) => a.distance - b.distance);
        
        setVets(googleVets);
      } else if (data.status === 'ZERO_RESULTS') {
        await searchAlternativeVets(lat, lon, radius);
      } else {
        throw new Error(`Google Places API error: ${data.status}`);
      }
      
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch nearby veterinary clinics: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Alternative search with keyword search
  const searchAlternativeVets = async (lat, lon, radius) => {
    
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&keyword=veterinary+animal+hospital+pet+clinic&key=${GOOGLE_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const googleVets = data.results.map((place, index) => ({
          id: place.place_id || `alt_google_${index}`,
          name: place.name,
          address: place.vicinity || 'Address not available',
          phone: null,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          distance: calculateDistance(lat, lon, place.geometry.location.lat, place.geometry.location.lng),
          type: 'veterinary',
          rating: place.rating || null,
          priceLevel: place.price_level || null,
          isOpen: place.opening_hours?.open_now || null
        })).sort((a, b) => a.distance - b.distance);
        
        setVets(googleVets);
      }
    } catch (error) {
      // Silent fallback
    }
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in kilometers
    return parseFloat(d.toFixed(1));
  };

  // Get route from Google Directions API and display on map
  const showDirectionsOnMap = async (vet) => {
    if (!location) return;
    
    setLoadingRoute(true);
    setSelectedVet(vet);
    
    
    const origin = `${location.coords.latitude},${location.coords.longitude}`;
    const destination = `${vet.latitude},${vet.longitude}`;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Decode the polyline to get route coordinates
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);
        
        // Set route information
        setRouteInfo({
          distance: leg.distance.text,
          duration: leg.duration.text,
          instructions: leg.steps.map(step => ({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
            distance: step.distance.text,
            duration: step.duration.text
          }))
        });
        

      } else {
        throw new Error(`Directions API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }
      
    } catch (error) {
Alert.alert('Error', 'Failed to get directions: ' + error.message);
    } finally {
      setLoadingRoute(false);
    }
  };

  // Decode polyline string to coordinates
  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({ latitude: lat / 1E5, longitude: lng / 1E5 });
    }
    return points;
  };

  // Make phone call
  const makeCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('No Contact', 'Phone number not available');
    }
  };

  // Clear route from map
  const clearRoute = () => {
    setRouteCoordinates([]);
    setSelectedVet(null);
    setRouteInfo(null);
  };

  const retryLocationRequest = async () => {
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);
      searchNearbyVets(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      setErrorMsg('Error getting location: ' + error.message);
    }
  };

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={retryLocationRequest}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Find a Vet</Text>
      
      {/* Route Info Bar */}
      {routeInfo && (
        <View style={{ backgroundColor: '#f0f0f0', padding: 10, margin: 5, borderRadius: 5 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontWeight: 'bold' }}>Route to {selectedVet?.name}</Text>
              <Text>Distance: {routeInfo.distance} • Duration: {routeInfo.duration}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: '#FF3B30', minWidth: 60 }]}
              onPress={clearRoute}
            >
              <Text style={[styles.contactButtonText, { color: '#fff' }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Map Display */}
      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            region={routeCoordinates.length > 0 ? {
              latitude: (location.coords.latitude + selectedVet.latitude) / 2,
              longitude: (location.coords.longitude + selectedVet.longitude) / 2,
              latitudeDelta: Math.abs(location.coords.latitude - selectedVet.latitude) * 1.5,
              longitudeDelta: Math.abs(location.coords.longitude - selectedVet.longitude) * 1.5,
            } : undefined}
          >
            {/* User location marker */}
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="You are here!"
              pinColor="blue"
            />
            
            {/* Vet markers */}
            {vets.map((vet) => (
              <Marker
                key={vet.id}
                coordinate={{
                  latitude: vet.latitude,
                  longitude: vet.longitude,
                }}
                title={vet.name}
                description={`${vet.distance} km away${vet.rating ? ` • ${vet.rating}⭐` : ''}`}
                pinColor={selectedVet?.id === vet.id ? "green" : "red"}
                onCalloutPress={() => showDirectionsOnMap(vet)}
              />
            ))}

            {/* Route polyline */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#007AFF"
                strokeWidth={4}
                lineDashPattern={[0]}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>Loading map...</Text>
          </View>
        )}
        
        {/* Loading overlay for route */}
        {loadingRoute && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
              <Text>Loading route...</Text>
            </View>
          </View>
        )}
      </View>
      
      {/* Search Controls */}
      <View style={{ padding: 10, flexDirection: 'row', justifyContent: 'space-around' }}>
        <TouchableOpacity 
          style={[styles.contactButton, { backgroundColor: '#007AFF', minWidth: 80 }]}
          onPress={() => location && searchNearbyVets(location.coords.latitude, location.coords.longitude, 2000)}
        >
          <Text style={[styles.contactButtonText, { color: '#fff' }]}>Search 2km</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.contactButton, { backgroundColor: '#007AFF', minWidth: 80 }]}
          onPress={() => location && searchNearbyVets(location.coords.latitude, location.coords.longitude, 5000)}
        >
          <Text style={[styles.contactButtonText, { color: '#fff' }]}>Search 5km</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.contactButton, { backgroundColor: '#007AFF', minWidth: 80 }]}
          onPress={() => location && searchNearbyVets(location.coords.latitude, location.coords.longitude, 10000)}
        >
          <Text style={[styles.contactButtonText, { color: '#fff' }]}>Search 10km</Text>
        </TouchableOpacity>
      </View>
      
      {/* Vet List */}
      <ScrollView style={styles.vetList}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Searching for nearby vets...</Text>
          </View>
        ) : (
          vets.map((vet) => (
            <TouchableOpacity 
              key={vet.id} 
              style={[
                styles.vetItem,
                selectedVet?.id === vet.id ? { backgroundColor: '#e8f5e8' } : {}
              ]}
              onPress={() => showDirectionsOnMap(vet)}
            >
              <View style={styles.vetInfo}>
                <Text style={styles.vetName}>{vet.name}</Text>
                <Text style={styles.vetAddress}>{vet.address}</Text>
                <Text style={styles.vetDistance}>{vet.distance} km away</Text>
                {vet.rating && (
                  <Text style={styles.vetType}>Rating: {vet.rating}⭐</Text>
                )}
                {vet.isOpen !== null && (
                  <Text style={[styles.vetType, { color: vet.isOpen ? 'green' : 'red' }]}>
                    {vet.isOpen ? 'Open Now' : 'Closed'}
                  </Text>
                )}
              </View>
              <View>
                <TouchableOpacity 
                  style={{
                    backgroundColor: '#34C759',
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                    borderRadius: 8,
                    minWidth: 120,
                    alignItems: 'center',
                  }}
                  onPress={(e) => {
                    e.stopPropagation();
                    showDirectionsOnMap(vet);
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Show Route</Text>
                </TouchableOpacity>
                {vet.phone && (
                  <TouchableOpacity 
                    style={[styles.contactButton, styles.callButton, { minWidth: 90, marginTop: 5 }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      makeCall(vet.phone);
                    }}
                  >
                    <Text style={[styles.contactButtonText, { color: '#fff' }]}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        
        {!loading && vets.length === 0 && location && (
          <View style={styles.noResults}>
            <Text>No veterinary clinics found in your area</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => searchNearbyVets(location.coords.latitude, location.coords.longitude, 20000)}
            >
              <Text style={styles.retryButtonText}>Search Wider Area (20km)</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default VetLocator;