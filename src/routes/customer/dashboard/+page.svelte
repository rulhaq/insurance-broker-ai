<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { currentUser, authService } from '$lib/services/auth';
	import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let showUserMenu = false;
	let loading = true;
	
	let dashboardData = {
		summary: {
			activePolicies: 0,
			pendingApplications: 0,
			totalPremium: 0,
			renewalAlerts: 0
		},
		recentPolicies: [],
		pendingApplications: [],
		quickActions: [
			{ 
				title: 'Start New Application', 
				description: 'Apply for new insurance coverage',
				icon: '📝',
				href: '/apply',
				color: 'primary'
			},
			{ 
				title: 'File a Claim', 
				description: 'Report an incident or damage',
				icon: '📋',
				href: '/customer/claims',
				color: 'orange'
			},
			{ 
				title: 'Make Payment', 
				description: 'Pay your insurance premium',
				icon: '💳',
				href: '/customer/policies',
				color: 'green'
			},
			{ 
				title: 'Get Support', 
				description: 'Contact our customer service',
				icon: '💬',
				href: '/customer/support',
				color: 'blue'
			}
		]
	};

	onMount(async () => {
		if (!$currentUser) {
			goto('/customer/login');
			return;
		}
		await loadDashboardData();
	});

	async function loadDashboardData() {
		if (!$currentUser || !$currentUser.uid) return;

		try {
			loading = true;

			// Load active policies
			const policiesQuery = query(
				collection(db, 'policies'),
				where('customerId', '==', $currentUser.uid),
				where('status', '==', 'active')
			);
			const policiesSnapshot = await getDocs(policiesQuery);
			
			dashboardData.summary.activePolicies = policiesSnapshot.size;
			
			// Calculate total monthly premium
			let totalMonthlyPremium = 0;
			const policies = [];
			
			policiesSnapshot.forEach(doc => {
				const policy = { id: doc.id, ...doc.data() };
				policies.push(policy);
				if (policy.premium?.monthly) {
					totalMonthlyPremium += policy.premium.monthly;
				}
			});
			
			dashboardData.summary.totalPremium = totalMonthlyPremium;
			dashboardData.recentPolicies = policies.slice(0, 3);

			// Check for renewals within 60 days
			const now = new Date();
			const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
			
			dashboardData.summary.renewalAlerts = policies.filter(policy => {
				if (policy.dates?.expiration) {
					const expirationDate = policy.dates.expiration.toDate ? 
						policy.dates.expiration.toDate() : 
						new Date(policy.dates.expiration);
					return expirationDate <= sixtyDaysFromNow && expirationDate > now;
				}
				return false;
			}).length;

			// Load pending applications
			console.log('🔍 Loading pending applications for customer:', $currentUser.uid);
			const applicationsQuery = query(
				collection(db, 'quotes'),
				where('customerId', '==', $currentUser.uid),
				where('status', 'in', ['submitted', 'reviewing', 'quoted']),
				orderBy('createdAt', 'desc'),
				limit(3)
			);
			const applicationsSnapshot = await getDocs(applicationsQuery);
			
			dashboardData.summary.pendingApplications = applicationsSnapshot.size;
			dashboardData.pendingApplications = applicationsSnapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			}));

			console.log('📄 Found pending applications:', dashboardData.summary.pendingApplications);
			console.log('📋 Applications:', dashboardData.pendingApplications);

		} catch (error) {
			console.error('❌ Error loading dashboard data:', error);
			console.error('🔧 This might be due to missing Firebase index or connection issue.');
		} finally {
			loading = false;
		}
	}

	function formatCurrency(amount) {
		if (!amount) return '$0';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0
		}).format(amount);
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

	function getApplicationStatusColor(status) {
		switch (status) {
			case 'submitted':
				return 'bg-blue-100 text-blue-800';
			case 'reviewing':
				return 'bg-yellow-100 text-yellow-800';
			case 'quoted':
				return 'bg-green-100 text-green-800';
			case 'purchased':
				return 'bg-success-100 text-success-800';
			default:
				return 'bg-gray-100 text-gray-800';
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

	function viewPolicy(policyId) {
		goto(`/customer/policies/${policyId}`);
	}

	function viewApplication(applicationId) {
		goto(`/customer/quotes/${applicationId}`);
	}

	function handleQuickAction(action) {
		if (action.href.startsWith('http')) {
			window.open(action.href, '_blank');
		} else {
			goto(action.href);
		}
	}
</script>

<svelte:head>
	<title>Customer Dashboard - X Insurance Brokers</title>
	<meta name="description" content="Manage your insurance policies, claims, and applications with X Insurance Brokers." />
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	<!-- Header -->
	<div class="bg-white shadow-sm border-b border-neutral-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">
						Welcome back, {$currentUser?.firstName || 'Customer'}!
					</h1>
					<p class="text-neutral-600">Manage your insurance coverage and track your applications</p>
				</div>
				<div class="flex items-center space-x-3">
					<a
						href="/apply"
						class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
					>
						Get Quote
					</a>
					
					<!-- User Menu -->
					<div class="relative">
						<button
							on:click={() => showUserMenu = !showUserMenu}
							class="flex items-center space-x-2 text-neutral-700 hover:text-neutral-900 p-2 rounded-md transition-colors"
						>
							<div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
								<span class="text-sm font-medium text-primary-600">
									{($currentUser?.firstName || 'C').charAt(0)}{($currentUser?.lastName || 'U').charAt(0)}
								</span>
							</div>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</button>

						{#if showUserMenu}
							<div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-neutral-200 z-50">
								<div class="py-1">
									<a
										href="/customer/profile"
										class="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
										on:click={() => showUserMenu = false}
									>
										<svg class="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
										</svg>
										My Profile
									</a>
									<a
										href="/customer/settings"
										class="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
										on:click={() => showUserMenu = false}
									>
										<svg class="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
										Settings
									</a>
									<div class="border-t border-neutral-200"></div>
									<button
										on:click={async () => {
											showUserMenu = false;
											await authService.signOut();
											goto('/');
										}}
										class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
									>
										<svg class="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
										</svg>
										Sign Out
									</button>
								</div>
							</div>
						{/if}
					</div>
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
			<!-- Summary Cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
					<div class="flex items-center">
						<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
							<svg class="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm text-neutral-600">Active Policies</p>
							<p class="text-2xl font-bold text-neutral-900">{dashboardData.summary.activePolicies}</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
					<div class="flex items-center">
						<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
							<svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm text-neutral-600">Monthly Premium</p>
							<p class="text-2xl font-bold text-neutral-900">{formatCurrency(dashboardData.summary.totalPremium)}</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
					<div class="flex items-center">
						<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
							<svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm text-neutral-600">Pending Applications</p>
							<p class="text-2xl font-bold text-neutral-900">{dashboardData.summary.pendingApplications}</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
					<div class="flex items-center">
						<div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
							<svg class="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm text-neutral-600">Renewal Alerts</p>
							<p class="text-2xl font-bold text-neutral-900">{dashboardData.summary.renewalAlerts}</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Main Content Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Left Column: Policies and Applications -->
				<div class="lg:col-span-2 space-y-6">
					<!-- Recent Policies -->
					<div class="bg-white rounded-lg shadow-sm border border-neutral-200">
						<div class="px-6 py-4 border-b border-neutral-200">
							<h2 class="text-lg font-semibold text-neutral-900">My Policies</h2>
						</div>
						<div class="p-6">
							{#if dashboardData.recentPolicies.length > 0}
								<div class="space-y-4">
									{#each dashboardData.recentPolicies as policy}
										<div class="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
											<div class="flex items-center space-x-3">
												<div class="text-2xl">
													{getCoverageIcon(policy.coverageType)}
												</div>
												<div>
													<h3 class="font-medium text-neutral-900">
														{policy.coverageType?.charAt(0).toUpperCase() + policy.coverageType?.slice(1)} Insurance
													</h3>
													<p class="text-sm text-neutral-600">Policy #{policy.policyNumber}</p>
												</div>
											</div>
											<div class="text-right">
												<p class="font-medium text-neutral-900">{formatCurrency(policy.premium?.monthly)}/mo</p>
												<button
													on:click={() => viewPolicy(policy.id)}
													class="text-sm text-primary-600 hover:text-primary-700"
												>
													View Details
												</button>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="text-center py-8">
									<div class="text-4xl mb-4">🛡️</div>
									<h3 class="text-lg font-medium text-neutral-900 mb-2">No Active Policies</h3>
									<p class="text-neutral-600 mb-4">Get started with your first insurance policy</p>
									<a
										href="/apply"
										class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
									>
										Get Quote
									</a>
								</div>
							{/if}
						</div>
					</div>

					<!-- Pending Applications -->
					<div class="bg-white rounded-lg shadow-sm border border-neutral-200">
						<div class="px-6 py-4 border-b border-neutral-200">
							<h2 class="text-lg font-semibold text-neutral-900">Pending Applications</h2>
						</div>
						<div class="p-6">
							{#if dashboardData.pendingApplications.length > 0}
								<div class="space-y-4">
									{#each dashboardData.pendingApplications as application}
										<div class="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
											<div class="flex items-center space-x-3">
												<div class="text-2xl">
													{getCoverageIcon(application.coverageType)}
												</div>
												<div>
													<h3 class="font-medium text-neutral-900">
														{application.coverageType?.charAt(0).toUpperCase() + application.coverageType?.slice(1)} Insurance
													</h3>
													<p class="text-sm text-neutral-600">
														Submitted {formatDate(application.submittedAt)}
													</p>
												</div>
											</div>
											<div class="flex items-center space-x-3">
												<span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {getApplicationStatusColor(application.status)}">
													{application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
												</span>
												<button
													on:click={() => viewApplication(application.id)}
													class="text-sm text-primary-600 hover:text-primary-700"
												>
													View Status
												</button>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="text-center py-8">
									<div class="text-4xl mb-4">📝</div>
									<h3 class="text-lg font-medium text-neutral-900 mb-2">No Pending Applications</h3>
									<p class="text-neutral-600">All your applications have been processed</p>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Right Column: Quick Actions -->
				<div class="space-y-6">
					<div class="bg-white rounded-lg shadow-sm border border-neutral-200">
						<div class="px-6 py-4 border-b border-neutral-200">
							<h2 class="text-lg font-semibold text-neutral-900">Quick Actions</h2>
						</div>
						<div class="p-6">
							<div class="space-y-3">
								{#each dashboardData.quickActions as action}
									<button
										on:click={() => handleQuickAction(action)}
										class="w-full flex items-center space-x-3 p-4 text-left border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
									>
										<div class="text-2xl">{action.icon}</div>
										<div>
											<h3 class="font-medium text-neutral-900">{action.title}</h3>
											<p class="text-sm text-neutral-600">{action.description}</p>
										</div>
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div> 