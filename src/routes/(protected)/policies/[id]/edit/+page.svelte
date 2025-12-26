<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { db } from '$lib/config/firebase';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

  let policy: any = null;
  let loading = true;
  let saving = false;
  let error = '';
  let successMessage = '';

  let formData = {
    productType: '',
    carrier: '',
    status: '',
    effectiveDate: '',
    expirationDate: '',
    coverageLimits: {
      perOccurrence: '',
      aggregate: ''
    },
    deductible: '',
    notes: ''
  };

  const productTypes = [
    { value: 'general_liability', label: 'General Liability' },
    { value: 'professional_liability', label: 'Professional Liability' },
    { value: 'commercial_auto', label: 'Commercial Auto' },
    { value: 'workers_compensation', label: 'Workers Compensation' },
    { value: 'cyber_liability', label: 'Cyber Liability' },
    { value: 'directors_officers', label: 'Directors & Officers' },
    { value: 'property', label: 'Commercial Property' },
    { value: 'umbrella', label: 'Umbrella Policy' }
  ];

  const carriers = [
    'State Farm', 'Allstate', 'Progressive', 'Liberty Mutual', 'Farmers',
    'Travelers', 'Nationwide', 'USAA', 'Geico', 'Hartford', 'Zurich', 'AIG'
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'expired', label: 'Expired' }
  ];

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
        ...policyData
      };

      // Populate form
      formData = {
        productType: policy.productType || '',
        carrier: policy.carrier || '',
        status: policy.status || '',
        effectiveDate: policy.dates?.effective ? formatDateForInput(policy.dates.effective.toDate ? policy.dates.effective.toDate() : new Date(policy.dates.effective)) : '',
        expirationDate: policy.dates?.expiration ? formatDateForInput(policy.dates.expiration.toDate ? policy.dates.expiration.toDate() : new Date(policy.dates.expiration)) : '',
        coverageLimits: {
          perOccurrence: policy.coverage?.limits?.perOccurrence?.toString() || '',
          aggregate: policy.coverage?.limits?.aggregate?.toString() || ''
        },
        deductible: policy.coverage?.deductible?.toString() || '',
        notes: policy.notes || ''
      };
    } catch (err) {
      console.error('Error loading policy:', err);
      error = 'Failed to load policy';
    } finally {
      loading = false;
    }
  }

  function formatDateForInput(date: Date) {
    return date.toISOString().split('T')[0];
  }

  function calculatePremium(formData: any) {
    // Base premium calculation based on coverage type
    const basePremiums = {
      'general_liability': 2000,
      'professional_liability': 3000,
      'cyber_liability': 2500,
      'directors_officers': 4000,
      'employment_practices': 2200,
      'commercial_auto': 2800,
      'workers_compensation': 3500,
      'property': 1800,
      'umbrella': 1200
    };

    const basePremium = basePremiums[formData.productType] || 2000;
    
    // Calculate premium based on coverage limits
    const perOccurrenceLimit = parseInt(formData.coverageLimits.perOccurrence);
    const aggregateLimit = parseInt(formData.coverageLimits.aggregate);
    const deductible = parseInt(formData.deductible);

    // Premium multipliers based on coverage amounts
    let limitMultiplier = 1;
    if (perOccurrenceLimit >= 5000000) limitMultiplier = 2.5;
    else if (perOccurrenceLimit >= 2000000) limitMultiplier = 1.8;
    else if (perOccurrenceLimit >= 1000000) limitMultiplier = 1.3;

    // Deductible discount (higher deductible = lower premium)
    let deductibleDiscount = 1;
    if (deductible >= 25000) deductibleDiscount = 0.8;
    else if (deductible >= 10000) deductibleDiscount = 0.9;
    else if (deductible >= 5000) deductibleDiscount = 0.95;

    // Calculate annual premium
    const annual = Math.round(basePremium * limitMultiplier * deductibleDiscount);
    const monthly = Math.round(annual / 12);

    return {
      annual,
      monthly
    };
  }

  async function handleSubmit() {
    if (!policy) return;

    // Validation
    if (!formData.productType || !formData.carrier || !formData.effectiveDate || !formData.expirationDate) {
      error = 'Please fill in all required fields';
      return;
    }

    saving = true;
    error = '';

    try {
      // Calculate new premium
      const pricing = calculatePremium(formData);

      const updateData = {
        productType: formData.productType,
        carrier: formData.carrier,
        status: formData.status,
        dates: {
          effective: new Date(formData.effectiveDate),
          expiration: new Date(formData.expirationDate)
        },
        coverage: {
          limits: {
            perOccurrence: parseInt(formData.coverageLimits.perOccurrence),
            aggregate: parseInt(formData.coverageLimits.aggregate)
          },
          deductible: parseInt(formData.deductible)
        },
        premium: {
          annual: pricing.annual,
          monthly: pricing.monthly,
          currency: 'USD'
        },
        commission: {
          rate: 15,
          amount: Math.round(pricing.annual * 0.15)
        },
        notes: formData.notes,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'policies', policyId), updateData);
      
      successMessage = 'Policy updated successfully!';
      
      setTimeout(() => {
        goto(`/policies/${policyId}`);
      }, 2000);
    } catch (err) {
      console.error('Error updating policy:', err);
      error = 'Failed to update policy';
    } finally {
      saving = false;
    }
  }

  function handleCancel() {
    goto(`/policies/${policyId}`);
  }
