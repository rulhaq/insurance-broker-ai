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
      loadCurrencySettings();
    }
  });

  let loading = true;
  let saving = false;
  let errorMessage = '';
  let successMessage = '';

  let currencySettings = {
    defaultCurrency: 'USD',
    currencySymbol: '$',
    currencyPosition: 'before', // 'before' or 'after'
    decimalPlaces: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    supportedCurrencies: [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
      { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
      { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼' },
      { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
      { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب' },
      { code: 'OMR', name: 'Omani Rial', symbol: '﷼' },
      { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' }
    ]
  };

  async function loadCurrencySettings() {
    loading = true;
    try {
      const docRef = doc(db, 'system_settings', 'currency');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        currencySettings = { ...currencySettings, ...data };
      }
    } catch (error) {
      console.error('Error loading currency settings:', error);
      errorMessage = 'Failed to load currency settings';
    } finally {
      loading = false;
    }
  }

  async function saveCurrencySettings() {
    saving = true;
    errorMessage = '';

    try {
      const docRef = doc(db, 'system_settings', 'currency');
      await setDoc(docRef, {
        ...currencySettings,
        updatedAt: serverTimestamp(),
        updatedBy: $currentUser.uid
      }, { merge: true });

      successMessage = 'Currency settings saved successfully!';
      
      setTimeout(() => {
        successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error saving currency settings:', error);
      errorMessage = 'Failed to save currency settings';
    } finally {
      saving = false;
    }
  }

  function updateCurrency(currencyCode: string) {
    const currency = currencySettings.supportedCurrencies.find(c => c.code === currencyCode);
    if (currency) {
      currencySettings.defaultCurrency = currency.code;
      currencySettings.currencySymbol = currency.symbol;
    }
  }

  function formatCurrencyPreview(amount: number) {
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: currencySettings.decimalPlaces,
      maximumFractionDigits: currencySettings.decimalPlaces
    }).replace(',', currencySettings.thousandSeparator).replace('.', currencySettings.decimalSeparator);

    if (currencySettings.currencyPosition === 'before') {
      return currencySettings.currencySymbol + formatted;
    } else {
      return formatted + currencySettings.currencySymbol;
    }
  }

  $: previewAmount = formatCurrencyPreview(12345.67);
</script>

<svelte:head>
  <title>Currency Settings - Admin Settings</title>
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
                      <span class="ml-4 text-sm font-medium text-neutral-500">Currency Settings</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 class="mt-2 text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
                Currency Settings
              </h1>
            </div>
            <div class="mt-5 flex lg:mt-0 lg:ml-4">
              <button
                type="button"
                on:click={saveCurrencySettings}
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
                  Save Settings
                {/if}
              </button>
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

          <!-- Preview -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 class="text-lg font-medium text-blue-900 mb-4">Currency Preview</h3>
            <div class="text-2xl font-bold text-blue-800">{previewAmount}</div>
            <p class="text-sm text-blue-600 mt-2">Preview of how currency will appear throughout the application</p>
          </div>

          <!-- Currency Settings -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-neutral-200">
              <h3 class="text-lg font-medium text-neutral-900">Default Currency</h3>
            </div>
            <div class="px-6 py-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label for="defaultCurrency" class="block text-sm font-medium text-neutral-700">
                    Primary Currency
                  </label>
                  <select
                    id="defaultCurrency"
                    bind:value={currencySettings.defaultCurrency}
                    on:change={(e) => updateCurrency(e.target.value)}
                    class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    {#each currencySettings.supportedCurrencies as currency}
                      <option value={currency.code}>{currency.code} - {currency.name} ({currency.symbol})</option>
                    {/each}
                  </select>
                </div>

                <div>
                  <label for="currencySymbol" class="block text-sm font-medium text-neutral-700">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    id="currencySymbol"
                    bind:value={currencySettings.currencySymbol}
                    class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label for="currencyPosition" class="block text-sm font-medium text-neutral-700">
                    Symbol Position
                  </label>
                  <select
                    id="currencyPosition"
                    bind:value={currencySettings.currencyPosition}
                    class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="before">Before amount ($100.00)</option>
                    <option value="after">After amount (100.00$)</option>
                  </select>
                </div>

                <div>
                  <label for="decimalPlaces" class="block text-sm font-medium text-neutral-700">
                    Decimal Places
                  </label>
                  <select
                    id="decimalPlaces"
                    bind:value={currencySettings.decimalPlaces}
                    class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value={0}>0 (100)</option>
                    <option value={2}>2 (100.00)</option>
                    <option value={3}>3 (100.000)</option>
                  </select>
                </div>

                <div>
                  <label for="thousandSeparator" class="block text-sm font-medium text-neutral-700">
                    Thousand Separator
                  </label>
                  <select
                    id="thousandSeparator"
                    bind:value={currencySettings.thousandSeparator}
                    class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value=",">Comma (1,000)</option>
                    <option value=".">Period (1.000)</option>
                    <option value=" ">Space (1 000)</option>
                    <option value="">None (1000)</option>
                  </select>
                </div>

                <div>
                  <label for="decimalSeparator" class="block text-sm font-medium text-neutral-700">
                    Decimal Separator
                  </label>
                  <select
                    id="decimalSeparator"
                    bind:value={currencySettings.decimalSeparator}
                    class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value=".">Period (100.50)</option>
                    <option value=",">Comma (100,50)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Supported Currencies -->
          <div class="bg-white shadow rounded-lg mt-8">
            <div class="px-6 py-4 border-b border-neutral-200">
              <h3 class="text-lg font-medium text-neutral-900">Supported Currencies</h3>
              <p class="text-sm text-neutral-500 mt-1">Manage which currencies are available throughout the application</p>
            </div>
            <div class="px-6 py-6">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {#each currencySettings.supportedCurrencies as currency, index}
                  <div class="border border-neutral-200 rounded-lg p-4">
                    <div class="space-y-3">
                      <div>
                        <label class="block text-sm font-medium text-neutral-700">Code</label>
                        <input
                          type="text"
                          bind:value={currency.code}
                          class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-neutral-700">Name</label>
                        <input
                          type="text"
                          bind:value={currency.name}
                          class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-neutral-700">Symbol</label>
                        <input
                          type="text"
                          bind:value={currency.symbol}
                          class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        on:click={() => {
                          currencySettings.supportedCurrencies = currencySettings.supportedCurrencies.filter((_, i) => i !== index);
                        }}
                        class="text-red-600 hover:text-red-900 text-sm"
                      >
                        Remove Currency
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
              
              <button
                type="button"
                on:click={() => {
                  currencySettings.supportedCurrencies = [...currencySettings.supportedCurrencies, { code: '', name: '', symbol: '' }];
                }}
                class="mt-4 text-primary-600 hover:text-primary-900 text-sm"
              >
                + Add Currency
              </button>
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