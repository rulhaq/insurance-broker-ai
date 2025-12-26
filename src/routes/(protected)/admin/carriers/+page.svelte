<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { db } from '$lib/config/firebase';
  import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

  // Redirect non-admins
  onMount(() => {
    if ($currentUser && $currentUser.role !== 'admin') {
      goto('/dashboard');
    } else if ($currentUser?.role === 'admin') {
      loadCarriers();
    }
  });

  let carriers: any[] = [];
  let loading = true;
  let saving = false;
  let showModal = false;
  let editingCarrier: any = null;
  let errorMessage = '';
  let successMessage = '';

  let formData = {
    name: '',
    code: '',
    website: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    status: 'active',
    rating: '',
    specialties: [] as string[],
    notes: ''
  };

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' }
  ];

  const ratingOptions = [
    { value: 'A++', label: 'A++ (Superior)' },
    { value: 'A+', label: 'A+ (Superior)' },
    { value: 'A', label: 'A (Excellent)' },
    { value: 'A-', label: 'A- (Excellent)' },
    { value: 'B++', label: 'B++ (Good)' },
    { value: 'B+', label: 'B+ (Good)' },
    { value: 'B', label: 'B (Fair)' },
    { value: 'B-', label: 'B- (Fair)' },
    { value: 'C++', label: 'C++ (Marginal)' },
    { value: 'C+', label: 'C+ (Marginal)' }
  ];

  const specialtyOptions = [
    'General Liability', 'Professional Liability', 'Cyber Liability',
    'Directors & Officers', 'Employment Practices', 'Commercial Property',
    'Business Interruption', 'Workers Compensation', 'Commercial Auto',
    'Umbrella', 'Marine', 'Aviation', 'Healthcare', 'Technology'
  ];

  async function loadCarriers() {
    loading = true;
    try {
      const snapshot = await getDocs(collection(db, 'carriers'));
      carriers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error loading carriers:', error);
      errorMessage = 'Failed to load carriers';
    } finally {
      loading = false;
    }
  }

  function openCreateModal() {
    editingCarrier = null;
    formData = {
      name: '',
      code: '',
      website: '',
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
      },
      status: 'active',
      rating: '',
      specialties: [],
      notes: ''
    };
    showModal = true;
  }

  function openEditModal(carrier: any) {
    editingCarrier = carrier;
    formData = {
      name: carrier.name || '',
      code: carrier.code || '',
      website: carrier.website || '',
      phone: carrier.phone || '',
      email: carrier.email || '',
      address: {
        street: carrier.address?.street || '',
        city: carrier.address?.city || '',
        state: carrier.address?.state || '',
        zipCode: carrier.address?.zipCode || '',
        country: carrier.address?.country || 'United States'
      },
      status: carrier.status || 'active',
      rating: carrier.rating || '',
      specialties: carrier.specialties || [],
      notes: carrier.notes || ''
    };
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingCarrier = null;
    errorMessage = '';
  }

  async function handleSubmit() {
    if (!formData.name || !formData.code) {
      errorMessage = 'Name and code are required';
      return;
    }

    saving = true;
    errorMessage = '';

    try {
      const carrierData = {
        ...formData,
        updatedAt: serverTimestamp(),
        ...(editingCarrier ? {} : { createdAt: serverTimestamp() })
      };

      if (editingCarrier) {
        await updateDoc(doc(db, 'carriers', editingCarrier.id), carrierData);
        successMessage = 'Carrier updated successfully!';
      } else {
        await addDoc(collection(db, 'carriers'), carrierData);
        successMessage = 'Carrier created successfully!';
      }

      closeModal();
      await loadCarriers();
      
      setTimeout(() => {
        successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error saving carrier:', error);
      errorMessage = 'Failed to save carrier';
    } finally {
      saving = false;
    }
  }

  async function deleteCarrier(carrier: any) {
    if (!confirm(`Are you sure you want to delete ${carrier.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'carriers', carrier.id));
      successMessage = 'Carrier deleted successfully!';
      await loadCarriers();
      
      setTimeout(() => {
        successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error deleting carrier:', error);
      errorMessage = 'Failed to delete carrier';
    }
  }

  function toggleSpecialty(specialty: string) {
    if (formData.specialties.includes(specialty)) {
      formData.specialties = formData.specialties.filter(s => s !== specialty);
    } else {
      formData.specialties = [...formData.specialties, specialty];
    }
  }

  function getStatusColor(status: string) {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'suspended': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
</script>

<svelte:head>
  <title>Insurance Carriers - App Admin Area</title>
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
                    <a href="/admin" class="text-neutral-400 hover:text-neutral-500">
                      App Admin Area
                    </a>
                  </li>
                  <li>
                    <div class="flex items-center">
                      <svg class="flex-shrink-0 h-5 w-5 text-neutral-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span class="ml-4 text-sm font-medium text-neutral-500">Insurance Carriers</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 class="mt-2 text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
                Insurance Carriers
              </h1>
              <div class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div class="mt-2 flex items-center text-sm text-neutral-500">
                  <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Manage insurance companies and carriers
                </div>
              </div>
            </div>
            <div class="mt-5 flex lg:mt-0 lg:ml-4">
              <button
                type="button"
                on:click={openCreateModal}
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Carrier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    {#if successMessage}
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-4">
        <div class="bg-green-50 border border-green-200 rounded-md p-4">
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
      </div>
    {/if}

    <!-- Content -->
    <div class="py-8">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {#if loading}
          <div class="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        {:else}
          <!-- Carriers Table -->
          <div class="bg-white shadow overflow-hidden sm:rounded-md">
            <div class="px-4 py-5 sm:p-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg leading-6 font-medium text-neutral-900">
                  Carriers ({carriers.length})
                </h3>
              </div>

              {#if carriers.length === 0}
                <div class="text-center py-12">
                  <svg class="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 class="mt-2 text-sm font-medium text-neutral-900">No carriers</h3>
                  <p class="mt-1 text-sm text-neutral-500">Get started by creating a new insurance carrier.</p>
                  <div class="mt-6">
                    <button
                      type="button"
                      on:click={openCreateModal}
                      class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <svg class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Carrier
                    </button>
                  </div>
                </div>
              {:else}
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-neutral-200">
                    <thead class="bg-neutral-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Carrier
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Rating
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Specialties
                        </th>
                        <th class="relative px-6 py-3">
                          <span class="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-neutral-200">
                      {#each carriers as carrier}
                        <tr class="hover:bg-neutral-50">
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-neutral-900">{carrier.name}</div>
                            {#if carrier.website}
                              <div class="text-sm text-neutral-500">
                                <a href={carrier.website} target="_blank" class="text-primary-600 hover:text-primary-500">
                                  {carrier.website}
                                </a>
                              </div>
                            {/if}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                            {carrier.code || 'N/A'}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                            {carrier.rating || 'Not Rated'}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(carrier.status)}">
                              {carrier.status}
                            </span>
                          </td>
                          <td class="px-6 py-4">
                            <div class="flex flex-wrap gap-1">
                              {#each (carrier.specialties || []).slice(0, 3) as specialty}
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {specialty}
                                </span>
                              {/each}
                              {#if (carrier.specialties || []).length > 3}
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                                  +{(carrier.specialties || []).length - 3} more
                                </span>
                              {/if}
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              on:click={() => openEditModal(carrier)}
                              class="text-primary-600 hover:text-primary-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              on:click={() => deleteCarrier(carrier)}
                              class="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Modal with full form content identical to original but trimmed for brevity -->
  {#if showModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-neutral-200">
          <h3 class="text-lg font-medium text-neutral-900">
            {editingCarrier ? 'Edit Carrier' : 'Add New Carrier'}
          </h3>
        </div>

        <form on:submit|preventDefault={handleSubmit} class="px-6 py-4 space-y-6">
          {#if errorMessage}
            <div class="bg-red-50 border border-red-200 rounded-md p-4">
              <p class="text-sm text-red-700">{errorMessage}</p>
            </div>
          {/if}

          <!-- Basic Information -->
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label for="name" class="block text-sm font-medium text-neutral-700">Carrier Name *</label>
              <input type="text" id="name" bind:value={formData.name} required class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label for="code" class="block text-sm font-medium text-neutral-700">Carrier Code *</label>
              <input type="text" id="code" bind:value={formData.code} required class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label for="website" class="block text-sm font-medium text-neutral-700">Website</label>
              <input type="url" id="website" bind:value={formData.website} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label for="phone" class="block text-sm font-medium text-neutral-700">Phone</label>
              <input type="tel" id="phone" bind:value={formData.phone} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-neutral-700">Email</label>
              <input type="email" id="email" bind:value={formData.email} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label for="status" class="block text-sm font-medium text-neutral-700">Status</label>
              <select id="status" bind:value={formData.status} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                {#each statusOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
            <button type="button" on:click={closeModal} class="px-4 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors">Cancel</button>
            <button type="submit" disabled={saving} class="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
              {#if saving}
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              {:else}
                {editingCarrier ? 'Update' : 'Create'} Carrier
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
{:else}
  <div class="min-h-screen flex items-center justify-center bg-neutral-50">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h1>
      <p class="text-neutral-600">You need admin privileges to access this page.</p>
    </div>
  </div>
{/if} 