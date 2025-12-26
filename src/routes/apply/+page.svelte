<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';

	const insuranceTypes = [
		{
			id: 'auto',
			title: 'Auto Insurance',
			description: 'Comprehensive coverage for your vehicle',
			icon: '🚗',
			features: ['Collision Coverage', 'Comprehensive Coverage', 'Liability Protection', '24/7 Roadside Assistance'],
			startingPrice: 89,
			href: '/customer/apply/auto'
		},
		{
			id: 'home',
			title: 'Home Insurance',
			description: 'Protect your home and belongings',
			icon: '🏠',
			features: ['Dwelling Coverage', 'Personal Property', 'Liability Protection', 'Additional Living Expenses'],
			startingPrice: 125,
			href: '/customer/apply/home'
		},
		{
			id: 'life',
			title: 'Life Insurance',
			description: 'Financial security for your loved ones',
			icon: '❤️',
			features: ['Term Life Options', 'Whole Life Coverage', 'Beneficiary Protection', 'Cash Value Building'],
			startingPrice: 45,
			href: '/customer/apply/life'
		},
		{
			id: 'health',
			title: 'Health Insurance',
			description: 'Comprehensive health coverage',
			icon: '🏥',
			features: ['Medical Coverage', 'Prescription Drugs', 'Preventive Care', 'Specialist Visits'],
			startingPrice: 285,
			href: '/customer/apply/health'
		},
		{
			id: 'business',
			title: 'Business Insurance',
			description: 'Protect your business operations',
			icon: '🏢',
			features: ['General Liability', 'Property Coverage', 'Workers Compensation', 'Business Interruption'],
			startingPrice: 200,
			href: '/customer/apply/business'
		},
		{
			id: 'renters',
			title: 'Renters Insurance',
			description: 'Coverage for renters and tenants',
			icon: '🔑',
			features: ['Personal Property', 'Liability Coverage', 'Additional Living Expenses', 'Guest Medical'],
			startingPrice: 25,
			href: '/customer/apply/renters'
		}
	];

	function handleApply(insuranceType) {
		if (!$currentUser) {
			// Store the intended destination and redirect to login
			localStorage.setItem('redirect_after_login', insuranceType.href);
			goto('/customer/login');
		} else {
			goto(insuranceType.href);
		}
	}

	function handleGetStarted() {
		if (!$currentUser) {
			goto('/customer/register');
		} else {
			goto('/customer/dashboard');
		}
	}
</script>

<svelte:head>
	<title>Apply for Insurance - X Insurance Brokers</title>
	<meta name="description" content="Choose from our comprehensive insurance options and apply online in minutes." />
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

			<!-- Navigation Links -->
			<div class="hidden md:flex items-center space-x-8">
				<a href="/" class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
					Home
				</a>
				<a href="/services" class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
					Services
				</a>
				<a href="/about" class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
					About
				</a>
				<a href="/contact" class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
					Contact
				</a>
			</div>

			<!-- Auth Buttons -->
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
					<a
						href="/auth/login"
						class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
					>
						Broker Login
					</a>
					<button
						on:click={handleGetStarted}
						class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
					>
						Get Started
					</button>
				{/if}
			</div>
		</div>
	</div>
</nav>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
		<div class="text-center">
			<h1 class="text-4xl lg:text-6xl font-bold mb-6">
				Choose Your <span class="text-success-400">Insurance</span>
			</h1>
			<p class="text-xl lg:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
				Get instant quotes and apply for comprehensive insurance coverage in just minutes. Our AI-powered platform makes protection simple.
			</p>
		</div>
	</div>
</section>

<!-- Insurance Types Grid -->
<section class="py-16 bg-white">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-12">
			<h2 class="text-3xl font-bold text-neutral-900 mb-4">Insurance Coverage Options</h2>
			<p class="text-lg text-neutral-600 max-w-2xl mx-auto">
				Explore our comprehensive insurance products designed to protect what matters most to you.
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			{#each insuranceTypes as insurance}
				<div class="bg-white border border-neutral-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
					<div class="text-center mb-6">
						<div class="text-5xl mb-4">{insurance.icon}</div>
						<h3 class="text-2xl font-bold text-neutral-900 mb-2">{insurance.title}</h3>
						<p class="text-neutral-600">{insurance.description}</p>
					</div>

					<div class="mb-6">
						<div class="text-center mb-4">
							<span class="text-3xl font-bold text-primary-600">${insurance.startingPrice}</span>
							<span class="text-neutral-500">/month starting</span>
						</div>
					</div>

					<ul class="space-y-3 mb-8">
						{#each insurance.features as feature}
							<li class="flex items-center text-neutral-700">
								<svg class="w-5 h-5 text-success-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
								{feature}
							</li>
						{/each}
					</ul>

					<button
						on:click={() => handleApply(insurance)}
						class="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
					>
						Get Quote
					</button>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- How It Works -->
<section class="py-16 bg-neutral-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-12">
			<h2 class="text-3xl font-bold text-neutral-900 mb-4">How It Works</h2>
			<p class="text-lg text-neutral-600 max-w-2xl mx-auto">
				Get insured in three simple steps with our streamlined application process.
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			<div class="text-center">
				<div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
					<span class="text-2xl font-bold text-primary-600">1</span>
				</div>
				<h3 class="text-xl font-semibold text-neutral-900 mb-4">Choose Coverage</h3>
				<p class="text-neutral-600">
					Select the type of insurance that fits your needs from our comprehensive options.
				</p>
			</div>

			<div class="text-center">
				<div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
					<span class="text-2xl font-bold text-primary-600">2</span>
				</div>
				<h3 class="text-xl font-semibold text-neutral-900 mb-4">Get Instant Quote</h3>
				<p class="text-neutral-600">
					Fill out our quick application and receive competitive quotes from top carriers.
				</p>
			</div>

			<div class="text-center">
				<div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
					<span class="text-2xl font-bold text-primary-600">3</span>
				</div>
				<h3 class="text-xl font-semibold text-neutral-900 mb-4">Get Protected</h3>
				<p class="text-neutral-600">
					Purchase your policy and get instant coverage with digital documents delivered immediately.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- Call to Action -->
<section class="bg-neutral-900 py-16">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<h2 class="text-3xl font-bold text-white mb-4">
			Ready to Get Protected?
		</h2>
		<p class="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
			Join thousands of satisfied customers who trust X Insurance Brokers for their protection needs.
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			{#if $currentUser}
				<a
					href="/customer/dashboard"
					class="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors text-center"
				>
					Go to Dashboard
				</a>
			{:else}
				<button
					on:click={() => goto('/customer/register')}
					class="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
				>
					Create Account
				</button>
				<a
					href="/customer/login"
					class="border-2 border-white text-white hover:bg-white hover:text-neutral-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors text-center"
				>
					Sign In
				</a>
			{/if}
		</div>
	</div>
</section> 