<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
  import { db } from '$lib/config/firebase';
  import { currentUser } from '$lib/services/auth';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
  import { fade } from 'svelte/transition';
  
  // Real data from Firebase
  let quotes: any[] = [];
  let loading = true;
  let searchTerm = '';
  let statusFilter = 'all';
  let typeFilter = 'all';
  let showDeleteModal = false;
  let quoteToDelete: any = null;

  // Pagination
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalItems = 0;

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'declined', label: 'Declined' },
    { value: 'expired', label: 'Expired' }
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
    await loadQuotes();
  });

  // Reload quotes when user changes
  $: if ($currentUser) {
    loadQuotes();
  }

  async function loadQuotes() {
    loading = true;
    
    // Load real data from Firebase
    if (!$currentUser) return;
    
    try {
      const isAdmin = $currentUser.role === 'admin';
      
      // Admin sees ALL quotes, brokers see only their own
      const quotesQuery = isAdmin
        ? query(collection(db, 'quotes'), orderBy('createdAt', 'desc'))
        : query(
            collection(db, 'quotes'),
            where('brokerId', '==', $currentUser.uid),
            orderBy('createdAt', 'desc')
          );
      
      const quotesSnapshot = await getDocs(quotesQuery);
      
      quotes = quotesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          client: { 
            name: data.customerName || data.clientName || 'Unknown Customer',
            email: data.customerEmail || data.clientEmail || 'no-email@example.com'
          },
          type: data.coverageType || 'general',
          status: data.status,
          premium: data.selectedQuote?.monthlyPremium || data.premium?.monthly || 0,
          coverage: `${data.coverageType?.replace('_', ' ') || 'Insurance'} Coverage`,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.dates?.expiration?.toDate() || new Date(),
          provider: data.selectedQuote?.carrierName || data.carrier || 'N/A',
          brokerId: data.brokerId // Include broker info for admin view
        };
      });
      
      totalItems = quotes.length;
    } catch (error) {
      console.error('Error loading quotes:', error);
      quotes = [];
      totalItems = 0;
    }
    loading = false;
  }

  $: filteredQuotes = quotes.filter(quote => {
    const matchesSearch = !searchTerm || 
      quote.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.coverage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.provider.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    const matchesType = typeFilter === 'all' || quote.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  $: paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  $: totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);

  function getStatusBadge(status: string) {
    const badges = {
      draft: 'bg-neutral-100 text-neutral-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      expired: 'bg-neutral-100 text-neutral-600'
    };
    return badges[status as keyof typeof badges] || badges.draft;
  }

  function handleCreateQuote() {
    goto('/quotes/new');
  }

  function handleViewQuote(id: string) {
    goto(`/quotes/${id}`);
  }

  function handleEditQuote(id: string) {
    goto(`/quotes/${id}/edit`);
  }

  function confirmDelete(quote: any) {
    quoteToDelete = quote;
    showDeleteModal = true;
  }

  async function handleDelete() {
    if (!quoteToDelete) return;
    
    try {
      // Actually delete from Firebase
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'quotes', quoteToDelete.id));
      
      // Remove from local state
      quotes = quotes.filter(q => q.id !== quoteToDelete.id);
      totalItems = quotes.length;
      console.log('✅ Quote deleted successfully');
    } catch (error) {
      console.error('Error deleting quote:', error);
    } finally {
      showDeleteModal = false;
      quoteToDelete = null;
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US').format(date);
  }
</script>

<svelte:head>
  <title>Quotes - Insurance Broker Pro</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-neutral-900">Quotes</h1>
      <p class="mt-1 text-sm text-neutral-600">
        Manage insurance quotes and proposals
      </p>
    </div>
    <div class="mt-4 sm:mt-0">
      <button
        on:click={handleCreateQuote}
        class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
      >
        Create Quote
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
          placeholder="Search quotes, clients, or providers..."
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
    <!-- Quotes Table -->
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200">
          <thead class="bg-neutral-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Client
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Coverage
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Provider
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Premium
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Expires
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-200">
            {#each paginatedQuotes as quote (quote.id)}
              <tr class="hover:bg-neutral-50" transition:fade>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-neutral-900">{quote.client.name}</div>
                    <div class="text-sm text-neutral-500">{quote.client.email}</div>
                    {#if $currentUser?.role === 'admin' && quote.brokerId}
                      <div class="text-xs text-blue-600">Broker: {quote.brokerId}</div>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-neutral-900">{quote.coverage}</div>
                  <div class="text-sm text-neutral-500 capitalize">{quote.type}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                  {quote.provider}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                  {formatCurrency(quote.premium)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize {getStatusBadge(quote.status)}">
                    {quote.status}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                  {formatDate(quote.expiresAt)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      on:click={() => handleViewQuote(quote.id)}
                      class="text-primary-600 hover:text-primary-900"
                    >
                      View
                    </button>
                    {#if $currentUser?.role === 'admin' || quote.brokerId === $currentUser?.uid}
                      <button
                        on:click={() => handleEditQuote(quote.id)}
                        class="text-neutral-600 hover:text-neutral-900"
                      >
                        Edit
                      </button>
                      <button
                        on:click={() => confirmDelete(quote)}
                        class="text-red-600 hover:text-red-900"
                      >
                        Delete
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredQuotes.length)} of {filteredQuotes.length} results
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

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" transition:fade>
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-medium text-neutral-900 mb-4">Delete Quote</h3>
      <p class="text-neutral-600 mb-6">
        Are you sure you want to delete the quote for {quoteToDelete?.client?.name}? This action cannot be undone.
      </p>
      <div class="flex justify-end space-x-3">
        <button
          on:click={() => showDeleteModal = false}
          class="px-4 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          on:click={handleDelete}
          class="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
{/if} 