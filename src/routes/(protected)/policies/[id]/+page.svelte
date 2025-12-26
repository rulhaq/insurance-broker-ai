<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { db } from '$lib/config/firebase';
  import { doc, getDoc } from 'firebase/firestore';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

  let policy: any = null;
  let loading = true;
  let error = '';

  $: policyId = $page.params.id;

  onMount(async () => {
    await loadPolicy();
  });

  async function loadPolicy() {
    if (!policyId || !$currentUser) return;
    
    loading = true;
    try {
      const policyDoc = await getDoc(doc(db, 'policies', policyId));
      
      if (!policyDoc.exists()) {
        error = 'Policy not found';
        return;
      }

      const policyData = policyDoc.data();
      
      // Check permissions
      if ($currentUser.role !== 'admin' && policyData.brokerId !== $currentUser.uid) {
        error = 'Access denied';
        return;
      }

      policy = {
        id: policyDoc.id,
        ...policyData,
        createdAt: policyData.createdAt?.toDate(),
        updatedAt: policyData.updatedAt?.toDate(),
        dates: {
          effective: policyData.dates?.effective?.toDate ? policyData.dates.effective.toDate() : new Date(policyData.dates?.effective),
          expiration: policyData.dates?.expiration?.toDate ? policyData.dates.expiration.toDate() : new Date(policyData.dates?.expiration)
        }
      };
    } catch (err) {
      console.error('Error loading policy:', err);
      error = 'Failed to load policy';
    } finally {
      loading = false;
    }
  }

  function handleEdit() {
    goto(`/policies/${policyId}/edit`);
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDate(date: Date) {
    return date?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) || 'N/A';
  }

  function getStatusColor(status: string) {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800',
      'expired': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
</script>

<div class="min-h-screen bg-neutral-50 py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button
            on:click={() => goto('/policies')}
            class="text-neutral-600 hover:text-neutral-900"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 class="text-3xl font-bold text-neutral-900">Policy Details</h1>
            <p class="text-neutral-600">View and manage policy information</p>
          </div>
        </div>
        
        {#if policy && ($currentUser?.role === 'admin' || policy.brokerId === $currentUser?.uid)}
          <button
            on:click={handleEdit}
            class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Edit Policy
          </button>
        {/if}
      </div>
    </div>

    {#if loading}
      <div class="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error</h3>
            <p class="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    {:else if policy}
      <!-- Policy Information -->
      <div class="bg-white shadow rounded-lg">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-neutral-200">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-neutral-900">{policy.policyNumber}</h2>
              <p class="text-neutral-600">{policy.clientName}</p>
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(policy.status)}">
              {policy.status?.toUpperCase()}
            </span>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 py-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Basic Information -->
            <div>
              <h3 class="text-lg font-medium text-neutral-900 mb-4">Basic Information</h3>
              <dl class="space-y-3">
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Policy Number</dt>
                  <dd class="text-sm text-neutral-900">{policy.policyNumber}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Client</dt>
                  <dd class="text-sm text-neutral-900">{policy.clientName}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Product Type</dt>
                  <dd class="text-sm text-neutral-900 capitalize">{policy.productType?.replace('_', ' ')}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Carrier</dt>
                  <dd class="text-sm text-neutral-900">{policy.carrier}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Status</dt>
                  <dd class="text-sm text-neutral-900 capitalize">{policy.status}</dd>
                </div>
              </dl>
            </div>

            <!-- Premium Information -->
            <div>
              <h3 class="text-lg font-medium text-neutral-900 mb-4">Premium Information</h3>
              <dl class="space-y-3">
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Annual Premium</dt>
                  <dd class="text-sm text-neutral-900">{formatCurrency(policy.premium?.annual || 0)}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Monthly Premium</dt>
                  <dd class="text-sm text-neutral-900">{formatCurrency(policy.premium?.monthly || 0)}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Commission Rate</dt>
                  <dd class="text-sm text-neutral-900">{policy.commission?.rate || 0}%</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Commission Amount</dt>
                  <dd class="text-sm text-neutral-900">{formatCurrency(policy.commission?.amount || 0)}</dd>
                </div>
              </dl>
            </div>

            <!-- Coverage Details -->
            <div>
              <h3 class="text-lg font-medium text-neutral-900 mb-4">Coverage Details</h3>
              <dl class="space-y-3">
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Per Occurrence Limit</dt>
                  <dd class="text-sm text-neutral-900">{formatCurrency(policy.coverage?.limits?.perOccurrence || 0)}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Aggregate Limit</dt>
                  <dd class="text-sm text-neutral-900">{formatCurrency(policy.coverage?.limits?.aggregate || 0)}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Deductible</dt>
                  <dd class="text-sm text-neutral-900">{formatCurrency(policy.coverage?.deductible || 0)}</dd>
                </div>
              </dl>
            </div>

            <!-- Important Dates -->
            <div>
              <h3 class="text-lg font-medium text-neutral-900 mb-4">Important Dates</h3>
              <dl class="space-y-3">
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Effective Date</dt>
                  <dd class="text-sm text-neutral-900">{formatDate(policy.dates?.effective)}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Expiration Date</dt>
                  <dd class="text-sm text-neutral-900">{formatDate(policy.dates?.expiration)}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Created</dt>
                  <dd class="text-sm text-neutral-900">{formatDate(policy.createdAt)}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Last Updated</dt>
                  <dd class="text-sm text-neutral-900">{formatDate(policy.updatedAt)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Notes -->
          {#if policy.notes}
            <div class="mt-8">
              <h3 class="text-lg font-medium text-neutral-900 mb-4">Notes</h3>
              <div class="bg-neutral-50 rounded-md p-4">
                <p class="text-sm text-neutral-700 whitespace-pre-wrap">{policy.notes}</p>
              </div>
            </div>
          {/if}

          <!-- Broker Information (Admin only) -->
          {#if $currentUser?.role === 'admin' && policy.brokerId}
            <div class="mt-8">
              <h3 class="text-lg font-medium text-neutral-900 mb-4">Broker Information</h3>
              <dl class="space-y-3">
                <div>
                  <dt class="text-sm font-medium text-neutral-500">Broker ID</dt>
                  <dd class="text-sm text-neutral-900 font-mono">{policy.brokerId}</dd>
                </div>
                {#if policy.brokerName}
                  <div>
                    <dt class="text-sm font-medium text-neutral-500">Broker Name</dt>
                    <dd class="text-sm text-neutral-900">{policy.brokerName}</dd>
                  </div>
                {/if}
              </dl>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div> 