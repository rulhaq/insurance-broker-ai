<script lang="ts">
	import { currentUser, authService } from '$lib/services/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let isLoading = false;
	let message = '';
	let preferences = {
		theme: 'light',
		colorScheme: 'blue',
		density: 'comfortable',
		animations: true,
		fontSize: 'medium',
		dashboardLayout: ['summary', 'tasks', 'recent_clients', 'quotes']
	};

	const themes = [
		{ value: 'light', label: 'Light', description: 'Clean and bright interface' },
		{ value: 'dark', label: 'Dark', description: 'Easy on the eyes in low light' },
		{ value: 'auto', label: 'Auto', description: 'Follows system preference' }
	];

	const colorSchemes = [
		{ value: 'blue', label: 'Professional Blue', color: 'bg-blue-600' },
		{ value: 'green', label: 'Success Green', color: 'bg-green-600' },
		{ value: 'purple', label: 'Modern Purple', color: 'bg-purple-600' },
		{ value: 'indigo', label: 'Corporate Indigo', color: 'bg-indigo-600' }
	];

	const densityOptions = [
		{ value: 'compact', label: 'Compact', description: 'More content, less spacing' },
		{ value: 'comfortable', label: 'Comfortable', description: 'Balanced spacing' },
		{ value: 'spacious', label: 'Spacious', description: 'More spacing, easier to read' }
	];

	const fontSizes = [
		{ value: 'small', label: 'Small', description: '14px base size' },
		{ value: 'medium', label: 'Medium', description: '16px base size' },
		{ value: 'large', label: 'Large', description: '18px base size' }
	];

	const availableWidgets = [
		{ id: 'summary', label: 'Performance Summary', description: 'Key metrics and KPIs' },
		{ id: 'tasks', label: 'Recent Tasks', description: 'Your latest tasks and deadlines' },
		{ id: 'recent_clients', label: 'Recent Clients', description: 'Recently added or updated clients' },
		{ id: 'quotes', label: 'Active Quotes', description: 'Pending and recent quotes' },
		{ id: 'renewals', label: 'Upcoming Renewals', description: 'Policies due for renewal' },
		{ id: 'revenue', label: 'Revenue Chart', description: 'Monthly revenue trends' }
	];

	onMount(() => {
		if ($currentUser?.preferences) {
			preferences = { ...preferences, ...$currentUser.preferences };
		}
	});

	async function handleSave() {
		if (!$currentUser) return;

		isLoading = true;
		try {
			await authService.updateUserProfile({
				preferences
			});
			
			message = 'Appearance settings saved successfully!';
			applyTheme();
			setTimeout(() => message = '', 3000);
		} catch (error) {
			console.error('Error saving preferences:', error);
			message = 'Failed to save settings';
		} finally {
			isLoading = false;
		}
	}

	function applyTheme() {
		// Apply theme to document
		if (preferences.theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else if (preferences.theme === 'light') {
			document.documentElement.classList.remove('dark');
		} else {
			// Auto theme
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			document.documentElement.classList.toggle('dark', prefersDark);
		}

		// Store preference
		localStorage.setItem('theme', preferences.theme);
	}

	function handleThemeChange() {
		applyTheme();
	}

	function moveWidgetUp(index: number) {
		if (index > 0) {
			const newLayout = [...preferences.dashboardLayout];
			[newLayout[index], newLayout[index - 1]] = [newLayout[index - 1], newLayout[index]];
			preferences.dashboardLayout = newLayout;
		}
	}

	function moveWidgetDown(index: number) {
		if (index < preferences.dashboardLayout.length - 1) {
			const newLayout = [...preferences.dashboardLayout];
			[newLayout[index], newLayout[index + 1]] = [newLayout[index + 1], newLayout[index]];
			preferences.dashboardLayout = newLayout;
		}
	}

	function removeWidget(index: number) {
		preferences.dashboardLayout = preferences.dashboardLayout.filter((_, i) => i !== index);
	}

	function addWidget(widgetId: string) {
		if (!preferences.dashboardLayout.includes(widgetId)) {
			preferences.dashboardLayout = [...preferences.dashboardLayout, widgetId];
		}
	}

	function getWidgetLabel(widgetId: string) {
		return availableWidgets.find(w => w.id === widgetId)?.label || widgetId;
	}
</script>

<svelte:head>
	<title>Appearance Settings - Insurance Broker Pro</title>
</svelte:head>

<div class="min-h-full">
	<!-- Header -->
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
											on:click={() => goto('/settings')}
											class="text-neutral-400 hover:text-neutral-500"
										>
											<svg class="flex-shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
											</svg>
											<span class="sr-only">Settings</span>
										</button>
									</div>
								</li>
								<li>
									<div class="flex items-center">
										<svg class="flex-shrink-0 h-5 w-5 text-neutral-300" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
										</svg>
										<span class="ml-4 text-sm font-medium text-neutral-500">Appearance</span>
									</div>
								</li>
							</ol>
						</nav>
						<h1 class="mt-2 text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
							Appearance Settings
						</h1>
						<div class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
							<div class="mt-2 flex items-center text-sm text-neutral-500">
								<svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
								</svg>
								Customize your workspace appearance
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8 py-8">
		{#if message}
			<div class="mb-6 p-4 rounded-lg {message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}">
				{message}
			</div>
		{/if}

		<div class="space-y-8">
			<!-- Theme Selection -->
			<div class="bg-white shadow rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg leading-6 font-medium text-neutral-900 mb-4">Theme</h3>
					
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
						{#each themes as theme}
							<label class="relative flex cursor-pointer rounded-lg border p-4 hover:bg-neutral-50 {preferences.theme === theme.value ? 'border-primary-500 bg-primary-50' : 'border-neutral-300'}">
								<input
									type="radio"
									bind:group={preferences.theme}
									value={theme.value}
									on:change={handleThemeChange}
									class="sr-only"
								/>
								<div class="flex flex-1">
									<div class="flex flex-col">
										<span class="block text-sm font-medium text-neutral-900">{theme.label}</span>
										<span class="mt-1 flex items-center text-sm text-neutral-500">{theme.description}</span>
									</div>
								</div>
								{#if preferences.theme === theme.value}
									<svg class="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
									</svg>
								{/if}
							</label>
						{/each}
					</div>
				</div>
			</div>

			<!-- Color Scheme -->
			<div class="bg-white shadow rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg leading-6 font-medium text-neutral-900 mb-4">Color Scheme</h3>
					
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
						{#each colorSchemes as scheme}
							<label class="relative flex cursor-pointer rounded-lg border p-4 hover:bg-neutral-50 {preferences.colorScheme === scheme.value ? 'border-primary-500 bg-primary-50' : 'border-neutral-300'}">
								<input
									type="radio"
									bind:group={preferences.colorScheme}
									value={scheme.value}
									class="sr-only"
								/>
								<div class="flex flex-1 items-center">
									<div class="w-4 h-4 rounded-full {scheme.color} mr-3"></div>
									<span class="block text-sm font-medium text-neutral-900">{scheme.label}</span>
								</div>
								{#if preferences.colorScheme === scheme.value}
									<svg class="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
									</svg>
								{/if}
							</label>
						{/each}
					</div>
				</div>
			</div>

			<!-- Display Options -->
			<div class="bg-white shadow rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg leading-6 font-medium text-neutral-900 mb-4">Display Options</h3>
					
					<div class="space-y-6">
						<!-- Density -->
						<div>
							<label class="text-base font-medium text-neutral-900">Interface Density</label>
							<div class="mt-2 space-y-2">
								{#each densityOptions as density}
									<label class="flex items-center">
										<input
											type="radio"
											bind:group={preferences.density}
											value={density.value}
											class="focus:ring-primary-500 h-4 w-4 text-primary-600 border-neutral-300"
										/>
										<div class="ml-3">
											<div class="text-sm font-medium text-neutral-700">{density.label}</div>
											<div class="text-sm text-neutral-500">{density.description}</div>
										</div>
									</label>
								{/each}
							</div>
						</div>

						<!-- Font Size -->
						<div>
							<label class="text-base font-medium text-neutral-900">Font Size</label>
							<div class="mt-2 space-y-2">
								{#each fontSizes as fontSize}
									<label class="flex items-center">
										<input
											type="radio"
											bind:group={preferences.fontSize}
											value={fontSize.value}
											class="focus:ring-primary-500 h-4 w-4 text-primary-600 border-neutral-300"
										/>
										<div class="ml-3">
											<div class="text-sm font-medium text-neutral-700">{fontSize.label}</div>
											<div class="text-sm text-neutral-500">{fontSize.description}</div>
										</div>
									</label>
								{/each}
							</div>
						</div>

						<!-- Animations -->
						<div class="flex items-center justify-between">
							<div>
								<div class="text-base font-medium text-neutral-900">Animations</div>
								<div class="text-sm text-neutral-500">Enable smooth transitions and animations</div>
							</div>
							<label class="relative inline-flex items-center cursor-pointer">
								<input type="checkbox" bind:checked={preferences.animations} class="sr-only peer" />
								<div class="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
							</label>
						</div>
					</div>
				</div>
			</div>

			<!-- Dashboard Layout -->
			<div class="bg-white shadow rounded-lg">
				<div class="px-4 py-5 sm:p-6">
					<h3 class="text-lg leading-6 font-medium text-neutral-900 mb-4">Dashboard Layout</h3>
					<p class="text-sm text-neutral-600 mb-4">Customize the order of widgets on your dashboard</p>
					
					<div class="space-y-4">
						<!-- Current Widgets -->
						<div>
							<h4 class="text-sm font-medium text-neutral-900 mb-2">Current Widgets</h4>
							<div class="space-y-2">
								{#each preferences.dashboardLayout as widgetId, index}
									<div class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
										<span class="text-sm font-medium text-neutral-900">{getWidgetLabel(widgetId)}</span>
										<div class="flex space-x-2">
											<button
												on:click={() => moveWidgetUp(index)}
												disabled={index === 0}
												class="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-50"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
												</svg>
											</button>
											<button
												on:click={() => moveWidgetDown(index)}
												disabled={index === preferences.dashboardLayout.length - 1}
												class="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-50"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
												</svg>
											</button>
											<button
												on:click={() => removeWidget(index)}
												class="p-1 text-red-400 hover:text-red-600"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											</button>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<!-- Available Widgets -->
						<div>
							<h4 class="text-sm font-medium text-neutral-900 mb-2">Available Widgets</h4>
							<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
								{#each availableWidgets.filter(w => !preferences.dashboardLayout.includes(w.id)) as widget}
									<button
										on:click={() => addWidget(widget.id)}
										class="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-left"
									>
										<div>
											<div class="text-sm font-medium text-neutral-900">{widget.label}</div>
											<div class="text-xs text-neutral-500">{widget.description}</div>
										</div>
										<svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
										</svg>
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Save Button -->
			<div class="flex justify-end">
				<button
					on:click={handleSave}
					disabled={isLoading}
					class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
				>
					{#if isLoading}
						<LoadingSpinner size="sm" color="white" />
						<span class="ml-2">Saving...</span>
					{:else}
						Save Appearance Settings
					{/if}
				</button>
			</div>
		</div>
	</div>
</div> 