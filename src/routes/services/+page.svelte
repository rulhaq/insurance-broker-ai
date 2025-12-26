<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';

	// Navigation items
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
			goto('/customer/register');
		}
	}

	function handleLogin() {
		goto('/auth/login');
	}

	let mobileMenuOpen = false;

	const services = [
		{
			title: 'Personal Insurance',
			description: 'Comprehensive protection for individuals and families with personalized coverage solutions',
			features: ['Auto Insurance', 'Homeowners Insurance', 'Life Insurance', 'Health Insurance'],
			icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z',
			image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
			color: 'from-blue-500 to-blue-600',
			stats: '10,000+ Families Protected'
		},
		{
			title: 'Commercial Insurance',
			description: 'Tailored business protection solutions to safeguard your company assets and operations',
			features: ['General Liability', 'Professional Liability', 'Workers Compensation', 'Commercial Property'],
			icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
			image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
			color: 'from-green-500 to-green-600',
			stats: '2,500+ Businesses Covered'
		},
		{
			title: 'Risk Management',
			description: 'AI-powered risk assessment and comprehensive mitigation strategies for proactive protection',
			features: ['Risk Analysis', 'Loss Prevention', 'Safety Consulting', 'Claims Management'],
			icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
			image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
			color: 'from-purple-500 to-purple-600',
			stats: '95% Risk Reduction Rate'
		},
		{
			title: 'Claims Support',
			description: '24/7 dedicated claims assistance with expert adjusters and streamlined digital processing',
			features: ['24/7 Claims Hotline', 'Fast Claim Processing', 'Expert Adjusters', 'Digital Claims Filing'],
			icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
			image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
			color: 'from-orange-500 to-orange-600',
			stats: '< 48 Hour Processing'
		}
	];
</script>

<svelte:head>
	<title>Insurance Services - X Insurance Brokers</title>
	<meta name="description" content="Explore our comprehensive insurance services including personal, commercial, and specialized coverage options." />
</svelte:head>

