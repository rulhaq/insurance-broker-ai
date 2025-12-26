<script lang="ts">
	import { onMount } from 'svelte';
	import { currentUser, authService } from '$lib/services/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Sidebar from '$components/layout/Sidebar.svelte';
	import Header from '$components/layout/Header.svelte';
	import AIChat from '$components/ai/AIChat.svelte';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	// Sidebar state
	let sidebarOpen = false;
	
	// AI Chat state
	let aiChatOpen = false;

	// Base navigation items
	let navigation = [
		{
			name: 'Dashboard',
			href: '/dashboard',
			icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
			current: false
		},
		{
			name: 'Clients',
			href: '/clients',
			icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
			current: false,
			badge: 5
		},
		{
			name: 'Quotes',
			href: '/quotes',
			icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
			current: false,
			badge: 3
		},
		{
			name: 'Policies',
			href: '/policies',
			icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
			current: false
		},
		{
			name: 'Tasks',
			href: '/tasks',
			icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
			current: false,
			badge: 7
		},
		{
			name: 'Documents',
			href: '/documents',
			icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
			current: false
		},
		{
			name: 'Reports',
			href: '/reports',
			icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
			current: false
		},
		{
			name: 'Settings',
			href: '/settings',
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
			current: false
		}
	];

	// Add admin navigation for admin users
	$: if ($currentUser?.role === 'admin') {
		const hasAdminArea = navigation.find(item => item.name === 'App Admin Area');
		if (!hasAdminArea) {
			// Insert admin area before Settings
			const settingsIndex = navigation.findIndex(item => item.name === 'Settings');
			navigation = [
				...navigation.slice(0, settingsIndex),
				{
					name: 'App Admin Area',
					href: '/admin',
					icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
					current: false,
					adminOnly: true
				},
				...navigation.slice(settingsIndex)
			];
		}
	} else {
		// Remove admin area for non-admin users
		navigation = navigation.filter(item => !item.adminOnly);
	}

	// Update navigation current state based on current page
	$: {
		navigation.forEach(item => {
			if (item.name === 'App Admin Area') {
				// Admin area is active for any admin route
				item.current = $page.url.pathname.startsWith('/admin') || 
							  $page.url.pathname.startsWith('/settings/admin');
			} else {
				item.current = $page.url.pathname === item.href || 
					($page.url.pathname.startsWith(item.href) && item.href !== '/dashboard');
			}
		});
	}

	// Handle user authentication check
	onMount(() => {
		if (!$currentUser) {
			goto('/auth/login');
		}
	});

	// Close sidebar when clicking outside (mobile)
	function closeSidebar() {
		sidebarOpen = false;
	}

	// Toggle sidebar
	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	// Handle logout
	async function handleLogout() {
		try {
			await authService.signOut();
			goto('/');
		} catch (error) {
			console.error('Logout error:', error);
		}
	}

	// Handle navigation from sidebar
	function handleNavigation(event: CustomEvent) {
		const { href } = event.detail;
		goto(href);
	}

	// Handle AI chat
	function handleAIToggle() {
		aiChatOpen = !aiChatOpen;
	}

	function handleAIClose() {
		aiChatOpen = false;
	}
</script>

{#if !$currentUser}
	<div class="min-h-screen bg-neutral-50 flex items-center justify-center">
		<LoadingSpinner size="lg" />
	</div>
{:else}
	<div class="h-screen flex bg-neutral-50">
		<!-- Sidebar -->
		<Sidebar 
			{navigation}
			bind:open={sidebarOpen}
			user={$currentUser}
			on:close={closeSidebar}
			on:logout={handleLogout}
			on:navigate={handleNavigation}
		/>

		<!-- Main content area -->
		<div class="flex-1 flex flex-col overflow-hidden">
			<!-- Header -->
			<Header 
				user={$currentUser}
				on:toggleSidebar={toggleSidebar}
				on:toggleAI={handleAIToggle}
				on:logout={handleLogout}
			/>

			<!-- Main content -->
			<main class="flex-1 overflow-y-auto focus:outline-none">
				<div class="page-transition">
					<slot />
				</div>
			</main>
		</div>

		<!-- Sidebar overlay for mobile -->
		{#if sidebarOpen}
			<div 
				class="fixed inset-0 z-30 bg-neutral-600 bg-opacity-50 lg:hidden"
				on:click={closeSidebar}
				on:keydown={(e) => e.key === 'Escape' && closeSidebar()}
				role="button"
				tabindex="0"
			></div>
		{/if}
	</div>
	
	<!-- AI Chat Assistant -->
	<AIChat isOpen={aiChatOpen} on:close={handleAIClose} />
{/if} 