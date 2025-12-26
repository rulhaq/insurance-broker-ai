<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';
	import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let loading = true;
	let claims = [];
	let showNewClaimForm = false;
	let submittingClaim = false;

	let newClaimData = {
		claimType: 'collision',
		incidentDate: '',
		incidentTime: '',
		location: '',
		description: '',
		policeReportFiled: false,
		policeReportNumber: '',
		injuriesReported: false,
		estimatedDamage: 0
	};

	const claimTypes = [
		{ value: 'collision', label: 'Vehicle Collision' },
		{ value: 'comprehensive', label: 'Comprehensive (Non-Collision)' },
		{ value: 'liability', label: 'Liability Claim' },
		{ value: 'glass', label: 'Glass Damage' },
		{ value: 'theft', label: 'Theft/Vandalism' },
		{ value: 'fire', label: 'Fire Damage' },
		{ value: 'flood', label: 'Flood Damage' },
		{ value: 'other', label: 'Other' }
	];

	onMount(async () => {
		if (!$currentUser) {
			goto('/customer/login');
			return;
		}
		await loadClaims();
	});

	async function loadClaims() {
		if (!$currentUser?.uid) return;

		try {
			loading = true;
			const claimsQuery = query(
				collection(db, 'claims'),
				where('customerId', '==', $currentUser.uid),
				orderBy('submittedAt', 'desc')
			);

			const snapshot = await getDocs(claimsQuery);
			claims = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			}));

		} catch (error) {
			console.error('Error loading claims:', error);
		} finally {
			loading = false;
		}
	}

	async function submitNewClaim() {
		if (!$currentUser?.uid) return;

		try {
			submittingClaim = true;
			
			const claimData = {
				customerId: $currentUser.uid,
				customerName: `${$currentUser.firstName} ${$currentUser.lastName}`,
				customerEmail: $currentUser.email,
				claimNumber: `CLM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
				claimType: newClaimData.claimType,
				status: 'submitted',
				
				incidentDetails: {
					date: newClaimData.incidentDate,
					time: newClaimData.incidentTime,
					location: newClaimData.location,
					description: newClaimData.description,
					policeReportFiled: newClaimData.policeReportFiled,
					policeReportNumber: newClaimData.policeReportNumber || null
				},
				
				damages: {
					injuriesReported: newClaimData.injuriesReported,
					estimatedAmount: newClaimData.estimatedDamage || 0
				},
				
				submittedAt: serverTimestamp(),
				lastUpdated: serverTimestamp(),
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
				
				timeline: [
					{
						date: new Date(),
						event: 'Claim submitted',
						status: 'completed'
					}
				]
			};

			await addDoc(collection(db, 'claims'), claimData);
			
			// Reset form and reload claims
			newClaimData = {
				claimType: 'collision',
				incidentDate: '',
				incidentTime: '',
				location: '',
				description: '',
				policeReportFiled: false,
				policeReportNumber: '',
				injuriesReported: false,
				estimatedDamage: 0
			};
			
			showNewClaimForm = false;
			await loadClaims();

		} catch (error) {
			console.error('Error submitting claim:', error);
		} finally {
			submittingClaim = false;
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
			case 'submitted':
				return 'bg-blue-100 text-blue-800';
			case 'investigating':
				return 'bg-yellow-100 text-yellow-800';
			case 'processing':
				return 'bg-purple-100 text-purple-800';
			case 'approved':
				return 'bg-success-100 text-success-800';
			case 'denied':
				return 'bg-red-100 text-red-800';
			case 'closed':
				return 'bg-neutral-100 text-neutral-800';
			case 'paid':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getClaimIcon(type) {
		switch (type) {
			case 'collision': return '🚗';
			case 'comprehensive': return '⛈️';
			case 'liability': return '⚠️';
			case 'glass': return '🪟';
			case 'theft': return '🔒';
			case 'fire': return '🔥';
			case 'flood': return '🌊';
			default: return '📋';
		}
	}
</script>

<svelte:head>
	<title>My Claims - X Insurance Brokers</title>
	<meta name="description" content="File and track your insurance claims." />
</svelte:head>

<div class="min-h-screen bg-neutral-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">My Claims</h1>
					<p class="text-neutral-600 mt-1">File new claims and track existing ones</p>
				</div>
				<div class="flex space-x-3">
					<a
						href="/customer/dashboard"
						class="text-primary-600 hover:text-primary-700 font-medium transition-colors"
					>
						← Back to Dashboard
					</a>
					<button
						on:click={() => showNewClaimForm = true}
						class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
					>
						File New Claim
					</button>
				</div>
			</div>
		</div>

		{#if showNewClaimForm}
			<!-- New Claim Form -->
			<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 mb-8">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-semibold text-neutral-900">File New Claim</h2>
					<button
						on:click={() => showNewClaimForm = false}
						class="text-neutral-400 hover:text-neutral-600"
					>
						<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<form on:submit|preventDefault={submitNewClaim} class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label for="claimType" class="block text-sm font-medium text-neutral-700 mb-2">
								Claim Type *
							</label>
							<select
								id="claimType"
								bind:value={newClaimData.claimType}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							>
								{#each claimTypes as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="incidentDate" class="block text-sm font-medium text-neutral-700 mb-2">
								Incident Date *
							</label>
							<input
								id="incidentDate"
								type="date"
								bind:value={newClaimData.incidentDate}
								required
								max={new Date().toISOString().split('T')[0]}
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="incidentTime" class="block text-sm font-medium text-neutral-700 mb-2">
								Incident Time
							</label>
							<input
								id="incidentTime"
								type="time"
								bind:value={newClaimData.incidentTime}
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="estimatedDamage" class="block text-sm font-medium text-neutral-700 mb-2">
								Estimated Damage Amount
							</label>
							<input
								id="estimatedDamage"
								type="number"
								bind:value={newClaimData.estimatedDamage}
								min="0"
								step="100"
								placeholder="Enter amount in USD"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>
					</div>

					<div>
						<label for="location" class="block text-sm font-medium text-neutral-700 mb-2">
							Incident Location *
						</label>
						<input
							id="location"
							type="text"
							bind:value={newClaimData.location}
							required
							placeholder="Street address, city, state"
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						/>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-neutral-700 mb-2">
							Incident Description *
						</label>
						<textarea
							id="description"
							rows="4"
							bind:value={newClaimData.description}
							required
							placeholder="Provide a detailed description of what happened..."
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						></textarea>
					</div>

					<div class="space-y-4">
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={newClaimData.policeReportFiled}
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
							/>
							<span class="ml-2 text-neutral-700">Police report was filed</span>
						</label>

						{#if newClaimData.policeReportFiled}
							<div>
								<label for="policeReportNumber" class="block text-sm font-medium text-neutral-700 mb-2">
									Police Report Number
								</label>
								<input
									id="policeReportNumber"
									type="text"
									bind:value={newClaimData.policeReportNumber}
									placeholder="Enter police report number"
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								/>
							</div>
						{/if}

						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={newClaimData.injuriesReported}
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
							/>
							<span class="ml-2 text-neutral-700">Injuries were reported</span>
						</label>
					</div>

					<div class="flex justify-end space-x-4">
						<button
							type="button"
							on:click={() => showNewClaimForm = false}
							class="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-6 py-2 rounded-md font-medium transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={submittingClaim}
							class="bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center"
						>
							{#if submittingClaim}
								<LoadingSpinner size="sm" />
								<span class="ml-2">Submitting...</span>
							{:else}
								Submit Claim
							{/if}
						</button>
					</div>
				</form>
			</div>
		{/if}

		{#if loading}
			<div class="flex items-center justify-center py-24">
				<LoadingSpinner size="lg" />
			</div>
		{:else}
			<!-- Claims List -->
			{#if claims.length === 0}
				<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-12 text-center">
					<div class="text-6xl mb-4">📋</div>
					<h3 class="text-lg font-medium text-neutral-900 mb-2">No claims filed</h3>
					<p class="text-neutral-600 mb-6">
						You haven't filed any insurance claims yet. If you need to report an incident, click the button below.
					</p>
					<button
						on:click={() => showNewClaimForm = true}
						class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
					>
						File Your First Claim
					</button>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-6">
					{#each claims as claim}
						<div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
							<div class="p-6">
								<div class="flex items-start justify-between mb-4">
									<div class="flex items-center space-x-3">
										<div class="text-3xl">
											{getClaimIcon(claim.claimType)}
										</div>
										<div>
											<h3 class="text-lg font-semibold text-neutral-900">
												{claim.claimType?.charAt(0).toUpperCase() + claim.claimType?.slice(1)} Claim
											</h3>
											<p class="text-sm text-neutral-600">
												Claim #{claim.claimNumber}
											</p>
											<p class="text-sm text-neutral-600">
												Filed {formatDate(claim.submittedAt)}
											</p>
										</div>
									</div>
									<span class="inline-flex px-3 py-1 text-sm font-medium rounded-full {getStatusColor(claim.status)}">
										{claim.status?.charAt(0).toUpperCase() + claim.status?.slice(1)}
									</span>
								</div>

								<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
									<div>
										<p class="text-xs text-neutral-500">Incident Date</p>
										<p class="font-medium text-neutral-900">{claim.incidentDetails?.date || 'N/A'}</p>
									</div>
									<div>
										<p class="text-xs text-neutral-500">Location</p>
										<p class="font-medium text-neutral-900">{claim.incidentDetails?.location || 'N/A'}</p>
									</div>
									<div>
										<p class="text-xs text-neutral-500">Estimated Damage</p>
										<p class="font-medium text-neutral-900">
											{formatCurrency(claim.damages?.estimatedAmount)}
										</p>
									</div>
								</div>

								{#if claim.incidentDetails?.description}
									<div class="mb-4">
										<p class="text-xs text-neutral-500 mb-1">Incident Description</p>
										<p class="text-sm text-neutral-700 bg-neutral-50 rounded-lg p-3">
											{claim.incidentDetails.description}
										</p>
									</div>
								{/if}

								<!-- Claim Progress -->
								<div class="mb-4">
									<div class="flex items-center justify-between text-sm mb-2">
										<span class="text-neutral-600">Claim Progress</span>
										<span class="text-neutral-900 font-medium">
											{claim.status === 'paid' || claim.status === 'closed' ? '100%' : 
											 claim.status === 'approved' ? '90%' :
											 claim.status === 'processing' ? '70%' :
											 claim.status === 'investigating' ? '50%' :
											 claim.status === 'denied' ? '100%' : '25%'}
										</span>
									</div>
									<div class="w-full bg-neutral-200 rounded-full h-2">
										<div 
											class="bg-primary-600 h-2 rounded-full transition-all duration-300"
											style="width: {claim.status === 'paid' || claim.status === 'closed' ? '100%' : 
														claim.status === 'approved' ? '90%' :
														claim.status === 'processing' ? '70%' :
														claim.status === 'investigating' ? '50%' :
														claim.status === 'denied' ? '100%' : '25%'}"
										></div>
									</div>
								</div>

								<!-- Actions -->
								<div class="flex flex-wrap gap-3">
									<button
										on:click={() => goto(`/customer/claims/${claim.id}`)}
										class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
									>
										View Details
									</button>
									
									{#if claim.status === 'submitted' || claim.status === 'investigating'}
										<button
											class="border border-neutral-300 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
										>
											Update Claim
										</button>
									{/if}
									
									{#if claim.adjusterId}
										<button
											class="border border-neutral-300 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
										>
											Contact Adjuster
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