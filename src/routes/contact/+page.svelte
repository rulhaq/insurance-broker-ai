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

	let formData = {
		name: '',
		email: '',
		phone: '',
		subject: '',
		message: ''
	};

	let isSubmitting = false;
	let submitMessage = '';

	async function handleSubmit() {
		isSubmitting = true;
		submitMessage = '';

		try {
			// Simulate form submission
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			submitMessage = 'Thank you for your message! We\'ll get back to you soon.';
			formData = {
				name: '',
				email: '',
				phone: '',
				subject: '',
				message: ''
			};
		} catch (error) {
			submitMessage = 'There was an error sending your message. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Contact Us - X Insurance Brokers</title>
	<meta name="description" content="Get in touch with X Insurance Brokers for personalized insurance solutions and expert guidance." />
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
				Contact <span class="text-success-400">X Insurance Brokers</span>
			</h1>
			<p class="text-xl lg:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
				Get in touch with our expert team for personalized insurance solutions and professional guidance.
			</p>
		</div>
	</div>
</section>

<!-- Contact Information -->
<section class="py-16 bg-white">
	<div class="container-page">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
			<!-- Office Location -->
			<div class="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-neutral-100 hover:border-primary-200 hover:-translate-y-1 text-center">
				<div class="relative mb-6">
					<div class="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
						<svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</div>
					<div class="absolute -inset-4 bg-primary-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
				</div>
				<h3 class="text-xl font-bold text-neutral-900 mb-4 group-hover:text-primary-600 transition-colors">Office Location</h3>
				<div class="text-neutral-600 leading-relaxed">
					<p class="font-medium text-neutral-800">123 Business Center Drive</p>
					<p>Los Angeles, CA 90210</p>
					<p>United States</p>
				</div>
				<div class="mt-4 inline-flex items-center text-sm text-primary-600 font-medium">
					<span>Get Directions</span>
					<svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</div>

			<!-- Phone Number -->
			<div class="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-neutral-100 hover:border-green-200 hover:-translate-y-1 text-center">
				<div class="relative mb-6">
					<div class="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
						<svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
						</svg>
					</div>
					<div class="absolute -inset-4 bg-green-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
				</div>
				<h3 class="text-xl font-bold text-neutral-900 mb-4 group-hover:text-green-600 transition-colors">Phone Number</h3>
				<div class="text-neutral-600 leading-relaxed">
					<a href="tel:+1555123456" class="text-lg font-semibold text-neutral-800 hover:text-green-600 transition-colors block mb-2">
						+1 (555) 123-4567
					</a>
					<p class="text-sm text-neutral-500">Mon - Fri: 8:00 AM - 6:00 PM</p>
					<p class="text-sm text-neutral-500">Emergency: 24/7 Available</p>
				</div>
				<div class="mt-4 inline-flex items-center text-sm text-green-600 font-medium">
					<span>Call Now</span>
					<svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</div>

			<!-- Email Address -->
			<div class="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-neutral-100 hover:border-blue-200 hover:-translate-y-1 text-center">
				<div class="relative mb-6">
					<div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
						<svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
					</div>
					<div class="absolute -inset-4 bg-blue-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
				</div>
				<h3 class="text-xl font-bold text-neutral-900 mb-4 group-hover:text-blue-600 transition-colors">Email Address</h3>
				<div class="text-neutral-600 leading-relaxed">
					<a href="mailto:info@xinsurancebrokers.com" class="text-lg font-semibold text-neutral-800 hover:text-blue-600 transition-colors block mb-2">
						info@xinsurancebrokers.com
					</a>
					<p class="text-sm text-neutral-500">Response within 24 hours</p>
					<p class="text-sm text-neutral-500">Priority support available</p>
				</div>
				<div class="mt-4 inline-flex items-center text-sm text-blue-600 font-medium">
					<span>Send Email</span>
					<svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</div>
		</div>

		<!-- Contact Form -->
		<div class="max-w-4xl mx-auto">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-neutral-900 mb-4">Send Us a Message</h2>
				<p class="text-lg text-neutral-600">
					Ready to discuss your insurance needs? Fill out the form below and our team will get back to you promptly.
				</p>
			</div>

			<div class="bg-neutral-50 rounded-2xl p-8">
				<form on:submit|preventDefault={handleSubmit} class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label for="name" class="block text-sm font-medium text-neutral-700 mb-2">
								Full Name *
							</label>
							<input
								type="text"
								id="name"
								bind:value={formData.name}
								required
								class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
								placeholder="Enter your full name"
							/>
						</div>

						<div>
							<label for="email" class="block text-sm font-medium text-neutral-700 mb-2">
								Email Address *
							</label>
							<input
								type="email"
								id="email"
								bind:value={formData.email}
								required
								class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
								placeholder="Enter your email address"
							/>
						</div>

						<div>
							<label for="phone" class="block text-sm font-medium text-neutral-700 mb-2">
								Phone Number
							</label>
							<input
								type="tel"
								id="phone"
								bind:value={formData.phone}
								class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
								placeholder="Enter your phone number"
							/>
						</div>

						<div>
							<label for="subject" class="block text-sm font-medium text-neutral-700 mb-2">
								Subject *
							</label>
							<select
								id="subject"
								bind:value={formData.subject}
								required
								class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
							>
								<option value="">Select a subject</option>
								<option value="quote">Request a Quote</option>
								<option value="claim">File a Claim</option>
								<option value="policy">Policy Questions</option>
								<option value="billing">Billing Inquiry</option>
								<option value="general">General Information</option>
								<option value="other">Other</option>
							</select>
						</div>
					</div>

					<div>
						<label for="message" class="block text-sm font-medium text-neutral-700 mb-2">
							Message *
						</label>
						<textarea
							id="message"
							rows="6"
							bind:value={formData.message}
							required
							class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
							placeholder="Tell us about your insurance needs or questions..."
						></textarea>
					</div>

					{#if submitMessage}
						<div class="p-4 rounded-lg {submitMessage.includes('Thank you') ? 'bg-success-50 text-success-700' : 'bg-red-50 text-red-700'}">
							{submitMessage}
						</div>
					{/if}

					<div class="text-center">
						<button
							type="submit"
							disabled={isSubmitting}
							class="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
						>
							{#if isSubmitting}
								Sending Message...
							{:else}
								Send Message
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</section>

<!-- Business Hours -->
<section class="py-16 bg-neutral-100">
	<div class="container-page">
		<div class="text-center mb-12">
			<h2 class="text-3xl font-bold text-neutral-900 mb-4">Business Hours</h2>
			<p class="text-lg text-neutral-600">
				We're here when you need us most. Contact us during business hours or leave a message anytime.
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<div class="bg-white rounded-lg p-6 text-center">
				<h3 class="text-lg font-semibold text-neutral-900 mb-2">Monday - Friday</h3>
				<p class="text-neutral-600">8:00 AM - 6:00 PM</p>
			</div>

			<div class="bg-white rounded-lg p-6 text-center">
				<h3 class="text-lg font-semibold text-neutral-900 mb-2">Saturday</h3>
				<p class="text-neutral-600">9:00 AM - 3:00 PM</p>
			</div>

			<div class="bg-white rounded-lg p-6 text-center">
				<h3 class="text-lg font-semibold text-neutral-900 mb-2">Sunday</h3>
				<p class="text-neutral-600">Closed</p>
			</div>

			<div class="bg-white rounded-lg p-6 text-center">
				<h3 class="text-lg font-semibold text-neutral-900 mb-2">Emergency</h3>
				<p class="text-neutral-600">24/7 Claims Support</p>
			</div>
		</div>
	</div>
</section>

<!-- Call to Action -->
<section class="bg-neutral-900 py-16">
	<div class="container-page text-center">
		<h2 class="text-3xl font-bold text-white mb-4">
			Ready to Get Started?
		</h2>
		<p class="text-xl text-neutral-300 mb-8">
			Join thousands of satisfied customers who trust X Insurance Brokers for their protection needs.
		</p>
		<button
			on:click={handleGetStarted}
			class="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
		>
			Get Started
		</button>
	</div>
</section> 