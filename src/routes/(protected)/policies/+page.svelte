<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
  import { db } from '$lib/config/firebase';
  import { currentUser } from '$lib/services/auth';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
  import { fade } from 'svelte/transition';
  
  let policies: any[] = [];
  let loading = true;
  let searchTerm = '';
  let statusFilter = 'all';
  let typeFilter = 'all';
  let showCancelModal = false;
  let policyToCancel: any = null;

  // Pagination
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalItems = 0;

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'suspended', label: 'Suspended' }
  ];

  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'auto', label: 'Auto Insurance' },
    { value: 'home', label: 'Home Insurance' },
    { value: 'life', label: 'Life Insurance' },
    { value: 'commercial', label: 'Commercial Insurance' },
    { value: 'health', label: 'Health Insurance' }
  ];

  onMount(async () => {
    await loadPolicies();
  });

  async function loadPolicies() {
    loading = true;
    
    // Load real data from Firebase
    if (!$currentUser) return;
    
    try {
      const isAdmin = $currentUser.role === 'admin';
      
      // Admin sees ALL policies, brokers see only their own
      const policiesQuery = isAdmin
        ? query(collection(db, 'policies'), orderBy('createdAt', 'desc'))
        : query(
            collection(db, 'policies'),
            where('brokerId', '==', $currentUser.uid),
            orderBy('createdAt', 'desc')
          );
      
      const policiesSnapshot = await getDocs(policiesQuery);
      
      policies = policiesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          policyNumber: data.policyNumber || `POL-${doc.id.substring(0, 8)}`,
          client: { 
            name: data.clientName || 'Unknown Client',
            email: data.clientEmail || 'no-email@example.com'
          },
          type: data.productType || data.coverageType || 'general',
          status: data.status || 'active',
          premium: data.premium?.annual || data.premium?.monthly * 12 || 0,
          coverage: data.coverage?.description || `${data.productType?.replace('_', ' ') || 'Insurance'} Coverage`,
          provider: data.carrier || 'N/A',
          effectiveDate: data.dates?.effective?.toDate() || new Date(),
          expirationDate: data.dates?.expiration?.toDate() || new Date(),
          lastPayment: data.lastPayment?.toDate() || null,
          nextPayment: data.nextPayment?.toDate() || null,
          brokerId: data.brokerId // Include broker info for admin view
        };
      });
      
      // If no real data, show some sample data for display
      if (policies.length === 0) {
        policies = [
          {
            id: 'POL-001',
            policyNumber: 'AUTO-2024-001',
            client: { name: 'John Smith', email: 'john.smith@email.com' },
            type: 'auto',
            status: 'active',
            premium: 1200,
            coverage: 'Full Coverage Auto',
            provider: 'State Farm',
            effectiveDate: new Date('2024-01-01'),
            expirationDate: new Date('2024-12-31'),
            lastPayment: new Date('2024-01-01'),
            nextPayment: new Date('2024-02-01'),
            brokerId: isAdmin ? 'broker-001' : $currentUser.uid
          },
          {
            id: 'POL-002',
            policyNumber: 'HOME-2024-002',
            client: { name: 'Sarah Johnson', email: 'sarah.j@email.com' },
            type: 'home',
            status: 'active',
            premium: 2500,
            coverage: 'Homeowners Premium',
            provider: 'Allstate',
            effectiveDate: new Date('2024-01-15'),
            expirationDate: new Date('2025-01-14'),
            lastPayment: new Date('2024-01-15'),
            nextPayment: new Date('2024-02-15'),
            brokerId: isAdmin ? 'broker-002' : $currentUser.uid
          }
        ];
      }
      
      totalItems = policies.length;
    } catch (error) {
      console.error('Error loading policies:', error);
      // Fallback to sample data for demo
      policies = [];
      totalItems = 0;
    }
    loading = false;
  }

  $: filteredPolicies = policies.filter(policy => {
    const matchesSearch = !searchTerm || 
      policy.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.coverage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.provider.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;
    const matchesType = typeFilter === 'all' || policy.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  $: paginatedPolicies = filteredPolicies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  $: totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);

  function getStatusBadge(status: string) {
    const badges = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-neutral-100 text-neutral-600',
      suspended: 'bg-orange-100 text-orange-800'
    };
    return badges[status as keyof typeof badges] || badges.pending;
  }

  function handleCreatePolicy() {
    goto('/policies/new');
  }

  function handleViewPolicy(id: string) {
    goto(`/policies/${id}`);
  }

  function handleEditPolicy(id: string) {
    goto(`/policies/${id}/edit`);
  }

  function confirmCancel(policy: any) {
    policyToCancel = policy;
    showCancelModal = true;
  }

  async function handleCancel() {
    if (!policyToCancel) return;
    
    // Mock cancellation - replace with actual API call
    const index = policies.findIndex(p => p.id === policyToCancel.id);
    if (index !== -1) {
      policies[index].status = 'cancelled';
      policies = [...policies];
    }
    
    showCancelModal = false;
    policyToCancel = null;
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDate(date: Date | null) {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US').format(date);
  }

  function isRenewalDue(policy: any) {
    if (!policy.expirationDate || policy.status !== 'active') return false;
    const daysUntilExpiry = Math.ceil((policy.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30;
  }
</script>

<svelte:head>
  <title>Policies - Insurance Broker Pro</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-neutral-900">Policies</h1>
      <p class="mt-1 text-sm text-neutral-600">
        Manage active insurance policies and renewals
      </p>
    </div>
    <div class="mt-4 sm:mt-0">
      <button
        on:click={handleCreatePolicy}
        class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
      >
        Create Policy
      </button>
    </div>
  </div>

  <!-- Search and Filters -->
  <div class="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label for="search" class="block text-sm font-medium text-neutral-700 mb-2">
          Search
        </label>
        <input
          id="search"
          type="text"
          bind:value={searchTerm}
          placeholder="Search policies, clients, or providers..."
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div>
        <label for="status" class="block text-sm font-medium text-neutral-700 mb-2">
          Status
        </label>
        <select
          id="status"
          bind:value={statusFilter}
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {#each statuses as status}
            <option value={status.value}>{status.label}</option>
          {/each}
        </select>
      </div>
      
      <div>
        <label for="type" class="block text-sm font-medium text-neutral-700 mb-2">
          Type
        </label>
        <select
          id="type"
          bind:value={typeFilter}
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {#each types as type}
            <option value={type.value}>{type.label}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>
  {:else}
    <!-- Policies Table -->
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200">
          <thead class="bg-neutral-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Policy
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Client
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Coverage
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Premium
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Expiration
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-200">
            {#each paginatedPolicies as policy (policy.id)}
              <tr class="hover:bg-neutral-50" transition:fade>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-neutral-900">{policy.policyNumber}</div>
                    <div class="text-sm text-neutral-500">{policy.provider}</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-neutral-900">{policy.client.name}</div>
                    <div class="text-sm text-neutral-500">{policy.client.email}</div>
                    {#if $currentUser?.role === 'admin' && policy.brokerId}
                      <div class="text-xs text-blue-600">Broker: {policy.brokerId}</div>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-neutral-900">{policy.coverage}</div>
                  <div class="text-sm text-neutral-500 capitalize">{policy.type}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                  {formatCurrency(policy.premium)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center space-x-2">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize {getStatusBadge(policy.status)}">
                      {policy.status}
                    </span>
                    {#if isRenewalDue(policy)}
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        Renewal Due
                      </span>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                  {formatDate(policy.expirationDate)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      on:click={() => handleViewPolicy(policy.id)}
                      class="text-primary-600 hover:text-primary-900"
                    >
                      View
                    </button>
                    {#if ($currentUser?.role === 'admin' || policy.brokerId === $currentUser?.uid) && policy.status === 'active'}
                      <button
                        on:click={() => handleEditPolicy(policy.id)}
                        class="text-neutral-600 hover:text-neutral-900"
                      >
                        Edit
                      </button>
                      <button
                        on:click={() => confirmCancel(policy)}
                        class="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="bg-white px-4 py-3 border-t border-neutral-200 sm:px-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <p class="text-sm text-neutral-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPolicies.length)} of {filteredPolicies.length} results
              </p>
            </div>
            <div class="flex items-center space-x-2">
              <button
                on:click={() => currentPage = Math.max(1, currentPage - 1)}
                disabled={currentPage === 1}
                class="px-3 py-1 text-sm bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
                {#if page === currentPage}
                  <span class="px-3 py-1 text-sm bg-primary-600 text-white rounded-md">
                    {page}
                  </span>
                {:else}
                  <button
                    on:click={() => currentPage = page}
                    class="px-3 py-1 text-sm bg-white border border-neutral-300 rounded-md hover:bg-neutral-50"
                  >
                    {page}
                  </button>
                {/if}
              {/each}
              
              <button
                on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
                disabled={currentPage === totalPages}
                class="px-3 py-1 text-sm bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Cancel Confirmation Modal -->
{#if showCancelModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" transition:fade>
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-medium text-neutral-900 mb-4">Cancel Policy</h3>
      <p class="text-neutral-600 mb-6">
        Are you sure you want to cancel policy {policyToCancel?.policyNumber} for {policyToCancel?.client?.name}? This action will require manual processing.
      </p>
      <div class="flex justify-end space-x-3">
        <button
          on:click={() => showCancelModal = false}
          class="px-4 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          on:click={handleCancel}
          class="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
        >
          Cancel Policy
        </button>
      </div>
    </div>
  </div>
{/if} 