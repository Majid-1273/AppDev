// Reports Screen Component
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styles from '../../styles'; 

const Reports = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Pet Reports</Text>
      
      <ScrollView>
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>Health Report - Max</Text>
            <Text style={styles.reportDate}>May 10, 2025</Text>
          </View>
          
          <View style={styles.reportSection}>
            <Text style={styles.reportSectionTitle}>Weight Tracking</Text>
            <View style={styles.chartPlaceholder}>
              <Text>Weight chart will be displayed here</Text>
            </View>
          </View>
          
          <View style={styles.reportSection}>
            <Text style={styles.reportSectionTitle}>Vaccination Status</Text>
            <View style={styles.vaccinationItem}>
              <Text style={styles.vaccineName}>Rabies</Text>
              <Text style={styles.vaccineStatus}>Up to date</Text>
              <Text style={styles.vaccineDate}>Last: Jan 15, 2025</Text>
            </View>
            <View style={styles.vaccinationItem}>
              <Text style={styles.vaccineName}>Distemper</Text>
              <Text style={styles.vaccineStatus}>Up to date</Text>
              <Text style={styles.vaccineDate}>Last: Mar 22, 2025</Text>
            </View>
            <View style={styles.vaccinationItem}>
              <Text style={styles.vaccineName}>Bordetella</Text>
              <Text style={styles.vaccineStatus}>Due soon</Text>
              <Text style={styles.vaccineDate}>Due: Jun 05, 2025</Text>
            </View>
          </View>
          
          <View style={styles.reportSection}>
            <Text style={styles.reportSectionTitle}>Vet Visits</Text>
            <View style={styles.visitItem}>
              <Text style={styles.visitDate}>Apr 15, 2025</Text>
              <Text style={styles.visitReason}>Annual Checkup</Text>
              <Text style={styles.visitVet}>Dr. Smith</Text>
            </View>
            <View style={styles.visitItem}>
              <Text style={styles.visitDate}>Feb 03, 2025</Text>
              <Text style={styles.visitReason}>Ear Infection</Text>
              <Text style={styles.visitVet}>Dr. Johnson</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.newReportButton}>
          <Text style={styles.newReportButtonText}>Create New Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default Reports;