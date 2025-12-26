<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';

	const navigation = [
		{ name: 'Home', href: '/' },
		{ name: 'Services', href: '/services' },
		{ name: 'About', href: '/about' },
		{ name: 'Contact', href: '/contact' }
	];

	function handleGetStarted() {
		if ($currentUser) {
			if ($currentUser.role === 'customer') {
				goto('/customer/dashboard');
			} else {
				goto('/dashboard');
			}
		} else {
			goto('/auth/signup');
		}
	}

	let mobileMenuOpen = false;

	const integrations = [
		{
			category: 'Insurance Carriers',
			items: [
				{ name: 'State Farm', icon: '🏢' },
				{ name: 'GEICO', icon: '🚗' },
				{ name: 'Progressive', icon: '📊' },
				{ name: 'Allstate', icon: '🛡️' },
				{ name: 'USAA', icon: '⭐' },
				{ name: 'Liberty Mutual', icon: '🔒' }
			]
		},
		{
			category: 'Payment Processing',
			items: [
				{ name: 'Stripe', icon: '💳' },
				{ name: 'PayPal', icon: '💰' },
				{ name: 'Square', icon: '📱' }
			]
		},
		{
			category: 'Communication',
			items: [
				{ name: 'Twilio', icon: '📞' },
				{ name: 'SendGrid', icon: '📧' },
				{ name: 'Slack', icon: '💬' }
			]
		},
		{
			category: 'CRM & Tools',
			items: [
				{ name: 'Salesforce', icon: '☁️' },
				{ name: 'HubSpot', icon: '🎯' },
				{ name: 'Zapier', icon: '⚡' }
			]
		}
	];
</script>

<svelte:head>
	<title>Integrations - Insurance Broker Pro</title>
	<meta name="description" content="Connect Insurance Broker Pro with your favorite tools and services. Integrations with carriers, payment processors, and more." />
</svelte:head>

<!-- Navigation Header -->
<nav class="bg-white shadow-soft sticky top-0 z-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center py-4">
			<div class="flex items-center">
				<a href="/" class="flex items-center">
					<div class="h-10 w-10 gradient-primary rounded-lg flex items-center justify-center">
						<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
					</div>
					<div class="ml-3">
						<h1 class="text-xl font-bold text-neutral-900">Insurance Broker Pro</h1>
					</div>
				</a>
			</div>

			<div class="hidden md:flex items-center space-x-8">
				{#each navigation as item}
					<a href={item.href} class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
						{item.name}
					</a>
				{/each}
				<a href="/features" class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</a>
				<a href="/pricing" class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Pricing</a>
			</div>

			<div class="hidden md:flex items-center space-x-4">
				{#if $currentUser}
					<a href={$currentUser.role === 'customer' ? '/customer/dashboard' : '/dashboard'} class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
						Dashboard
					</a>
				{:else}
					<a href="/auth/login" class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Login</a>
					<button on:click={handleGetStarted} class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Get Started</button>
				{/if}
			</div>

			<button class="md:hidden" on:click={() => mobileMenuOpen = !mobileMenuOpen}>
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					{#if mobileMenuOpen}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					{/if}
				</svg>
			</button>
		</div>

		{#if mobileMenuOpen}
			<div class="md:hidden py-4 border-t border-neutral-200">
				<div class="space-y-2">
					{#each navigation as item}
						<a href={item.href} class="block px-3 py-2 text-neutral-700 hover:text-primary-600 font-medium">{item.name}</a>
					{/each}
					<a href="/features" class="block px-3 py-2 text-neutral-700 hover:text-primary-600 font-medium">Features</a>
					<a href="/pricing" class="block px-3 py-2 text-neutral-700 hover:text-primary-600 font-medium">Pricing</a>
				</div>
			</div>
		{/if}
	</div>
</nav>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-primary-50 to-success-50 py-16">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<h1 class="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
			Powerful Integrations
		</h1>
		<p class="text-xl text-neutral-600 max-w-3xl mx-auto">
			Connect Insurance Broker Pro with your favorite tools and services
		</p>
	</div>
</section>

<!-- Integrations Grid -->
<section class="py-16 bg-white">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		{#each integrations as category}
			<div class="mb-12">
				<h2 class="text-2xl font-bold mb-6">{category.category}</h2>
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
					{#each category.items as item}
						<div class="bg-white rounded-lg p-6 border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all text-center">
							<div class="text-4xl mb-2">{item.icon}</div>
							<h3 class="font-semibold text-sm">{item.name}</h3>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- API Section -->
<section class="py-16 bg-neutral-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="bg-white rounded-2xl p-8 shadow-lg">
			<h2 class="text-3xl font-bold mb-4">API Access</h2>
			<p class="text-neutral-600 mb-6">
				Build custom integrations with our RESTful API. Full documentation available for developers.
			</p>
			<button class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold">
				View API Documentation
			</button>
		</div>
	</div>
</section>

<!-- Footer -->
<footer class="bg-neutral-900 text-white">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<div class="border-t border-neutral-800 pt-8 text-center">
			<p class="text-neutral-400 text-sm mb-2">
				Insurance Broker Pro by © 2026 <a href="https://www.scalovate.com/products" target="_blank" rel="noopener noreferrer" class="text-white hover:text-primary-400 transition-colors font-semibold">Scalovate Systems Solutions</a>, . All rights reserved.
			</p>
			<p class="text-neutral-400 text-sm">
				contact: <a href="mailto:support@Scalovate.com" class="text-white hover:text-primary-400 transition-colors">support@Scalovate.com</a>
			</p>
		</div>
	</div>
</footer>

