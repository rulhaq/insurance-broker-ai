<script lang="ts">
	import { onMount } from 'svelte';
	import { currentUser } from '$lib/services/auth';
	import { getClients, searchClients, deleteClient, type ClientFilters } from '$lib/services/clients';
	import type { Client, PaginatedResponse } from '$types';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';
	import Toast from '$components/ui/Toast.svelte';

	// State management
	let clients: Client[] = [];
	let loading = true;
	let searchQuery = '';
	let selectedClients: string[] = [];
	let showDeleteModal = false;
	let clientToDelete: Client | null = null;
	let errorMessage = '';
	let successMessage = '';

	// Filters and pagination
	let filters: ClientFilters = {
		status: [],
		industry: [],
		riskLevel: []
	};
	let currentPage = 1;
	let pageSize = 25;
	let totalClients = 0;
	let totalPages = 0;

	// Filter options
	const statusOptions = [
		{ label: 'Active', value: 'active' },
		{ label: 'Prospect', value: 'prospect' },
		{ label: 'Inactive', value: 'inactive' }
	];

	const industryOptions = [
		{ label: 'Technology', value: 'technology' },
		{ label: 'Healthcare', value: 'healthcare' },
		{ label: 'Manufacturing', value: 'manufacturing' },
		{ label: 'Retail', value: 'retail' },
		{ label: 'Construction', value: 'construction' },
		{ label: 'Professional Services', value: 'professional_services' },
		{ label: 'Other', value: 'other' }
	];

	const riskLevelOptions = [
		{ label: 'Low', value: 'LOW' },
		{ label: 'Medium', value: 'MEDIUM' },
		{ label: 'High', value: 'HIGH' },
		{ label: 'Very High', value: 'VERY_HIGH' }
	];

	// Load clients on mount and when filters change
	onMount(() => {
		loadClients();
	});

	$: if ($currentUser) {
		loadClients();
	}

	// Load clients with current filters
	async function loadClients() {
		if (!$currentUser) return;

		loading = true;
		errorMessage = '';

		try {
			const isAdmin = $currentUser.role === 'admin';
			
			const result: PaginatedResponse<Client> = await getClients(
				isAdmin ? null : $currentUser.uid, // Pass null for admin to get ALL clients
				filters,
				currentPage,
				pageSize
			);

			clients = result.items;
			totalClients = result.total;
			totalPages = result.pages;
		} catch (error: any) {
			errorMessage = error.message || 'Failed to load clients';
		} finally {
			loading = false;
		}
	}

	// Search clients
	async function handleSearch() {
		const isAdmin = $currentUser?.role === 'admin';
		
		if (!$currentUser || !searchQuery.trim()) {
			loadClients();
			return;
		}

		loading = true;
		try {
			clients = await searchClients(
				isAdmin ? null : $currentUser.uid, // Pass null for admin to search ALL clients
				searchQuery.trim()
			);
			totalClients = clients.length;
			totalPages = 1;
		} catch (error: any) {
			errorMessage = error.message || 'Search failed';
		} finally {
			loading = false;
		}
	}

	// Clear search
	function clearSearch() {
		searchQuery = '';
		loadClients();
	}

	// Handle filter changes
	function onFilterChange() {
		currentPage = 1;
		loadClients();
	}

	// Pagination
	function goToPage(page: number) {
		currentPage = page;
		loadClients();
	}

	// Selection management
	function toggleClientSelection(clientId: string) {
		if (selectedClients.includes(clientId)) {
			selectedClients = selectedClients.filter(id => id !== clientId);
		} else {
			selectedClients = [...selectedClients, clientId];
		}
	}

	function toggleSelectAll() {
		if (selectedClients.length === clients.length) {
			selectedClients = [];
		} else {
			selectedClients = clients.map(c => c.id);
		}
	}

	// Delete client
	function confirmDelete(client: Client) {
		clientToDelete = client;
		showDeleteModal = true;
	}

	async function handleDelete() {
		if (!clientToDelete || !$currentUser) return;

		try {
			await deleteClient(clientToDelete.id, $currentUser.uid);
			successMessage = `Client ${clientToDelete.firstName} ${clientToDelete.lastName} deleted successfully`;
			showDeleteModal = false;
			clientToDelete = null;
			loadClients();
		} catch (error: any) {
			errorMessage = error.message || 'Failed to delete client';
		}
	}

	function cancelDelete() {
		showDeleteModal = false;
		clientToDelete = null;
	}

	// Utility functions
	function getRiskLevelColor(level: string) {
		switch (level) {
			case 'LOW':
				return 'bg-success-100 text-success-800';
			case 'MEDIUM':
				return 'bg-yellow-100 text-yellow-800';
			case 'HIGH':
				return 'bg-red-100 text-red-800';
			case 'VERY_HIGH':
				return 'bg-red-200 text-red-900';
			default:
				return 'bg-neutral-100 text-neutral-800';
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'active':
				return 'bg-success-100 text-success-800';
			case 'prospect':
				return 'bg-blue-100 text-blue-800';
			case 'inactive':
				return 'bg-neutral-100 text-neutral-800';
			default:
				return 'bg-neutral-100 text-neutral-800';
		}
	}

	function formatDate(date: any): string {
		if (!date) return 'N/A';
		const d = date.toDate ? date.toDate() : new Date(date);
		return d.toLocaleDateString();
	}
