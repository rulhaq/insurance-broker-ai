<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';
	import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let loading = true;
	let applications = [];
	let searchQuery = '';
	let statusFilter = 'all';

	const statuses = [
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
		console.log('👤 Customer user loaded:', { uid: $currentUser.uid, email: $currentUser.email, role: $currentUser.role });
		await loadApplications();
	});

	async function loadApplications() {
		if (!$currentUser?.uid) return;

		try {
			loading = true;
			console.log('🔍 Loading applications for customer:', $currentUser.uid);
			
			const applicationsQuery = query(
				collection(db, 'quotes'),
				where('customerId', '==', $currentUser.uid),
				orderBy('createdAt', 'desc')
			);

			const snapshot = await getDocs(applicationsQuery);
			applications = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			}));

			console.log('📄 Found applications:', applications.length);
			if (applications.length > 0) {
				console.log('📋 Applications:', applications);
			}

		} catch (error) {
			console.error('❌ Error loading applications:', error);
			console.error('🔧 This might be due to missing Firebase index. Check console output.');
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

	$: filteredApplications = applications.filter(app => {
		const matchesSearch = !searchQuery || 
			app.coverageType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			app.customerName?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

		return matchesSearch && matchesStatus;
	});
</script>

<svelte:head>
	<title>My Applications - X Insurance Brokers</title>
	<meta name="description" content="Track your insurance applications and quotes." />
</svelte:head>

<div class="min-h-screen bg-neutral-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">My Applications</h1>
					<p class="text-neutral-600 mt-1">Track your insurance applications and quotes</p>
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
						New Application
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
							Search Applications
						</label>
						<input
							id="search"
							type="text"
							placeholder="Search by coverage type..."
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

			<!-- Applications List -->
			{#if filteredApplications.length === 0}
				<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-12 text-center">
					<div class="text-6xl mb-4">📝</div>
					<h3 class="text-lg font-medium text-neutral-900 mb-2">No applications found</h3>
					<p class="text-neutral-600 mb-6">
						{#if searchQuery || statusFilter !== 'all'}
							Try adjusting your search or filter criteria.
						{:else}
							Start your first insurance application to see it here.
						{/if}
					</p>
					<a
						href="/apply"
						class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
					>
						Start Application
					</a>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-6">
					{#each filteredApplications as application}
						<div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
							<div class="p-6">
								<div class="flex items-start justify-between mb-4">
									<div class="flex items-center space-x-3">
										<div class="text-3xl">
											{getCoverageIcon(application.coverageType)}
										</div>
										<div>
											<h3 class="text-lg font-semibold text-neutral-900">
												{application.coverageType?.charAt(0).toUpperCase() + application.coverageType?.slice(1)} Insurance
											</h3>
											<p class="text-sm text-neutral-600">
												Application #{application.id.slice(-8)}
											</p>
										</div>
									</div>
									<span class="inline-flex px-3 py-1 text-sm font-medium rounded-full {getStatusColor(application.status)}">
										{application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
									</span>
								</div>

								<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
									<div>
										<p class="text-xs text-neutral-500">Submitted</p>
										<p class="font-medium text-neutral-900">{formatDate(application.submittedAt)}</p>
									</div>
									<div>
										<p class="text-xs text-neutral-500">Coverage Type</p>
										<p class="font-medium text-neutral-900">
											{application.coverageType?.charAt(0).toUpperCase() + application.coverageType?.slice(1)}
										</p>
									</div>
									{#if application.selectedQuote}
										<div>
											<p class="text-xs text-neutral-500">Quoted Premium</p>
											<p class="font-medium text-neutral-900">
												${application.selectedQuote.monthlyPremium}/month
											</p>
										</div>
									{/if}
								</div>

								<!-- Application Progress -->
								<div class="mb-4">
									<div class="flex items-center justify-between text-sm mb-2">
										<span class="text-neutral-600">Application Progress</span>
										<span class="text-neutral-900 font-medium">
											{application.status === 'purchased' ? '100%' : 
											 application.status === 'quoted' ? '75%' :
											 application.status === 'reviewing' ? '50%' :
											 application.status === 'declined' ? '100%' : '25%'}
										</span>
									</div>
									<div class="w-full bg-neutral-200 rounded-full h-2">
										<div 
											class="bg-primary-600 h-2 rounded-full transition-all duration-300"
											style="width: {application.status === 'purchased' ? '100%' : 
														application.status === 'quoted' ? '75%' :
														application.status === 'reviewing' ? '50%' :
														application.status === 'declined' ? '100%' : '25%'}"
										></div>
									</div>
								</div>

								<!-- Actions -->
								<div class="flex flex-wrap gap-3">
									<button
										on:click={() => goto(`/customer/applications/${application.id}`)}
										class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
									>
										View Details
									</button>
									
									{#if application.status === 'quoted' && application.selectedQuote}
										<button
											on:click={() => goto(`/customer/checkout/${application.id}`)}
											class="bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
										>
											Purchase Policy
										</button>
									{/if}
									
									{#if application.status === 'submitted' || application.status === 'reviewing'}
										<button
											on:click={() => goto(`/customer/apply/${application.coverageType}?edit=${application.id}`)}
											class="border border-neutral-300 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
										>
											Edit Application
										</button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div> 