</script>

<div class="min-h-screen bg-neutral-50 py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-4">
        <button
          on:click={() => goto(`/policies/${policyId}`)}
          class="text-neutral-600 hover:text-neutral-900"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 class="text-3xl font-bold text-neutral-900">Edit Policy</h1>
          <p class="text-neutral-600">Modify policy information</p>
        </div>
      </div>
    </div>

    {#if loading}
      <div class="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
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
    {/if}

    {#if successMessage}
      <div class="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
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

    {#if policy}
      <!-- Policy Information Header -->
      <div class="bg-white shadow rounded-lg mb-6">
        <div class="px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-neutral-900">{policy.policyNumber}</h2>
              <p class="text-neutral-600">{policy.clientName}</p>
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {policy.status?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <!-- Edit Form -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-6">
          <form on:submit|preventDefault={handleSubmit}>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Product Type -->
              <div>
                <label for="productType" class="block text-sm font-medium text-neutral-700">
                  Product Type *
                </label>
                <select
                  id="productType"
                  bind:value={formData.productType}
                  required
                  class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select product type</option>
                  {#each productTypes as type}
                    <option value={type.value}>{type.label}</option>
                  {/each}
                </select>
              </div>

              <!-- Carrier -->
              <div>
                <label for="carrier" class="block text-sm font-medium text-neutral-700">
                  Insurance Carrier *
                </label>
                <select
                  id="carrier"
                  bind:value={formData.carrier}
                  required
                  class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select carrier</option>
                  {#each carriers as carrier}
                    <option value={carrier}>{carrier}</option>
                  {/each}
                </select>
              </div>

              <!-- Status -->
              <div>
                <label for="status" class="block text-sm font-medium text-neutral-700">
                  Status *
                </label>
                <select
                  id="status"
                  bind:value={formData.status}
                  required
                  class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select status</option>
                  {#each statusOptions as status}
                    <option value={status.value}>{status.label}</option>
                  {/each}
                </select>
              </div>

              <!-- Per Occurrence Limit -->
              <div>
                <label for="perOccurrence" class="block text-sm font-medium text-neutral-700">
                  Per Occurrence Limit *
                </label>
                <select
                  id="perOccurrence"
                  bind:value={formData.coverageLimits.perOccurrence}
                  required
                  class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select limit</option>
                  <option value="500000">$500,000</option>
                  <option value="1000000">$1,000,000</option>
                  <option value="2000000">$2,000,000</option>
                  <option value="5000000">$5,000,000</option>
                  <option value="10000000">$10,000,000</option>
                </select>
              </div>

              <!-- Aggregate Limit -->
              <div>
                <label for="aggregate" class="block text-sm font-medium text-neutral-700">
                  Aggregate Limit *
                </label>
                <select
                  id="aggregate"
                  bind:value={formData.coverageLimits.aggregate}
                  required
                  class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select limit</option>
                  <option value="1000000">$1,000,000</option>
                  <option value="2000000">$2,000,000</option>
                  <option value="3000000">$3,000,000</option>
                  <option value="5000000">$5,000,000</option>
                  <option value="10000000">$10,000,000</option>
                  <option value="20000000">$20,000,000</option>
                </select>
              </div>

              <!-- Deductible -->
              <div>
                <label for="deductible" class="block text-sm font-medium text-neutral-700">
                  Deductible *
                </label>
                <select
                  id="deductible"
                  bind:value={formData.deductible}
                  required
                  class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select deductible</option>
                  <option value="1000">$1,000</option>
                  <option value="2500">$2,500</option>
                  <option value="5000">$5,000</option>
                  <option value="10000">$10,000</option>
                  <option value="25000">$25,000</option>
                  <option value="50000">$50,000</option>
                </select>
              </div>

              <!-- Effective Date -->
              <div>
                <label for="effectiveDate" class="block text-sm font-medium text-neutral-700">
                  Effective Date *
                </label>
                <input
                  type="date"
                  id="effectiveDate"
                  bind:value={formData.effectiveDate}
                  required
                  class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <!-- Expiration Date -->
              <div>
                <label for="expirationDate" class="block text-sm font-medium text-neutral-700">
                  Expiration Date *
                </label>
                <input
                  type="date"
                  id="expirationDate"
                  bind:value={formData.expirationDate}
                  required
                  class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <!-- Notes -->
            <div class="mt-6">
              <label for="notes" class="block text-sm font-medium text-neutral-700">
                Notes
              </label>
              <textarea
                id="notes"
                bind:value={formData.notes}
                rows="4"
                class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Add any additional notes or requirements..."
              ></textarea>
            </div>

            <!-- Form Actions -->
            <div class="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                on:click={handleCancel}
                class="px-4 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                class="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {#if saving}
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                {:else}
                  Save Changes
                {/if}
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
  </div>
</div> 