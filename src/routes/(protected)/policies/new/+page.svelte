<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';
	import { db } from '$lib/config/firebase';
	import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
	import { searchClients } from '$lib/services/clients';
	import { getProductTypeOptions, getBasePremium } from '$lib/services/productTypes';
	import { formatCurrency } from '$lib/services/currency';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let isLoading = false;
	let errorMessage = '';
	let successMessage = '';
	let loadingProductTypes = true;

	// Client search state
	let clientSearchTerm = '';
	let searchResults: any[] = [];
	let searchingClients = false;
	let showClientDropdown = false;
	let selectedClient: any = null;

	let formData = {
		policyNumber: `POL-${Date.now()}`,
		clientId: '',
		clientName: '',
		carrier: '',
		productType: 'general_liability',
		status: 'active',
		premium: {
			annual: '',
			monthly: '',
			currency: 'USD'
		},
		coverage: {
			limits: {
				perOccurrence: '1000000',
				aggregate: '2000000'
			},
			deductible: '1000'
		},
		dates: {
			effective: new Date().toISOString().split('T')[0],
			expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
		},
		commission: {
			rate: '15',
			amount: ''
		},
		notes: ''
	};

	let productTypes: Array<{value: string, label: string}> = [];

	// Load product types from Firebase on component mount
	onMount(async () => {
		try {
			productTypes = await getProductTypeOptions();
			console.log('📋 Loaded product types:', productTypes);
		} catch (error) {
			console.error('Error loading product types:', error);
			// Fallback to hardcoded types
			productTypes = [
				{ value: 'general_liability', label: 'General Liability' },
				{ value: 'professional_liability', label: 'Professional Liability' },
				{ value: 'commercial_auto', label: 'Commercial Auto' },
				{ value: 'workers_compensation', label: 'Workers Compensation' },
				{ value: 'cyber_liability', label: 'Cyber Liability' },
				{ value: 'directors_officers', label: 'Directors & Officers' },
				{ value: 'property', label: 'Commercial Property' },
				{ value: 'umbrella', label: 'Umbrella Policy' }
			];
		} finally {
			loadingProductTypes = false;
		}
	});

	const carriers = [
		'State Farm', 'Allstate', 'Progressive', 'Farmers', 'Liberty Mutual',
		'Travelers', 'Nationwide', 'USAA', 'Geico', 'Hartford', 'Zurich', 'AIG'
	];

	// Auto-calculate premium when coverage details change
	$: if (formData.productType && formData.coverage.limits.perOccurrence && formData.coverage.limits.aggregate && formData.coverage.deductible) {
		calculatePremium(formData).then(calculatedPremium => {
			formData.premium.annual = calculatedPremium.annual.toString();
			formData.premium.monthly = calculatedPremium.monthly.toString();
		});
	}

	// Calculate commission amount when rate or premium changes
	$: if (formData.premium.annual && formData.commission.rate) {
		formData.commission.amount = (parseFloat(formData.premium.annual) * parseFloat(formData.commission.rate) / 100).toFixed(2);
	}

	async function calculatePremium(formData: any) {
		// Get base premium from Firebase product types or use fallback
		const basePremium = await getBasePremium(formData.productType);
		
		// Calculate premium based on coverage limits
		const perOccurrenceLimit = parseInt(formData.coverage.limits.perOccurrence);
		const aggregateLimit = parseInt(formData.coverage.limits.aggregate);
		const deductible = parseInt(formData.coverage.deductible);

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

	// formatCurrency is imported from currency service

	async function handleSubmit() {
		if (!$currentUser) return;

		if (!selectedClient || !formData.carrier || !formData.productType) {
			errorMessage = 'Please select a client and fill in all required fields';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			const policyData = {
				...formData,
				clientId: selectedClient.id,
				clientName: `${selectedClient.firstName} ${selectedClient.lastName}`,
				brokerId: $currentUser.uid,
				brokerName: `${$currentUser.firstName} ${$currentUser.lastName}`,
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
				premium: {
					...formData.premium,
					annual: parseFloat(formData.premium.annual),
					monthly: parseFloat(formData.premium.monthly)
				},
				commission: {
					...formData.commission,
					rate: parseFloat(formData.commission.rate),
					amount: parseFloat(formData.commission.amount)
				}
			};

			await addDoc(collection(db, 'policies'), policyData);
			successMessage = 'Policy created successfully!';
			
			setTimeout(() => {
				goto('/policies');
			}, 1500);
		} catch (error) {
			console.error('Error creating policy:', error);
			errorMessage = 'Failed to create policy. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function handleCancel() {
		goto('/policies');
	}

	// Client search functions
	async function handleClientSearch() {
		if (!$currentUser || clientSearchTerm.length < 2) {
			searchResults = [];
			showClientDropdown = false;
			return;
		}

		searchingClients = true;
		try {
			const isAdmin = $currentUser.role === 'admin';
			const brokerId = isAdmin ? null : $currentUser.uid;
			console.log('🔍 Searching clients with:', { brokerId, clientSearchTerm, isAdmin });
			searchResults = await searchClients(brokerId, clientSearchTerm);
			console.log('📋 Search results:', searchResults);
			showClientDropdown = searchResults.length > 0;
		} catch (error) {
			console.error('Error searching clients:', error);
			searchResults = [];
			showClientDropdown = false;
		} finally {
			searchingClients = false;
		}
	}

	function selectClient(client: any) {
		selectedClient = client;
		clientSearchTerm = `${client.firstName} ${client.lastName}`;
		formData.clientId = client.id;
		formData.clientName = `${client.firstName} ${client.lastName}`;
		showClientDropdown = false;
	}

	function clearClientSelection() {
		selectedClient = null;
		clientSearchTerm = '';
		formData.clientId = '';
		formData.clientName = '';
		searchResults = [];
		showClientDropdown = false;
	}
</script>

<svelte:head>
	<title>New Policy - Insurance Broker Pro</title>
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
											on:click={() => goto('/policies')}
											class="text-neutral-400 hover:text-neutral-500"
										>
											<svg class="flex-shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
											<span class="sr-only">Policies</span>
										</button>
									</div>
								</li>
								<li>
									<div class="flex items-center">
										<svg class="flex-shrink-0 h-5 w-5 text-neutral-300" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
										</svg>
										<span class="ml-4 text-sm font-medium text-neutral-500">New Policy</span>
									</div>
								</li>
							</ol>
						</nav>
						<h1 class="mt-2 text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
							Create New Policy
						</h1>
						<div class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
							<div class="mt-2 flex items-center text-sm text-neutral-500">
								<svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								Create and manage insurance policies
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
			<!-- Basic Policy Information -->
			<div class="bg-white shadow rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg leading-6 font-medium text-neutral-900 mb-4">Basic Information</h3>
					
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<label for="policyNumber" class="block text-sm font-medium text-neutral-700">Policy Number</label>
							<input
								type="text"
								id="policyNumber"
								bind:value={formData.policyNumber}
								readonly
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm bg-neutral-50 text-neutral-500 sm:text-sm"
							/>
							<p class="mt-1 text-xs text-neutral-500">Auto-generated</p>
						</div>

						<div class="relative">
							<label for="clientSearch" class="block text-sm font-medium text-neutral-700">Client *</label>
							<input
								type="text"
								id="clientSearch"
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
							<label for="carrier" class="block text-sm font-medium text-neutral-700">Insurance Carrier *</label>
							<select
								id="carrier"
								bind:value={formData.carrier}
								required
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							>
								<option value="">Select carrier...</option>
								{#each carriers as carrier}
									<option value={carrier}>{carrier}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="productType" class="block text-sm font-medium text-neutral-700">Product Type</label>
							<select
								id="productType"
								bind:value={formData.productType}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							>
								{#each productTypes as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="effectiveDate" class="block text-sm font-medium text-neutral-700">Effective Date</label>
							<input
								type="date"
								id="effectiveDate"
								bind:value={formData.dates.effective}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>

						<div>
							<label for="expirationDate" class="block text-sm font-medium text-neutral-700">Expiration Date</label>
							<input
								type="date"
								id="expirationDate"
								bind:value={formData.dates.expiration}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Premium Information -->
			<div class="bg-white shadow rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg leading-6 font-medium text-neutral-900 mb-4">Premium & Commission</h3>
					
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
						<div>
							<label for="annualPremium" class="block text-sm font-medium text-neutral-700">Annual Premium</label>
							<div class="mt-1 relative rounded-md shadow-sm">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<span class="text-neutral-500 sm:text-sm">$</span>
								</div>
								<input
									type="text"
									id="annualPremium"
									value={formData.premium.annual ? formatCurrency(parseFloat(formData.premium.annual)) : '$0.00'}
									readonly
									class="block w-full pl-7 pr-12 border-neutral-300 rounded-md bg-neutral-50 text-neutral-500 sm:text-sm"
								/>
							</div>
							<p class="mt-1 text-xs text-neutral-500">Auto-calculated</p>
						</div>

						<div>
							<label for="monthlyPremium" class="block text-sm font-medium text-neutral-700">Monthly Premium</label>
							<div class="mt-1 relative rounded-md shadow-sm">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<span class="text-neutral-500 sm:text-sm">$</span>
								</div>
								<input
									type="text"
									id="monthlyPremium"
									value={formData.premium.monthly ? formatCurrency(parseFloat(formData.premium.monthly)) : '$0.00'}
									readonly
									class="block w-full pl-7 pr-12 border-neutral-300 rounded-md bg-neutral-50 text-neutral-500 sm:text-sm"
								/>
							</div>
							<p class="mt-1 text-xs text-neutral-500">Auto-calculated</p>
						</div>

						<div>
							<label for="totalCommission" class="block text-sm font-medium text-neutral-700">Total Commission</label>
							<div class="mt-1 relative rounded-md shadow-sm">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<span class="text-neutral-500 sm:text-sm">$</span>
								</div>
								<input
									type="text"
									id="totalCommission"
									value={formData.commission.amount ? formatCurrency(parseFloat(formData.commission.amount)) : '$0.00'}
									readonly
									class="block w-full pl-7 pr-12 border-neutral-300 rounded-md bg-neutral-50 text-neutral-500 sm:text-sm"
								/>
							</div>
							<p class="mt-1 text-xs text-neutral-500">15% commission</p>
						</div>


					</div>
				</div>
			</div>

			<!-- Coverage Details -->
			<div class="bg-white shadow rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg leading-6 font-medium text-neutral-900 mb-4">Coverage Details</h3>
					
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<label for="perOccurrence" class="block text-sm font-medium text-neutral-700">Per Occurrence Limit</label>
							<select
								id="perOccurrence"
								bind:value={formData.coverage.limits.perOccurrence}
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
								bind:value={formData.coverage.limits.aggregate}
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
								bind:value={formData.coverage.deductible}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							>
								<option value="500">$500</option>
								<option value="1000">$1,000</option>
								<option value="2500">$2,500</option>
								<option value="5000">$5,000</option>
								<option value="10000">$10,000</option>
							</select>
						</div>

						<div class="sm:col-span-2">
							<label for="notes" class="block text-sm font-medium text-neutral-700">Additional Notes</label>
							<textarea
								id="notes"
								bind:value={formData.notes}
								rows="3"
								placeholder="Any special terms, conditions, or notes about this policy..."
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							></textarea>
						</div>
					</div>
				</div>
			</div>

					<!-- Premium Preview -->
		{#if formData.premium.annual && formData.premium.monthly}
			<div class="bg-blue-50 border border-blue-200 rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg font-medium text-blue-900 mb-3">Policy Premium Summary</h3>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div class="text-center">
							<div class="text-2xl font-bold text-blue-700">{formatCurrency(parseFloat(formData.premium.annual))}</div>
							<div class="text-sm text-blue-600">Annual Premium</div>
						</div>
						<div class="text-center">
							<div class="text-2xl font-bold text-blue-700">{formatCurrency(parseFloat(formData.premium.monthly))}</div>
							<div class="text-sm text-blue-600">Monthly Premium</div>
						</div>
						<div class="text-center">
							<div class="text-2xl font-bold text-blue-700">{formatCurrency(parseFloat(formData.commission.amount) || 0)}</div>
							<div class="text-sm text-blue-600">Your Commission ({formData.commission.rate}%)</div>
						</div>
					</div>
					<div class="mt-3 text-xs text-blue-600">
						* Premium calculated based on {formData.productType.replace('_', ' ')} coverage with {formatCurrency(parseInt(formData.coverage.limits.perOccurrence))} per occurrence limit.
					</div>
				</div>
			</div>
		{/if}

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
						<span class="ml-2">Creating...</span>
					{:else}
						Create Policy
					{/if}
				</button>
			</div>
		</form>
	</div>
</div> 