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

	const plans = [
		{
			name: 'Starter',
			price: '$99',
			period: '/month',
			description: 'Perfect for small agencies',
			features: [
				'Up to 5 users',
				'100 clients',
				'500 quotes/month',
				'Basic AI features',
				'Email support',
				'Standard integrations'
			],
			popular: false
		},
		{
			name: 'Professional',
			price: '$299',
			period: '/month',
			description: 'For growing brokerages',
			features: [
				'Up to 25 users',
				'Unlimited clients',
				'Unlimited quotes',
				'Advanced AI features',
				'Priority support',
				'All integrations',
				'Custom reporting',
				'API access'
			],
			popular: true
		},
		{
			name: 'Enterprise',
			price: 'Custom',
			period: '',
			description: 'For large organizations',
			features: [
				'Unlimited users',
				'Unlimited everything',
				'Premium AI features',
				'Dedicated support',
				'Custom integrations',
				'White-label options',
				'Advanced security',
				'Custom training'
			],
			popular: false
		}
	];
</script>

<svelte:head>
	<title>Pricing - Insurance Broker Pro</title>
	<meta name="description" content="Flexible pricing plans for Insurance Broker Pro. Choose the plan that fits your brokerage needs." />
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
				<a href="/pricing" class="text-primary-600 px-3 py-2 rounded-md text-sm font-medium">Pricing</a>
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
					<a href="/pricing" class="block px-3 py-2 text-primary-600 font-medium">Pricing</a>
				</div>
			</div>
		{/if}
	</div>
</nav>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-primary-50 to-success-50 py-16">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<h1 class="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
			Simple, Transparent Pricing
		</h1>
		<p class="text-xl text-neutral-600 max-w-3xl mx-auto">
			Choose the plan that fits your brokerage. All plans include a 14-day free trial.
		</p>
	</div>
</section>

<!-- Pricing Plans -->
<section class="py-16 bg-white">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			{#each plans as plan}
				<div class="bg-white rounded-2xl p-8 shadow-lg border-2 {plan.popular ? 'border-primary-500' : 'border-neutral-200'} relative">
					{#if plan.popular}
						<div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
							<span class="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
						</div>
					{/if}
					<div class="text-center mb-6">
						<h3 class="text-2xl font-bold mb-2">{plan.name}</h3>
						<p class="text-neutral-600 mb-4">{plan.description}</p>
						<div class="flex items-baseline justify-center">
							<span class="text-4xl font-bold">{plan.price}</span>
							<span class="text-neutral-600 ml-2">{plan.period}</span>
						</div>
					</div>
					<ul class="space-y-4 mb-8">
						{#each plan.features as feature}
							<li class="flex items-start">
								<svg class="h-5 w-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
								<span class="text-neutral-700">{feature}</span>
							</li>
						{/each}
					</ul>
					<button 
						on:click={handleGetStarted}
						class="w-full {plan.popular ? 'bg-primary-600 hover:bg-primary-700' : 'bg-neutral-100 hover:bg-neutral-200'} text-white px-6 py-3 rounded-lg font-semibold transition-colors"
					>
						Start Free Trial
					</button>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- FAQ Section -->
<section class="py-16 bg-neutral-50">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<h2 class="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
		<div class="space-y-6">
			<div class="bg-white rounded-lg p-6 shadow-sm">
				<h3 class="font-semibold text-lg mb-2">Can I change plans later?</h3>
				<p class="text-neutral-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
			</div>
			<div class="bg-white rounded-lg p-6 shadow-sm">
				<h3 class="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
				<p class="text-neutral-600">We accept all major credit cards, bank transfers, and ACH payments.</p>
			</div>
			<div class="bg-white rounded-lg p-6 shadow-sm">
				<h3 class="font-semibold text-lg mb-2">Is there a setup fee?</h3>
				<p class="text-neutral-600">No setup fees for any plan. You only pay the monthly subscription.</p>
			</div>
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

