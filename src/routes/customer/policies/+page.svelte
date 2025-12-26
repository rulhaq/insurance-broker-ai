<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';
	import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let loading = true;
	let policies = [];
	let searchQuery = '';
	let statusFilter = 'all';

	const statuses = [
		{ value: 'all', label: 'All Policies' },
		{ value: 'active', label: 'Active' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'expired', label: 'Expired' },
		{ value: 'cancelled', label: 'Cancelled' }
	];

	onMount(async () => {
		if (!$currentUser) {
			goto('/customer/login');
			return;
		}
		await loadPolicies();
	});

	async function loadPolicies() {
		if (!$currentUser?.uid) return;

		try {
			loading = true;
			const policiesQuery = query(
				collection(db, 'policies'),
				where('customerId', '==', $currentUser.uid),
				orderBy('createdAt', 'desc')
			);

			const snapshot = await getDocs(policiesQuery);
			policies = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			}));

		} catch (error) {
			console.error('Error loading policies:', error);
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
			currency: 'USD',
			minimumFractionDigits: 0
		}).format(amount);
	}

	function getStatusColor(status) {
		switch (status) {
			case 'active':
				return 'bg-success-100 text-success-800';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'expired':
				return 'bg-red-100 text-red-800';
			case 'cancelled':
				return 'bg-neutral-100 text-neutral-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getPaymentStatusColor(status) {
		switch (status) {
			case 'current':
				return 'bg-success-100 text-success-800';
			case 'overdue':
				return 'bg-red-100 text-red-800';
			case 'grace_period':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getCoverageIcon(type) {
		switch (type) {
			case 'auto': return '🚗';
			case 'home': return '🏠';
			case 'life': return '❤️';
			case 'health': return '🏥';
			case 'business': return '🏢';
			case 'renters': return '🔑';
			default: return '📄';
		}
	}

	function isRenewalDue(policy) {
		if (!policy.dates?.expiration) return false;
		const expirationDate = policy.dates.expiration.toDate ? 
			policy.dates.expiration.toDate() : 
			new Date(policy.dates.expiration);
		const now = new Date();
		const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
		return daysUntilExpiration <= 60 && daysUntilExpiration > 0;
	}

	$: filteredPolicies = policies.filter(policy => {
		const matchesSearch = !searchQuery || 
			policy.coverageType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			policy.policyNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			policy.carrier?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;

		return matchesSearch && matchesStatus;
	});
</script>

<svelte:head>
	<title>My Policies - X Insurance Brokers</title>
	<meta name="description" content="Manage your insurance policies, payments, and documents." />
</svelte:head>

<div class="min-h-screen bg-neutral-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">My Policies</h1>
					<p class="text-neutral-600 mt-1">Manage your insurance policies and coverage</p>
				</div>
				<div class="flex space-x-3">
					<a
						href="/customer/dashboard"
						class="text-primary-600 hover:text-primary-700 font-medium transition-colors"
					>
						← Back to Dashboard
					</a>
					<a
						href="/apply"
						class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
					>
						Add Coverage
					</a>
				</div>
			</div>
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-24">
				<LoadingSpinner size="lg" />
			</div>
		{:else}
			<!-- Filters -->
			<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="search" class="block text-sm font-medium text-neutral-700 mb-2">
							Search Policies
						</label>
						<input
							id="search"
							type="text"
							placeholder="Search by policy number, coverage type, or carrier..."
							bind:value={searchQuery}
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						/>
					</div>
					<div>
						<label for="status" class="block text-sm font-medium text-neutral-700 mb-2">
							Filter by Status
						</label>
						<select
							id="status"
							bind:value={statusFilter}
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						>
							{#each statuses as status}
								<option value={status.value}>{status.label}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			<!-- Policies List -->
			{#if filteredPolicies.length === 0}
				<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-12 text-center">
					<div class="text-6xl mb-4">🛡️</div>
					<h3 class="text-lg font-medium text-neutral-900 mb-2">No policies found</h3>
					<p class="text-neutral-600 mb-6">
						{#if searchQuery || statusFilter !== 'all'}
							Try adjusting your search or filter criteria.
						{:else}
							Get started with your first insurance policy.
						{/if}
					</p>
					<a
						href="/apply"
						class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
					>
						Get Quote
					</a>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-6">
					{#each filteredPolicies as policy}
						<div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
							<!-- Renewal Alert -->
							{#if isRenewalDue(policy)}
								<div class="bg-orange-50 border-b border-orange-200 px-6 py-3">
									<div class="flex items-center">
										<svg class="w-5 h-5 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
										</svg>
										<span class="text-sm font-medium text-orange-800">
											Policy expires {formatDate(policy.dates?.expiration)} - Renewal required
										</span>
									</div>
								</div>
							{/if}

							<div class="p-6">
								<div class="flex items-start justify-between mb-4">
									<div class="flex items-center space-x-3">
										<div class="text-3xl">
											{getCoverageIcon(policy.coverageType)}
										</div>
										<div>
											<h3 class="text-lg font-semibold text-neutral-900">
												{policy.coverageType?.charAt(0).toUpperCase() + policy.coverageType?.slice(1)} Insurance
											</h3>
											<p class="text-sm text-neutral-600">
												Policy #{policy.policyNumber}
											</p>
											<p class="text-sm text-neutral-600">
												{policy.carrier}
											</p>
										</div>
									</div>
									<div class="flex flex-col space-y-2">
										<span class="inline-flex px-3 py-1 text-sm font-medium rounded-full {getStatusColor(policy.status)}">
											{policy.status?.charAt(0).toUpperCase() + policy.status?.slice(1)}
										</span>
										<span class="inline-flex px-3 py-1 text-sm font-medium rounded-full {getPaymentStatusColor(policy.paymentStatus)}">
											{policy.paymentStatus?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
										</span>
									</div>
								</div>

								<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
									<div>
										<p class="text-xs text-neutral-500">Monthly Premium</p>
										<p class="font-medium text-neutral-900">{formatCurrency(policy.premium?.monthly)}</p>
									</div>
									<div>
										<p class="text-xs text-neutral-500">Effective Date</p>
										<p class="font-medium text-neutral-900">{formatDate(policy.dates?.effective)}</p>
									</div>
									<div>
										<p class="text-xs text-neutral-500">Expiration Date</p>
										<p class="font-medium text-neutral-900">{formatDate(policy.dates?.expiration)}</p>
									</div>
									<div>
										<p class="text-xs text-neutral-500">Next Payment</p>
										<p class="font-medium text-neutral-900">{formatDate(policy.premium?.nextDueDate)}</p>
									</div>
								</div>

								<!-- Coverage Details -->
								{#if policy.coverage}
									<div class="mb-6">
										<h4 class="text-sm font-medium text-neutral-900 mb-2">Coverage Details</h4>
										<div class="bg-neutral-50 rounded-lg p-4">
											<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
												{#if policy.coverage.liability}
													<div>
														<span class="text-neutral-600">Liability:</span>
														<span class="font-medium">
															{formatCurrency(policy.coverage.liability.bodilyInjury)} / 
															{formatCurrency(policy.coverage.liability.propertyDamage)}
														</span>
													</div>
												{/if}
												{#if policy.coverage.collision?.selected}
													<div>
														<span class="text-neutral-600">Collision Deductible:</span>
														<span class="font-medium">{formatCurrency(policy.coverage.collision.deductible)}</span>
													</div>
												{/if}
												{#if policy.coverage.comprehensive?.selected}
													<div>
														<span class="text-neutral-600">Comprehensive Deductible:</span>
														<span class="font-medium">{formatCurrency(policy.coverage.comprehensive.deductible)}</span>
													</div>
												{/if}
											</div>
										</div>
									</div>
								{/if}

								<!-- Actions -->
								<div class="flex flex-wrap gap-3">
									<button
										on:click={() => goto(`/customer/policies/${policy.id}`)}
										class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
									>
										View Policy
									</button>
									
									{#if policy.paymentStatus === 'overdue' || policy.paymentStatus === 'grace_period'}
										<button
											class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
										>
											Make Payment
										</button>
									{:else}
										<button
											class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
										>
											Pay Premium
										</button>
									{/if}
									
									{#if policy.documents && policy.documents.length > 0}
										<button
											class="border border-neutral-300 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
										>
											Download ID Cards
										</button>
									{/if}
									
									{#if isRenewalDue(policy)}
										<button
											class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
										>
											Renew Policy
										</button>
									{/if}
									
									<button
										class="border border-neutral-300 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
									>
										Contact Agent
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div> 