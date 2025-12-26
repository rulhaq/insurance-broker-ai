<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let isLoading = false;
	let errorMessage = '';
	let successMessage = '';

	let formData = {
		title: '',
		description: '',
		priority: 'medium',
		dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		clientId: '',
		category: 'general',
		assignedTo: ''
	};

	const priorityOptions = [
		{ value: 'low', label: 'Low Priority', color: 'text-green-600' },
		{ value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
		{ value: 'high', label: 'High Priority', color: 'text-orange-600' },
		{ value: 'urgent', label: 'Urgent', color: 'text-red-600' }
	];

	const categoryOptions = [
		{ value: 'general', label: 'General Task' },
		{ value: 'follow_up', label: 'Client Follow-up' },
		{ value: 'renewal', label: 'Policy Renewal' },
		{ value: 'quote', label: 'Quote Review' },
		{ value: 'documentation', label: 'Documentation' },
		{ value: 'compliance', label: 'Compliance Check' }
	];

	async function handleSubmit() {
		if (!$currentUser) return;

		isLoading = true;
		errorMessage = '';

		try {
			await new Promise(resolve => setTimeout(resolve, 1000));
			successMessage = 'Task created successfully!';
			
			setTimeout(() => {
				goto('/tasks');
			}, 1500);
		} catch (error) {
			console.error('Error creating task:', error);
			errorMessage = 'Failed to create task. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function handleCancel() {
		goto('/tasks');
	}
</script>

<svelte:head>
	<title>New Task - Insurance Broker Pro</title>
</svelte:head>

<div class="min-h-full">
	<div class="bg-white shadow">
		<div class="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
			<div class="py-6">
				<div class="lg:flex lg:items-center lg:justify-between">
					<div class="flex-1 min-w-0">
						<nav class="flex" aria-label="Breadcrumb">
							<ol role="list" class="flex items-center space-x-4">
								<li>
									<div>
										<button 
											on:click={() => goto('/tasks')}
											class="text-neutral-400 hover:text-neutral-500"
										>
											<svg class="flex-shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
											</svg>
											<span class="sr-only">Tasks</span>
										</button>
									</div>
								</li>
								<li>
									<div class="flex items-center">
										<svg class="flex-shrink-0 h-5 w-5 text-neutral-300" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
										</svg>
										<span class="ml-4 text-sm font-medium text-neutral-500">New Task</span>
									</div>
								</li>
							</ol>
						</nav>
						<h1 class="mt-2 text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
							Create New Task
						</h1>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8 py-8">
		{#if errorMessage}
			<div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
				{errorMessage}
			</div>
		{/if}

		{#if successMessage}
			<div class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
				{successMessage}
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit} class="space-y-8">
			<div class="bg-white shadow rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg leading-6 font-medium text-neutral-900 mb-4">Task Details</h3>
					
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div class="sm:col-span-2">
							<label for="title" class="block text-sm font-medium text-neutral-700">Task Title</label>
							<input
								type="text"
								id="title"
								bind:value={formData.title}
								required
								placeholder="Enter task title..."
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>

						<div>
							<label for="priority" class="block text-sm font-medium text-neutral-700">Priority</label>
							<select
								id="priority"
								bind:value={formData.priority}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							>
								{#each priorityOptions as priority}
									<option value={priority.value}>{priority.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="category" class="block text-sm font-medium text-neutral-700">Category</label>
							<select
								id="category"
								bind:value={formData.category}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							>
								{#each categoryOptions as category}
									<option value={category.value}>{category.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="dueDate" class="block text-sm font-medium text-neutral-700">Due Date</label>
							<input
								type="date"
								id="dueDate"
								bind:value={formData.dueDate}
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>

						<div>
							<label for="clientId" class="block text-sm font-medium text-neutral-700">Related Client (Optional)</label>
							<input
								type="text"
								id="clientId"
								bind:value={formData.clientId}
								placeholder="Search and select client..."
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							/>
						</div>

						<div class="sm:col-span-2">
							<label for="description" class="block text-sm font-medium text-neutral-700">Description</label>
							<textarea
								id="description"
								bind:value={formData.description}
								rows="4"
								placeholder="Describe the task and any important details..."
								class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
							></textarea>
						</div>
					</div>
				</div>
			</div>

			<div class="flex justify-end space-x-3">
				<button
					type="button"
					on:click={handleCancel}
					class="bg-white py-2 px-4 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isLoading}
					class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
				>
					{#if isLoading}
						<LoadingSpinner size="sm" color="white" />
						<span class="ml-2">Creating...</span>
					{:else}
						Create Task
					{/if}
				</button>
			</div>
		</form>
	</div>
</div> 