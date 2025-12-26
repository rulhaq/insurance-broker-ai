<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { db } from '$lib/config/firebase';
  import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
  import { currencySettings, loadCurrencySettings, type CurrencySettings } from '$lib/services/currency';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

  onMount(async () => {
    if ($currentUser && $currentUser.role !== 'admin') {
      goto('/dashboard');
    } else if ($currentUser?.role === 'admin') {
      loading = true;
      try {
        await loadCurrencySettings();
      } catch (error) {
        console.error('Error loading currency settings:', error);
        errorMessage = 'Failed to load currency settings';
      } finally {
        loading = false;
      }
    }
  });

  let loading = true;
  let saving = false;
  let errorMessage = '';
  let successMessage = '';

  // Use the global currency settings store
  $: localCurrencySettings = $currencySettings;

  // Ensure we have valid settings
  $: if (!localCurrencySettings) {
    localCurrencySettings = {
      defaultCurrency: 'USD',
      currencySymbol: '$',
      currencyPosition: 'before',
      decimalPlaces: 2,
      thousandSeparator: ',',
      decimalSeparator: '.',
      supportedCurrencies: []
    };
  }

  async function saveCurrencySettings() {
    saving = true;
    errorMessage = '';

    try {
      const docRef = doc(db, 'system_settings', 'currency');
      await setDoc(docRef, {
        ...localCurrencySettings,
        updatedAt: serverTimestamp(),
        updatedBy: $currentUser.uid
      }, { merge: true });

      // Update the global store
      currencySettings.set(localCurrencySettings);

      successMessage = 'Currency settings saved successfully and updated throughout the app!';
      
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
    const currency = localCurrencySettings.supportedCurrencies.find(c => c.code === currencyCode);
    if (currency) {
      localCurrencySettings.defaultCurrency = currency.code;
      localCurrencySettings.currencySymbol = currency.symbol;
      // Update the global store
      currencySettings.set(localCurrencySettings);
    }
  }

  function formatCurrencyPreview(amount: number) {
    if (!localCurrencySettings) return '$12,345.67';
    
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: localCurrencySettings.decimalPlaces,
      maximumFractionDigits: localCurrencySettings.decimalPlaces
    }).replace(',', localCurrencySettings.thousandSeparator).replace('.', localCurrencySettings.decimalSeparator);

    if (localCurrencySettings.currencyPosition === 'before') {
      return localCurrencySettings.currencySymbol + formatted;
    } else {
      return formatted + localCurrencySettings.currencySymbol;
    }
  }

  $: previewAmount = localCurrencySettings ? formatCurrencyPreview(12345.67) : '$12,345.67';
</script>

<svelte:head>
  <title>Currency Settings - App Admin Area</title>
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
                      <span class="ml-4 text-sm font-medium text-neutral-500">Currency Settings</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 class="mt-2 text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl">Currency Settings</h1>
              <p class="mt-1 text-sm text-neutral-500">Configure global currency settings for the entire application</p>
            </div>
            <div class="mt-6 flex space-x-3 lg:mt-0 lg:ml-4">
              <button type="button" on:click={saveCurrencySettings} disabled={saving} class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
                {#if saving}Saving...{:else}Save Changes{/if}
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

          <!-- Currency Preview -->
          <div class="bg-white shadow rounded-lg mb-6">
            <div class="px-6 py-4 border-b border-neutral-200">
              <h3 class="text-lg font-medium text-neutral-900">Preview</h3>
            </div>
            <div class="px-6 py-6">
              <div class="text-center">
                <p class="text-sm text-neutral-500 mb-2">Sample Amount (12,345.67):</p>
                <p class="text-2xl font-bold text-primary-600">{previewAmount}</p>
              </div>
            </div>
          </div>

          <!-- Currency Settings -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-neutral-200">
              <h3 class="text-lg font-medium text-neutral-900">Default Currency</h3>
            </div>
            <div class="px-6 py-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label for="defaultCurrency" class="block text-sm font-medium text-neutral-700">Primary Currency</label>
                  <select id="defaultCurrency" bind:value={localCurrencySettings.defaultCurrency} on:change={(e) => updateCurrency(e.target.value)} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    {#each localCurrencySettings.supportedCurrencies as currency}
                      <option value={currency.code}>{currency.code} - {currency.name} ({currency.symbol})</option>
                    {/each}
                  </select>
                </div>
                <div>
                  <label for="currencySymbol" class="block text-sm font-medium text-neutral-700">Currency Symbol</label>
                  <input type="text" id="currencySymbol" bind:value={localCurrencySettings.currencySymbol} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <div>
                  <label for="currencyPosition" class="block text-sm font-medium text-neutral-700">Symbol Position</label>
                  <select id="currencyPosition" bind:value={localCurrencySettings.currencyPosition} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="before">Before amount (e.g., $100.00)</option>
                    <option value="after">After amount (e.g., 100.00$)</option>
                  </select>
                </div>
                <div>
                  <label for="decimalPlaces" class="block text-sm font-medium text-neutral-700">Decimal Places</label>
                  <select id="decimalPlaces" bind:value={localCurrencySettings.decimalPlaces} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value={0}>0 (e.g., $100)</option>
                    <option value={2}>2 (e.g., $100.00)</option>
                    <option value={3}>3 (e.g., $100.000)</option>
                  </select>
                </div>
                <div>
                  <label for="thousandSeparator" class="block text-sm font-medium text-neutral-700">Thousand Separator</label>
                  <select id="thousandSeparator" bind:value={localCurrencySettings.thousandSeparator} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value=",">Comma (,)</option>
                    <option value=".">Period (.)</option>
                    <option value=" ">Space ( )</option>
                    <option value="">None</option>
                  </select>
                </div>
                <div>
                  <label for="decimalSeparator" class="block text-sm font-medium text-neutral-700">Decimal Separator</label>
                  <select id="decimalSeparator" bind:value={localCurrencySettings.decimalSeparator} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value=".">Period (.)</option>
                    <option value=",">Comma (,)</option>
                  </select>
                </div>
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