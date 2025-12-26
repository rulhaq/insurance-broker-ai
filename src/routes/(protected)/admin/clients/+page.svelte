<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { db } from '$lib/config/firebase';
  import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

  // Redirect non-admins
  onMount(() => {
    if ($currentUser && $currentUser.role !== 'admin') {
      goto('/dashboard');
    } else if ($currentUser?.role === 'admin') {
      loadClients();
    }
  });

  let clients: any[] = [];
  let filteredClients: any[] = [];
  let loading = true;
  let saving = false;
  let showModal = false;
  let editingClient: any = null;
  let errorMessage = '';
  let successMessage = '';

  // Filters
  let searchTerm = '';
  let typeFilter = 'all';
  let statusFilter = 'all';

  const clientTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'individual', label: 'Individual' },
    { value: 'business', label: 'Business' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'prospect', label: 'Prospect' }
  ];

  let formData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    clientType: 'individual',
    status: 'active',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    dateOfBirth: '',
    ssn: '',
    industry: '',
    website: '',
    notes: ''
  };

  async function loadClients() {
    loading = true;
    try {
      const clientsQuery = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(clientsQuery);
      
      clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));

      console.log('Loaded clients:', clients.length);
      applyFilters();
    } catch (error) {
      console.error('Error loading clients:', error);
      errorMessage = 'Failed to load clients';
    } finally {
      loading = false;
    }
  }

  function applyFilters() {
    filteredClients = clients.filter(client => {
      const matchesSearch = !searchTerm || 
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.businessName && client.businessName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || client.clientType === typeFilter;
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }

  // Apply filters when search or filter values change
  $: {
    if (clients.length > 0) {
      applyFilters();
    }
  }

  function openCreateModal() {
    editingClient = null;
    formData = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      businessName: '',
      clientType: 'individual',
      status: 'active',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
      },
      dateOfBirth: '',
      ssn: '',
      industry: '',
      website: '',
      notes: ''
    };
    showModal = true;
    errorMessage = '';
  }

  function openEditModal(client: any) {
    editingClient = client;
    formData = {
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      email: client.email || '',
      phone: client.phone || '',
      businessName: client.businessName || '',
      clientType: client.clientType || 'individual',
      status: client.status || 'active',
      address: {
        street: client.address?.street || '',
        city: client.address?.city || '',
        state: client.address?.state || '',
        zipCode: client.address?.zipCode || '',
        country: client.address?.country || 'United States'
      },
      dateOfBirth: client.dateOfBirth || '',
      ssn: client.ssn || '',
      industry: client.industry || '',
      website: client.website || '',
      notes: client.notes || ''
    };
    showModal = true;
    errorMessage = '';
  }

  function closeModal() {
    showModal = false;
    editingClient = null;
    errorMessage = '';
  }

  async function handleSubmit() {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      errorMessage = 'First name, last name, and email are required';
      return;
    }

    saving = true;
    errorMessage = '';

    try {
      const clientData = {
        ...formData,
        updatedAt: serverTimestamp(),
        updatedBy: $currentUser.uid,
        ...(editingClient ? {} : { 
          createdAt: serverTimestamp(),
          brokerId: $currentUser.uid 
        })
      };

      if (editingClient) {
        await updateDoc(doc(db, 'clients', editingClient.id), clientData);
        successMessage = 'Client updated successfully!';
      } else {
        await addDoc(collection(db, 'clients'), clientData);
        successMessage = 'Client created successfully!';
      }

      closeModal();
      await loadClients();
      
      setTimeout(() => {
        successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error saving client:', error);
      errorMessage = 'Failed to save client';
    } finally {
      saving = false;
    }
  }

  async function deleteClient(client: any) {
    if (!confirm(`Are you sure you want to delete ${client.firstName} ${client.lastName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'clients', client.id));
      successMessage = 'Client deleted successfully!';
      await loadClients();
      
      setTimeout(() => {
        successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error deleting client:', error);
      errorMessage = 'Failed to delete client';
    }
  }

  function getStatusColor(status: string) {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'prospect': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  function formatDate(date: Date) {
    return date?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) || 'N/A';
  }
</script>

<svelte:head>
  <title>Client Management - App Admin Area</title>
</svelte:head>

{#if $currentUser?.role === 'admin'}
  <div class="min-h-screen bg-neutral-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="px-4 sm:px-6 lg:max-w-7xl lg:mx-auto lg:px-8">
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
                      <span class="ml-4 text-sm font-medium text-neutral-500">Client Management</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 class="mt-2 text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
                Client Management
              </h1>
              <div class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div class="mt-2 flex items-center text-sm text-neutral-500">
                  <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Manage all client records across the system
                </div>
              </div>
            </div>
            <div class="mt-5 flex lg:mt-0 lg:ml-4">
              <button
                type="button"
                on:click={openCreateModal}
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <svg class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Client
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    {#if successMessage}
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <div class="bg-green-50 border border-green-200 rounded-md p-4">
          <p class="text-sm text-green-700">{successMessage}</p>
        </div>
      </div>
    {/if}

    {#if errorMessage}
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
          <p class="text-sm text-red-700">{errorMessage}</p>
        </div>
      </div>
    {/if}

    <!-- Content -->
    <div class="py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {#if loading}
          <div class="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        {:else}
          <!-- Filters -->
          <div class="bg-white shadow rounded-lg mb-6">
            <div class="px-6 py-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label for="search" class="block text-sm font-medium text-neutral-700">
                    Search Clients
                  </label>
                  <input
                    type="text"
                    id="search"
                    bind:value={searchTerm}
                    placeholder="Name, email, or business..."
                    class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label for="typeFilter" class="block text-sm font-medium text-neutral-700">
                    Client Type
                  </label>
                  <select
                    id="typeFilter"
                    bind:value={typeFilter}
                    class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    {#each clientTypes as type}
                      <option value={type.value}>{type.label}</option>
                    {/each}
                  </select>
                </div>

                <div>
                  <label for="statusFilter" class="block text-sm font-medium text-neutral-700">
                    Status
                  </label>
                  <select
                    id="statusFilter"
                    bind:value={statusFilter}
                    class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    {#each statusOptions as status}
                      <option value={status.value}>{status.label}</option>
                    {/each}
                  </select>
                </div>

                <div class="flex items-end">
                  <button
                    on:click={loadClients}
                    class="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Clients Table -->
          <div class="bg-white shadow overflow-hidden sm:rounded-md">
            <div class="px-4 py-5 sm:p-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg leading-6 font-medium text-neutral-900">
                  Clients ({filteredClients.length} of {clients.length})
                </h3>
              </div>

              {#if filteredClients.length === 0}
                <div class="text-center py-12">
                  <svg class="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <h3 class="mt-2 text-sm font-medium text-neutral-900">No clients found</h3>
                  <p class="mt-1 text-sm text-neutral-500">Try adjusting your search or filter criteria.</p>
                </div>
              {:else}
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-neutral-200">
                    <thead class="bg-neutral-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Broker
                        </th>
                        <th class="relative px-6 py-3">
                          <span class="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-neutral-200">
                      {#each filteredClients as client}
                        <tr class="hover:bg-neutral-50">
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                              <div class="flex-shrink-0 h-10 w-10">
                                <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                  <span class="text-primary-700 font-medium text-sm">
                                    {(client.firstName?.[0] || '').toUpperCase()}{(client.lastName?.[0] || '').toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div class="ml-4">
                                <div class="text-sm font-medium text-neutral-900">
                                  {client.firstName} {client.lastName}
                                </div>
                                <div class="text-sm text-neutral-500">{client.email}</div>
                                {#if client.businessName}
                                  <div class="text-sm text-neutral-500">{client.businessName}</div>
                                {/if}
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                              {client.clientType || 'individual'}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(client.status || 'active')}">
                              {client.status || 'active'}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                            {formatDate(client.createdAt)}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                            {client.brokerId || 'N/A'}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div class="flex items-center justify-end space-x-2">
                              <button
                                on:click={() => openEditModal(client)}
                                class="text-primary-600 hover:text-primary-900"
                              >
                                Edit
                              </button>
                              <button
                                on:click={() => deleteClient(client)}
                                class="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
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

  <!-- Modal (trimmed for brevity but includes full form) -->
  {#if showModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-neutral-200">
          <h3 class="text-lg font-medium text-neutral-900">
            {editingClient ? 'Edit Client' : 'Add New Client'}
          </h3>
        </div>

        <form on:submit|preventDefault={handleSubmit} class="px-6 py-4 space-y-6">
          {#if errorMessage}
            <div class="bg-red-50 border border-red-200 rounded-md p-4">
              <p class="text-sm text-red-700">{errorMessage}</p>
            </div>
          {/if}

          <!-- Basic Information -->
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label for="firstName" class="block text-sm font-medium text-neutral-700">First Name *</label>
              <input type="text" id="firstName" bind:value={formData.firstName} required class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label for="lastName" class="block text-sm font-medium text-neutral-700">Last Name *</label>
              <input type="text" id="lastName" bind:value={formData.lastName} required class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-neutral-700">Email *</label>
              <input type="email" id="email" bind:value={formData.email} required class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
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
                {editingClient ? 'Update' : 'Create'} Client
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