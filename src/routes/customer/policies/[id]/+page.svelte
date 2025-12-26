<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { currentUser } from '$lib/services/auth';
	import { doc, getDoc } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let loading = true;
	let policy = null;
	let errorMessage = '';

	const policyId = $page.params.id;

	onMount(async () => {
		if (!$currentUser) {
			goto('/customer/login');
			return;
		}
		await loadPolicy();
	});

	async function loadPolicy() {
		try {
			const policyDoc = await getDoc(doc(db, 'policies', policyId));
			if (policyDoc.exists()) {
				const data = policyDoc.data();
				// Verify this policy belongs to the current user
				if (data.customerId === $currentUser.uid) {
					policy = { id: policyDoc.id, ...data };
				} else {
					errorMessage = 'Policy not found or access denied.';
				}
			} else {
				errorMessage = 'Policy not found.';
			}
		} catch (error) {
			console.error('Error loading policy:', error);
			errorMessage = 'Failed to load policy details.';
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
			case 'active':
				return 'bg-success-100 text-success-800';
			case 'expired':
				return 'bg-red-100 text-red-800';
			case 'cancelled':
				return 'bg-neutral-100 text-neutral-800';
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

	function downloadDocument(url, name) {
		window.open(url, '_blank');
	}

	function isExpiringSoon(expirationDate) {
		if (!expirationDate) return false;
		const expDate = expirationDate.toDate ? expirationDate.toDate() : new Date(expirationDate);
		const now = new Date();
		const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
		return expDate <= thirtyDaysFromNow && expDate > now;
	}
</script>

<svelte:head>
	<title>Policy Details - X Insurance Brokers</title>
	<meta name="description" content="View your insurance policy details and manage your coverage." />
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
						<a href="/customer/policies" class="hover:text-primary-600">Policies</a>
						<span>›</span>
						<span>Policy Details</span>
					</div>
					<h1 class="text-2xl font-bold text-neutral-900">Policy Details</h1>
				</div>
				<a
					href="/customer/policies"
					class="text-primary-600 hover:text-primary-700 font-medium transition-colors"
				>
					← Back to Policies
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
					href="/customer/policies"
					class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
				>
					View All Policies
				</a>
			</div>
		{:else if policy}
			<!-- Policy Overview -->
			<div class="bg-white rounded-xl shadow-sm border border-neutral-200 mb-8 {isExpiringSoon(policy.dates?.expiration) ? 'ring-2 ring-yellow-300' : ''}">
				<div class="px-6 py-4 border-b border-neutral-200">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-4">
							<div class="text-3xl">{getCoverageIcon(policy.coverageType)}</div>
							<div>
								<h2 class="text-xl font-semibold text-neutral-900">
									{policy.policyNumber}
								</h2>
								<p class="text-neutral-600 capitalize">
									{policy.coverageType} Insurance • {policy.carrier}
								</p>
							</div>
						</div>
						<div class="text-right">
							<span class="inline-flex px-3 py-1 text-sm font-medium rounded-full {getStatusColor(policy.status)}">
								{policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
							</span>
							{#if isExpiringSoon(policy.dates?.expiration)}
								<div class="mt-1">
									<span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
										Expiring Soon
									</span>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<div class="p-6">
					<!-- Key Information -->
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
						<div>
							<label class="block text-sm font-medium text-neutral-700">Effective Date</label>
							<p class="mt-1 text-sm text-neutral-900">{formatDate(policy.dates?.effective)}</p>
						</div>
						<div>
							<label class="block text-sm font-medium text-neutral-700">Expiration Date</label>
							<p class="mt-1 text-sm text-neutral-900">{formatDate(policy.dates?.expiration)}</p>
						</div>
						<div>
							<label class="block text-sm font-medium text-neutral-700">Monthly Premium</label>
							<p class="mt-1 text-lg font-semibold text-neutral-900">{formatCurrency(policy.premium?.monthly)}</p>
						</div>
					</div>

					<!-- Warning for expiring policies -->
					{#if isExpiringSoon(policy.dates?.expiration)}
						<div class="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<div class="flex items-center">
								<svg class="w-5 h-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
								</svg>
								<div>
									<h4 class="font-medium text-yellow-900">Policy Expiring Soon</h4>
									<p class="text-yellow-700 text-sm">
										Your policy expires on {formatDate(policy.dates?.expiration)}. Contact us to renew your coverage.
									</p>
								</div>
							</div>
						</div>
					{/if}

					<!-- Quick Actions -->
					<div class="flex flex-wrap gap-3 mb-6">
						{#if policy.status === 'active'}
							<button
								on:click={() => goto('/customer/claims')}
								class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
							>
								File Claim
							</button>
						{/if}

						{#if policy.documents && policy.documents.length > 0}
							{#each policy.documents as document}
								<button
									on:click={() => downloadDocument(document.url, document.name)}
									class="bg-primary-100 hover:bg-primary-200 text-primary-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
								>
									📄 {document.name}
								</button>
							{/each}
						{/if}

						<a
							href="/customer/support"
							class="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
						>
							Contact Support
						</a>
					</div>
				</div>
			</div>

			<!-- Premium and Payment Information -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
				<div class="bg-white rounded-xl shadow-sm border border-neutral-200">
					<div class="px-6 py-4 border-b border-neutral-200">
						<h3 class="text-lg font-semibold text-neutral-900">Premium Information</h3>
					</div>
					<div class="p-6">
						<div class="space-y-4">
							<div class="flex justify-between">
								<span class="text-neutral-600">Monthly Premium</span>
								<span class="font-medium">{formatCurrency(policy.premium?.monthly)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-neutral-600">Annual Premium</span>
								<span class="font-medium">{formatCurrency(policy.premium?.annual)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-neutral-600">Billing Frequency</span>
								<span class="font-medium capitalize">{policy.premium?.billingFrequency}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-neutral-600">Payment Method</span>
								<span class="font-medium capitalize">{policy.premium?.paymentMethod?.replace('_', ' ')}</span>
							</div>
							{#if policy.premium?.autopay}
								<div class="flex justify-between">
									<span class="text-neutral-600">AutoPay</span>
									<span class="font-medium text-success-600">Enabled</span>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<div class="bg-white rounded-xl shadow-sm border border-neutral-200">
					<div class="px-6 py-4 border-b border-neutral-200">
						<h3 class="text-lg font-semibold text-neutral-900">Payment Status</h3>
					</div>
					<div class="p-6">
						<div class="space-y-4">
							<div class="flex justify-between items-center">
								<span class="text-neutral-600">Current Status</span>
								<span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
									{policy.paymentStatus || 'Current'}
								</span>
							</div>
							{#if policy.payment?.nextDueDate}
								<div class="flex justify-between">
									<span class="text-neutral-600">Next Payment Due</span>
									<span class="font-medium">{formatDate(policy.payment.nextDueDate)}</span>
								</div>
							{/if}
							{#if policy.payment?.amount}
								<div class="flex justify-between">
									<span class="text-neutral-600">Last Payment</span>
									<span class="font-medium">{formatCurrency(policy.payment.amount)}</span>
								</div>
							{/if}
							{#if policy.payment?.processedAt}
								<div class="flex justify-between">
									<span class="text-neutral-600">Payment Date</span>
									<span class="font-medium">{formatDate(policy.payment.processedAt)}</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Coverage Details -->
			{#if policy.coverage}
				<div class="bg-white rounded-xl shadow-sm border border-neutral-200 mb-8">
					<div class="px-6 py-4 border-b border-neutral-200">
						<h3 class="text-lg font-semibold text-neutral-900">Coverage Details</h3>
					</div>
					<div class="p-6">
						{#if policy.coverageType === 'auto'}
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
								{#if policy.coverage.liability}
									<div>
										<h4 class="font-medium text-neutral-900 mb-2">Liability Coverage</h4>
										<p class="text-sm text-neutral-600">
											Bodily Injury: ${policy.coverage.liability.bodilyInjury?.toLocaleString() || 'N/A'}<br>
											Property Damage: ${policy.coverage.liability.propertyDamage?.toLocaleString() || 'N/A'}
										</p>
									</div>
								{/if}
								{#if policy.coverage.collision?.selected}
									<div>
										<h4 class="font-medium text-neutral-900 mb-2">Collision Coverage</h4>
										<p class="text-sm text-neutral-600">
											Deductible: ${policy.coverage.collision.deductible}
										</p>
									</div>
								{/if}
								{#if policy.coverage.comprehensive?.selected}
									<div>
										<h4 class="font-medium text-neutral-900 mb-2">Comprehensive Coverage</h4>
										<p class="text-sm text-neutral-600">
											Deductible: ${policy.coverage.comprehensive.deductible}
										</p>
									</div>
								{/if}
								{#if policy.coverage.uninsuredMotorist?.selected}
									<div>
										<h4 class="font-medium text-neutral-900 mb-2">Uninsured Motorist</h4>
										<p class="text-sm text-neutral-600">
											Limit: ${policy.coverage.uninsuredMotorist.limit?.toLocaleString() || 'N/A'}
										</p>
									</div>
								{/if}
							</div>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{#each Object.entries(policy.coverage) as [key, value]}
									<div>
										<h4 class="font-medium text-neutral-900 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
										<p class="text-sm text-neutral-600">
											{#if typeof value === 'object' && value !== null}
												{#each Object.entries(value) as [subKey, subValue]}
													{subKey}: {subValue}<br>
												{/each}
											{:else}
												{value}
											{/if}
										</p>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Vehicle Information (for auto policies) -->
			{#if policy.coverageType === 'auto' && policy.vehicles}
				<div class="bg-white rounded-xl shadow-sm border border-neutral-200 mb-8">
					<div class="px-6 py-4 border-b border-neutral-200">
						<h3 class="text-lg font-semibold text-neutral-900">Covered Vehicles</h3>
					</div>
					<div class="p-6">
						<div class="space-y-4">
							{#each policy.vehicles as vehicle, index}
								<div class="border border-neutral-200 rounded-lg p-4">
									<h4 class="font-medium text-neutral-900 mb-3">Vehicle {index + 1}</h4>
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
				</div>
			{/if}

			<!-- Policy Documents -->
			{#if policy.documents && policy.documents.length > 0}
				<div class="bg-white rounded-xl shadow-sm border border-neutral-200 mb-8">
					<div class="px-6 py-4 border-b border-neutral-200">
						<h3 class="text-lg font-semibold text-neutral-900">Policy Documents</h3>
					</div>
					<div class="p-6">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							{#each policy.documents as document}
								<div class="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
									<div class="flex items-center space-x-3">
										<div class="text-2xl">📄</div>
										<div>
											<h4 class="font-medium text-neutral-900">{document.name}</h4>
											<p class="text-sm text-neutral-600">
												Generated: {formatDate(document.generatedAt)}
											</p>
										</div>
									</div>
									<button
										on:click={() => downloadDocument(document.url, document.name)}
										class="bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
									>
										Download
									</button>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Contact Information -->
			<div class="bg-primary-50 rounded-xl p-6">
				<h3 class="text-lg font-semibold text-neutral-900 mb-4">Need Help with Your Policy?</h3>
				<p class="text-neutral-600 mb-6">
					Our customer service team is here to help you understand your coverage, make changes, or answer any questions.
				</p>
				<div class="flex flex-col sm:flex-row gap-4">
					<a
						href="/customer/support"
						class="bg-white text-primary-600 hover:bg-neutral-50 border border-primary-200 px-6 py-2 rounded-lg font-medium transition-colors text-center"
					>
						Contact Support
					</a>
					<a
						href="tel:1-800-CUSTOMER"
						class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors text-center"
					>
						Call (800) 287-8663
					</a>
				</div>
			</div>
		{/if}
	</div>
</div> 