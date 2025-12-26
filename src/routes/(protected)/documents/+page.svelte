<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
  import { db } from '$lib/config/firebase';
  import { currentUser } from '$lib/services/auth';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
  import { fade } from 'svelte/transition';
  
  let documents: any[] = [];
  let loading = true;
  let searchTerm = '';
  let categoryFilter = 'all';
  let clientFilter = 'all';
  let showDeleteModal = false;
  let documentToDelete: any = null;
  let uploading = false;

  // Pagination
  let currentPage = 1;
  let itemsPerPage = 12;

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'policy', label: 'Policy Documents' },
    { value: 'claim', label: 'Claim Documents' },
    { value: 'quote', label: 'Quote Documents' },
    { value: 'certificate', label: 'Certificates' },
    { value: 'legal', label: 'Legal Documents' },
    { value: 'financial', label: 'Financial Documents' },
    { value: 'other', label: 'Other' }
  ];

  const clients = [
    { value: 'all', label: 'All Clients' },
    { value: 'client1', label: 'John Smith' },
    { value: 'client2', label: 'Sarah Johnson' },
    { value: 'client3', label: 'Mike Chen' },
    { value: 'client4', label: 'Emily Davis' },
    { value: 'client5', label: 'Robert Wilson' }
  ];

  onMount(async () => {
    await loadDocuments();
  });

  async function loadDocuments() {
    loading = true;
    
    // Load real data from Firebase
    if (!$currentUser) return;
    
    try {
      const isAdmin = $currentUser.role === 'admin';
      
      // Admin sees ALL documents, brokers see only their own
      const documentsQuery = isAdmin
        ? query(collection(db, 'documents'), orderBy('createdAt', 'desc'))
        : query(
            collection(db, 'documents'),
            where('brokerId', '==', $currentUser.uid),
            orderBy('createdAt', 'desc')
          );
      
      const documentsSnapshot = await getDocs(documentsQuery);
      
      documents = documentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.fileName || data.name || 'Untitled Document',
          type: data.fileType || data.type || 'pdf',
          size: data.fileSize || data.size || 1024000,
          category: data.category || 'other',
          client: {
            id: data.clientId || 'none',
            name: data.clientName || 'No Client'
          },
          uploadedAt: data.uploadedAt?.toDate() || data.createdAt?.toDate() || new Date(),
          uploadedBy: data.uploadedBy || data.brokerId || 'unknown',
          url: data.downloadUrl || data.url || `/documents/${doc.id}`,
          description: data.description || 'No description available',
          brokerId: data.brokerId // Include broker info for admin view
        };
      });
      
      // If no real data, show some sample data for demo
      if (documents.length === 0) {
        documents = [
          {
            id: '1',
            name: 'Auto Insurance Policy - John Smith.pdf',
            type: 'pdf',
            size: 1024000,
            category: 'policy',
            client: { id: 'client1', name: 'John Smith' },
            uploadedAt: new Date('2024-01-20'),
            uploadedBy: isAdmin ? 'broker-001' : $currentUser.uid,
            url: '/documents/1',
            description: 'Complete auto insurance policy documentation',
            brokerId: isAdmin ? 'broker-001' : $currentUser.uid
          },
          {
            id: '2',
            name: 'Claim Form - Vehicle Accident.pdf',
            type: 'pdf',
            size: 512000,
            category: 'claim',
            client: { id: 'client4', name: 'Emily Davis' },
            uploadedAt: new Date('2024-01-18'),
            uploadedBy: isAdmin ? 'broker-002' : $currentUser.uid,
            url: '/documents/2',
            description: 'Claim documentation for vehicle accident',
            brokerId: isAdmin ? 'broker-002' : $currentUser.uid
          }
        ];
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      documents = [];
    }
    
    loading = false;
  }

  $: filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.client.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesClient = clientFilter === 'all' || doc.client.id === clientFilter;
    
    return matchesSearch && matchesCategory && matchesClient;
  });

  $: paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  $: totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);

  function getFileIcon(type: string) {
    const icons = {
      pdf: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      docx: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      xlsx: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z',
      default: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    };
    return icons[type as keyof typeof icons] || icons.default;
  }

  function getFileTypeColor(type: string) {
    const colors = {
      pdf: 'text-red-600',
      docx: 'text-blue-600',
      xlsx: 'text-green-600',
      default: 'text-neutral-600'
    };
    return colors[type as keyof typeof colors] || colors.default;
  }

  function getCategoryBadge(category: string) {
    const badges = {
      policy: 'bg-blue-100 text-blue-800',
      claim: 'bg-red-100 text-red-800',
      quote: 'bg-yellow-100 text-yellow-800',
      certificate: 'bg-green-100 text-green-800',
      legal: 'bg-purple-100 text-purple-800',
      financial: 'bg-orange-100 text-orange-800',
      other: 'bg-neutral-100 text-neutral-800'
    };
    return badges[category as keyof typeof badges] || badges.other;
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US').format(date);
  }

  function handleUpload() {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg';
    
    input.onchange = async (e: any) => {
      const files = e.target.files;
      if (files.length > 0) {
        uploading = true;
        
        // Mock upload process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Add mock documents
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const newDoc = {
            id: Date.now().toString() + i,
            name: file.name,
            type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
            size: file.size,
            category: 'other',
            client: { id: 'client1', name: 'John Smith' },
            uploadedAt: new Date(),
            uploadedBy: 'current_user',
            url: `/documents/${Date.now() + i}`,
            description: 'Recently uploaded document'
          };
          documents = [newDoc, ...documents];
        }
        
        uploading = false;
      }
    };
    
    input.click();
  }

  function handleView(document: any) {
    // In a real app, this would open the document viewer
    window.open(document.url, '_blank');
  }

  function handleDownload(document: any) {
    // In a real app, this would trigger the download
    console.log('Downloading:', document.name);
  }

  function confirmDelete(document: any) {
    documentToDelete = document;
    showDeleteModal = true;
  }

  async function handleDelete() {
    if (!documentToDelete) return;
    
    documents = documents.filter(d => d.id !== documentToDelete.id);
    
    showDeleteModal = false;
    documentToDelete = null;
  }