<!-- Navigation Header -->
<nav class="bg-white shadow-soft sticky top-0 z-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center py-4">
			<!-- Logo -->
			<div class="flex items-center">
				<a href="/" class="flex items-center">
					<div class="h-10 w-10 gradient-primary rounded-lg flex items-center justify-center">
						<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
					</div>
					<div class="ml-3">
						<h1 class="text-xl font-bold text-neutral-900">X Insurance Brokers</h1>
					</div>
				</a>
			</div>

			<!-- Desktop Navigation -->
			<div class="hidden md:flex items-center space-x-8">
				{#each navigation as item}
					<a 
						href={item.href}
						class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
						class:text-primary-600={item.href === '/services'}
					>
						{item.name}
					</a>
				{/each}
			</div>

			<!-- Desktop Auth Buttons -->
			<div class="hidden md:flex items-center space-x-4">
				{#if $currentUser}
					<a
						href={$currentUser.role === 'customer' ? '/customer/dashboard' : '/dashboard'}
						class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
					>
						{$currentUser.role === 'customer' ? 'My Account' : 'Broker Portal'}
					</a>
				{:else}
					<a
						href="/customer/login"
						class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
					>
						Customer Login
					</a>
					<button
						on:click={handleLogin}
						class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
					>
						Broker Login
					</button>
					<button
						on:click={handleGetStarted}
						class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
					>
						Get Started
					</button>
				{/if}
			</div>

			<!-- Mobile menu button -->
			<div class="md:hidden">
				<button
					on:click={() => mobileMenuOpen = !mobileMenuOpen}
					class="text-neutral-500 hover:text-neutral-700 focus:outline-none focus:text-neutral-700"
				>
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

		<!-- Mobile menu -->
		{#if mobileMenuOpen}
			<div class="md:hidden border-t border-neutral-200 py-4">
				<div class="space-y-2">
					{#each navigation as item}
						<a
							href={item.href}
							class="block px-3 py-2 text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors"
							class:text-primary-600={item.href === '/services'}
							on:click={() => mobileMenuOpen = false}
						>
							{item.name}
						</a>
					{/each}
					<div class="pt-4 border-t border-neutral-200 space-y-2">
						{#if $currentUser}
							<a
								href={$currentUser.role === 'customer' ? '/customer/dashboard' : '/dashboard'}
								class="block px-3 py-2 text-base font-medium bg-primary-600 text-white rounded-md"
								on:click={() => mobileMenuOpen = false}
							>
								{$currentUser.role === 'customer' ? 'My Account' : 'Dashboard'}
							</a>
						{:else}
							<a
								href="/customer/login"
								class="block px-3 py-2 text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors"
								on:click={() => mobileMenuOpen = false}
							>
								Customer Login
							</a>
							<button
								on:click={() => { handleLogin(); mobileMenuOpen = false; }}
								class="block w-full text-left px-3 py-2 text-base font-medium text-neutral-700"
							>
								Broker Login
							</button>
							<button
								on:click={() => { handleGetStarted(); mobileMenuOpen = false; }}
								class="block w-full text-left px-3 py-2 text-base font-medium bg-primary-600 text-white rounded-md"
							>
								Get Started
							</button>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</nav>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
	<div class="container-page py-16">
		<div class="text-center">
			<h1 class="text-4xl lg:text-6xl font-bold mb-6">
				Insurance <span class="text-success-400">Services</span>
			</h1>
			<p class="text-xl lg:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
				Comprehensive insurance solutions powered by AI technology and backed by expert guidance for complete peace of mind.
			</p>
		</div>
	</div>
</section>

<!-- Services Grid -->
<section class="py-16 bg-white">
	<div class="container-page">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			{#each services as service}
				<div class="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-neutral-100 hover:-translate-y-1">
					<!-- Image Header -->
					<div class="relative h-64 overflow-hidden">
						<img 
							src={service.image} 
							alt={service.title}
							class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
						/>
						<div class="absolute inset-0 bg-gradient-to-t {service.color} opacity-80"></div>
						<div class="absolute top-6 left-6">
							<div class="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
								<svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={service.icon} />
								</svg>
							</div>
						</div>
						<div class="absolute bottom-6 left-6 right-6">
							<h3 class="text-2xl font-bold text-white mb-2">{service.title}</h3>
							<p class="text-white/90 text-sm font-medium">{service.stats}</p>
						</div>
					</div>
					
					<!-- Content -->
					<div class="p-8">
						<p class="text-neutral-600 mb-6 text-lg leading-relaxed">{service.description}</p>
						
						<div class="space-y-3 mb-8">
							{#each service.features as feature}
								<div class="flex items-center text-neutral-700">
									<div class="h-5 w-5 rounded-full bg-gradient-to-r {service.color} flex items-center justify-center mr-3 flex-shrink-0">
										<svg class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
										</svg>
									</div>
									<span class="font-medium">{feature}</span>
								</div>
							{/each}
						</div>

						<div class="flex gap-3">
							<button
								on:click={() => goto('/contact')}
								class="flex-1 bg-gradient-to-r {service.color} text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform group-hover:scale-105"
							>
								Get Quote
							</button>
							<button
								on:click={() => goto('/contact')}
								class="px-6 py-3 border-2 border-neutral-200 text-neutral-700 rounded-lg font-semibold hover:border-neutral-300 transition-colors"
							>
								Learn More
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Call to Action -->
<section class="bg-neutral-900 py-16">
	<div class="container-page text-center">
		<h2 class="text-3xl font-bold text-white mb-4">
			Ready to Protect What Matters Most?
		</h2>
		<p class="text-xl text-neutral-300 mb-8">
			Get personalized insurance quotes and expert guidance from X Insurance Brokers today.
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<button
				on:click={handleGetStarted}
				class="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
			>
				Get Free Quote
			</button>
			<a
				href="/contact"
				class="border-2 border-white text-white hover:bg-white hover:text-neutral-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors text-center"
			>
				Contact Expert
			</a>
		</div>
	</div>
</section> 