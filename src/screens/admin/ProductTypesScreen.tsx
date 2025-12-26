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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ProductType {
  id: string;
  name: string;
  code: string;
  description: string;
  category: 'personal' | 'commercial' | 'specialty';
  isActive: boolean;
  defaultCoverage: number;
  minimumPremium: number;
  riskFactors: string[];
  requiredFields: string[];
  createdAt: Date;
}

const ProductTypesScreen = ({ navigation }: any) => {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<ProductType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProductType['category']>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'personal' as ProductType['category'],
    isActive: true,
    defaultCoverage: 0,
    minimumPremium: 0,
    riskFactors: [] as string[],
    requiredFields: [] as string[],
  });

  const riskFactorOptions = [
    'Age', 'Gender', 'Location', 'Driving Record', 'Credit Score',
    'Property Value', 'Business Type', 'Employee Count', 'Annual Revenue'
  ];

  const requiredFieldOptions = [
    'Date of Birth', 'Address', 'Phone', 'Email', 'SSN',
    'Driver License', 'Vehicle Info', 'Property Details', 'Medical History'
  ];

  useEffect(() => {
    loadProductTypes();
  }, []);

  useEffect(() => {
    filterTypes();
  }, [productTypes, searchQuery, selectedCategory]);

  const loadProductTypes = () => {
    const mockTypes: ProductType[] = [
      {
        id: '1',
        name: 'Auto Insurance',
        code: 'AUTO',
        description: 'Comprehensive vehicle insurance coverage',
        category: 'personal',
        isActive: true,
        defaultCoverage: 100000,
        minimumPremium: 500,
        riskFactors: ['Age', 'Driving Record', 'Location'],
        requiredFields: ['Date of Birth', 'Driver License', 'Vehicle Info'],
        createdAt: new Date(),
      },
      {
        id: '2',
        name: 'Health Insurance',
        code: 'HEALTH',
        description: 'Medical and health coverage plans',
        category: 'personal',
        isActive: true,
        defaultCoverage: 250000,
        minimumPremium: 1200,
        riskFactors: ['Age', 'Medical History', 'Location'],
        requiredFields: ['Date of Birth', 'Medical History', 'Address'],
        createdAt: new Date(),
      },
    ];
    setProductTypes(mockTypes);
  };

  const filterTypes = () => {
    let filtered = productTypes;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(type => type.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(type =>
        type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        type.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        type.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredTypes(filtered);
  };

  const openModal = (type?: ProductType) => {
    if (type) {
      setSelectedType(type);
      setFormData({
        name: type.name,
        code: type.code,
        description: type.description,
        category: type.category,
        isActive: type.isActive,
        defaultCoverage: type.defaultCoverage,
        minimumPremium: type.minimumPremium,
        riskFactors: type.riskFactors,
        requiredFields: type.requiredFields,
      });
      setIsEditing(true);
    } else {
      setSelectedType(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        category: 'personal',
        isActive: true,
        defaultCoverage: 0,
        minimumPremium: 0,
        riskFactors: [],
        requiredFields: [],
      });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const saveProductType = () => {
    if (!formData.name || !formData.code) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isEditing && selectedType) {
      const updatedTypes = productTypes.map(t =>
        t.id === selectedType.id ? { ...selectedType, ...formData } : t
      );
      setProductTypes(updatedTypes);
      Alert.alert('Success', 'Product type updated successfully');
    } else {
      const newType: ProductType = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date(),
      };
      setProductTypes([...productTypes, newType]);
      Alert.alert('Success', 'Product type created successfully');
    }
    setShowModal(false);
  };

  const deleteProductType = (type: ProductType) => {
    Alert.alert(
      'Delete Product Type',
      `Are you sure you want to delete ${type.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedTypes = productTypes.filter(t => t.id !== type.id);
            setProductTypes(updatedTypes);
            Alert.alert('Success', 'Product type deleted successfully');
          }
        }
      ]
    );
  };

  const getCategoryColor = (category: ProductType['category']) => {
    switch (category) {
      case 'personal': return '#007bff';
      case 'commercial': return '#28a745';
      case 'specialty': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  const renderProductType = ({ item }: { item: ProductType }) => (
    <TouchableOpacity style={styles.typeCard} onPress={() => openModal(item)}>
      <View style={styles.typeHeader}>
        <View style={styles.typeInfo}>
          <View style={styles.typeNameRow}>
            <Text style={styles.typeName}>{item.name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
              <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.typeCode}>Code: {item.code}</Text>
          <Text style={styles.typeDescription} numberOfLines={2}>{item.description}</Text>
          <View style={styles.typeMetrics}>
            <Text style={styles.metricText}>Coverage: ${item.defaultCoverage.toLocaleString()}</Text>
            <Text style={styles.metricText}>Min Premium: ${item.minimumPremium.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: item.isActive ? '#28a745' : '#dc3545' }]} />
          <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      <View style={styles.typeFooter}>
        <View style={styles.factorCount}>
          <Ionicons name="warning-outline" size={16} color="#666" />
          <Text style={styles.factorText}>{item.riskFactors.length} risk factors</Text>
        </View>
        <View style={styles.fieldCount}>
          <Ionicons name="list-outline" size={16} color="#666" />
          <Text style={styles.fieldText}>{item.requiredFields.length} required fields</Text>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteProductType(item)}>
          <Ionicons name="trash-outline" size={18} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const CategoryFilter = ({ category, title }: any) => (
    <TouchableOpacity
      style={[
        styles.categoryFilter,
        selectedCategory === category && styles.activeCategoryFilter
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[
        styles.categoryFilterText,
        selectedCategory === category && styles.activeCategoryFilterText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6f42c1', '#5a2d91']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Types</Text>
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
            placeholder="Search product types..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        <CategoryFilter category="all" title="All" />
        <CategoryFilter category="personal" title="Personal" />
        <CategoryFilter category="commercial" title="Commercial" />
        <CategoryFilter category="specialty" title="Specialty" />
      </ScrollView>

      {/* Product Types List */}
      <FlatList
        data={filteredTypes}
        renderItem={renderProductType}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="layers-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No product types found</Text>
            <Text style={styles.emptySubtext}>Create your first product type</Text>
          </View>
        }
      />

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#6f42c1', '#5a2d91']} style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Product Type' : 'Add Product Type'}</Text>
            <TouchableOpacity onPress={saveProductType} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter product name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Product Code *</Text>
              <TextInput
                style={styles.input}
                value={formData.code}
                onChangeText={(text) => setFormData({ ...formData, code: text.toUpperCase() })}
                placeholder="Enter product code"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter product description"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Active Status</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                  trackColor={{ false: '#ccc', true: '#6f42c1' }}
                  thumbColor={formData.isActive ? '#fff' : '#fff'}
                />
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
  filtersContainer: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#fff' },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    marginRight: 8,
  },
  activeCategoryFilter: { backgroundColor: '#6f42c1' },
  categoryFilterText: { fontSize: 14, color: '#666', fontWeight: '500' },
  activeCategoryFilterText: { color: '#fff' },
  listContainer: { padding: 15 },
  typeCard: {
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
  typeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  typeInfo: { flex: 1 },
  typeNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  typeName: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  categoryText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  typeCode: { fontSize: 14, color: '#666', marginBottom: 4 },
  typeDescription: { fontSize: 14, color: '#666', marginBottom: 8 },
  typeMetrics: { flexDirection: 'row', gap: 15 },
  metricText: { fontSize: 12, color: '#28a745', fontWeight: '600' },
  statusContainer: { alignItems: 'center' },
  statusIndicator: { width: 12, height: 12, borderRadius: 6, marginBottom: 4 },
  statusText: { fontSize: 12, color: '#666' },
  typeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  factorCount: { flexDirection: 'row', alignItems: 'center' },
  factorText: { fontSize: 12, color: '#666', marginLeft: 4 },
  fieldCount: { flexDirection: 'row', alignItems: 'center' },
  fieldText: { fontSize: 12, color: '#666', marginLeft: 4 },
  deleteButton: { padding: 8 },
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
});

export default ProductTypesScreen; 