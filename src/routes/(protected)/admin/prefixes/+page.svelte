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
      loadSettings();
    }
  });

  let loading = true;
  let saving = false;
  let errorMessage = '';
  let successMessage = '';

  let settings = {
    quotePrefix: 'QUO',
    quoteSeparator: '-',
    quoteNumberFormat: 'timestamp', // 'timestamp', 'sequential', 'date-sequential'
    quoteStartNumber: 1000,
    
    policyPrefix: 'POL',
    policySeparator: '-',
    policyNumberFormat: 'timestamp', // 'timestamp', 'sequential', 'date-sequential'
    policyStartNumber: 1000,
    
    includeYear: false,
    includeBrokerCode: false,
    brokerCodeLength: 2,
    
    lastQuoteNumber: 0,
    lastPolicyNumber: 0
  };

  const formatOptions = [
    { value: 'timestamp', label: 'Timestamp (QUO-1642765432123)', description: 'Uses current timestamp for uniqueness' },
    { value: 'sequential', label: 'Sequential (QUO-1001)', description: 'Incremental numbering starting from specified number' },
    { value: 'date-sequential', label: 'Date + Sequential (QUO-20240120-001)', description: 'Date (YYYYMMDD) followed by daily sequential number' }
  ];

  async function loadSettings() {
    loading = true;
    try {
      const docRef = doc(db, 'system_settings', 'number_formats');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        settings = { ...settings, ...data };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      errorMessage = 'Failed to load settings';
    } finally {
      loading = false;
    }
  }

  async function saveSettings() {
    saving = true;
    errorMessage = '';

    try {
      const docRef = doc(db, 'system_settings', 'number_formats');
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: $currentUser.uid
      }, { merge: true });

      successMessage = 'Settings saved successfully!';
      
      setTimeout(() => {
        successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      errorMessage = 'Failed to save settings';
    } finally {
      saving = false;
    }
  }

  function generatePreview(type: 'quote' | 'policy') {
    const prefix = type === 'quote' ? settings.quotePrefix : settings.policyPrefix;
    const separator = type === 'quote' ? settings.quoteSeparator : settings.policySeparator;
    const format = type === 'quote' ? settings.quoteNumberFormat : settings.policyNumberFormat;
    const startNumber = type === 'quote' ? settings.quoteStartNumber : settings.policyStartNumber;

    let number = '';
    const now = new Date();
    
    // Add year if enabled
    if (settings.includeYear) {
      number += now.getFullYear().toString() + separator;
    }
    
    // Add broker code if enabled
    if (settings.includeBrokerCode) {
      const brokerCode = 'BR'; // Example broker code
      number += brokerCode.substring(0, settings.brokerCodeLength) + separator;
    }

    // Generate number based on format
    switch (format) {
      case 'timestamp':
        number += Date.now().toString();
        break;
      case 'sequential':
        number += (startNumber + 1).toString().padStart(4, '0');
        break;
      case 'date-sequential':
        const dateStr = now.getFullYear().toString() + 
                       (now.getMonth() + 1).toString().padStart(2, '0') + 
                       now.getDate().toString().padStart(2, '0');
        number += dateStr + separator + '001';
        break;
    }

    return prefix + separator + number;
  }

  $: quotePreview = generatePreview('quote');
  $: policyPreview = generatePreview('policy');
</script>

