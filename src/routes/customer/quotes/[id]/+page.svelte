<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { currentUser } from '$lib/services/auth';
	import { doc, getDoc } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let loading = true;
	let quote = null;
	let errorMessage = '';

	const quoteId = $page.params.id;

	onMount(async () => {
		if (!$currentUser) {
			goto('/customer/login');
			return;
		}
		await loadQuote();
	});

	async function loadQuote() {
		try {
			const quoteDoc = await getDoc(doc(db, 'quotes', quoteId));
			if (quoteDoc.exists()) {
				const data = quoteDoc.data();
				// Verify this quote belongs to the current user
				if (data.customerId === $currentUser.uid) {
					quote = { id: quoteDoc.id, ...data };
				} else {
					errorMessage = 'Quote not found or access denied.';
				}
			} else {
				errorMessage = 'Quote not found.';
			}
		} catch (error) {
			console.error('Error loading quote:', error);
			errorMessage = 'Failed to load quote details.';
		} finally {
			loading = false;
		}
	}

	function formatDate(date) {
		if (!date) return 'N/A';
		const d = date.toDate ? date.toDate() : new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatCurrency(amount) {
		if (!amount) return '$0';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function getStatusColor(status) {
		switch (status) {
			case 'submitted':
				return 'bg-blue-100 text-blue-800';
			case 'reviewing':
				return 'bg-yellow-100 text-yellow-800';
			case 'quoted':
				return 'bg-green-100 text-green-800';
			case 'purchased':
				return 'bg-success-100 text-success-800';
			case 'declined':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-neutral-100 text-neutral-800';
		}
	}

	function getCoverageIcon(type) {
		switch (type) {
			case 'auto':
				return '🚗';
			case 'home':
				return '🏠';
			case 'life':
				return '❤️';
			case 'health':
				return '🏥';
			case 'business':
				return '🏢';
			case 'renters':
				return '🔑';
			default:
				return '📄';
		}
	}

	function continueToQuotes() {
		goto(`/customer/quotes/${quoteId}/compare`);
	}

	function editApplication() {
		// Navigate to edit application - for now just go to the application type
		goto(`/customer/apply/${quote.coverageType}`);
	}
</script>

<svelte:head>
	<title>Quote Details - X Insurance Brokers</title>
	<meta name="description" content="View your insurance quote application details." />
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	<!-- Header -->
	<div class="bg-white shadow-sm border-b border-neutral-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex items-center justify-between">
				<div>
					<div class="flex items-center space-x-2 text-sm text-neutral-600 mb-2">
						<a href="/customer/dashboard" class="hover:text-primary-600">Dashboard</a>
						<span>›</span>
						<a href="/customer/quotes" class="hover:text-primary-600">Applications</a>
						<span>›</span>
						<span>Quote Details</span>
					</div>
					<h1 class="text-2xl font-bold text-neutral-900">Quote Application Details</h1>
				</div>
				<a
					href="/customer/quotes"
					class="text-primary-600 hover:text-primary-700 font-medium transition-colors"
				>
					← Back to Applications
				</a>
			</div>
		</div>
	</div>

	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{#if loading}
			<div class="flex items-center justify-center py-24">
				<LoadingSpinner size="lg" />
			</div>
		{:else if errorMessage}
			<div class="text-center py-12">
				<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h2 class="text-xl font-semibold text-neutral-900 mb-2">Error</h2>
				<p class="text-neutral-600 mb-6">{errorMessage}</p>
				<a
					href="/customer/quotes"
					class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
				>
					View All Applications
				</a>
			</div>
		{:else if quote}
			<!-- Quote Overview -->
			<div class="bg-white rounded-xl shadow-sm border border-neutral-200 mb-8">
				<div class="px-6 py-4 border-b border-neutral-200">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-4">
							<div class="text-3xl">{getCoverageIcon(quote.coverageType)}</div>
							<div>
								<h2 class="text-xl font-semibold text-neutral-900 capitalize">
									{quote.coverageType} Insurance Application
								</h2>
								<p class="text-neutral-600">Application ID: {quote.id}</p>
							</div>
						</div>
						<span class="inline-flex px-3 py-1 text-sm font-medium rounded-full {getStatusColor(quote.status)}">
							{quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
						</span>
					</div>
				</div>

				<div class="p-6">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
						<div>
							<label class="block text-sm font-medium text-neutral-700">Submitted</label>
							<p class="mt-1 text-sm text-neutral-900">{formatDate(quote.submittedAt || quote.createdAt)}</p>
						</div>
						<div>
							<label class="block text-sm font-medium text-neutral-700">Last Updated</label>
							<p class="mt-1 text-sm text-neutral-900">{formatDate(quote.updatedAt)}</p>
						</div>
						{#if quote.selectedQuote}
							<div>
								<label class="block text-sm font-medium text-neutral-700">Selected Quote</label>
								<p class="mt-1 text-sm text-neutral-900 font-medium">
									{formatCurrency(quote.selectedQuote.monthlyPremium)}/month
								</p>
							</div>
						{/if}
					</div>

					<!-- Progress Indicator -->
					<div class="mb-6">
						<div class="flex items-center justify-between mb-2">
							<h3 class="font-medium text-neutral-900">Application Progress</h3>
							<span class="text-sm text-neutral-600">
								{#if quote.status === 'submitted'}
									Step 1 of 3
								{:else if quote.status === 'reviewing' || quote.status === 'quoted'}
									Step 2 of 3
								{:else if quote.status === 'purchased'}
									Complete
								{:else}
									{quote.status}
								{/if}
							</span>
						</div>
						<div class="flex items-center space-x-2">
							<div class="flex-1 bg-neutral-200 rounded-full h-3">
								<div 
									class="bg-primary-600 h-3 rounded-full transition-all duration-300"
									style="width: {quote.status === 'submitted' ? '33%' : quote.status === 'reviewing' || quote.status === 'quoted' ? '66%' : quote.status === 'purchased' ? '100%' : '10%'}"
								></div>
							</div>
						</div>
						<div class="flex justify-between text-xs text-neutral-500 mt-2">
							<span>Application Submitted</span>
							<span>Under Review</span>
							<span>Ready to Purchase</span>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex flex-wrap gap-3">
						{#if quote.status === 'quoted'}
							<button
								on:click={continueToQuotes}
								class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
							>
								Compare Quotes
							</button>
						{/if}

						{#if quote.status === 'submitted' || quote.status === 'reviewing'}
							<button
								on:click={editApplication}
								class="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-6 py-2 rounded-md font-medium transition-colors"
							>
								Edit Application
							</button>
						{/if}

						{#if quote.status === 'purchased'}
							<a
								href="/customer/policies"
								class="bg-success-600 hover:bg-success-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
							>
								View Policy
							</a>
						{/if}

						<a
							href="/customer/support"
							class="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-6 py-2 rounded-md font-medium transition-colors"
						>
							Contact Support
						</a>
					</div>
				</div>
			</div>

			<!-- Application Details -->
			{#if quote.applicationData}
				<div class="bg-white rounded-xl shadow-sm border border-neutral-200 mb-8">
					<div class="px-6 py-4 border-b border-neutral-200">
						<h3 class="text-lg font-semibold text-neutral-900">Application Information</h3>
					</div>
					<div class="p-6">
						{#if quote.applicationData.personalInfo}
							<div class="mb-8">
								<h4 class="font-medium text-neutral-900 mb-4">Personal Information</h4>
								<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label class="block text-sm font-medium text-neutral-700">Full Name</label>
										<p class="mt-1 text-sm text-neutral-900">
											{quote.applicationData.personalInfo.firstName} {quote.applicationData.personalInfo.lastName}
										</p>
									</div>
									<div>
										<label class="block text-sm font-medium text-neutral-700">Date of Birth</label>
										<p class="mt-1 text-sm text-neutral-900">{quote.applicationData.personalInfo.dateOfBirth}</p>
									</div>
									<div>
										<label class="block text-sm font-medium text-neutral-700">Email</label>
										<p class="mt-1 text-sm text-neutral-900">{quote.applicationData.personalInfo.email}</p>
									</div>
									<div>
										<label class="block text-sm font-medium text-neutral-700">Phone</label>
										<p class="mt-1 text-sm text-neutral-900">{quote.applicationData.personalInfo.phone}</p>
									</div>
									{#if quote.applicationData.personalInfo.address}
										<div class="md:col-span-2">
											<label class="block text-sm font-medium text-neutral-700">Address</label>
											<p class="mt-1 text-sm text-neutral-900">
												{quote.applicationData.personalInfo.address.street}<br>
												{quote.applicationData.personalInfo.address.city}, {quote.applicationData.personalInfo.address.state} {quote.applicationData.personalInfo.address.zipCode}
											</p>
										</div>
									{/if}
								</div>
							</div>
						{/if}

						{#if quote.coverageType === 'auto' && quote.applicationData.vehicles}
							<div class="mb-8">
								<h4 class="font-medium text-neutral-900 mb-4">Vehicle Information</h4>
								<div class="space-y-4">
									{#each quote.applicationData.vehicles as vehicle, index}
										<div class="border border-neutral-200 rounded-lg p-4">
											<h5 class="font-medium text-neutral-900 mb-3">Vehicle {index + 1}</h5>
											<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
												<div>
													<label class="block text-sm font-medium text-neutral-700">Year</label>
													<p class="mt-1 text-sm text-neutral-900">{vehicle.year}</p>
												</div>
												<div>
													<label class="block text-sm font-medium text-neutral-700">Make</label>
													<p class="mt-1 text-sm text-neutral-900">{vehicle.make}</p>
												</div>
												<div>
													<label class="block text-sm font-medium text-neutral-700">Model</label>
													<p class="mt-1 text-sm text-neutral-900">{vehicle.model}</p>
												</div>
												{#if vehicle.vin}
													<div>
														<label class="block text-sm font-medium text-neutral-700">VIN</label>
														<p class="mt-1 text-sm text-neutral-900 font-mono">{vehicle.vin}</p>
													</div>
												{/if}
												{#if vehicle.mileage}
													<div>
														<label class="block text-sm font-medium text-neutral-700">Mileage</label>
														<p class="mt-1 text-sm text-neutral-900">{vehicle.mileage.toLocaleString()} miles</p>
													</div>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						{#if quote.applicationData.coverage}
							<div class="mb-8">
								<h4 class="font-medium text-neutral-900 mb-4">Coverage Selection</h4>
								<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
									{#if quote.applicationData.coverage.liability}
										<div>
											<label class="block text-sm font-medium text-neutral-700">Liability Coverage</label>
											<p class="mt-1 text-sm text-neutral-900">
												${quote.applicationData.coverage.liability.bodilyInjury?.toLocaleString() || 'N/A'} / 
												${quote.applicationData.coverage.liability.propertyDamage?.toLocaleString() || 'N/A'}
											</p>
										</div>
									{/if}
									{#if quote.applicationData.coverage.collision}
										<div>
											<label class="block text-sm font-medium text-neutral-700">Collision</label>
											<p class="mt-1 text-sm text-neutral-900">
												{#if quote.applicationData.coverage.collision.selected}
													${quote.applicationData.coverage.collision.deductible} deductible
												{:else}
													Not selected
												{/if}
											</p>
										</div>
									{/if}
									{#if quote.applicationData.coverage.comprehensive}
										<div>
											<label class="block text-sm font-medium text-neutral-700">Comprehensive</label>
											<p class="mt-1 text-sm text-neutral-900">
												{#if quote.applicationData.coverage.comprehensive.selected}
													${quote.applicationData.coverage.comprehensive.deductible} deductible
												{:else}
													Not selected
												{/if}
											</p>
										</div>
									{/if}
								</div>
							</div>
						{/if}

						{#if quote.applicationData.drivingExperience}
							<div>
								<h4 class="font-medium text-neutral-900 mb-4">Driving Experience</h4>
								<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label class="block text-sm font-medium text-neutral-700">Years of Experience</label>
										<p class="mt-1 text-sm text-neutral-900">{quote.applicationData.drivingExperience}</p>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Status-specific Information -->
			{#if quote.status === 'quoted' && quote.selectedQuote}
				<div class="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
					<div class="flex items-center">
						<svg class="w-6 h-6 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<div>
							<h3 class="text-lg font-semibold text-green-900">Quotes Ready!</h3>
							<p class="text-green-700">
								We've found personalized quotes for your {quote.coverageType} insurance. 
								Compare options from multiple carriers and choose the best coverage for your needs.
							</p>
						</div>
					</div>
				</div>
			{:else if quote.status === 'declined'}
				<div class="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
					<div class="flex items-center">
						<svg class="w-6 h-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<div>
							<h3 class="text-lg font-semibold text-red-900">Application Declined</h3>
							<p class="text-red-700">
								Unfortunately, we were unable to provide a quote for this application. 
								Please contact our support team for more information or assistance with alternative options.
							</p>
						</div>
					</div>
				</div>
			{:else if quote.status === 'reviewing'}
				<div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
					<div class="flex items-center">
						<svg class="w-6 h-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<div>
							<h3 class="text-lg font-semibold text-yellow-900">Under Review</h3>
							<p class="text-yellow-700">
								Your application is currently being reviewed by our underwriting team. 
								We'll notify you once quotes are available, typically within 24-48 hours.
							</p>
						</div>
					</div>
				</div>
			{:else if quote.status === 'purchased'}
				<div class="bg-success-50 border border-success-200 rounded-xl p-6 mb-8">
					<div class="flex items-center">
						<svg class="w-6 h-6 text-success-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<div>
							<h3 class="text-lg font-semibold text-success-900">Policy Active</h3>
							<p class="text-success-700">
								Congratulations! Your policy is now active. You can view your policy details, 
								documents, and manage your coverage in the Policies section.
							</p>
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div> 