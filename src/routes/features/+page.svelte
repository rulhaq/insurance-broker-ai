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

	const features = [
		{
			title: 'AI-Powered Risk Assessment',
			description: 'Machine learning algorithms analyze thousands of data points for 99.2% accurate risk scoring and premium recommendations.',
			icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
			benefits: ['Real-time risk analysis', 'Predictive modeling', 'Continuous learning', '99.2% accuracy rate']
		},
		{
			title: 'Smart Quote Comparison',
			description: 'Compare quotes from 50+ carriers in under 3 seconds with intelligent gap analysis and coverage recommendations.',
			icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
			benefits: ['50+ carrier networks', '< 3 second comparisons', 'Gap analysis', 'AI recommendations']
		},
		{
			title: 'Document Intelligence',
			description: 'OCR-powered document processing with automated extraction, categorization, and fraud detection capabilities.',
			icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
			benefits: ['OCR technology', 'Auto-categorization', 'Fraud detection', 'Multi-language support']
		},
		{
			title: '360° Client Management',
			description: 'Complete CRM with client profiles, communication history, risk predictions, and behavioral analytics.',
			icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
			benefits: ['Complete client profiles', 'Interaction tracking', 'AI insights', 'Relationship scoring']
		},
		{
			title: 'Policy Lifecycle Management',
			description: 'End-to-end policy management from creation to renewal with automated workflows and notifications.',
			icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
			benefits: ['Automated renewals', 'Status tracking', 'Document storage', 'Compliance monitoring']
		},
		{
			title: 'Claims Processing',
			description: 'Streamlined claims filing, investigation, approval workflow with AI-powered fraud detection.',
			icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
			benefits: ['Digital filing', 'Status tracking', 'Fraud detection', 'Automated routing']
		},
		{
			title: 'Workflow Automation',
			description: 'Automate routine tasks, prioritize by revenue impact, and streamline communications with 80% time savings.',
			icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
			benefits: ['Task automation', 'Smart prioritization', 'Auto-follow-ups', '80% time savings']
		},
		{
			title: 'Business Intelligence',
			description: 'Real-time analytics, revenue tracking, performance metrics, and custom reporting dashboards.',
			icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
			benefits: ['Real-time dashboards', 'Revenue tracking', 'Custom reports', 'Predictive analytics']
		},
		{
			title: 'Task Management',
			description: 'Automated task creation, assignment, deadline tracking, and performance analytics for your team.',
			icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
			benefits: ['Auto-assignment', 'Deadline tracking', 'Team collaboration', 'Performance metrics']
		}
	];
</script>

<svelte:head>
	<title>Features - Insurance Broker Pro</title>
	<meta name="description" content="Discover all the powerful features of Insurance Broker Pro - AI-powered risk assessment, quote comparison, client management, and more." />
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
				<a href="/features" class="text-primary-600 px-3 py-2 rounded-md text-sm font-medium">Features</a>
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
					<a href="/features" class="block px-3 py-2 text-primary-600 font-medium">Features</a>
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
			Powerful Features for Modern Insurance Brokers
		</h1>
		<p class="text-xl text-neutral-600 max-w-3xl mx-auto">
			Everything you need to manage your insurance business efficiently with AI-powered automation
		</p>
	</div>
</section>

<!-- Features Grid -->
<section class="py-16 bg-white">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			{#each features as feature}
				<div class="bg-white rounded-xl p-6 shadow-lg border border-neutral-100 hover:shadow-xl transition-shadow">
					<div class="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mb-4">
						<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={feature.icon} />
						</svg>
					</div>
					<h3 class="text-xl font-bold mb-2">{feature.title}</h3>
					<p class="text-neutral-600 mb-4">{feature.description}</p>
					<ul class="space-y-2">
						{#each feature.benefits as benefit}
							<li class="flex items-center text-sm text-neutral-600">
								<svg class="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
								{benefit}
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="py-16 bg-gradient-to-br from-primary-600 to-primary-700">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<h2 class="text-3xl font-bold text-white mb-4">Ready to Experience These Features?</h2>
		<p class="text-xl text-primary-100 mb-8">Start your free trial today</p>
		<button on:click={handleGetStarted} class="bg-white text-primary-600 hover:bg-neutral-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
			Get Started Free
		</button>
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