</script>

<svelte:head>
	<title>Clients - Insurance Broker Pro</title>
</svelte:head>

<div class="container-page py-6">
	<!-- Page Header -->
	<div class="mb-8">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-2xl font-bold text-neutral-900">Clients</h1>
				<p class="text-neutral-600 mt-1">
					Manage your client relationships and track risk assessments
				</p>
			</div>
			<div class="mt-4 sm:mt-0">
				<a href="/clients/new" class="btn btn-primary btn-md">
					<svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Add New Client
				</a>
			</div>
		</div>
	</div>

	<!-- Search and Filters -->
	<div class="card mb-6">
		<div class="card-body">
			<!-- Search Bar -->
			<div class="mb-4">
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<svg class="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					<input
						type="text"
						bind:value={searchQuery}
						on:keydown={(e) => e.key === 'Enter' && handleSearch()}
						placeholder="Search clients by name, email, or company..."
						class="input pl-10 pr-4"
					/>
					{#if searchQuery}
						<button
							on:click={clearSearch}
							class="absolute inset-y-0 right-0 pr-3 flex items-center"
						>
							<svg class="h-4 w-4 text-neutral-400 hover:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
				</div>
			</div>

			<!-- Filters -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<!-- Status Filter -->
				<div>
					<label class="block text-sm font-medium text-neutral-700 mb-2">Status</label>
					<select
						bind:value={filters.status}
						on:change={onFilterChange}
						multiple
						class="input"
					>
						{#each statusOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<!-- Industry Filter -->
				<div>
					<label class="block text-sm font-medium text-neutral-700 mb-2">Industry</label>
					<select
						bind:value={filters.industry}
						on:change={onFilterChange}
						multiple
						class="input"
					>
						{#each industryOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<!-- Risk Level Filter -->
				<div>
					<label class="block text-sm font-medium text-neutral-700 mb-2">Risk Level</label>
					<select
						bind:value={filters.riskLevel}
						on:change={onFilterChange}
						multiple
						class="input"
					>
						{#each riskLevelOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	</div>

	<!-- Clients Table -->
	<div class="card">
		<div class="card-header">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<h2 class="text-lg font-semibold text-neutral-900">
						Clients ({totalClients})
					</h2>
					{#if selectedClients.length > 0}
						<span class="text-sm text-neutral-600">
							{selectedClients.length} selected
						</span>
					{/if}
				</div>
				{#if selectedClients.length > 0}
					<div class="flex items-center space-x-2">
						<button class="btn btn-secondary btn-sm">
							Export Selected
						</button>
						<button class="btn btn-danger btn-sm">
							Delete Selected
						</button>
					</div>
				{/if}
			</div>
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<LoadingSpinner size="lg" />
			</div>
		{:else if clients.length === 0}
			<div class="text-center py-12">
				<svg class="h-12 w-12 text-neutral-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
				</svg>
				<h3 class="text-lg font-medium text-neutral-900 mb-2">No clients found</h3>
				<p class="text-neutral-600 mb-4">
					{searchQuery ? 'Try adjusting your search or filters' : 'Get started by adding your first client'}
				</p>
				{#if !searchQuery}
					<a href="/clients/new" class="btn btn-primary btn-md">
						Add New Client
					</a>
				{/if}
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table">
					<thead class="table-header">
						<tr>
							<th class="table-header-cell">
								<input
									type="checkbox"
									checked={selectedClients.length === clients.length && clients.length > 0}
									on:change={toggleSelectAll}
									class="rounded"
								/>
							</th>
							<th class="table-header-cell">Client</th>
							<th class="table-header-cell">Contact</th>
							<th class="table-header-cell">Company</th>
							<th class="table-header-cell">Industry</th>
							<th class="table-header-cell">Risk Level</th>
							<th class="table-header-cell">Status</th>
							<th class="table-header-cell">Created</th>
							<th class="table-header-cell">Actions</th>
						</tr>
					</thead>
					<tbody class="table-body">
						{#each clients as client}
							<tr class="table-row">
								<td class="table-cell">
									<input
										type="checkbox"
										checked={selectedClients.includes(client.id)}
										on:change={() => toggleClientSelection(client.id)}
										class="rounded"
									/>
								</td>
								<td class="table-cell">
									<div class="flex items-center space-x-3">
										<div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
											<span class="text-primary-600 font-medium text-sm">
												{client.firstName.charAt(0)}{client.lastName.charAt(0)}
											</span>
										</div>
										<div>
											<p class="font-medium text-neutral-900">
												{client.firstName} {client.lastName}
											</p>
											<p class="text-sm text-neutral-600">
												ID: {client.id.slice(0, 8)}...
											</p>
										</div>
									</div>
								</td>
								<td class="table-cell">
									<div>
										<p class="text-neutral-900">{client.email}</p>
										<p class="text-sm text-neutral-600">{client.phone}</p>
									</div>
								</td>
								<td class="table-cell">
									{client.businessName || 'N/A'}
								</td>
								<td class="table-cell">
									{client.industry || 'N/A'}
								</td>
								<td class="table-cell">
									<span class="badge {getRiskLevelColor(client.riskAssessment.level)}">
										{client.riskAssessment.level}
									</span>
								</td>
								<td class="table-cell">
									<span class="badge {getStatusColor(client.status)}">
										{client.status}
									</span>
								</td>
								<td class="table-cell">
									{formatDate(client.createdAt)}
								</td>
								<td class="table-cell">
									<div class="flex items-center space-x-2">
										<a
											href="/clients/{client.id}"
											class="text-primary-600 hover:text-primary-500 text-sm font-medium"
										>
											View
										</a>
										{#if $currentUser?.role === 'admin' || client.brokerId === $currentUser?.uid}
											<a
												href="/clients/{client.id}/edit"
												class="text-neutral-600 hover:text-neutral-500 text-sm font-medium"
											>
												Edit
											</a>
											<button
												on:click={() => confirmDelete(client)}
												class="text-red-600 hover:text-red-500 text-sm font-medium"
											>
												Delete
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="card-footer">
					<div class="flex items-center justify-between">
						<div class="text-sm text-neutral-600">
							Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalClients)} of {totalClients} results
						</div>
						<div class="flex items-center space-x-2">
							<button
								on:click={() => goToPage(currentPage - 1)}
								disabled={currentPage === 1}
								class="btn btn-secondary btn-sm"
							>
								Previous
							</button>
							
							{#each Array(totalPages).fill(0) as _, index}
								{#if index + 1 === currentPage || index + 1 === 1 || index + 1 === totalPages || (index + 1 >= currentPage - 2 && index + 1 <= currentPage + 2)}
									<button
										on:click={() => goToPage(index + 1)}
										class="btn {index + 1 === currentPage ? 'btn-primary' : 'btn-secondary'} btn-sm"
									>
										{index + 1}
									</button>
								{:else if index + 1 === currentPage - 3 || index + 1 === currentPage + 3}
									<span class="text-neutral-500">...</span>
								{/if}
							{/each}

							<button
								on:click={() => goToPage(currentPage + 1)}
								disabled={currentPage === totalPages}
								class="btn btn-secondary btn-sm"
							>
								Next
							</button>
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && clientToDelete}
	<div class="fixed inset-0 bg-neutral-600 bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
			<h3 class="text-lg font-semibold text-neutral-900 mb-4">Delete Client</h3>
			<p class="text-neutral-600 mb-6">
				Are you sure you want to delete <strong>{clientToDelete.firstName} {clientToDelete.lastName}</strong>? 
				This action cannot be undone and will also delete all associated quotes, policies, and documents.
			</p>
			<div class="flex justify-end space-x-3">
				<button
					on:click={cancelDelete}
					class="btn btn-secondary btn-md"
				>
					Cancel
				</button>
				<button
					on:click={handleDelete}
					class="btn btn-danger btn-md"
				>
					Delete Client
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Toast Messages -->
{#if errorMessage}
	<Toast 
		type="error" 
		message={errorMessage} 
		onClose={() => errorMessage = ''}
	/>
{/if}

{#if successMessage}
	<Toast 
		type="success" 
		message={successMessage} 
		onClose={() => successMessage = ''}
	/>
{/if} 