<svelte:head>
  <title>Quote & Policy Prefixes - App Admin Area</title>
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
                      <span class="ml-4 text-sm font-medium text-neutral-500">Quote & Policy Prefixes</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 class="mt-2 text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
                Quote & Policy Number Formats
              </h1>
              <div class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div class="mt-2 flex items-center text-sm text-neutral-500">
                  <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  Configure automatic number generation formats
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <form on:submit|preventDefault={saveSettings} class="space-y-8">
            <!-- Preview Section -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 class="text-lg font-medium text-blue-900 mb-4">Live Preview</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-blue-700 mb-2">Quote Number Example</label>
                  <div class="bg-white border border-blue-300 rounded-md px-3 py-2 text-sm font-mono text-neutral-900">
                    {quotePreview}
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-blue-700 mb-2">Policy Number Example</label>
                  <div class="bg-white border border-blue-300 rounded-md px-3 py-2 text-sm font-mono text-neutral-900">
                    {policyPreview}
                  </div>
                </div>
              </div>
            </div>

            <!-- Quote Settings -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-6 py-4 border-b border-neutral-200">
                <h3 class="text-lg font-medium text-neutral-900">Quote Number Settings</h3>
              </div>
              <div class="px-6 py-6 space-y-6">
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label for="quotePrefix" class="block text-sm font-medium text-neutral-700">Prefix</label>
                    <input type="text" id="quotePrefix" bind:value={settings.quotePrefix} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="QUO" />
                  </div>
                  <div>
                    <label for="quoteSeparator" class="block text-sm font-medium text-neutral-700">Separator</label>
                    <select id="quoteSeparator" bind:value={settings.quoteSeparator} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                      <option value="-">Dash (-)</option>
                      <option value="_">Underscore (_)</option>
                      <option value="">None</option>
                    </select>
                  </div>
                  <div>
                    <label for="quoteStartNumber" class="block text-sm font-medium text-neutral-700">Start Number (Sequential)</label>
                    <input type="number" id="quoteStartNumber" bind:value={settings.quoteStartNumber} min="1" class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-neutral-700 mb-3">Number Format</label>
                  <div class="space-y-3">
                    {#each formatOptions as option}
                      <label class="relative flex items-start">
                        <input type="radio" bind:group={settings.quoteNumberFormat} value={option.value} class="focus:ring-primary-500 h-4 w-4 text-primary-600 border-neutral-300" />
                        <div class="ml-3">
                          <div class="text-sm font-medium text-neutral-700">{option.label}</div>
                          <div class="text-sm text-neutral-500">{option.description}</div>
                        </div>
                      </label>
                    {/each}
                  </div>
                </div>
              </div>
            </div>

            <!-- Policy Settings -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-6 py-4 border-b border-neutral-200">
                <h3 class="text-lg font-medium text-neutral-900">Policy Number Settings</h3>
              </div>
              <div class="px-6 py-6 space-y-6">
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label for="policyPrefix" class="block text-sm font-medium text-neutral-700">Prefix</label>
                    <input type="text" id="policyPrefix" bind:value={settings.policyPrefix} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="POL" />
                  </div>
                  <div>
                    <label for="policySeparator" class="block text-sm font-medium text-neutral-700">Separator</label>
                    <select id="policySeparator" bind:value={settings.policySeparator} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                      <option value="-">Dash (-)</option>
                      <option value="_">Underscore (_)</option>
                      <option value="">None</option>
                    </select>
                  </div>
                  <div>
                    <label for="policyStartNumber" class="block text-sm font-medium text-neutral-700">Start Number (Sequential)</label>
                    <input type="number" id="policyStartNumber" bind:value={settings.policyStartNumber} min="1" class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-neutral-700 mb-3">Number Format</label>
                  <div class="space-y-3">
                    {#each formatOptions as option}
                      <label class="relative flex items-start">
                        <input type="radio" bind:group={settings.policyNumberFormat} value={option.value} class="focus:ring-primary-500 h-4 w-4 text-primary-600 border-neutral-300" />
                        <div class="ml-3">
                          <div class="text-sm font-medium text-neutral-700">{option.label}</div>
                          <div class="text-sm text-neutral-500">{option.description}</div>
                        </div>
                      </label>
                    {/each}
                  </div>
                </div>
              </div>
            </div>

            <!-- Additional Options -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-6 py-4 border-b border-neutral-200">
                <h3 class="text-lg font-medium text-neutral-900">Additional Options</h3>
              </div>
              <div class="px-6 py-6 space-y-6">
                <div class="space-y-4">
                  <label class="relative flex items-start">
                    <input type="checkbox" bind:checked={settings.includeYear} class="focus:ring-primary-500 h-4 w-4 text-primary-600 border-neutral-300 rounded" />
                    <div class="ml-3">
                      <div class="text-sm font-medium text-neutral-700">Include Year</div>
                      <div class="text-sm text-neutral-500">Add current year to the beginning of numbers</div>
                    </div>
                  </label>

                  <label class="relative flex items-start">
                    <input type="checkbox" bind:checked={settings.includeBrokerCode} class="focus:ring-primary-500 h-4 w-4 text-primary-600 border-neutral-300 rounded" />
                    <div class="ml-3">
                      <div class="text-sm font-medium text-neutral-700">Include Broker Code</div>
                      <div class="text-sm text-neutral-500">Add broker initials to numbers</div>
                    </div>
                  </label>

                  {#if settings.includeBrokerCode}
                    <div class="ml-7">
                      <label for="brokerCodeLength" class="block text-sm font-medium text-neutral-700">Broker Code Length</label>
                      <select id="brokerCodeLength" bind:value={settings.brokerCodeLength} class="mt-1 block w-32 border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                        <option value={2}>2 characters</option>
                        <option value={3}>3 characters</option>
                        <option value={4}>4 characters</option>
                      </select>
                    </div>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end">
              <button type="submit" disabled={saving} class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {#if saving}
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                {:else}
                  Save Settings
                {/if}
              </button>
            </div>
          </form>
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