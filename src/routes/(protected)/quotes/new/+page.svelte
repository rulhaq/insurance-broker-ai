<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';
	import { searchClients } from '$lib/services/clients';
	import { getProductTypeOptions, getBasePremium } from '$lib/services/productTypes';
	import { formatCurrency } from '$lib/services/currency';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let isLoading = false;
	let errorMessage = '';
	let successMessage = '';
	let loadingProductTypes = true;

	// Client search functionality
	let clientSearchTerm = '';
	let searchResults = [];
	let searchingClients = false;
	let showClientDropdown = false;
	let selectedClient = null;

	let formData = {
		clientId: '',
		coverageType: 'general_liability',
		coverageLimits: {
			perOccurrence: '1000000',
			aggregate: '2000000'
		},
		deductible: '1000',
		effectiveDate: new Date().toISOString().split('T')[0],
		expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		notes: ''
	};

	let coverageTypes = [];

	// Load product types from Firebase on component mount
	onMount(async () => {
		try {
			coverageTypes = await getProductTypeOptions();
			console.log('📋 Loaded coverage types:', coverageTypes);
		} catch (error) {
			console.error('Error loading coverage types:', error);
			// Fallback to hardcoded types
			coverageTypes = [
				{ value: 'general_liability', label: 'General Liability' },
				{ value: 'professional_liability', label: 'Professional Liability' },
				{ value: 'commercial_auto', label: 'Commercial Auto' },
				{ value: 'workers_compensation', label: 'Workers Compensation' },
				{ value: 'cyber_liability', label: 'Cyber Liability' },
				{ value: 'directors_officers', label: 'Directors & Officers' },
				{ value: 'property', label: 'Commercial Property' }
			];
		} finally {
			loadingProductTypes = false;
		}
	});

	// Search clients when user types
	async function handleClientSearch() {
		if (!$currentUser || clientSearchTerm.length < 2) {
			searchResults = [];
			showClientDropdown = false;
			return;
		}

		try {
			searchingClients = true;
			console.log('🔍 Searching clients for:', clientSearchTerm);
			
			// Search clients for current broker
			const results = await searchClients($currentUser.uid, clientSearchTerm);
			console.log('📊 Found clients:', results.length);
			
			searchResults = results;
			showClientDropdown = results.length > 0;
		} catch (error) {
			console.error('Error searching clients:', error);
			searchResults = [];
			showClientDropdown = false;
		} finally {
			searchingClients = false;
		}
	}

	// Select a client from search results
	function selectClient(client) {
		selectedClient = client;
		formData.clientId = client.id;
		clientSearchTerm = `${client.firstName} ${client.lastName} - ${client.businessName || client.email}`;
		showClientDropdown = false;
		console.log('✅ Selected client:', client);
	}

	// Clear client selection
	function clearClientSelection() {
		selectedClient = null;
		formData.clientId = '';
		clientSearchTerm = '';
		showClientDropdown = false;
	}

	async function handleSubmit() {
		if (!$currentUser) return;

		// Validate required fields
		if (!formData.clientId) {
			errorMessage = 'Please select a client';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			// Calculate proper pricing based on coverage
			const pricing = await calculatePremium(formData);
			
			// Create quote data for Firebase
			const quoteData = {
				quoteNumber: `QUO-${Date.now()}`,
				clientId: formData.clientId,
				clientName: selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : '',
				brokerId: $currentUser.uid,
				coverageType: formData.coverageType,
				status: 'quoted',
				premium: {
					annual: pricing.annual,
					monthly: pricing.monthly,
					currency: 'USD'
				},
				coverage: {
					limits: {
						perOccurrence: parseInt(formData.coverageLimits.perOccurrence),
						aggregate: parseInt(formData.coverageLimits.aggregate)
					},
					deductible: parseInt(formData.deductible)
				},
				dates: {
					effective: new Date(formData.effectiveDate),
					expiration: new Date(formData.expirationDate)
				},
				carrier: 'AI-Selected Carrier', // Placeholder
				commission: {
					rate: 15,
					amount: Math.round(pricing.annual * 0.15)
				},
				notes: formData.notes,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			console.log('🔧 Creating quote in Firebase:', quoteData);
			
			// Actually save to Firebase
			const { addDoc, collection } = await import('firebase/firestore');
			const { db } = await import('$lib/config/firebase');
			
			const docRef = await addDoc(collection(db, 'quotes'), quoteData);
			console.log('✅ Quote created with ID:', docRef.id);
			
			successMessage = 'Quote generated and saved successfully!';
			
			setTimeout(() => {
				goto('/quotes');
			}, 1500);
		} catch (error) {
			console.error('Error generating quote:', error);
			errorMessage = 'Failed to generate quote. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function handleCancel() {
		goto('/quotes');
	}

	// formatCurrency is imported from currency service

	async function calculatePremium(formData: any) {
		// Get base premium from Firebase product types or use fallback
		const basePremium = await getBasePremium(formData.coverageType);
		
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
</script>

<svelte:head>
	<title>Generate Quote - Insurance Broker Pro</title>
</svelte:head>

<div class="min-h-full">
	<!-- Header -->
	<div class="bg-white shadow">
		<div class="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
			<div class="py-6">
				<div class="lg:flex lg:items-center lg:justify-between">
					<div class="flex-1 min-w-0">
						<nav class="flex" aria-label="Breadcrumb">
							<ol role="list" class="flex items-center space-x-4">
								<li>
									<div>
										<button 
											on:click={() => goto('/quotes')}
											class="text-neutral-400 hover:text-neutral-500"
										>
											<svg class="flex-shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
											</svg>
											<span class="sr-only">Quotes</span>
										</button>
									</div>
								</li>
								<li>
									<div class="flex items-center">
										<svg class="flex-shrink-0 h-5 w-5 text-neutral-300" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
										</svg>
										<span class="ml-4 text-sm font-medium text-neutral-500">Generate Quote</span>
									</div>
								</li>
							</ol>
						</nav>
						<h1 class="mt-2 text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
							Generate New Quote
						</h1>
						<div class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
							<div class="mt-2 flex items-center text-sm text-neutral-500">
								<svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
								</svg>
								AI-powered quote comparison across carriers
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8 py-8">
		{#if errorMessage}
			<div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
				{errorMessage}
			</div>
		{/if}

		{#if successMessage}
			<div class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
				{successMessage}
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit} class="space-y-8">
			<!-- Coverage Information -->
			<div class="bg-white shadow rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg leading-6 font-medium text-neutral-900 mb-4">Coverage Information</h3>
					
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<label for="coverageType" class="block text-sm font-medium text-neutral-700">Coverage Type</label>
							<select
								id="coverageType"
								bind:value={formData.coverageType}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							>
								{#each coverageTypes as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="clientId" class="block text-sm font-medium text-neutral-700">Client</label>
							<input
								type="text"
								id="clientId"
								bind:value={clientSearchTerm}
								on:input={handleClientSearch}
								on:focus={() => {if (clientSearchTerm.length >= 2) showClientDropdown = searchResults.length > 0;}}
								placeholder="Search and select client..."
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
							{#if showClientDropdown && searchResults.length > 0}
								<div class="absolute z-10 mt-1 w-full bg-white border border-neutral-300 rounded-md shadow-lg max-h-60 overflow-auto">
									{#each searchResults as client}
										<div
											on:click={() => selectClient(client)}
											class="p-2 cursor-pointer hover:bg-neutral-100 text-sm"
										>
											{client.firstName} {client.lastName} - {client.businessName || client.email}
										</div>
									{/each}
								</div>
							{/if}
							
							{#if clientSearchTerm.length >= 2 && searchResults.length === 0 && !searchingClients}
								<div class="mt-1 text-sm text-neutral-500">
									No clients found. <a href="/clients/new" class="text-primary-600 hover:text-primary-500">Create new client</a>
								</div>
							{/if}
							{#if selectedClient}
								<div class="mt-2 text-sm text-neutral-500">
									Selected Client: {selectedClient.firstName} {selectedClient.lastName} - {selectedClient.businessName || selectedClient.email}
									<button type="button" on:click={clearClientSelection} class="ml-2 text-red-500 hover:text-red-700">
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							{/if}
						</div>

						<div>
							<label for="perOccurrence" class="block text-sm font-medium text-neutral-700">Per Occurrence Limit</label>
							<select
								id="perOccurrence"
								bind:value={formData.coverageLimits.perOccurrence}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							>
								<option value="500000">$500,000</option>
								<option value="1000000">$1,000,000</option>
								<option value="2000000">$2,000,000</option>
								<option value="5000000">$5,000,000</option>
								<option value="10000000">$10,000,000</option>
							</select>
						</div>

						<div>
							<label for="aggregate" class="block text-sm font-medium text-neutral-700">Aggregate Limit</label>
							<select
								id="aggregate"
								bind:value={formData.coverageLimits.aggregate}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							>
								<option value="1000000">$1,000,000</option>
								<option value="2000000">$2,000,000</option>
								<option value="3000000">$3,000,000</option>
								<option value="5000000">$5,000,000</option>
								<option value="10000000">$10,000,000</option>
							</select>
						</div>

						<div>
							<label for="deductible" class="block text-sm font-medium text-neutral-700">Deductible</label>
							<select
								id="deductible"
								bind:value={formData.deductible}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							>
								<option value="500">$500</option>
								<option value="1000">$1,000</option>
								<option value="2500">$2,500</option>
								<option value="5000">$5,000</option>
								<option value="10000">$10,000</option>
							</select>
						</div>

						<div>
							<label for="effectiveDate" class="block text-sm font-medium text-neutral-700">Effective Date</label>
							<input
								type="date"
								id="effectiveDate"
								bind:value={formData.effectiveDate}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>

						<div class="sm:col-span-2">
							<label for="notes" class="block text-sm font-medium text-neutral-700">Additional Notes</label>
							<textarea
								id="notes"
								bind:value={formData.notes}
								rows="3"
								placeholder="Any special requirements or notes for the quote..."
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							></textarea>
						</div>
					</div>
				</div>
			</div>

			<!-- Premium Preview -->
			{#if formData.coverageType && formData.coverageLimits.perOccurrence && formData.coverageLimits.aggregate && formData.deductible}
				{@const previewPricing = calculatePremium(formData)}
				<div class="bg-green-50 border border-green-200 rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<h3 class="text-lg font-medium text-green-900 mb-3">Estimated Premium</h3>
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div class="text-center">
								<div class="text-2xl font-bold text-green-700">{formatCurrency(previewPricing.annual)}</div>
								<div class="text-sm text-green-600">Annual Premium</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold text-green-700">{formatCurrency(previewPricing.monthly)}</div>
								<div class="text-sm text-green-600">Monthly Premium</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold text-green-700">{formatCurrency(Math.round(previewPricing.annual * 0.15))}</div>
								<div class="text-sm text-green-600">Commission (15%)</div>
							</div>
						</div>
						<div class="mt-3 text-xs text-green-600">
							* Estimated pricing based on selected coverage. Final quote may vary based on underwriting.
						</div>
					</div>
				</div>
			{/if}

			<!-- AI Quote Analysis -->
			<div class="bg-primary-50 border border-primary-200 rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg font-medium text-primary-900 mb-2">AI-Powered Quote Analysis</h3>
					<p class="text-sm text-primary-700 mb-4">
						Our AI will analyze multiple carriers and provide recommendations based on coverage, pricing, and risk factors.
					</p>
					<ul class="text-sm text-primary-600 space-y-1">
						<li>• Compare quotes from 15+ insurance carriers</li>
						<li>• AI risk assessment and coverage gap analysis</li>
						<li>• Pricing anomaly detection</li>
						<li>• Personalized coverage recommendations</li>
					</ul>
				</div>
			</div>

			<!-- Form Actions -->
			<div class="flex justify-end space-x-3">
				<button
					type="button"
					on:click={handleCancel}
					class="bg-white py-2 px-4 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isLoading}
					class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
				>
					{#if isLoading}
						<LoadingSpinner size="sm" color="white" />
						<span class="ml-2">Generating Quote...</span>
					{:else}
						Generate Quote
					{/if}
				</button>
			</div>
		</form>
	</div>
</div> 