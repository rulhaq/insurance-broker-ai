<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import type { User } from '$types';

	export let user: User;

	const dispatch = createEventDispatcher();

	// Header state
	let searchQuery = '';
	let showNotifications = false;
	let showUserMenu = false;

	// Mock notifications for demo
	const notifications = [
		{
			id: 1,
			title: 'Policy Renewal Due',
			message: 'Client John Smith\'s commercial auto policy expires in 7 days',
			time: '2 hours ago',
			type: 'warning',
			unread: true
		},
		{
			id: 2,
			title: 'New Quote Request',
			message: 'Sarah Johnson requested a quote for general liability insurance',
			time: '4 hours ago',
			type: 'info',
			unread: true
		},
		{
			id: 3,
			title: 'AI Risk Assessment Complete',
			message: 'Risk analysis completed for ABC Corp with HIGH risk rating',
			time: '6 hours ago',
			type: 'success',
			unread: false
		}
	];

	const unreadCount = notifications.filter(n => n.unread).length;

	function handleSearch() {
		if (searchQuery.trim()) {
			console.log('Searching for:', searchQuery);
			// Implement search functionality
		}
	}

	function handleLogout() {
		dispatch('logout');
	}

	function toggleSidebar() {
		dispatch('toggleSidebar');
	}

	// Close dropdowns when clicking outside
	function closeDropdowns() {
		showNotifications = false;
		showUserMenu = false;
	}

	// Navigation functions
	function goToProfile() {
		showUserMenu = false;
		goto('/profile');
	}

	function goToSettings() {
		showUserMenu = false;
		goto('/settings');
	}

	function goToHelp() {
		showUserMenu = false;
		goto('/support');
	}
</script>

<header class="bg-white shadow-soft border-b border-neutral-200">
	<div class="px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center py-4">
			<!-- Left section: Mobile menu button + Search -->
			<div class="flex items-center flex-1">
				<!-- Mobile menu button -->
				<button
					on:click={toggleSidebar}
					class="lg:hidden p-2 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>

				<!-- Search -->
				<div class="ml-4 flex-1 max-w-lg">
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<svg class="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<input
							type="search"
							bind:value={searchQuery}
							on:keydown={(e) => e.key === 'Enter' && handleSearch()}
							placeholder="Search clients, policies, quotes..."
							class="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg bg-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
						/>
						{#if searchQuery}
							<button
								on:click={() => searchQuery = ''}
								class="absolute inset-y-0 right-0 pr-3 flex items-center"
							>
								<svg class="h-4 w-4 text-neutral-400 hover:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/if}
					</div>
				</div>
			</div>

			<!-- Right section: Notifications + User menu -->
			<div class="flex items-center space-x-4">
				<!-- AI Assistant Button -->
				<button 
					on:click={() => dispatch('toggleAI')}
					class="p-2 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors relative"
					title="AI Assistant"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
					</svg>
					<span class="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full"></span>
				</button>

				<!-- Notifications -->
				<div class="relative">
					<button
						on:click={() => showNotifications = !showNotifications}
						class="relative p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
					>
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
						</svg>
						{#if unreadCount > 0}
							<span class="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center -mt-1 -mr-1">
								{unreadCount}
							</span>
						{/if}
					</button>

					<!-- Notifications dropdown -->
					{#if showNotifications}
						<div class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-large border border-neutral-200 z-50">
							<div class="p-4 border-b border-neutral-200">
								<h3 class="text-sm font-semibold text-neutral-900">Notifications</h3>
							</div>
							<div class="max-h-64 overflow-y-auto">
								{#each notifications as notification}
									<div class="p-4 border-b border-neutral-100 hover:bg-neutral-50 {notification.unread ? 'bg-primary-25' : ''}">
										<div class="flex items-start space-x-3">
											<div class="flex-shrink-0">
												{#if notification.type === 'warning'}
													<div class="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
														<svg class="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
														</svg>
													</div>
												{:else if notification.type === 'info'}
													<div class="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
														<svg class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
														</svg>
													</div>
												{:else}
													<div class="h-8 w-8 bg-success-100 rounded-full flex items-center justify-center">
														<svg class="h-4 w-4 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
														</svg>
													</div>
												{/if}
											</div>
											<div class="flex-1 min-w-0">
												<p class="text-sm font-medium text-neutral-900">{notification.title}</p>
												<p class="text-sm text-neutral-600 mt-1">{notification.message}</p>
												<p class="text-xs text-neutral-500 mt-2">{notification.time}</p>
											</div>
											{#if notification.unread}
												<div class="flex-shrink-0">
													<div class="h-2 w-2 bg-primary-600 rounded-full"></div>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
							<div class="p-4">
								<button class="text-sm text-primary-600 hover:text-primary-500 font-medium">
									View all notifications
								</button>
							</div>
						</div>
					{/if}
				</div>

				<!-- User menu -->
				<div class="relative">
					<button
						on:click={() => showUserMenu = !showUserMenu}
						class="flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
					>
						{#if user.avatar}
							<img class="h-8 w-8 rounded-full object-cover" src={user.avatar} alt="{user.firstName} {user.lastName}" />
						{:else}
							<div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
								<span class="text-primary-600 font-medium text-sm">
									{user.firstName.charAt(0)}{user.lastName.charAt(0)}
								</span>
							</div>
						{/if}
						<div class="hidden md:block text-left">
							<p class="text-sm font-medium text-neutral-900">
								{user.firstName} {user.lastName}
							</p>
							<p class="text-xs text-neutral-500 capitalize">
								{user.role}
							</p>
						</div>
						<svg class="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					<!-- User menu dropdown -->
					{#if showUserMenu}
						<div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-large border border-neutral-200 z-50">
							<div class="py-1">
								<button
									on:click={goToProfile}
									class="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
								>
									Your Profile
								</button>
								<button
									on:click={goToSettings}
									class="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
								>
									Settings
								</button>
								<button
									on:click={goToHelp}
									class="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
								>
									Help & Support
								</button>
								<div class="border-t border-neutral-100 my-1"></div>
								<button
									on:click={handleLogout}
									class="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
								>
									Sign out
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</header>

<!-- Backdrop to close dropdowns -->
{#if showNotifications || showUserMenu}
	<div
		class="fixed inset-0 z-40"
		on:click={closeDropdowns}
		on:keydown={(e) => e.key === 'Escape' && closeDropdowns()}
		role="button"
		tabindex="0"
	></div>
{/if} 