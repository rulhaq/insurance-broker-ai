<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { db } from '$lib/config/firebase';
  import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

  // Redirect non-admins
  onMount(() => {
    if ($currentUser && $currentUser.role !== 'admin') {
      goto('/dashboard');
    } else if ($currentUser?.role === 'admin') {
      loadProductTypes();
    }
  });

  let loading = true;
  let saving = false;
  let errorMessage = '';
  let successMessage = '';

  let productTypes = [
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

  const categories = [
    { value: 'liability', label: 'Liability' },
    { value: 'property', label: 'Property' },
    { value: 'auto', label: 'Auto' },
    { value: 'workers_comp', label: 'Workers Compensation' },
    { value: 'specialty', label: 'Specialty' },
    { value: 'management', label: 'Management' },
    { value: 'umbrella', label: 'Umbrella' }
  ];

  async function loadProductTypes() {
    loading = true;
    try {
      const docRef = doc(db, 'system_settings', 'product_types');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.productTypes) {
          productTypes = data.productTypes;
        }
      }
    } catch (error) {
      console.error('Error loading product types:', error);
      errorMessage = 'Failed to load product types';
    } finally {
      loading = false;
    }
  }

  async function saveProductTypes() {
    saving = true;
    errorMessage = '';

    try {
      const docRef = doc(db, 'system_settings', 'product_types');
      await setDoc(docRef, {
        productTypes,
        updatedAt: serverTimestamp(),
        updatedBy: $currentUser.uid
      }, { merge: true });

      successMessage = 'Product types saved successfully!';
      
      setTimeout(() => {
        successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error saving product types:', error);
      errorMessage = 'Failed to save product types';
    } finally {
      saving = false;
    }
  }

  function addNewProductType() {
    productTypes = [...productTypes, {
      value: '',
      label: '',
      description: '',
      basePremium: 2000,
      category: 'liability',
      active: true
    }];
  }

  function removeProductType(index: number) {
    if (confirm('Are you sure you want to remove this product type?')) {
      productTypes = productTypes.filter((_, i) => i !== index);
    }
  }

  function updateProductTypeValue(index: number, label: string) {
    // Auto-generate value from label
    const value = label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    productTypes[index].value = value;
  }

  $: groupedProductTypes = productTypes.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});
</script>

<svelte:head>
  <title>Product Types - Admin Settings</title>
</svelte:head>

{#if $currentUser?.role === 'admin'}
  <div class="min-h-screen bg-neutral-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
        <div class="py-6">
          <div class="lg:flex lg:items-center lg:justify-between">
            <div class="flex-1 min-w-0">
              <nav class="flex" aria-label="Breadcrumb">
                <ol role="list" class="flex items-center space-x-4">
                  <li>
                    <a href="/settings/admin" class="text-neutral-400 hover:text-neutral-500">
                      Admin Settings
                    </a>
                  </li>
                  <li>
                    <div class="flex items-center">
                      <svg class="flex-shrink-0 h-5 w-5 text-neutral-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span class="ml-4 text-sm font-medium text-neutral-500">Product Types</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 class="mt-2 text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
                Insurance Product Types
              </h1>
              <div class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div class="mt-2 flex items-center text-sm text-neutral-500">
                  <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Manage insurance product types and pricing
                </div>
              </div>
            </div>
            <div class="mt-5 flex lg:mt-0 lg:ml-4 space-x-3">
              <button
                type="button"
                on:click={addNewProductType}
                class="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50"
              >
                <svg class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Product Type
              </button>
              <button
                type="button"
                on:click={saveProductTypes}
                disabled={saving}
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {#if saving}
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                {:else}
                  Save Changes
                {/if}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="py-8">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {#if loading}
          <div class="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        {:else}
          <!-- Success/Error Messages -->
          {#if successMessage}
            <div class="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          {/if}

          {#if errorMessage}
            <div class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          {/if}

          <!-- Product Types by Category -->
          {#each Object.entries(groupedProductTypes) as [categoryValue, products]}
            {@const categoryLabel = categories.find(c => c.value === categoryValue)?.label || categoryValue}
            <div class="bg-white shadow rounded-lg mb-6">
              <div class="px-6 py-4 border-b border-neutral-200">
                <h3 class="text-lg font-medium text-neutral-900">{categoryLabel}</h3>
              </div>
              <div class="px-6 py-6">
                <div class="space-y-4">
                  {#each products as product, index}
                    {@const globalIndex = productTypes.findIndex(p => p === product)}
                    <div class="border border-neutral-200 rounded-lg p-4">
                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <label class="block text-sm font-medium text-neutral-700">Label</label>
                          <input
                            type="text"
                            bind:value={product.label}
                            on:input={(e) => updateProductTypeValue(globalIndex, e.target.value)}
                            class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label class="block text-sm font-medium text-neutral-700">Value</label>
                          <input
                            type="text"
                            bind:value={product.value}
                            class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono text-sm"
                          />
                        </div>

                        <div>
                          <label class="block text-sm font-medium text-neutral-700">Base Premium</label>
                          <div class="mt-1 relative rounded-md shadow-sm">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span class="text-neutral-500 sm:text-sm">$</span>
                            </div>
                            <input
                              type="number"
                              bind:value={product.basePremium}
                              min="0"
                              step="100"
                              class="block w-full pl-7 border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label class="block text-sm font-medium text-neutral-700">Category</label>
                          <select
                            bind:value={product.category}
                            class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          >
                            {#each categories as category}
                              <option value={category.value}>{category.label}</option>
                            {/each}
                          </select>
                        </div>

                        <div class="sm:col-span-2 lg:col-span-3">
                          <label class="block text-sm font-medium text-neutral-700">Description</label>
                          <textarea
                            bind:value={product.description}
                            rows="2"
                            class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          ></textarea>
                        </div>

                        <div class="flex items-end justify-between">
                          <label class="relative flex items-center">
                            <input
                              type="checkbox"
                              bind:checked={product.active}
                              class="focus:ring-primary-500 h-4 w-4 text-primary-600 border-neutral-300 rounded"
                            />
                            <span class="ml-2 text-sm text-neutral-700">Active</span>
                          </label>
                          
                          <button
                            type="button"
                            on:click={() => removeProductType(globalIndex)}
                            class="text-red-600 hover:text-red-900 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/each}

          <!-- Empty State -->
          {#if productTypes.length === 0}
            <div class="bg-white shadow rounded-lg">
              <div class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-neutral-900">No product types</h3>
                <p class="mt-1 text-sm text-neutral-500">Get started by adding your first insurance product type.</p>
                <div class="mt-6">
                  <button
                    type="button"
                    on:click={addNewProductType}
                    class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <svg class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Product Type
                  </button>
                </div>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center bg-neutral-50">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h1>
      <p class="text-neutral-600">You need admin privileges to access this page.</p>
    </div>
  </div>
{/if} 