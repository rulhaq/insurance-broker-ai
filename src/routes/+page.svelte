<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';
	import { onMount } from 'svelte';
	import AIChat from '$lib/components/ai/AIChat.svelte';
	import InteractiveDemo from '$lib/components/ui/InteractiveDemo.svelte';


	// Navigation items
	const navigation = [
		{ name: 'Home', href: '/' },
		{ name: 'Services', href: '/services' },
		{ name: 'About', href: '/about' },
		{ name: 'Contact', href: '/contact' }
	];

	// Feature highlights with enhanced content and images
	const features = [
		{
			title: 'AI-Powered Risk Assessment',
			description: 'Advanced machine learning algorithms analyze thousands of data points to provide accurate risk assessments, helping you make informed decisions and price policies competitively.',
			icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
			image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
			benefits: ['99.2% accuracy rate', 'Real-time processing', 'Continuous learning'],
			color: 'from-blue-500 to-blue-600'
		},
		{
			title: 'Smart Quote Comparison',
			description: 'Instantly compare quotes from 50+ carriers with intelligent analysis that identifies the best value propositions, coverage gaps, and competitive advantages for your clients.',
			icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
			image: 'https://images.unsplash.com/photo-1460472178825-e5240623afd5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
			benefits: ['50+ carrier networks', '< 3 second comparisons', 'Gap analysis included'],
			color: 'from-green-500 to-green-600'
		},
		{
			title: 'Document Intelligence',
			description: 'Automatically extract, categorize, and analyze insurance documents. Generate plain-language summaries and identify key terms, exclusions, and coverage details instantly.',
			icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
			image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
			benefits: ['OCR technology', 'Multi-language support', 'Smart categorization'],
			color: 'from-purple-500 to-purple-600'
		},
		{
			title: 'Intelligent Workflow Automation',
			description: 'Automate routine tasks, prioritize work by revenue impact, predict optimal renewal timing, and streamline client communications with personalized messaging.',
			icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
			image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
			benefits: ['80% time savings', 'Smart prioritization', 'Automated follow-ups'],
			color: 'from-orange-500 to-orange-600'
		},
		{
			title: 'Client Management System',
			description: 'Comprehensive 360° client profiles with AI-generated insights, communication history, risk predictions, and behavioral analytics to enhance relationship management.',
			icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
			image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
			benefits: ['360° client view', 'Behavioral insights', 'Relationship scoring'],
			color: 'from-indigo-500 to-indigo-600'
		},
		{
			title: 'Real-time Analytics',
			description: 'Advanced business intelligence with predictive analytics, market trend analysis, performance benchmarking, and actionable insights to optimize your brokerage operations.',
			icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
			image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
			benefits: ['Real-time dashboards', 'Predictive modeling', 'Custom reporting'],
			color: 'from-red-500 to-red-600'
		}
	];

	// Testimonials
	const testimonials = [
		{
			content: "This AI-powered platform has revolutionized how we manage clients and quotes. The risk assessment feature alone has helped us identify opportunities we would have missed.",
			author: "Sarah Johnson",
			role: "Senior Insurance Broker",
			company: "Metropolitan Insurance Services"
		},
		{
			content: "The automated document processing saves us hours every day. What used to take 30 minutes now happens in seconds with higher accuracy.",
			author: "Michael Chen",
			role: "Agency Owner",
			company: "Chen Insurance Group"
		},
		{
			content: "The predictive analytics for renewals has improved our retention rate by 25%. We can now proactively address client needs before they even realize them.",
			author: "Lisa Rodriguez",
			role: "Commercial Lines Manager",
			company: "Premier Risk Solutions"
		}
	];

	// Insurance carrier logos (placeholder - replace with actual logos)
	const carriers = [
		"Qatar Insurance Company", "Doha Insurance Group", "Al Khaleej Takaful Insurance", "Qatar General Insurance & Reinsurance Company", "Oman Insurance Company",
		"Abu Dhabi National Insurance Company (ADNIC)", "Emirates Insurance Company", "Dubai Insurance Company", "Al Sagr National Insurance Company", "Sukoon Insurance Company"
	];

	function handleGetStarted() {
		if ($currentUser) {
			// Route based on user role
			if ($currentUser.role === 'customer') {
				goto('/customer/dashboard');
			} else {
				goto('/dashboard');
			}
		} else {
			goto('/auth/signup');
		}
	}

	function handleLogin() {
		goto('/auth/login');
	}

	let mobileMenuOpen = false;
	let aiChatOpen = false;
	let currentSlide = 0;
	const slides = 3;

	// Auto-advance slides
	function nextSlide() {
		currentSlide = (currentSlide + 1) % slides;
		updateSlides();
	}

	function updateSlides() {
		if (typeof window !== 'undefined') {
			const slideElements = document.querySelectorAll('.slide');
			slideElements.forEach((slide, index) => {
				slide.classList.toggle('active', index === currentSlide);
			});
		}
	}

	// AI Chat functions
	function handleAIToggle() {
		aiChatOpen = !aiChatOpen;
	}

	function handleAIClose() {
		aiChatOpen = false;
	}

	// Start slider on mount
	onMount(() => {
		const interval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>X Insurance Brokers - AI-Powered Insurance Protection</title>
	<meta name="description" content="Welcome to X Insurance Brokers - where cutting-edge AI technology meets personalized insurance solutions. Professional protection with intelligent automation." />
</svelte:head>

<div class="min-h-screen bg-white">
	<!-- Navigation -->
	<nav class="bg-white shadow-soft sticky top-0 z-50">
		<div class="container-page">
			<div class="flex justify-between items-center py-4">
				<!-- Logo -->
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="h-10 w-10 gradient-primary rounded-lg flex items-center justify-center">
							<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
							</svg>
						</div>
					</div>
					<div class="ml-3">
						<h1 class="text-xl font-bold text-neutral-900">X Insurance Brokers</h1>
						<p class="text-xs text-neutral-500">AI-Powered Protection</p>
					</div>
				</div>

				<!-- Desktop Navigation -->
				<div class="hidden md:block">
					<div class="ml-10 flex items-baseline space-x-8">
						{#each navigation as item}
							<a 
								href={item.href} 
								class="text-neutral-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
							>
								{item.name}
							</a>
						{/each}
					</div>
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
						class="inline-flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-primary-600 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
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
				<div class="md:hidden border-t border-neutral-200">
					<div class="px-2 pt-2 pb-3 space-y-1">
						{#each navigation as item}
							<a 
								href={item.href} 
								class="block px-3 py-2 text-base font-medium text-neutral-600 hover:text-primary-600 hover:bg-neutral-50 rounded-md"
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

	<!-- Hero Section with Image Slider -->
	<section class="relative bg-gradient-to-br from-primary-50 to-success-50 overflow-hidden">
		<div class="absolute inset-0">
			<div class="hero-slider relative w-full h-full">
				<div class="slide active">
					<img 
						src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2126&q=80" 
						alt="Modern office building" 
						class="w-full h-full object-cover opacity-15"
					/>
				</div>
				<div class="slide">
					<img 
						src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
						alt="Insurance professionals meeting" 
						class="w-full h-full object-cover opacity-15"
					/>
				</div>
				<div class="slide">
					<img 
						src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80" 
						alt="Business handshake" 
						class="w-full h-full object-cover opacity-15"
					/>
				</div>
			</div>
		</div>
		<div class="absolute inset-0 bg-gradient-to-br from-primary-600/25 to-success-600/20"></div>
		<div class="relative container-page py-16 lg:py-24">
			<div class="text-center">
							<h1 class="text-4xl lg:text-6xl font-bold text-neutral-900 mb-6 text-balance">
				<span class="text-primary-600">X Insurance Brokers</span><br/>
				AI-Powered Protection for Your Business
			</h1>
			<p class="text-xl lg:text-2xl text-neutral-600 mb-8 max-w-3xl mx-auto text-balance">
				Welcome to X Insurance Brokers - where cutting-edge AI technology meets personalized insurance solutions. We streamline your protection with intelligent risk assessment, automated quote comparisons, and expert guidance.
			</p>
				<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
					<button on:click={handleGetStarted} class="btn btn-primary btn-lg">
						{$currentUser ? 'Go to Dashboard' : 'Get Started'}
						<svg class="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</button>
					{#if !$currentUser}
						<button on:click={handleLogin} class="btn btn-secondary btn-lg">
							Sign In
						</button>
					{/if}
				</div>
				{#if !$currentUser}
					<p class="text-sm text-neutral-500 mt-4">
						Secure login • Google authentication • Role-based access
					</p>
				{/if}
			</div>


		</div>
	</section>

	<!-- Interactive Demo Section -->
	<section class="py-16 lg:py-24 bg-neutral-50">
		<div class="container-page">
			<div class="text-center mb-16">
				<h2 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
					Experience the Platform in Action
				</h2>
				<p class="text-xl text-neutral-600 max-w-3xl mx-auto">
					Take a guided tour through our AI-powered insurance broker platform. See how intelligent automation transforms your workflow.
				</p>
			</div>
			
			<InteractiveDemo />
		</div>
	</section>

	<!-- Features Section -->
	<section class="py-16 lg:py-24 bg-white">
		<div class="container-page">
			<div class="text-center mb-16">
				<h2 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
					Intelligent Features for Modern Brokers
				</h2>
				<p class="text-xl text-neutral-600 max-w-3xl mx-auto">
					Leverage cutting-edge AI to automate routine tasks, gain deeper insights, and deliver exceptional service to your clients.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{#each features as feature}
					<div class="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-neutral-100 hover:border-primary-200 hover:-translate-y-2">
						<!-- Image Header -->
						<div class="relative h-48 overflow-hidden">
							<img 
								src={feature.image} 
								alt={feature.title}
								class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
							/>
							<div class="absolute inset-0 bg-gradient-to-t {feature.color} opacity-80"></div>
							<div class="absolute top-4 left-4">
								<div class="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
									<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={feature.icon} />
									</svg>
								</div>
							</div>
						</div>
						
						<!-- Content -->
						<div class="p-6">
							<h3 class="text-xl font-bold text-neutral-900 mb-3 group-hover:text-primary-600 transition-colors">{feature.title}</h3>
							<p class="text-neutral-600 mb-4 leading-relaxed">{feature.description}</p>
							
							<!-- Benefits -->
							<div class="space-y-2">
								{#each feature.benefits as benefit}
									<div class="flex items-center text-sm text-neutral-700">
										<div class="h-4 w-4 rounded-full bg-gradient-to-r {feature.color} flex items-center justify-center mr-3 flex-shrink-0">
											<svg class="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
											</svg>
										</div>
										{benefit}
									</div>
								{/each}
							</div>
							
							<!-- Learn More Button -->
							<div class="mt-6">
								<button class="w-full bg-gradient-to-r {feature.color} text-white px-4 py-2 rounded-lg font-medium text-sm hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
									Learn More
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Trusted by Section -->
	<section class="py-16 bg-neutral-50">
		<div class="container-page">
			<div class="text-center mb-12">
				<h2 class="text-2xl font-semibold text-neutral-900 mb-4">
					Trusted by Leading Insurance Carriers
				</h2>
				<p class="text-neutral-600">
					Integrated with major insurance providers for seamless quote management
				</p>
			</div>
			<div class="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
				{#each carriers.slice(0, 10) as carrier}
					<div class="flex items-center justify-center">
						<div class="bg-white rounded-lg p-6 shadow-soft border border-neutral-200 w-full">
							<p class="text-neutral-700 font-medium text-center text-sm">{carrier}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Testimonials Section -->
	<section class="py-16 lg:py-24 bg-white">
		<div class="container-page">
			<div class="text-center mb-16">
				<h2 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
					What Brokers Are Saying
				</h2>
				<p class="text-xl text-neutral-600">
					Join thousands of insurance professionals already using our platform
				</p>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{#each testimonials as testimonial}
					<div class="card">
						<div class="card-body">
							<div class="flex items-center mb-4">
								{#each Array(5) as _}
									<svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
								{/each}
							</div>
							<blockquote class="text-neutral-700 mb-6">
								"{testimonial.content}"
							</blockquote>
							<div class="border-t border-neutral-200 pt-4">
								<p class="font-semibold text-neutral-900">{testimonial.author}</p>
								<p class="text-sm text-neutral-600">{testimonial.role}</p>
								<p class="text-sm text-neutral-500">{testimonial.company}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-16 lg:py-24 gradient-primary">
		<div class="container-page text-center">
			<h2 class="text-3xl lg:text-4xl font-bold text-white mb-6">
				Ready to Transform Your Brokerage?
			</h2>
			<p class="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
				Join the AI revolution in insurance. Start your free trial today and experience the future of insurance brokerage.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<button
					on:click={handleGetStarted}
					class="bg-white text-primary-600 hover:bg-neutral-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
				>
					Start Application
				</button>
				<a
					href="/customer/login"
					class="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors text-center"
				>
					Customer Portal
				</a>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="bg-neutral-900 text-white py-12">
		<div class="container-page">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
				<!-- Company Info -->
				<div class="col-span-1 lg:col-span-2">
					<div class="flex items-center mb-4">
						<div class="h-8 w-8 gradient-primary rounded-lg flex items-center justify-center">
							<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
							</svg>
						</div>
						<span class="ml-2 text-lg font-bold">Insurance Broker Pro</span>
					</div>
					<p class="text-neutral-400 mb-4">
						The leading AI-powered platform for insurance brokers. Streamline your operations, enhance client relationships, and grow your business with intelligent automation.
					</p>
					<div class="flex space-x-4">
						<!-- Social Links -->
						<a href="#" class="text-neutral-400 hover:text-white transition-colors">
							<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
								<path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
							</svg>
						</a>
						<a href="#" class="text-neutral-400 hover:text-white transition-colors">
							<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
								<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
							</svg>
						</a>
					</div>
				</div>

				<!-- Quick Links -->
				<div>
					<h3 class="text-lg font-semibold mb-4">Platform</h3>
					<ul class="space-y-2">
						<li><a href="/features" class="text-neutral-400 hover:text-white transition-colors">Features</a></li>
						<li><a href="/pricing" class="text-neutral-400 hover:text-white transition-colors">Pricing</a></li>
						<li><a href="/integrations" class="text-neutral-400 hover:text-white transition-colors">Integrations</a></li>
						<li><a href="/security" class="text-neutral-400 hover:text-white transition-colors">Security</a></li>
					</ul>
				</div>

				<!-- Support -->
				<div>
					<h3 class="text-lg font-semibold mb-4">Support</h3>
					<ul class="space-y-2">
						<li><a href="/help" class="text-neutral-400 hover:text-white transition-colors">Help Center</a></li>
						<li><a href="/contact" class="text-neutral-400 hover:text-white transition-colors">Contact Us</a></li>
						<li><a href="/privacy" class="text-neutral-400 hover:text-white transition-colors">Privacy Policy</a></li>
						<li><a href="/terms" class="text-neutral-400 hover:text-white transition-colors">Terms of Service</a></li>
					</ul>
				</div>

				<!-- Mobile App -->
				<div>
					<h3 class="text-lg font-semibold mb-4">Mobile App</h3>
					<div class="space-y-3">
						<a href="#" class="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors group">
							<div class="bg-neutral-800 group-hover:bg-neutral-700 rounded-lg p-2 transition-colors">
								<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
									<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
								</svg>
							</div>
							<div>
								<div class="text-sm font-medium">Download on the</div>
								<div class="text-xs text-neutral-500">App Store</div>
							</div>
						</a>
						<a href="#" class="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors group">
							<div class="bg-neutral-800 group-hover:bg-neutral-700 rounded-lg p-2 transition-colors">
								<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
									<path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
								</svg>
							</div>
							<div>
								<div class="text-sm font-medium">Get it on</div>
								<div class="text-xs text-neutral-500">Google Play</div>
							</div>
						</a>
					</div>
				</div>
			</div>

			<div class="border-t border-neutral-800 mt-8 pt-8 text-center">
				<p class="text-neutral-400 text-sm mb-2">
					Insurance Broker Pro by © 2026 <a href="https://www.scalovate.com/products" target="_blank" rel="noopener noreferrer" class="text-white hover:text-primary-400 transition-colors font-semibold">Scalovate Systems Solutions</a>, . All rights reserved.
				</p>
				<p class="text-neutral-400 text-sm">
					contact: <a href="mailto:support@Scalovate.com" class="text-white hover:text-primary-400 transition-colors">support@Scalovate.com</a>
				</p>
			</div>
		</div>
	</footer>
	
	<!-- Floating AI Assistant Button -->
	<button 
		on:click={() => aiChatOpen = true}
		class="fixed bottom-6 right-6 z-40 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
		title="Ask AI Assistant"
	>
		<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
		</svg>
		<span class="absolute -top-2 -right-2 h-4 w-4 bg-green-400 rounded-full animate-pulse"></span>
	</button>
</div>

<!-- AI Chat Assistant -->
<AIChat isOpen={aiChatOpen} on:close={() => aiChatOpen = false} />

<style>
	.hero-slider {
		position: relative;
		overflow: hidden;
	}

	.slide {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		transition: opacity 1s ease-in-out;
	}

	.slide.active {
		opacity: 1;
	}

	.slide img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style> 