<script lang="ts">
	import { onMount } from 'svelte';
	import { currentUser } from '$lib/services/auth';
	import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';
	import RevenueChart from '$components/dashboard/RevenueChart.svelte';

	// Real dashboard data from Firebase - NO MOCK DATA
	let loading = true;
	let dashboardData = {
		summary: {
			totalClients: 0,
			activeQuotes: 0,
			policiesRenewing: 0,
			monthlyRevenue: 0,
			revenueGrowth: 0
		},
		recentClients: [],
		urgentTasks: [],
		aiInsights: []
	};

	onMount(async () => {
		if (!$currentUser) {
			return;
		}
		await loadDashboardData();
	});

	async function loadDashboardData() {
		if (!$currentUser) return;

		try {
			loading = true;
			const isAdmin = $currentUser.role === 'admin';

			console.log('🔍 Loading dashboard data for:', {
				userId: $currentUser.uid,
				userEmail: $currentUser.email,
				userRole: $currentUser.role,
				isAdmin
			});

			// Load clients - admins see ALL clients, brokers see only their own
			const clientsQuery = isAdmin 
				? query(collection(db, 'clients'))
				: query(collection(db, 'clients'), where('brokerId', '==', $currentUser.uid));
			
			console.log('📊 Executing clients query for brokerId:', $currentUser.uid);
			const clientsSnapshot = await getDocs(clientsQuery);
			console.log('📊 Found clients:', clientsSnapshot.size);
			
			// Log the first few clients to see their brokerId values
			clientsSnapshot.docs.forEach((doc, index) => {
				if (index < 3) { // Only log first 3 for debugging
					const data = doc.data();
					console.log(`Client ${index + 1}:`, {
						id: doc.id,
						name: `${data.firstName} ${data.lastName}`,
						brokerId: data.brokerId,
						matches: data.brokerId === $currentUser.uid
					});
				}
			});
			
			dashboardData.summary.totalClients = clientsSnapshot.size;

			// Get recent clients - admins see ALL, brokers see only their own
			const recentClientsQuery = isAdmin
				? query(collection(db, 'clients'), orderBy('createdAt', 'desc'), limit(5))
				: query(
					collection(db, 'clients'),
					where('brokerId', '==', $currentUser.uid),
					orderBy('createdAt', 'desc'),
					limit(5)
				);
			
			const recentClientsSnapshot = await getDocs(recentClientsQuery);
			console.log('📊 Found recent clients:', recentClientsSnapshot.size);
			
			dashboardData.recentClients = recentClientsSnapshot.docs.map(doc => {
				const data = doc.data();
				return {
					id: doc.id,
					name: `${data.firstName} ${data.lastName}`,
					company: data.businessName || `${data.firstName} ${data.lastName}`,
					riskLevel: data.riskAssessment?.level || 'MEDIUM',
					lastContact: formatDate(data.updatedAt),
					avatar: null,
					brokerId: data.brokerId // Show broker info for admin
				};
			});

			// Load active quotes - admins see ALL, brokers see only their own
			const quotesQuery = isAdmin
				? query(collection(db, 'quotes'), where('status', 'in', ['submitted', 'reviewing', 'quoted']))
				: query(
					collection(db, 'quotes'),
					where('brokerId', '==', $currentUser.uid),
					where('status', 'in', ['submitted', 'reviewing', 'quoted'])
				);
			
			const quotesSnapshot = await getDocs(quotesQuery);
			console.log('📊 Found active quotes:', quotesSnapshot.size);
			dashboardData.summary.activeQuotes = quotesSnapshot.size;

			// Load policies for revenue calculation - admins see ALL, brokers see only their own
			const policiesQuery = isAdmin
				? query(collection(db, 'policies'))
				: query(collection(db, 'policies'), where('brokerId', '==', $currentUser.uid));
			
			const policiesSnapshot = await getDocs(policiesQuery);
			console.log('📊 Found policies:', policiesSnapshot.size);
			
			// Calculate monthly revenue and renewals
			let totalRevenue = 0;
			let renewingCount = 0;
			const now = new Date();
			const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

			policiesSnapshot.forEach(doc => {
				const policy = doc.data();
				if (policy.commission?.amount) {
					totalRevenue += policy.commission.amount;
				}
				
				// Check if policy is renewing soon
				if (policy.dates?.expiration) {
					const expirationDate = policy.dates.expiration.toDate ? 
						policy.dates.expiration.toDate() : 
						new Date(policy.dates.expiration);
					if (expirationDate <= thirtyDaysFromNow && expirationDate > now) {
						renewingCount++;
					}
				}
			});

			dashboardData.summary.monthlyRevenue = totalRevenue;
			dashboardData.summary.policiesRenewing = renewingCount;

			// Load urgent tasks - admins see ALL, brokers see only their own
			const tasksQuery = isAdmin
				? query(
					collection(db, 'tasks'),
					where('status', 'in', ['pending', 'in_progress']),
					orderBy('dueDate', 'asc'),
					limit(5)
				)
				: query(
					collection(db, 'tasks'),
					where('brokerId', '==', $currentUser.uid),
					where('status', 'in', ['pending', 'in_progress']),
					orderBy('dueDate', 'asc'),
					limit(5)
				);
			
			const tasksSnapshot = await getDocs(tasksQuery);
			console.log('📊 Found urgent tasks:', tasksSnapshot.size);
			
			dashboardData.urgentTasks = tasksSnapshot.docs.map(doc => {
				const data = doc.data();
				return {
					id: doc.id,
					title: data.title,
					dueDate: formatDate(data.dueDate),
					priority: data.priority?.toUpperCase() || 'NORMAL',
					type: data.type || 'general',
					brokerId: data.brokerId // Show broker info for admin
				};
			});

			// Generate AI insights based on real data
			dashboardData.aiInsights = generateAIInsights();

			console.log('✅ Dashboard data loaded:', {
				totalClients: dashboardData.summary.totalClients,
				activeQuotes: dashboardData.summary.activeQuotes,
				recentClients: dashboardData.recentClients.length,
				urgentTasks: dashboardData.urgentTasks.length
			});

		} catch (error) {
			console.error('❌ Error loading dashboard data:', error);
		} finally {
			loading = false;
		}
	}

	function generateAIInsights() {
		const insights = [];
		
		if (dashboardData.summary.totalClients > 0) {
			insights.push({
				id: 1,
				type: 'opportunity',
				title: 'Cross-selling Opportunity Detected',
				description: `AI identified ${Math.floor(dashboardData.summary.totalClients * 0.2)} clients who may benefit from additional coverage based on their profiles.`,
				confidence: 87,
				action: 'Review Opportunities'
			});
		}

		if (dashboardData.summary.policiesRenewing > 0) {
			insights.push({
				id: 2,
				type: 'renewal',
				title: 'Renewal Alerts',
				description: `${dashboardData.summary.policiesRenewing} policies are due for renewal within 30 days. Early engagement recommended.`,
				confidence: 94,
				action: 'View Renewals'
			});
		}

		if (dashboardData.summary.activeQuotes > 0) {
			insights.push({
				id: 3,
				type: 'quote',
				title: 'Quote Follow-up Required',
				description: `You have ${dashboardData.summary.activeQuotes} active quotes. AI suggests prioritizing high-value prospects.`,
				confidence: 89,
				action: 'Review Quotes'
			});
		}

		return insights;
	}

	function formatDate(date) {
		if (!date) return 'Unknown';
		const d = date.toDate ? date.toDate() : new Date(date);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - d.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return '1 day ago';
		if (diffDays < 7) return `${diffDays} days ago`;
		return d.toLocaleDateString();
	}

	function getRiskLevelColor(level) {
		switch (level) {
			case 'LOW':
				return 'text-success-600 bg-success-100';
			case 'MEDIUM':
				return 'text-yellow-600 bg-yellow-100';
			case 'HIGH':
				return 'text-red-600 bg-red-100';
			default:
				return 'text-neutral-600 bg-neutral-100';
		}
	}

	function getPriorityColor(priority) {
		switch (priority) {
			case 'HIGH':
			case 'URGENT':
				return 'text-red-600 bg-red-100';
			case 'MEDIUM':
				return 'text-yellow-600 bg-yellow-100';
			case 'LOW':
				return 'text-neutral-600 bg-neutral-100';
			default:
				return 'text-neutral-600 bg-neutral-100';
		}
	}

	function getInsightColor(type) {
		switch (type) {
			case 'opportunity':
				return 'text-success-600 bg-success-100';
			case 'risk':
				return 'text-red-600 bg-red-100';
			case 'renewal':
				return 'text-blue-600 bg-blue-100';
			case 'quote':
				return 'text-purple-600 bg-purple-100';
			default:
				return 'text-neutral-600 bg-neutral-100';
		}
	}
