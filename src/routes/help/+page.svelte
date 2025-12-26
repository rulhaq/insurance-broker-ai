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
	let searchQuery = '';
	let selectedCategory = 'all';

	const categories = [
		{ id: 'all', name: 'All Topics' },
		{ id: 'getting-started', name: 'Getting Started' },
		{ id: 'broker', name: 'Broker Portal' },
		{ id: 'customer', name: 'Customer Portal' },
		{ id: 'billing', name: 'Billing & Payments' },
		{ id: 'technical', name: 'Technical Support' }
	];

	const articles = [
		{
			id: 1,
			category: 'getting-started',
			title: 'How to Create Your First Account',
			content: 'Learn how to sign up and create your Insurance Broker Pro account in minutes.',
			icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
		},
		{
			id: 2,
			category: 'broker',
			title: 'Managing Clients and Quotes',
			content: 'Complete guide to adding clients, creating quotes, and managing your insurance business.',
			icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
		},
		{
			id: 3,
			category: 'customer',
			title: 'Applying for Insurance Coverage',
			content: 'Step-by-step instructions for customers to apply for auto, home, life, and other insurance types.',
			icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
		},
		{
			id: 4,
			category: 'broker',
			title: 'AI Risk Assessment Guide',
			content: 'Understanding how AI-powered risk assessment works and how to use it effectively.',
			icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
		},
		{
			id: 5,
			category: 'billing',
			title: 'Payment Methods and Billing',
			content: 'Learn about accepted payment methods, billing cycles, and payment processing.',
			icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
		},
		{
			id: 6,
			category: 'technical',
			title: 'Troubleshooting Common Issues',
			content: 'Solutions to common technical problems and how to get support.',
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
		}
	];

	$: filteredArticles = articles.filter(article => {
		const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
		const matchesSearch = searchQuery === '' || 
			article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			article.content.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesCategory && matchesSearch;
	});
</script>

<svelte:head>
	<title>Help Center - Insurance Broker Pro</title>
	<meta name="description" content="Get help with Insurance Broker Pro. Find answers to common questions and learn how to use our platform." />
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
	</div>
</nav>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-primary-50 to-success-50 py-16">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-8">
			<h1 class="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
				How Can We Help?
			</h1>
			<p class="text-xl text-neutral-600 mb-8">
				Find answers to common questions and learn how to use Insurance Broker Pro
			</p>
			
			<!-- Search Bar -->
			<div class="max-w-2xl mx-auto">
				<div class="relative">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search for help articles..."
						class="w-full px-4 py-4 pl-12 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					/>
					<svg class="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Categories -->
<section class="py-8 bg-white border-b border-neutral-200">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex flex-wrap gap-4 justify-center">
			{#each categories as category}
				<button
					on:click={() => selectedCategory = category.id}
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {selectedCategory === category.id ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}"
				>
					{category.name}
				</button>
			{/each}
		</div>
	</div>
</section>

<!-- Articles -->
<section class="py-16 bg-white">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		{#if filteredArticles.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each filteredArticles as article}
					<div class="bg-white rounded-xl p-6 shadow-lg border border-neutral-100 hover:shadow-xl transition-shadow cursor-pointer">
						<div class="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mb-4">
							<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={article.icon} />
							</svg>
						</div>
						<h3 class="text-xl font-bold mb-2">{article.title}</h3>
						<p class="text-neutral-600">{article.content}</p>
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-center py-12">
				<p class="text-neutral-600 text-lg">No articles found. Try a different search or category.</p>
			</div>
		{/if}
	</div>
</section>

<!-- Contact Support -->
<section class="py-16 bg-neutral-50">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<h2 class="text-3xl font-bold mb-4">Still Need Help?</h2>
		<p class="text-xl text-neutral-600 mb-8">
			Our support team is here to help you 24/7
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<a href="/contact" class="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
				Contact Support
			</a>
			<a href="mailto:support@Scalovate.com" class="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
				Email Us
			</a>
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

