// Vet Locator Screen Component
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styles from '../../styles'; 

const VetLocator = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Find a Vet</Text>
      
      <View style={styles.searchBar}>
        <Text>Search by location...</Text>
      </View>
      
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>Map will be displayed here</Text>
      </View>
      
      <ScrollView style={styles.vetList}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.vetItem}>
            <View style={styles.vetInfo}>
              <Text style={styles.vetName}>Animal Care Clinic {item}</Text>
              <Text style={styles.vetAddress}>123 Pet Street, Suite {item * 100}</Text>
              <Text style={styles.vetDistance}>{item * 0.7} miles away</Text>
              <View style={styles.ratingContainer}>
                {[...Array(5)].map((_, index) => (
                  <Text key={index} style={index < 4 ? styles.starFilled : styles.starEmpty}>★</Text>
                ))}
                <Text style={styles.reviewCount}>(42 reviews)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default VetLocator;