</script>

<svelte:head>
  <title>Documents - Insurance Broker Pro</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-neutral-900">Documents</h1>
      <p class="mt-1 text-sm text-neutral-600">
        Manage and organize client documents and files
      </p>
    </div>
    <div class="mt-4 sm:mt-0">
      <button
        on:click={handleUpload}
        disabled={uploading}
        class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if uploading}
          <LoadingSpinner size="sm" color="white" />
          <span class="ml-2">Uploading...</span>
        {:else}
          Upload Documents
        {/if}
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
          placeholder="Search documents, clients, or descriptions..."
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div>
        <label for="category" class="block text-sm font-medium text-neutral-700 mb-2">
          Category
        </label>
        <select
          id="category"
          bind:value={categoryFilter}
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {#each categories as category}
            <option value={category.value}>{category.label}</option>
          {/each}
        </select>
      </div>
      
      <div>
        <label for="client" class="block text-sm font-medium text-neutral-700 mb-2">
          Client
        </label>
        <select
          id="client"
          bind:value={clientFilter}
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {#each clients as client}
            <option value={client.value}>{client.label}</option>
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
    <!-- Documents Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {#each paginatedDocuments as document (document.id)}
        <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow" transition:fade>
          <!-- Document Icon and Type -->
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-neutral-50 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 {getFileTypeColor(document.type)}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getFileIcon(document.type)} />
              </svg>
            </div>
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize {getCategoryBadge(document.category)}">
              {document.category}
            </span>
          </div>

          <!-- Document Name -->
          <h3 class="text-sm font-semibold text-neutral-900 mb-2 truncate" title={document.name}>
            {document.name}
          </h3>

          <!-- Description -->
          <p class="text-xs text-neutral-600 mb-4 line-clamp-2">
            {document.description}
          </p>

          <!-- Client and File Info -->
          <div class="space-y-2 mb-4">
            <div class="flex items-center text-xs text-neutral-600">
              <svg class="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div class="flex flex-col">
                <span>{document.client.name}</span>
                {#if $currentUser?.role === 'admin' && document.brokerId}
                  <span class="text-xs text-blue-600">Broker: {document.brokerId}</span>
                {/if}
              </div>
            </div>
            <div class="flex items-center text-xs text-neutral-600">
              <svg class="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(document.uploadedAt)}
            </div>
            <div class="flex items-center text-xs text-neutral-600">
              <svg class="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {formatFileSize(document.size)}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between pt-4 border-t border-neutral-200">
            <div class="flex space-x-2">
              <button
                on:click={() => handleView(document)}
                class="text-primary-600 hover:text-primary-900 text-xs font-medium"
              >
                View
              </button>
              <button
                on:click={() => handleDownload(document)}
                class="text-neutral-600 hover:text-neutral-900 text-xs font-medium"
              >
                Download
              </button>
            </div>
            {#if $currentUser?.role === 'admin' || document.brokerId === $currentUser?.uid}
              <button
                on:click={() => confirmDelete(document)}
                class="text-red-600 hover:text-red-900 text-xs font-medium"
              >
                Delete
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex items-center justify-center space-x-2 pt-6">
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
    {/if}
  {/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" transition:fade>
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-medium text-neutral-900 mb-4">Delete Document</h3>
      <p class="text-neutral-600 mb-6">
        Are you sure you want to delete "{documentToDelete?.name}"? This action cannot be undone.
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