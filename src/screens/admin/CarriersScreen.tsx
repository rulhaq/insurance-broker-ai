import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Carrier {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  commissionRate: number;
  status: 'active' | 'inactive';
  productTypes: string[];
  contactPerson: string;
  notes: string;
  createdAt: Date;
}

const CarriersScreen = ({ navigation }: any) => {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [filteredCarriers, setFilteredCarriers] = useState<Carrier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    commissionRate: 0,
    status: 'active' as 'active' | 'inactive',
    productTypes: [] as string[],
    contactPerson: '',
    notes: '',
  });

  const productTypeOptions = ['Auto', 'Health', 'Life', 'Business', 'Home', 'Renters'];

  useEffect(() => {
    loadCarriers();
  }, []);

  useEffect(() => {
    filterCarriers();
  }, [carriers, searchQuery]);

  const loadCarriers = () => {
    // Mock data - in real app, fetch from Firebase
    const mockCarriers: Carrier[] = [
      {
        id: '1',
        name: 'Qatar Insurance Company',
        code: 'QIC',
        email: 'partners@qic.com.qa',
        phone: '+974 4496 8888',
        website: 'www.qic.com.qa',
        address: 'QIC Building, West Bay, Doha, Qatar',
        commissionRate: 15,
        status: 'active',
        productTypes: ['Auto', 'Health', 'Life', 'Business'],
        contactPerson: 'Ahmed Al-Mansouri',
        notes: 'Primary carrier for Qatar market',
        createdAt: new Date(),
      },
      {
        id: '2',
        name: 'Doha Insurance Group',
        code: 'DIG',
        email: 'brokers@dohainsurance.com',
        phone: '+974 4444 5555',
        website: 'www.dohainsurance.com',
        address: 'Diplomatic Area, Doha, Qatar',
        commissionRate: 12,
        status: 'active',
        productTypes: ['Auto', 'Home', 'Business'],
        contactPerson: 'Sara Al-Thani',
        notes: 'Competitive rates for auto insurance',
        createdAt: new Date(),
      },
    ];
    setCarriers(mockCarriers);
  };

  const filterCarriers = () => {
    let filtered = carriers;
    if (searchQuery) {
      filtered = filtered.filter(carrier =>
        carrier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        carrier.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        carrier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredCarriers(filtered);
  };

  const openModal = (carrier?: Carrier) => {
    if (carrier) {
      setSelectedCarrier(carrier);
      setFormData({
        name: carrier.name,
        code: carrier.code,
        email: carrier.email,
        phone: carrier.phone,
        website: carrier.website,
        address: carrier.address,
        commissionRate: carrier.commissionRate,
        status: carrier.status,
        productTypes: carrier.productTypes,
        contactPerson: carrier.contactPerson,
        notes: carrier.notes,
      });
      setIsEditing(true);
    } else {
      setSelectedCarrier(null);
      setFormData({
        name: '',
        code: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        commissionRate: 0,
        status: 'active',
        productTypes: [],
        contactPerson: '',
        notes: '',
      });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const saveCarrier = () => {
    if (!formData.name || !formData.code || !formData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isEditing && selectedCarrier) {
      const updatedCarriers = carriers.map(c =>
        c.id === selectedCarrier.id ? { ...selectedCarrier, ...formData } : c
      );
      setCarriers(updatedCarriers);
      Alert.alert('Success', 'Carrier updated successfully');
    } else {
      const newCarrier: Carrier = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date(),
      };
      setCarriers([...carriers, newCarrier]);
      Alert.alert('Success', 'Carrier created successfully');
    }
    setShowModal(false);
  };

  const deleteCarrier = (carrier: Carrier) => {
    Alert.alert(
      'Delete Carrier',
      `Are you sure you want to delete ${carrier.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedCarriers = carriers.filter(c => c.id !== carrier.id);
            setCarriers(updatedCarriers);
            Alert.alert('Success', 'Carrier deleted successfully');
          }
        }
      ]
    );
  };

  const toggleProductType = (type: string) => {
    const updated = formData.productTypes.includes(type)
      ? formData.productTypes.filter(t => t !== type)
      : [...formData.productTypes, type];
    setFormData({ ...formData, productTypes: updated });
  };

  const renderCarrier = ({ item }: { item: Carrier }) => (
    <TouchableOpacity style={styles.carrierCard} onPress={() => openModal(item)}>
      <View style={styles.carrierHeader}>
        <View style={styles.carrierInfo}>
          <View style={styles.carrierNameRow}>
            <Text style={styles.carrierName}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#28a745' : '#dc3545' }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.carrierCode}>Code: {item.code}</Text>
          <Text style={styles.carrierContact}>{item.contactPerson}</Text>
          <Text style={styles.carrierCommission}>Commission: {item.commissionRate}%</Text>
        </View>
      </View>
      
      <View style={styles.productTypes}>
        {item.productTypes.slice(0, 3).map(type => (
          <View key={type} style={styles.productTypeBadge}>
            <Text style={styles.productTypeText}>{type}</Text>
          </View>
        ))}
        {item.productTypes.length > 3 && (
          <Text style={styles.moreTypes}>+{item.productTypes.length - 3} more</Text>
        )}
      </View>

      <View style={styles.carrierActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => openModal(item)}>
          <Ionicons name="create-outline" size={18} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => deleteCarrier(item)}>
          <Ionicons name="trash-outline" size={18} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#28a745', '#1e7e34']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insurance Carriers</Text>
        <TouchableOpacity onPress={() => openModal()} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search carriers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{carriers.filter(c => c.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{carriers.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Math.round(carriers.reduce((sum, c) => sum + c.commissionRate, 0) / carriers.length || 0)}%</Text>
          <Text style={styles.statLabel}>Avg Commission</Text>
        </View>
      </View>

      {/* Carriers List */}
      <FlatList
        data={filteredCarriers}
        renderItem={renderCarrier}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No carriers found</Text>
            <Text style={styles.emptySubtext}>Add your first insurance carrier</Text>
          </View>
        }
      />

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#28a745', '#1e7e34']} style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Carrier' : 'Add Carrier'}</Text>
            <TouchableOpacity onPress={saveCarrier} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Carrier Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter carrier name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Carrier Code *</Text>
              <TextInput
                style={styles.input}
                value={formData.code}
                onChangeText={(text) => setFormData({ ...formData, code: text.toUpperCase() })}
                placeholder="Enter carrier code (e.g., QIC)"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Person</Text>
              <TextInput
                style={styles.input}
                value={formData.contactPerson}
                onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
                placeholder="Enter contact person name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Commission Rate (%)</Text>
              <TextInput
                style={styles.input}
                value={formData.commissionRate.toString()}
                onChangeText={(text) => setFormData({ ...formData, commissionRate: parseFloat(text) || 0 })}
                placeholder="Enter commission rate"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Status</Text>
                <Switch
                  value={formData.status === 'active'}
                  onValueChange={(value) => setFormData({ ...formData, status: value ? 'active' : 'inactive' })}
                  trackColor={{ false: '#ccc', true: '#28a745' }}
                  thumbColor={formData.status === 'active' ? '#fff' : '#fff'}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Product Types</Text>
              <View style={styles.checkboxGroup}>
                {productTypeOptions.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={styles.checkboxRow}
                    onPress={() => toggleProductType(type)}
                  >
                    <Ionicons
                      name={formData.productTypes.includes(type) ? "checkbox" : "square-outline"}
                      size={24}
                      color={formData.productTypes.includes(type) ? "#28a745" : "#666"}
                    />
                    <Text style={styles.checkboxLabel}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: { padding: 5 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  addButton: { padding: 5 },
  searchContainer: { padding: 15, backgroundColor: '#fff' },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#28a745' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 5 },
  listContainer: { padding: 15 },
  carrierCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  carrierHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  carrierInfo: { flex: 1 },
  carrierNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  carrierName: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  carrierCode: { fontSize: 14, color: '#666', marginBottom: 2 },
  carrierContact: { fontSize: 14, color: '#666', marginBottom: 2 },
  carrierCommission: { fontSize: 14, color: '#28a745', fontWeight: '600' },
  productTypes: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  productTypeBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  productTypeText: { fontSize: 12, color: '#007bff', fontWeight: '500' },
  moreTypes: { fontSize: 12, color: '#666', alignSelf: 'center' },
  carrierActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  actionButton: { padding: 8, marginLeft: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#666', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#f8f9fa' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  closeButton: { padding: 5 },
  modalTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  saveButton: { padding: 5 },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  modalContent: { flex: 1, padding: 20 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkboxGroup: { gap: 10 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkboxLabel: { fontSize: 16, color: '#333', marginLeft: 10 },
});

export default CarriersScreen; 