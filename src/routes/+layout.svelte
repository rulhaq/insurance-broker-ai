<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authService, currentUser, authLoading, authError } from '$lib/services/auth';
	import { validateFirebaseConfig } from '$lib/config/firebase';
	import { initializeCurrency } from '$lib/services/currency';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';
	import ErrorBoundary from '$components/ui/ErrorBoundary.svelte';
	import Toast from '$components/ui/Toast.svelte';
	import AIChat from '$components/ai/AIChat.svelte';


	// Check Firebase configuration on app start
	let configValid = false;
	let configError = '';
	
	// AI Chat state for public pages
	let aiChatOpen = false;

	onMount(() => {
		configValid = validateFirebaseConfig();
		if (!configValid) {
			configError = 'Firebase configuration is missing or incomplete. Please check your environment variables.';
		}
		
		// Initialize global currency settings
		initializeCurrency();
	});

	// Handle AI chat for public pages
	function handleAIToggle() {
		aiChatOpen = !aiChatOpen;
	}

	function handleAIClose() {
		aiChatOpen = false;
	}

	// Handle authentication routing
	$: if (!$authLoading && configValid) {
		const isAuthPage = ['/auth/login', '/auth/signup', '/auth/reset-password', '/auth/test'].includes($page.url.pathname);
		const isCustomerAuthPage = ['/customer/login', '/customer/register', '/customer/reset-password'].includes($page.url.pathname);
		const isPublicPage = ['/', '/about', '/contact', '/services', '/privacy', '/terms', '/apply', '/features', '/pricing', '/integrations', '/security', '/help'].includes($page.url.pathname);
		const isCustomerPage = $page.url.pathname.startsWith('/customer/');
		const isProtectedPage = $page.url.pathname.startsWith('/dashboard') || 
							   $page.url.pathname.startsWith('/admin') || 
							   $page.url.pathname.startsWith('/clients') || 
							   $page.url.pathname.startsWith('/policies') || 
							   $page.url.pathname.startsWith('/quotes') || 
							   $page.url.pathname.startsWith('/reports') || 
							   $page.url.pathname.startsWith('/settings') || 
							   $page.url.pathname.startsWith('/tasks') || 
							   $page.url.pathname.startsWith('/documents') || 
							   $page.url.pathname.startsWith('/support') || 
							   $page.url.pathname.startsWith('/profile') || 
							   $page.url.pathname.startsWith('/status');
		
		console.log('Auth routing check:', { 
			user: !!$currentUser, 
			loading: $authLoading, 
			pathname: $page.url.pathname,
			isAuthPage,
			isCustomerAuthPage,
			isPublicPage,
			isCustomerPage,
			isProtectedPage
		});
		
		// Only redirect to login if user is not authenticated AND trying to access protected pages
		if (!$currentUser && isProtectedPage && !isAuthPage && !isCustomerAuthPage) {
			console.log('Redirecting to login - user not authenticated accessing protected page');
			goto('/auth/login');
		} else if ($currentUser && (isAuthPage && $page.url.pathname !== '/auth/test')) {
			console.log('Redirecting to dashboard - user authenticated on auth page');
			if ($currentUser.role === 'customer') {
				goto('/customer/dashboard');
			} else {
				goto('/dashboard');
			}
		} else if ($currentUser && isCustomerAuthPage) {
			console.log('Redirecting customer to dashboard - already authenticated');
			goto('/customer/dashboard');
		}
	}

	// Global error handler
	function handleGlobalError(event: ErrorEvent) {
		console.error('Global error:', event.error);
		// Log to error tracking service
	}

	// Handle unhandled promise rejections
	function handleUnhandledRejection(event: PromiseRejectionEvent) {
		console.error('Unhandled promise rejection:', event.reason);
		// Log to error tracking service
	}

	onMount(() => {
		window.addEventListener('error', handleGlobalError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		return () => {
			window.removeEventListener('error', handleGlobalError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	});
</script>

<svelte:head>
	<title>Insurance Broker Pro - AI-Enabled Platform</title>
</svelte:head>

<ErrorBoundary>
	{#if !configValid}
		<div class="min-h-screen bg-red-50 flex items-center justify-center p-4">
			<div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
				<div class="flex items-center space-x-3 mb-4">
					<div class="flex-shrink-0">
						<svg class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
					</div>
					<h1 class="text-lg font-semibold text-gray-900">Configuration Error</h1>
				</div>
				<p class="text-gray-600 mb-4">{configError}</p>
				<p class="text-sm text-gray-500">
					Please check your Firebase configuration and environment variables. 
					See the <code class="bg-gray-100 px-1 rounded">env.example</code> file for required variables.
				</p>
			</div>
		</div>
	{:else if $authLoading}
		<div class="min-h-screen bg-neutral-50 flex items-center justify-center">
			<LoadingSpinner size="lg" />
		</div>
	{:else}
		<main class="min-h-screen bg-neutral-50">
			<slot />
		</main>
		
		<!-- Global Toast Container -->
		<div id="toast-container" class="fixed bottom-4 right-4 z-50 space-y-2">
			<!-- Toasts will be dynamically inserted here -->
		</div>
		
		<!-- Global Error Display -->
		{#if $authError}
			<Toast 
				type="error" 
				message={$authError} 
				duration={5000}
				onClose={() => authError.set(null)}
			/>
		{/if}
	{/if}
</ErrorBoundary>

<!-- AI Chat Assistant for Public Pages -->
<AIChat isOpen={aiChatOpen} on:close={handleAIClose} />

<!-- AI Chat Assistant for Public Pages -->
<AIChat isOpen={aiChatOpen} on:close={handleAIClose} />

<style>
	/* Global animations */
	:global(.page-transition) {
		animation: fadeIn 0.3s ease-out;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>

<!-- AI Chat Assistant for Public Pages -->
<AIChat isOpen={aiChatOpen} on:close={handleAIClose} /> 