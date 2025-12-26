<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';
	import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let loading = true;
	let reports = [];
	let searchQuery = '';
	let selectedType = 'all';
	let sortBy = 'newest';

	const reportTypes = [
		{ value: 'all', label: 'All Reports' },
		{ value: 'monthly_sales', label: 'Monthly Sales' },
		{ value: 'quarterly_performance', label: 'Quarterly Performance' },
		{ value: 'annual_summary', label: 'Annual Summary' },
		{ value: 'client_analysis', label: 'Client Analysis' },
		{ value: 'claims_overview', label: 'Claims Overview' },
		{ value: 'revenue_forecast', label: 'Revenue Forecast' }
	];

	onMount(async () => {
		if (!$currentUser) {
			goto('/auth/login');
			return;
		}
		await loadReports();
	});

	async function loadReports() {
		if (!$currentUser) return;

		try {
			loading = true;
			const isAdmin = $currentUser.role === 'admin';
			
			// Admin sees ALL reports, brokers see only their own
			const reportsQuery = isAdmin
				? query(collection(db, 'reports'), orderBy('generatedDate', 'desc'))
				: query(
					collection(db, 'reports'),
					where('brokerId', '==', $currentUser.uid),
					orderBy('generatedDate', 'desc')
				);

			const snapshot = await getDocs(reportsQuery);
			reports = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
				brokerId: doc.data().brokerId // Include broker info for admin view
			}));

		} catch (error) {
			console.error('Error loading reports:', error);
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
			case 'generated':
				return 'bg-success-100 text-success-800';
			case 'in_progress':
				return 'bg-yellow-100 text-yellow-800';
			case 'scheduled':
				return 'bg-blue-100 text-blue-800';
			case 'archived':
				return 'bg-neutral-100 text-neutral-800';
			default:
				return 'bg-neutral-100 text-neutral-800';
		}
	}

	function downloadReport(report) {
		if (report.downloadUrl) {
			window.open(report.downloadUrl, '_blank');
		}
	}

	function generateNewReport() {
		goto('/reports/new');
	}

	$: filteredReports = reports.filter(report => {
		const matchesSearch = !searchQuery || 
			report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			report.type?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesType = selectedType === 'all' || report.type === selectedType;

		return matchesSearch && matchesType;
	}).sort((a, b) => {
		switch (sortBy) {
			case 'newest':
				return new Date(b.generatedDate?.toDate() || b.generatedDate) - new Date(a.generatedDate?.toDate() || a.generatedDate);
			case 'oldest':
				return new Date(a.generatedDate?.toDate() || a.generatedDate) - new Date(b.generatedDate?.toDate() || b.generatedDate);
			case 'title':
				return a.title?.localeCompare(b.title || '') || 0;
			default:
				return 0;
		}
	});
</script>

<svelte:head>
	<title>Reports - X Insurance Brokers</title>
	<meta name="description" content="View and manage your insurance reports and analytics." />
</svelte:head>

<div class="container-page py-6">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold text-neutral-900">Reports</h1>
			<p class="text-neutral-600 mt-2">View and manage your business reports and analytics</p>
		</div>
		<button
			on:click={generateNewReport}
			class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
		>
			Generate Report
		</button>
	</div>

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
							Search Reports
						</label>
						<input
							id="search"
							type="text"
							placeholder="Report title or type..."
							bind:value={searchQuery}
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						/>
					</div>
					<div>
						<label for="type" class="block text-sm font-medium text-neutral-700 mb-2">
							Report Type
						</label>
						<select
							id="type"
							bind:value={selectedType}
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						>
							{#each reportTypes as type}
								<option value={type.value}>{type.label}</option>
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
							<option value="title">Title</option>
						</select>
					</div>
				</div>
			</div>
		</div>

		<!-- Reports List -->
		{#if filteredReports.length === 0}
			<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
				<svg class="mx-auto h-12 w-12 text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
				</svg>
				<h3 class="text-lg font-medium text-neutral-900 mb-2">No reports found</h3>
				<p class="text-neutral-600 mb-6">
					{#if searchQuery || selectedType !== 'all'}
						Try adjusting your search or filter criteria.
					{:else}
						Generate your first report to get insights into your business performance.
					{/if}
				</p>
				<button
					on:click={generateNewReport}
					class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
				>
					Generate Report
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{#each filteredReports as report}
					<div class="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
						<div class="p-6">
							<div class="flex items-start justify-between mb-4">
								<div>
									<h3 class="text-lg font-semibold text-neutral-900">
										{report.title}
									</h3>
									<p class="text-neutral-600 text-sm capitalize">
										{report.type?.replace('_', ' ')}
									</p>
									{#if $currentUser?.role === 'admin' && report.brokerId}
										<p class="text-xs text-blue-600">Broker: {report.brokerId}</p>
									{/if}
								</div>
								<span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {getStatusColor(report.status)}">
									{report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
								</span>
							</div>

							{#if report.description}
								<p class="text-neutral-600 text-sm mb-4">{report.description}</p>
							{/if}

							<!-- Key Metrics -->
							{#if report.metrics}
								<div class="grid grid-cols-2 gap-4 mb-4">
									{#if report.metrics.totalClients}
										<div>
											<p class="text-xs text-neutral-500">Total Clients</p>
											<p class="text-lg font-semibold text-neutral-900">{report.metrics.totalClients}</p>
										</div>
									{/if}
									{#if report.metrics.revenue}
										<div>
											<p class="text-xs text-neutral-500">Revenue</p>
											<p class="text-lg font-semibold text-neutral-900">
												${report.metrics.revenue.toLocaleString()}
											</p>
										</div>
									{/if}
									{#if report.metrics.totalPolicies}
										<div>
											<p class="text-xs text-neutral-500">Total Policies</p>
											<p class="text-lg font-semibold text-neutral-900">{report.metrics.totalPolicies}</p>
										</div>
									{/if}
									{#if report.metrics.retention}
										<div>
											<p class="text-xs text-neutral-500">Retention Rate</p>
											<p class="text-lg font-semibold text-neutral-900">{report.metrics.retention}%</p>
										</div>
									{/if}
								</div>
							{/if}

							<!-- Report Info -->
							<div class="flex items-center justify-between text-sm text-neutral-500 mb-4">
								<span>Generated: {formatDate(report.generatedDate)}</span>
								<span class="capitalize">{report.format || 'PDF'}</span>
							</div>

							<!-- Actions -->
							<div class="flex flex-wrap gap-2">
								{#if report.status === 'generated' && report.downloadUrl}
									<button
										on:click={() => downloadReport(report)}
										class="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
									>
										Download
									</button>
								{/if}
								
								<button
									on:click={() => goto(`/reports/${report.id}`)}
									class="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
								>
									View Details
								</button>
								
								{#if report.status === 'generated'}
									<button
										class="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
									>
										Share
									</button>
								{/if}
								
								{#if $currentUser?.role === 'admin' || report.brokerId === $currentUser?.uid}
									<button
										class="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
									>
										Delete
									</button>
								{/if}
							</div>

							<!-- Insights Preview -->
							{#if report.insights && report.insights.length > 0}
								<div class="mt-4 pt-4 border-t border-neutral-200">
									<h4 class="font-medium text-neutral-900 mb-2">Key Insights</h4>
									<ul class="space-y-1">
										{#each report.insights.slice(0, 2) as insight}
											<li class="text-sm text-neutral-600">• {insight}</li>
										{/each}
										{#if report.insights.length > 2}
											<li class="text-sm text-neutral-500">
												+{report.insights.length - 2} more insights
											</li>
										{/if}
									</ul>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div> 