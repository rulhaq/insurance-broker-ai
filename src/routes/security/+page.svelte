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

	const securityFeatures = [
		{
			title: 'End-to-End Encryption',
			description: 'All data is encrypted in transit and at rest using industry-standard AES-256 encryption.',
			icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
		},
		{
			title: 'Firebase Security',
			description: 'Built on Google Firebase infrastructure with enterprise-grade security and compliance.',
			icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
		},
		{
			title: 'Role-Based Access Control',
			description: 'Granular permissions and access control based on user roles and responsibilities.',
			icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
		},
		{
			title: 'GDPR Compliance',
			description: 'Full compliance with GDPR and other data protection regulations worldwide.',
			icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
		},
		{
			title: 'Regular Security Audits',
			description: 'Continuous security monitoring and regular third-party security audits.',
			icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
		},
		{
			title: '99.9% Uptime SLA',
			description: 'Enterprise-grade infrastructure with guaranteed uptime and disaster recovery.',
			icon: 'M13 10V3L4 14h7v7l9-11h-7z'
		}
	];
</script>

<svelte:head>
	<title>Security - Insurance Broker Pro</title>
	<meta name="description" content="Learn about Insurance Broker Pro security features - encryption, compliance, and data protection." />
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
			Enterprise-Grade Security
		</h1>
		<p class="text-xl text-neutral-600 max-w-3xl mx-auto">
			Your data is protected with industry-leading security measures and compliance standards
		</p>
	</div>
</section>

<!-- Security Features -->
<section class="py-16 bg-white">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			{#each securityFeatures as feature}
				<div class="bg-white rounded-xl p-6 shadow-lg border border-neutral-100">
					<div class="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mb-4">
						<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={feature.icon} />
						</svg>
					</div>
					<h3 class="text-xl font-bold mb-2">{feature.title}</h3>
					<p class="text-neutral-600">{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Compliance Section -->
<section class="py-16 bg-neutral-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<h2 class="text-3xl font-bold text-center mb-12">Compliance & Certifications</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-8">
			<div class="text-center">
				<div class="text-4xl mb-2">🔒</div>
				<h3 class="font-semibold">GDPR</h3>
				<p class="text-sm text-neutral-600">Compliant</p>
			</div>
			<div class="text-center">
				<div class="text-4xl mb-2">🛡️</div>
				<h3 class="font-semibold">SOC 2</h3>
				<p class="text-sm text-neutral-600">Certified</p>
			</div>
			<div class="text-center">
				<div class="text-4xl mb-2">✅</div>
				<h3 class="font-semibold">ISO 27001</h3>
				<p class="text-sm text-neutral-600">Certified</p>
			</div>
			<div class="text-center">
				<div class="text-4xl mb-2">💳</div>
				<h3 class="font-semibold">PCI DSS</h3>
				<p class="text-sm text-neutral-600">Compliant</p>
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

