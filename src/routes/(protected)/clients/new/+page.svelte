<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';
	import { createClient } from '$lib/services/clients';
	import type { Client } from '$types';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let isLoading = false;
	let errorMessage = '';
	let successMessage = '';

	let formData = {
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		businessName: '',
		industry: '',
		website: '',
		description: '',
		// Address fields
		address: {
			street: '',
			city: '',
			state: '',
			zipCode: '',
			country: 'United States'
		},
		// Business details
		businessDetails: {
			foundedYear: new Date().getFullYear(),
			employeeCount: 1,
			annualRevenue: '',
			businessStructure: 'corporation'
		},
		status: 'prospect'
	};

	const industryOptions = [
		'Technology',
		'Healthcare',
		'Manufacturing', 
		'Retail',
		'Construction',
		'Professional Services',
		'Food & Beverage',
		'Transportation',
		'Real Estate',
		'Education',
		'Other'
	];

	const businessStructureOptions = [
		{ value: 'corporation', label: 'Corporation' },
		{ value: 'llc', label: 'LLC' },
		{ value: 'partnership', label: 'Partnership' },
		{ value: 'sole_proprietorship', label: 'Sole Proprietorship' },
		{ value: 'nonprofit', label: 'Non-Profit' }
	];

	async function handleSubmit() {
		if (!$currentUser) return;

		// Basic validation
		if (!formData.firstName || !formData.lastName || !formData.email) {
			errorMessage = 'Please fill in all required fields';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			// Clean and prepare client data - only include defined fields
			const clientData = {
				firstName: formData.firstName,
				lastName: formData.lastName,
				email: formData.email,
				phone: formData.phone,
				businessName: formData.businessName || undefined,
				industry: formData.industry || undefined,
				website: formData.website || undefined,
				description: formData.description || undefined,
				address: {
					street: formData.address.street,
					city: formData.address.city,
					state: formData.address.state,
					zipCode: formData.address.zipCode,
					country: formData.address.country
				},
				employeeCount: formData.businessDetails.employeeCount || undefined,
				annualRevenue: formData.businessDetails.annualRevenue ? parseFloat(formData.businessDetails.annualRevenue) : undefined,
				status: formData.status,
				tags: [],
				notes: ''
				// Note: removed dateOfBirth since it's not in the form
			};

			await createClient(clientData, $currentUser.uid);
			successMessage = 'Client created successfully!';
			
			setTimeout(() => {
				goto('/clients');
			}, 1500);
		} catch (error) {
			console.error('Error creating client:', error);
			errorMessage = 'Failed to create client. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function handleCancel() {
		goto('/clients');
	}
</script>

<svelte:head>
	<title>New Client - Insurance Broker Pro</title>
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
											on:click={() => goto('/clients')}
											class="text-neutral-400 hover:text-neutral-500"
										>
											<svg class="flex-shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
											</svg>
											<span class="sr-only">Clients</span>
										</button>
									</div>
								</li>
								<li>
									<div class="flex items-center">
										<svg class="flex-shrink-0 h-5 w-5 text-neutral-300" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
										</svg>
										<span class="ml-4 text-sm font-medium text-neutral-500">New Client</span>
									</div>
								</li>
							</ol>
						</nav>
						<h1 class="mt-2 text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
							Add New Client
						</h1>
						<div class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
							<div class="mt-2 flex items-center text-sm text-neutral-500">
								<svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
								Create a new client profile
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
			<!-- Basic Information -->
			<div class="bg-white shadow rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg leading-6 font-medium text-neutral-900 mb-4">Basic Information</h3>
					
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<label for="firstName" class="block text-sm font-medium text-neutral-700">First Name *</label>
							<input
								type="text"
								id="firstName"
								bind:value={formData.firstName}
								required
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>

						<div>
							<label for="lastName" class="block text-sm font-medium text-neutral-700">Last Name *</label>
							<input
								type="text"
								id="lastName"
								bind:value={formData.lastName}
								required
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>

						<div>
							<label for="email" class="block text-sm font-medium text-neutral-700">Email Address *</label>
							<input
								type="email"
								id="email"
								bind:value={formData.email}
								required
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>

						<div>
							<label for="phone" class="block text-sm font-medium text-neutral-700">Phone Number</label>
							<input
								type="tel"
								id="phone"
								bind:value={formData.phone}
								placeholder="+1 (555) 123-4567"
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Business Information -->
			<div class="bg-white shadow rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg leading-6 font-medium text-neutral-900 mb-4">Business Information</h3>
					
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div class="sm:col-span-2">
							<label for="businessName" class="block text-sm font-medium text-neutral-700">Business Name</label>
							<input
								type="text"
								id="businessName"
								bind:value={formData.businessName}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>

						<div>
							<label for="industry" class="block text-sm font-medium text-neutral-700">Industry</label>
							<select
								id="industry"
								bind:value={formData.industry}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							>
								<option value="">Select an industry</option>
								{#each industryOptions as industry}
									<option value={industry.toLowerCase().replace(/\s+/g, '_')}>{industry}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="website" class="block text-sm font-medium text-neutral-700">Website</label>
							<input
								type="url"
								id="website"
								bind:value={formData.website}
								placeholder="https://example.com"
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>

						<div>
							<label for="employeeCount" class="block text-sm font-medium text-neutral-700">Employee Count</label>
							<input
								type="number"
								id="employeeCount"
								bind:value={formData.businessDetails.employeeCount}
								min="1"
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>

						<div>
							<label for="businessStructure" class="block text-sm font-medium text-neutral-700">Business Structure</label>
							<select
								id="businessStructure"
								bind:value={formData.businessDetails.businessStructure}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							>
								{#each businessStructureOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</div>

						<div class="sm:col-span-2">
							<label for="description" class="block text-sm font-medium text-neutral-700">Business Description</label>
							<textarea
								id="description"
								bind:value={formData.description}
								rows="3"
								placeholder="Brief description of the business..."
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							></textarea>
						</div>
					</div>
				</div>
			</div>

			<!-- Address Information -->
			<div class="bg-white shadow rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg leading-6 font-medium text-neutral-900 mb-4">Address Information</h3>
					
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div class="sm:col-span-2">
							<label for="street" class="block text-sm font-medium text-neutral-700">Street Address</label>
							<input
								type="text"
								id="street"
								bind:value={formData.address.street}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>

						<div>
							<label for="city" class="block text-sm font-medium text-neutral-700">City</label>
							<input
								type="text"
								id="city"
								bind:value={formData.address.city}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>

						<div>
							<label for="state" class="block text-sm font-medium text-neutral-700">State</label>
							<input
								type="text"
								id="state"
								bind:value={formData.address.state}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>

						<div>
							<label for="zipCode" class="block text-sm font-medium text-neutral-700">ZIP Code</label>
							<input
								type="text"
								id="zipCode"
								bind:value={formData.address.zipCode}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>

						<div>
							<label for="country" class="block text-sm font-medium text-neutral-700">Country</label>
							<input
								type="text"
								id="country"
								bind:value={formData.address.country}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>
					</div>
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
						<span class="ml-2">Creating...</span>
					{:else}
						Create Client
					{/if}
				</button>
			</div>
		</form>
	</div>
</div> 