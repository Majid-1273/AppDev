// Styles
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  
  // Profile Screen styles
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileBio: {
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  petBreed: {
    color: '#666',
  },
  petAge: {
    color: '#666',
    fontSize: 12,
  },
  settingItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  
  // Flock Screen styles
  searchBar: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  flockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  flockDetails: {
    color: '#666',
    fontSize: 14,
  },
  flockDistance: {
    color: '#888',
    fontSize: 12,
  },
  connectButton: {
    backgroundColor: '#5c6bc0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  connectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // Chatbot Screen styles
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  messageList: {
    flex: 1,
    padding: 16,
  },
  botMessage: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 0,
    alignSelf: 'flex-start',
    maxWidth: '80%',
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: '#5c6bc0',
    padding: 12,
    borderRadius: 16,
    borderTopRightRadius: 0,
    alignSelf: 'flex-end',
    maxWidth: '80%',
    marginBottom: 12,
  },
  messageText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 10,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#5c6bc0',
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // Vet Locator Screen styles
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 16,
  },
  mapText: {
    color: '#666',
  },
  vetList: {
    flex: 1,
  },
  vetItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  vetAddress: {
    color: '#666',
    marginBottom: 4,
  },
  vetDistance: {
    color: '#888',
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  starFilled: {
    color: '#ffc107',
    fontSize: 16,
  },
  starEmpty: {
    color: '#ddd',
    fontSize: 16,
  },
  reviewCount: {
    color: '#888',
    fontSize: 12,
    marginLeft: 4,
  },
  contactButton: {
    backgroundColor: '#5c6bc0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // Reports Screen styles
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportDate: {
    color: '#888',
  },
  reportSection: {
    marginBottom: 16,
  },
  reportSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chartPlaceholder: {
    height: 150,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  vaccinationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  vaccineName: {
    flex: 1,
    fontWeight: 'bold',
  },
  vaccineStatus: {
    flex: 1,
    textAlign: 'center',
  },
  vaccineDate: {
    flex: 1,
    textAlign: 'right',
    color: '#888',
  },
  visitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  visitDate: {
    flex: 1,
    fontWeight: 'bold',
  },
  visitReason: {
    flex: 1,
    textAlign: 'center',
  },
  visitVet: {
    flex: 1,
    textAlign: 'right',
    color: '#888',
  },
  newReportButton: {
    backgroundColor: '#5c6bc0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  newReportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
//  Flocks Screen Styles
   flocksContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 12,
  },
  searchBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 24,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  activeFilter: {
    backgroundColor: '#5c6bc0',
  },
  filterText: {
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  flockList: {
    flex: 1,
  },
  flockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  flocksImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  flockInfo: {
    flex: 1,
  },
  flocksName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  flockDetails: {
    color: '#666',
    fontSize: 14,
    marginBottom: 2,
  },
  flockAge: {
    color: '#888',
    fontSize: 13,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#5c6bc0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
// Flock Screen Styles
   flockContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerSection: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  flockImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
  },
  flockHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  flockName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  flockType: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    marginLeft: 4,
    color: '#444',
    fontSize: 13,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontWeight: '500',
    color: '#666',
  },
  infoValue: {
    color: '#333',
  },
  environmentSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  environmentCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  environmentCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  environmentValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  environmentLabel: {
    color: '#666',
    marginTop: 4,
  },
  quickStatsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickStat: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    width: '23%',
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 24,
  },
  managementButton: {
    backgroundColor: '#5c6bc0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  managementButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#5c6bc0',
    marginTop: 4,
    fontWeight: '500',
    fontSize: 12,
  },
  rowBack: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 10,
    marginVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  deleteButton: {
    width: 50,
    backgroundColor: 'rgba(255, 69, 58, 0.9)', // soft red with transparency
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 5,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  
  
});

export default styles;