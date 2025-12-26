<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { db } from '$lib/config/firebase';
  import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

  onMount(() => {
    if ($currentUser && $currentUser.role !== 'admin') {
      goto('/dashboard');
    } else if ($currentUser?.role === 'admin') {
      loadDropdownValues();
    }
  });

  let loading = true;
  let saving = false;
  let errorMessage = '';
  let successMessage = '';

  let dropdownValues = {
    industries: [
      'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
      'Construction', 'Real Estate', 'Education', 'Professional Services',
      'Restaurant & Food Service', 'Transportation', 'Automotive', 'Energy'
    ],
    
    states: [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
      'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
      'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
      'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
      'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
      'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
      'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
      'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
      'West Virginia', 'Wisconsin', 'Wyoming'
    ],

    countries: [
      'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
      'France', 'Japan', 'South Korea', 'Singapore', 'Hong Kong',
      'UAE', 'Saudi Arabia', 'Oman', 'Bahrain', 'Kuwait', 'Qatar',
      'Turkey', 'India', 'Pakistan'
    ],

    coverageLimits: [
      { value: 500000, label: '$500,000' },
      { value: 1000000, label: '$1,000,000' },
      { value: 2000000, label: '$2,000,000' },
      { value: 5000000, label: '$5,000,000' },
      { value: 10000000, label: '$10,000,000' }
    ],

    deductibles: [
      { value: 500, label: '$500' },
      { value: 1000, label: '$1,000' },
      { value: 2500, label: '$2,500' },
      { value: 5000, label: '$5,000' },
      { value: 10000, label: '$10,000' },
      { value: 25000, label: '$25,000' },
      { value: 50000, label: '$50,000' }
    ],

    policyStatuses: [
      'active', 'pending', 'cancelled', 'expired', 'suspended'
    ],

    taskPriorities: [
      'low', 'medium', 'high', 'urgent'
    ],

    documentTypes: [
      'policy_document', 'certificate', 'claim_form', 'application',
      'endorsement', 'invoice', 'payment_receipt', 'correspondence'
    ]
  };

  async function loadDropdownValues() {
    loading = true;
    try {
      const docRef = doc(db, 'system_settings', 'dropdown_values');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        dropdownValues = { ...dropdownValues, ...data };
      }
    } catch (error) {
      console.error('Error loading dropdown values:', error);
      errorMessage = 'Failed to load dropdown values';
    } finally {
      loading = false;
    }
  }

  async function saveDropdownValues() {
    saving = true;
    errorMessage = '';

    try {
      const docRef = doc(db, 'system_settings', 'dropdown_values');
      await setDoc(docRef, {
        ...dropdownValues,
        updatedAt: serverTimestamp(),
        updatedBy: $currentUser.uid
      }, { merge: true });

      successMessage = 'Dropdown values saved successfully!';
      
      setTimeout(() => {
        successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error saving dropdown values:', error);
      errorMessage = 'Failed to save dropdown values';
    } finally {
      saving = false;
    }
  }

  function addItem(category: string) {
    if (Array.isArray(dropdownValues[category])) {
      dropdownValues[category] = [...dropdownValues[category], ''];
    }
  }

  function removeItem(category: string, index: number) {
    if (Array.isArray(dropdownValues[category])) {
      dropdownValues[category] = dropdownValues[category].filter((_, i) => i !== index);
    }
  }

  function addLimitItem(category: string) {
    dropdownValues[category] = [...dropdownValues[category], { value: 0, label: '$0' }];
  }

  function removeLimitItem(category: string, index: number) {
    dropdownValues[category] = dropdownValues[category].filter((_, i) => i !== index);
  }
</script>

<svelte:head>
  <title>Dropdown Values - Admin Settings</title>
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
                      <span class="ml-4 text-sm font-medium text-neutral-500">Dropdown Values</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 class="mt-2 text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
                Dropdown Values Management
              </h1>
            </div>
            <div class="mt-5 flex lg:mt-0 lg:ml-4">
              <button
                type="button"
                on:click={saveDropdownValues}
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
                  Save All Changes
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
              <p class="text-sm text-green-700">{successMessage}</p>
            </div>
          {/if}

          {#if errorMessage}
            <div class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p class="text-sm text-red-700">{errorMessage}</p>
            </div>
          {/if}

          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Simple Text Lists -->
            <div class="bg-white shadow rounded-lg p-6">
              <h3 class="text-lg font-medium text-neutral-900 mb-4">Industries</h3>
              <div class="space-y-2">
                {#each dropdownValues.industries as industry, index}
                  <div class="flex items-center space-x-2">
                    <input
                      type="text"
                      bind:value={dropdownValues.industries[index]}
                      class="flex-1 border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <button
                      on:click={() => removeItem('industries', index)}
                      class="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </div>
                {/each}
                <button
                  on:click={() => addItem('industries')}
                  class="text-primary-600 hover:text-primary-900 text-sm"
                >
                  + Add Industry
                </button>
              </div>
            </div>

            <!-- Coverage Limits -->
            <div class="bg-white shadow rounded-lg p-6">
              <h3 class="text-lg font-medium text-neutral-900 mb-4">Coverage Limits</h3>
              <div class="space-y-2">
                {#each dropdownValues.coverageLimits as limit, index}
                  <div class="flex items-center space-x-2">
                    <input
                      type="number"
                      bind:value={limit.value}
                      class="w-32 border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <input
                      type="text"
                      bind:value={limit.label}
                      class="flex-1 border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <button
                      on:click={() => removeLimitItem('coverageLimits', index)}
                      class="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </div>
                {/each}
                <button
                  on:click={() => addLimitItem('coverageLimits')}
                  class="text-primary-600 hover:text-primary-900 text-sm"
                >
                  + Add Limit
                </button>
              </div>
            </div>

            <!-- Countries -->
            <div class="bg-white shadow rounded-lg p-6">
              <h3 class="text-lg font-medium text-neutral-900 mb-4">Countries</h3>
              <div class="space-y-2">
                {#each dropdownValues.countries as country, index}
                  <div class="flex items-center space-x-2">
                    <input
                      type="text"
                      bind:value={dropdownValues.countries[index]}
                      class="flex-1 border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <button
                      on:click={() => removeItem('countries', index)}
                      class="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </div>
                {/each}
                <button
                  on:click={() => addItem('countries')}
                  class="text-primary-600 hover:text-primary-900 text-sm"
                >
                  + Add Country
                </button>
              </div>
            </div>

            <!-- Deductibles -->
            <div class="bg-white shadow rounded-lg p-6">
              <h3 class="text-lg font-medium text-neutral-900 mb-4">Deductibles</h3>
              <div class="space-y-2">
                {#each dropdownValues.deductibles as deductible, index}
                  <div class="flex items-center space-x-2">
                    <input
                      type="number"
                      bind:value={deductible.value}
                      class="w-32 border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <input
                      type="text"
                      bind:value={deductible.label}
                      class="flex-1 border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <button
                      on:click={() => removeLimitItem('deductibles', index)}
                      class="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </div>
                {/each}
                <button
                  on:click={() => addLimitItem('deductibles')}
                  class="text-primary-600 hover:text-primary-900 text-sm"
                >
                  + Add Deductible
                </button>
              </div>
            </div>
          </div>
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