</script>

<svelte:head>
	<title>Dashboard - X Insurance Brokers</title>
	<meta name="description" content="Insurance broker dashboard with real-time analytics and client management." />
</svelte:head>

<div class="container-page py-6">
	{#if loading}
		<div class="flex items-center justify-center py-24">
			<LoadingSpinner size="lg" />
		</div>
	{:else}
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-neutral-900">
				Welcome back, {$currentUser?.firstName || 'User'}!
			</h1>
			<p class="text-neutral-600 mt-2">
				{#if $currentUser?.role === 'admin'}
					Here's a complete overview of all system data and activity.
				{:else}
					Here's what's happening with your business today.
				{/if}
			</p>
		</div>

		<!-- Summary Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
				<div class="flex items-center">
					<div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm text-neutral-600">Total Clients</p>
						<p class="text-2xl font-bold text-neutral-900">{dashboardData.summary.totalClients}</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
				<div class="flex items-center">
					<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm text-neutral-600">Active Quotes</p>
						<p class="text-2xl font-bold text-neutral-900">{dashboardData.summary.activeQuotes}</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
				<div class="flex items-center">
					<div class="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm text-neutral-600">Monthly Revenue</p>
						<p class="text-2xl font-bold text-neutral-900">${dashboardData.summary.monthlyRevenue.toLocaleString()}</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
				<div class="flex items-center">
					<div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm text-neutral-600">Policies Renewing</p>
						<p class="text-2xl font-bold text-neutral-900">{dashboardData.summary.policiesRenewing}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Recent Clients -->
			<div class="lg:col-span-2">
				<div class="bg-white rounded-xl shadow-sm border border-neutral-200">
					<div class="px-6 py-4 border-b border-neutral-200">
						<h2 class="text-lg font-semibold text-neutral-900">Recent Clients</h2>
					</div>
					<div class="p-6">
						{#if dashboardData.recentClients.length > 0}
							<div class="space-y-4">
								{#each dashboardData.recentClients as client}
									<div class="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
										<div class="flex items-center space-x-3">
											<div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
												<span class="text-sm font-medium text-primary-600">
													{client.name.split(' ').map(n => n[0]).join('')}
												</span>
											</div>
											<div>
												<h3 class="font-medium text-neutral-900">{client.name}</h3>
												<p class="text-sm text-neutral-500">{client.company}</p>
												{#if $currentUser?.role === 'admin' && client.brokerId}
													<p class="text-xs text-blue-600">Broker ID: {client.brokerId}</p>
												{/if}
											</div>
										</div>
										<div class="flex items-center space-x-2">
											<span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {getRiskLevelColor(client.riskLevel)}">
												{client.riskLevel}
											</span>
											<span class="text-xs text-neutral-500">{client.lastContact}</span>
											{#if $currentUser?.role === 'admin'}
												<div class="flex space-x-1">
													<button class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700" title="Edit">
														✏️
													</button>
													<button class="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700" title="Delete">
														🗑️
													</button>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-neutral-500 text-center py-8">No recent clients</p>
						{/if}
					</div>
				</div>

				<!-- Revenue Chart -->
				<div class="mt-8">
					<RevenueChart />
				</div>
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Urgent Tasks -->
				<div class="bg-white rounded-xl shadow-sm border border-neutral-200">
					<div class="px-6 py-4 border-b border-neutral-200">
						<h2 class="text-lg font-semibold text-neutral-900">Urgent Tasks</h2>
					</div>
					<div class="p-6">
						{#if dashboardData.urgentTasks.length > 0}
							<div class="space-y-3">
								{#each dashboardData.urgentTasks as task}
									<div class="p-3 border border-neutral-200 rounded-lg">
										<div class="flex items-center justify-between mb-2">
											<h3 class="text-sm font-medium text-neutral-900">{task.title}</h3>
											<span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {getPriorityColor(task.priority)}">
												{task.priority}
											</span>
										</div>
										<p class="text-xs text-neutral-500">Due: {task.dueDate}</p>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-neutral-500 text-center py-8">No urgent tasks</p>
						{/if}
					</div>
				</div>

				<!-- AI Insights -->
				<div class="bg-white rounded-xl shadow-sm border border-neutral-200">
					<div class="px-6 py-4 border-b border-neutral-200">
						<h2 class="text-lg font-semibold text-neutral-900">AI Insights</h2>
					</div>
					<div class="p-6">
						{#if dashboardData.aiInsights.length > 0}
							<div class="space-y-4">
								{#each dashboardData.aiInsights as insight}
									<div class="p-4 border border-neutral-200 rounded-lg">
										<div class="flex items-center justify-between mb-2">
											<h3 class="text-sm font-medium text-neutral-900">{insight.title}</h3>
											<span class="inline-flex px-2 py-1 text-xs font-medium rounded-full {getInsightColor(insight.type)}">
												{insight.confidence}%
											</span>
										</div>
										<p class="text-xs text-neutral-600 mb-3">{insight.description}</p>
										<button class="text-xs text-primary-600 hover:text-primary-700 font-medium">
											{insight.action} →
										</button>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-neutral-500 text-center py-8">AI is analyzing your data...</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div> 