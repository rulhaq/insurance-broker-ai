<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';
	import { doc, getDoc } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let loading = true;
	let application: any = null;
	let error = '';

	$: applicationId = $page.params.id;

	onMount(async () => {
		if (!$currentUser) {
			goto('/customer/login');
			return;
		}
		await loadApplication();
	});

	async function loadApplication() {
		if (!applicationId) return;

		try {
			loading = true;
			console.log('🔍 Loading application details:', applicationId);

			const applicationDoc = await getDoc(doc(db, 'quotes', applicationId));
			
			if (!applicationDoc.exists()) {
				error = 'Application not found';
				return;
			}

			const applicationData = applicationDoc.data();
			
			// Verify this application belongs to the current user
			if (applicationData.customerId !== $currentUser.uid) {
				error = 'Unauthorized access to this application';
				return;
			}

			application = {
				id: applicationDoc.id,
				...applicationData
			};

			console.log('📋 Application loaded:', application);
		} catch (err) {
			console.error('❌ Error loading application:', err);
			error = 'Failed to load application details';
		} finally {
			loading = false;
		}
	}

	function formatDate(date: any) {
		if (!date) return 'N/A';
		const d = date.toDate ? date.toDate() : new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatCurrency(amount: number) {
		if (!amount) return '$0';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function getStatusColor(status: string) {
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

	function getCoverageIcon(type: string) {
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

	function editApplication() {
		goto(`/customer/apply/${application.coverageType}`);
	}

	function goBack() {
		goto('/customer/applications');
	}

	function viewQuotes() {
		goto(`/customer/quotes/${applicationId}/compare`);
	}
</script>

<svelte:head>
	<title>Application Details - X Insurance Brokers</title>
	<meta name="description" content="View your insurance application details and status." />
</svelte:head>

<div class="min-h-screen bg-neutral-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Breadcrumb -->
		<nav class="flex mb-8" aria-label="Breadcrumb">
			<ol class="inline-flex items-center space-x-1 md:space-x-3">
				<li class="inline-flex items-center">
					<button 
						on:click={() => goto('/customer/dashboard')}
						class="text-neutral-700 hover:text-primary-600 inline-flex items-center"
					>
						<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
						</svg>
						Dashboard
					</button>
				</li>
				<li>
					<div class="flex items-center">
						<svg class="w-6 h-6 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
						</svg>
						<button 
							on:click={goBack}
							class="ml-1 text-neutral-700 hover:text-primary-600 md:ml-2"
						>
							Applications
						</button>
					</div>
				</li>
				<li aria-current="page">
					<div class="flex items-center">
						<svg class="w-6 h-6 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
						</svg>
						<span class="ml-1 text-neutral-500 md:ml-2">Details</span>
					</div>
				</li>
			</ol>
		</nav>

		{#if loading}
			<div class="flex items-center justify-center py-24">
				<LoadingSpinner size="lg" />
			</div>
		{:else if error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
				<div class="text-red-600 text-6xl mb-4">⚠️</div>
				<h3 class="text-lg font-medium text-red-900 mb-2">Error Loading Application</h3>
				<p class="text-red-700 mb-4">{error}</p>
				<button 
					on:click={goBack}
					class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
				>
					Back to Applications
				</button>
			</div>
		{:else if application}
			<!-- Application Header -->
			<div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden mb-6">
				<div class="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-3">
							<div class="text-4xl">
								{getCoverageIcon(application.coverageType)}
							</div>
							<div>
								<h1 class="text-2xl font-bold text-neutral-900">
									{application.coverageType?.charAt(0).toUpperCase() + application.coverageType?.slice(1)} Insurance Application
								</h1>
								<p class="text-neutral-600">
									Application #{application.id.slice(-8)} • Submitted {formatDate(application.submittedAt)}
								</p>
							</div>
						</div>
						<span class="inline-flex px-4 py-2 text-sm font-medium rounded-full {getStatusColor(application.status)}">
							{application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
						</span>
					</div>
				</div>

				<!-- Application Actions -->
				<div class="px-6 py-4 bg-white border-b border-neutral-200">
					<div class="flex flex-wrap gap-3">
						{#if application.status === 'submitted' || application.status === 'reviewing'}
							<button
								on:click={editApplication}
								class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
							>
								Edit Application
							</button>
						{/if}
						
						{#if application.status === 'quoted'}
							<button
								on:click={viewQuotes}
								class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
							>
								View Quotes
							</button>
						{/if}
						
						<button
							on:click={goBack}
							class="border border-neutral-300 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
						>
							Back to Applications
						</button>
					</div>
				</div>
			</div>

			<!-- Application Details -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Personal Information -->
				{#if application.applicationData?.personalInfo}
					<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Personal Information</h3>
						<dl class="space-y-3">
							<div>
								<dt class="text-sm font-medium text-neutral-500">Full Name</dt>
								<dd class="text-sm text-neutral-900">
									{application.applicationData.personalInfo.firstName} {application.applicationData.personalInfo.lastName}
								</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-neutral-500">Email</dt>
								<dd class="text-sm text-neutral-900">{application.applicationData.personalInfo.email}</dd>
							</div>
							{#if application.applicationData.personalInfo.phone}
								<div>
									<dt class="text-sm font-medium text-neutral-500">Phone</dt>
									<dd class="text-sm text-neutral-900">{application.applicationData.personalInfo.phone}</dd>
								</div>
							{/if}
							{#if application.applicationData.personalInfo.dateOfBirth}
								<div>
									<dt class="text-sm font-medium text-neutral-500">Date of Birth</dt>
									<dd class="text-sm text-neutral-900">{application.applicationData.personalInfo.dateOfBirth}</dd>
								</div>
							{/if}
						</dl>
					</div>
				{/if}

				<!-- Coverage-Specific Information -->
				{#if application.coverageType === 'auto' && application.applicationData?.vehicles}
					<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Vehicle Information</h3>
						{#each application.applicationData.vehicles as vehicle, index}
							<div class="mb-4 {index > 0 ? 'pt-4 border-t border-neutral-200' : ''}">
								<h4 class="font-medium text-neutral-900 mb-2">Vehicle {index + 1}</h4>
								<dl class="space-y-2 text-sm">
									<div class="flex justify-between">
										<dt class="text-neutral-500">Year/Make/Model</dt>
										<dd class="text-neutral-900">{vehicle.year} {vehicle.make} {vehicle.model}</dd>
									</div>
									{#if vehicle.vin}
										<div class="flex justify-between">
											<dt class="text-neutral-500">VIN</dt>
											<dd class="text-neutral-900 font-mono">{vehicle.vin}</dd>
										</div>
									{/if}
								</dl>
							</div>
						{/each}
					</div>
				{:else if application.coverageType === 'home' && application.applicationData?.propertyInfo}
					<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Property Information</h3>
						<dl class="space-y-3">
							<div>
								<dt class="text-sm font-medium text-neutral-500">Property Type</dt>
								<dd class="text-sm text-neutral-900">{application.applicationData.propertyInfo.type}</dd>
							</div>
							{#if application.applicationData.propertyInfo.yearBuilt}
								<div>
									<dt class="text-sm font-medium text-neutral-500">Year Built</dt>
									<dd class="text-sm text-neutral-900">{application.applicationData.propertyInfo.yearBuilt}</dd>
								</div>
							{/if}
							{#if application.applicationData.propertyInfo.squareFootage}
								<div>
									<dt class="text-sm font-medium text-neutral-500">Square Footage</dt>
									<dd class="text-sm text-neutral-900">{application.applicationData.propertyInfo.squareFootage} sq ft</dd>
								</div>
							{/if}
						</dl>
					</div>
				{/if}

				<!-- Coverage Information -->
				{#if application.applicationData?.coverageInfo}
					<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Coverage Details</h3>
						<dl class="space-y-3">
							{#if application.applicationData.coverageInfo.dwellingCoverage}
								<div>
									<dt class="text-sm font-medium text-neutral-500">Dwelling Coverage</dt>
									<dd class="text-sm text-neutral-900">{formatCurrency(application.applicationData.coverageInfo.dwellingCoverage)}</dd>
								</div>
							{/if}
							{#if application.applicationData.coverageInfo.personalProperty}
								<div>
									<dt class="text-sm font-medium text-neutral-500">Personal Property</dt>
									<dd class="text-sm text-neutral-900">{formatCurrency(application.applicationData.coverageInfo.personalProperty)}</dd>
								</div>
							{/if}
							{#if application.applicationData.coverageInfo.liability}
								<div>
									<dt class="text-sm font-medium text-neutral-500">Liability</dt>
									<dd class="text-sm text-neutral-900">{formatCurrency(application.applicationData.coverageInfo.liability)}</dd>
								</div>
							{/if}
							{#if application.applicationData.coverageInfo.deductible}
								<div>
									<dt class="text-sm font-medium text-neutral-500">Deductible</dt>
									<dd class="text-sm text-neutral-900">{formatCurrency(application.applicationData.coverageInfo.deductible)}</dd>
								</div>
							{/if}
						</dl>
					</div>
				{/if}

				<!-- Application Timeline -->
				<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
					<h3 class="text-lg font-semibold text-neutral-900 mb-4">Application Timeline</h3>
					<div class="space-y-4">
						<div class="flex items-start space-x-3">
							<div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
							<div>
								<p class="text-sm font-medium text-neutral-900">Application Submitted</p>
								<p class="text-xs text-neutral-500">{formatDate(application.submittedAt)}</p>
							</div>
						</div>
						
						{#if application.status === 'reviewing' || application.status === 'quoted' || application.status === 'purchased'}
							<div class="flex items-start space-x-3">
								<div class="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
								<div>
									<p class="text-sm font-medium text-neutral-900">Under Review</p>
									<p class="text-xs text-neutral-500">Application is being processed</p>
								</div>
							</div>
						{/if}
						
						{#if application.status === 'quoted' || application.status === 'purchased'}
							<div class="flex items-start space-x-3">
								<div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
								<div>
									<p class="text-sm font-medium text-neutral-900">Quotes Available</p>
									<p class="text-xs text-neutral-500">Ready for review and selection</p>
								</div>
							</div>
						{/if}
						
						{#if application.status === 'purchased'}
							<div class="flex items-start space-x-3">
								<div class="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
								<div>
									<p class="text-sm font-medium text-neutral-900">Policy Purchased</p>
									<p class="text-xs text-neutral-500">Coverage is now active</p>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div> 