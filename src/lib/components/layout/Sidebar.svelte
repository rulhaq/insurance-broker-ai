<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { User } from '$types';

	export let navigation: any[];
	export let open: boolean = false;
	export let user: User;

	const dispatch = createEventDispatcher();

	function handleNavigation(href: string) {
		// Close sidebar on mobile after navigation
		if (typeof window !== 'undefined' && window.innerWidth < 1024) {
			dispatch('close');
		}
		// Dispatch navigation event to parent
		dispatch('navigate', { href });
	}

	function handleLogout() {
		dispatch('logout');
	}
</script>

<!-- Desktop sidebar -->
<div class="hidden lg:flex lg:flex-shrink-0">
	<div class="flex flex-col w-64">
		<div class="flex flex-col flex-grow bg-white border-r border-neutral-200 pt-5 pb-4 overflow-y-auto">
			<!-- Logo -->
			<div class="flex items-center flex-shrink-0 px-4">
				<div class="flex items-center">
					<div class="h-8 w-8 gradient-primary rounded-lg flex items-center justify-center">
						<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
					</div>
					<div class="ml-3">
						<h1 class="text-lg font-bold text-neutral-900">Broker Pro</h1>
					</div>
				</div>
			</div>

			<!-- Navigation -->
			<nav class="mt-8 flex-1 px-2 space-y-1">
				{#each navigation as item}
					<button
						on:click={() => handleNavigation(item.href)}
						class="group w-full flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200 {item.current 
							? 'nav-link-active' 
							: 'nav-link-inactive'}"
					>
						<svg 
							class="mr-3 h-5 w-5 flex-shrink-0 {item.current 
								? 'text-primary-600' 
								: 'text-neutral-400 group-hover:text-neutral-600'}" 
							fill="none" 
							viewBox="0 0 24 24" 
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
						</svg>
						<span class="flex-1">{item.name}</span>
						{#if item.badge}
							<span class="badge badge-primary ml-3">
								{item.badge}
							</span>
						{/if}
					</button>
				{/each}
			</nav>

			<!-- User Profile Section -->
			<div class="flex-shrink-0 flex border-t border-neutral-200 p-4">
				<div class="flex items-center w-full">
					<div class="flex-shrink-0">
						{#if user.avatar}
							<img class="h-10 w-10 rounded-full object-cover" src={user.avatar} alt="{user.firstName} {user.lastName}" />
						{:else}
							<div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
								<span class="text-primary-600 font-medium text-sm">
									{user.firstName.charAt(0)}{user.lastName.charAt(0)}
								</span>
							</div>
						{/if}
					</div>
					<div class="ml-3 flex-1">
						<p class="text-sm font-medium text-neutral-900">
							{user.firstName} {user.lastName}
						</p>
						<p class="text-xs text-neutral-500 capitalize">
							{user.role}
						</p>
					</div>
					<div class="flex-shrink-0">
						<button
							on:click={handleLogout}
							class="p-1 rounded-md text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
							title="Sign out"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Mobile sidebar -->
<div class="lg:hidden">
	<div class="fixed inset-0 flex z-40 {open ? '' : 'pointer-events-none'}">
		<!-- Sidebar -->
		<div class="relative flex-1 flex flex-col max-w-xs w-full transform transition-transform duration-300 ease-in-out {open ? 'translate-x-0' : '-translate-x-full'}">
			<div class="absolute top-0 right-0 -mr-12 pt-2 {open ? '' : 'hidden'}">
				<button
					on:click={() => dispatch('close')}
					class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
				>
					<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="flex-1 h-0 pt-5 pb-4 overflow-y-auto bg-white">
				<!-- Logo -->
				<div class="flex-shrink-0 flex items-center px-4">
					<div class="flex items-center">
						<div class="h-8 w-8 gradient-primary rounded-lg flex items-center justify-center">
							<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
							</svg>
						</div>
						<div class="ml-3">
							<h1 class="text-lg font-bold text-neutral-900">Broker Pro</h1>
						</div>
					</div>
				</div>

				<!-- Navigation -->
				<nav class="mt-8 px-2 space-y-1">
					{#each navigation as item}
						<button
							on:click={() => handleNavigation(item.href)}
							class="group w-full flex items-center px-2 py-2 text-base font-medium rounded-lg transition-colors duration-200 {item.current 
								? 'nav-link-active' 
								: 'nav-link-inactive'}"
						>
							<svg 
								class="mr-4 h-6 w-6 flex-shrink-0 {item.current 
									? 'text-primary-600' 
									: 'text-neutral-400 group-hover:text-neutral-600'}" 
								fill="none" 
								viewBox="0 0 24 24" 
								stroke="currentColor"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
							</svg>
							<span class="flex-1">{item.name}</span>
							{#if item.badge}
								<span class="badge badge-primary ml-3">
									{item.badge}
								</span>
							{/if}
						</button>
					{/each}
				</nav>
			</div>

			<!-- Mobile User Profile Section -->
			<div class="flex-shrink-0 flex border-t border-neutral-200 p-4 bg-white">
				<div class="flex items-center w-full">
					<div class="flex-shrink-0">
						{#if user.avatar}
							<img class="h-10 w-10 rounded-full object-cover" src={user.avatar} alt="{user.firstName} {user.lastName}" />
						{:else}
							<div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
								<span class="text-primary-600 font-medium text-sm">
									{user.firstName.charAt(0)}{user.lastName.charAt(0)}
								</span>
							</div>
						{/if}
					</div>
					<div class="ml-3 flex-1">
						<p class="text-sm font-medium text-neutral-900">
							{user.firstName} {user.lastName}
						</p>
						<p class="text-xs text-neutral-500 capitalize">
							{user.role}
						</p>
					</div>
					<div class="flex-shrink-0">
						<button
							on:click={handleLogout}
							class="p-1 rounded-md text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
							title="Sign out"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div> 