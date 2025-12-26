import { db } from '$lib/config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface ProductType {
  value: string;
  label: string;
  description: string;
  basePremium: number;
  category: string;
  active: boolean;
}

export interface Category {
  value: string;
  label: string;
}

// Default product types as fallback
const defaultProductTypes: ProductType[] = [
  {
    value: 'general_liability',
    label: 'General Liability',
    description: 'Protection against third-party claims of bodily injury, property damage, and personal injury',
    basePremium: 2000,
    category: 'liability',
    active: true
  },
  {
    value: 'professional_liability',
    label: 'Professional Liability',
    description: 'Coverage for claims arising from professional services and advice',
    basePremium: 3000,
    category: 'liability',
    active: true
  },
  {
    value: 'cyber_liability',
    label: 'Cyber Liability',
    description: 'Protection against cyber attacks, data breaches, and digital threats',
    basePremium: 2500,
    category: 'specialty',
    active: true
  },
  {
    value: 'directors_officers',
    label: 'Directors & Officers',
    description: 'Protection for company directors and officers against personal liability',
    basePremium: 4000,
    category: 'management',
    active: true
  },
  {
    value: 'employment_practices',
    label: 'Employment Practices',
    description: 'Coverage for employment-related claims and lawsuits',
    basePremium: 2200,
    category: 'liability',
    active: true
  },
  {
    value: 'commercial_property',
    label: 'Commercial Property',
    description: 'Protection for business property and equipment',
    basePremium: 1800,
    category: 'property',
    active: true
  },
  {
    value: 'business_interruption',
    label: 'Business Interruption',
    description: 'Coverage for lost income due to business interruption',
    basePremium: 1500,
    category: 'property',
    active: true
  },
  {
    value: 'workers_compensation',
    label: 'Workers Compensation',
    description: 'Required coverage for employee injuries and illnesses',
    basePremium: 3500,
    category: 'workers_comp',
    active: true
  },
  {
    value: 'commercial_auto',
    label: 'Commercial Auto',
    description: 'Coverage for business vehicles and drivers',
    basePremium: 2800,
    category: 'auto',
    active: true
  },
  {
    value: 'umbrella',
    label: 'Umbrella Policy',
    description: 'Additional liability coverage above primary policies',
    basePremium: 1200,
    category: 'umbrella',
    active: true
  }
];

// Default categories as fallback
const defaultCategories: Category[] = [
  { value: 'liability', label: 'Liability' },
  { value: 'property', label: 'Property' },
  { value: 'auto', label: 'Auto' },
  { value: 'workers_comp', label: 'Workers Compensation' },
  { value: 'specialty', label: 'Specialty' },
  { value: 'management', label: 'Management' },
  { value: 'umbrella', label: 'Umbrella' }
];

/**
 * Load categories from Firebase system settings
 * Falls back to default categories if none found
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const docRef = doc(db, 'system_settings', 'product_types');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.categories && Array.isArray(data.categories)) {
        return data.categories;
      }
    }
    
    // Return default categories if none found
    return defaultCategories;
  } catch (error) {
    console.error('Error loading categories:', error);
    // Return default categories on error
    return defaultCategories;
  }
}

/**
 * Load product types from Firebase system settings
 * Falls back to default product types if none found
 */
export async function getProductTypes(): Promise<ProductType[]> {
  try {
    const docRef = doc(db, 'system_settings', 'product_types');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.productTypes && Array.isArray(data.productTypes)) {
        // Filter only active product types
        return data.productTypes.filter((type: ProductType) => type.active);
      }
    }
    
    // Return default product types if none found
    return defaultProductTypes.filter(type => type.active);
  } catch (error) {
    console.error('Error loading product types:', error);
    // Return default product types on error
    return defaultProductTypes.filter(type => type.active);
  }
}

/**
 * Get a specific product type by value
 */
export async function getProductType(value: string): Promise<ProductType | null> {
  const productTypes = await getProductTypes();
  return productTypes.find(type => type.value === value) || null;
}

/**
 * Get base premium for a product type
 */
export async function getBasePremium(productTypeValue: string): Promise<number> {
  const productType = await getProductType(productTypeValue);
  return productType?.basePremium || 2000; // Default fallback
}

/**
 * Format product types for dropdown use
 */
export async function getProductTypeOptions(): Promise<Array<{value: string, label: string}>> {
  const productTypes = await getProductTypes();
  return productTypes.map(type => ({
    value: type.value,
    label: type.label
  }));
}

/**
 * Get product types grouped by category with category labels
 */
export async function getProductTypesByCategory(): Promise<Record<string, {category: Category, products: ProductType[]}>> {
  const [productTypes, categories] = await Promise.all([getProductTypes(), getCategories()]);
  
  const grouped: Record<string, {category: Category, products: ProductType[]}> = {};
  
  // Initialize with all categories (even empty ones)
  categories.forEach(category => {
    grouped[category.value] = {
      category,
      products: []
    };
  });
  
  // Add products to their categories
  productTypes.forEach(product => {
    if (grouped[product.category]) {
      grouped[product.category].products.push(product);
    } else {
      // Handle products with unknown categories
      const unknownCategory = { value: product.category, label: product.category };
      grouped[product.category] = {
        category: unknownCategory,
        products: [product]
      };
    }
  });
  
  return grouped;
} 