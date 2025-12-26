<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';
	import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let loading = true;
	let quotes = [];
	let searchQuery = '';
	let selectedStatus = 'all';
	let sortBy = 'newest';

	const statusOptions = [
		{ value: 'all', label: 'All Applications' },
		{ value: 'submitted', label: 'Submitted' },
		{ value: 'reviewing', label: 'Under Review' },
		{ value: 'quoted', label: 'Quoted' },
		{ value: 'purchased', label: 'Purchased' },
		{ value: 'declined', label: 'Declined' }
	];

	onMount(async () => {
		if (!$currentUser) {
			goto('/customer/login');
			return;
		}
		await loadQuotes();
	});

	async function loadQuotes() {
		if (!$currentUser) return;

		try {
			loading = true;
			const quotesQuery = query(
				collection(db, 'quotes'),
				where('customerId', '==', $currentUser.uid),
				orderBy('createdAt', 'desc')
			);

			const snapshot = await getDocs(quotesQuery);
			quotes = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			}));

		} catch (error) {
			console.error('Error loading quotes:', error);
		} finally {
			loading = false;
		}
	}

	function formatDate(date) {
		if (!date) return 'N/A';
		const d = date.toDate ? date.toDate() : new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
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

	function viewQuote(quoteId) {
		goto(`/customer/quotes/${quoteId}`);
	}

	function continueApplication(quoteId) {
		goto(`/customer/quotes/${quoteId}/compare`);
	}

	function startNewApplication() {
		goto('/apply');
	}

	$: filteredQuotes = quotes.filter(quote => {
		const matchesSearch = !searchQuery || 
			quote.coverageType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			quote.customerName?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesStatus = selectedStatus === 'all' || quote.status === selectedStatus;

		return matchesSearch && matchesStatus;
	}).sort((a, b) => {
		switch (sortBy) {
			case 'newest':
				return new Date(b.createdAt?.toDate() || b.createdAt) - new Date(a.createdAt?.toDate() || a.createdAt);
			case 'oldest':
				return new Date(a.createdAt?.toDate() || a.createdAt) - new Date(b.createdAt?.toDate() || b.createdAt);
					case 'status':
			return a.status.localeCompare(b.status);
			default:
				return 0;
		}
	});
</script>

<svelte:head>
	<title>My Applications - X Insurance Brokers</title>
	<meta name="description" content="View and manage your insurance applications and quotes with X Insurance Brokers." />
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	<!-- Header -->
	<div class="bg-white shadow-sm border-b border-neutral-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">My Applications</h1>
					<p class="text-neutral-600">Track your insurance applications and quotes</p>
				</div>
				<div class="flex space-x-3">
					<a
						href="/customer/dashboard"
						class="text-primary-600 hover:text-primary-700 font-medium transition-colors"
					>
						← Dashboard
					</a>
					<button
						on:click={startNewApplication}
						class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
					>
						New Application
					</button>
				</div>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{#if loading}
			<div class="flex items-center justify-center py-24">
				<LoadingSpinner size="lg" />
			</div>
		{:else}
			<!-- Filters -->
			<div class="bg-white rounded-xl shadow-sm border border-neutral-200 mb-6">
				<div class="p-6">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label for="search" class="block text-sm font-medium text-neutral-700 mb-2">
								Search Applications
							</label>
							<input
								id="search"
								type="text"
								placeholder="Coverage type or name..."
								bind:value={searchQuery}
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>
						<div>
							<label for="status" class="block text-sm font-medium text-neutral-700 mb-2">
								Status
							</label>
							<select
								id="status"
								bind:value={selectedStatus}
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							>
								{#each statusOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="sort" class="block text-sm font-medium text-neutral-700 mb-2">
								Sort By
							</label>
							<select
								id="sort"
								bind:value={sortBy}
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							>
								<option value="newest">Newest First</option>
								<option value="oldest">Oldest First</option>
								<option value="status">Status</option>
							</select>
						</div>
					</div>
				</div>
			</div>

			<!-- Applications List -->
			{#if filteredQuotes.length === 0}
				<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
					<svg class="mx-auto h-12 w-12 text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<h3 class="text-lg font-medium text-neutral-900 mb-2">No applications found</h3>
					<p class="text-neutral-600 mb-6">
						{#if searchQuery || selectedStatus !== 'all'}
							Try adjusting your search or filter criteria.
						{:else}
							Start your first insurance application to get personalized quotes.
						{/if}
					</p>
					<button
						on:click={startNewApplication}
						class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
					>
						Start Application
					</button>
				</div>
			{:else}
				<div class="space-y-6">
					{#each filteredQuotes as quote}
						<div class="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
							<div class="p-6">
								<div class="flex items-start justify-between">
									<div class="flex items-start space-x-4">
										<div class="text-3xl">{getCoverageIcon(quote.coverageType)}</div>
										<div>
											<h3 class="text-lg font-semibold text-neutral-900 capitalize">
												{quote.coverageType} Insurance Application
											</h3>
											<p class="text-neutral-600">
												Application ID: {quote.id.slice(-8)}
											</p>
											<div class="flex items-center space-x-4 mt-2 text-sm text-neutral-500">
												<span>Submitted: {formatDate(quote.submittedAt || quote.createdAt)}</span>
												{#if quote.updatedAt && quote.updatedAt !== quote.createdAt}
													<span>•</span>
													<span>Updated: {formatDate(quote.updatedAt)}</span>
												{/if}
											</div>
										</div>
									</div>
									<div class="text-right">
										<span class="inline-flex px-3 py-1 text-sm font-medium rounded-full {getStatusColor(quote.status)}">
											{quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
										</span>
										{#if quote.selectedQuote && quote.selectedQuote.monthlyPremium}
											<div class="mt-2">
												<p class="text-lg font-semibold text-neutral-900">
													{formatCurrency(quote.selectedQuote.monthlyPremium)}/month
												</p>
											</div>
										{/if}
									</div>
								</div>

								<!-- Progress Indicator -->
								<div class="mt-6 pt-6 border-t border-neutral-200">
									<div class="flex items-center justify-between mb-2">
										<h4 class="font-medium text-neutral-900">Application Progress</h4>
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
										<div class="flex-1 bg-neutral-200 rounded-full h-2">
											<div 
												class="bg-primary-600 h-2 rounded-full transition-all duration-300"
												style="width: {quote.status === 'submitted' ? '33%' : quote.status === 'reviewing' || quote.status === 'quoted' ? '66%' : quote.status === 'purchased' ? '100%' : '10%'}"
											></div>
										</div>
									</div>
									<div class="flex justify-between text-xs text-neutral-500 mt-1">
										<span>Application</span>
										<span>Review</span>
										<span>Purchase</span>
									</div>
								</div>

								<!-- Application Details -->
								{#if quote.applicationData}
									<div class="mt-6 pt-6 border-t border-neutral-200">
										<h4 class="font-medium text-neutral-900 mb-3">Application Details</h4>
										<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
											{#if quote.applicationData.personalInfo}
												<div>
													<p class="text-neutral-600">Applicant</p>
													<p class="font-medium">
														{quote.applicationData.personalInfo.firstName} {quote.applicationData.personalInfo.lastName}
													</p>
												</div>
											{/if}
											{#if quote.coverageType === 'auto' && quote.applicationData.vehicles}
												<div>
													<p class="text-neutral-600">Vehicles</p>
													<p class="font-medium">
														{quote.applicationData.vehicles.length} vehicle{quote.applicationData.vehicles.length !== 1 ? 's' : ''}
													</p>
												</div>
											{/if}
											{#if quote.applicationData.drivingExperience}
												<div>
													<p class="text-neutral-600">Experience</p>
													<p class="font-medium">{quote.applicationData.drivingExperience} years</p>
												</div>
											{/if}
										</div>
									</div>
								{/if}

								<!-- Actions -->
								<div class="mt-6 pt-6 border-t border-neutral-200">
									<div class="flex flex-wrap gap-3">
										<button
											on:click={() => viewQuote(quote.id)}
											class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
										>
											View Details
										</button>

										{#if quote.status === 'quoted'}
											<button
												on:click={() => continueApplication(quote.id)}
												class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
											>
												Compare Quotes
											</button>
										{/if}

										{#if quote.status === 'submitted' || quote.status === 'reviewing'}
											<span class="inline-flex items-center px-4 py-2 text-sm text-neutral-600 bg-neutral-100 rounded-md">
												⏳ Processing
											</span>
										{/if}

										{#if quote.status === 'purchased'}
											<button
												on:click={() => goto('/customer/policies')}
												class="bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
											>
												View Policy
											</button>
										{/if}

										<button
											on:click={() => goto('/customer/support')}
											class="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
										>
											Get Help
										</button>
									</div>
								</div>

								<!-- Status-specific Messages -->
								{#if quote.status === 'declined'}
									<div class="mt-6 pt-6 border-t border-neutral-200">
										<div class="bg-red-50 border border-red-200 rounded-lg p-4">
											<div class="flex items-center">
												<svg class="w-5 h-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												<div>
													<h5 class="font-medium text-red-900">Application Declined</h5>
													<p class="text-red-700 text-sm">
														This application was not approved. Contact support for more information or try a different coverage option.
													</p>
												</div>
											</div>
										</div>
									</div>
								{:else if quote.status === 'quoted'}
									<div class="mt-6 pt-6 border-t border-neutral-200">
										<div class="bg-green-50 border border-green-200 rounded-lg p-4">
											<div class="flex items-center">
												<svg class="w-5 h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												<div>
													<h5 class="font-medium text-green-900">Quotes Ready!</h5>
													<p class="text-green-700 text-sm">
														We've found personalized quotes for you. Compare options and choose the best coverage.
													</p>
												</div>
											</div>
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div> 