<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';

	const navigation = [
		{ name: 'Home', href: '/' },
		{ name: 'Services', href: '/services' },
		{ name: 'About', href: '/about' },
		{ name: 'Contact', href: '/contact' }
	];

	let mobileMenuOpen = false;
</script>

<svelte:head>
	<title>Privacy Policy - Insurance Broker Pro</title>
	<meta name="description" content="Privacy Policy for Insurance Broker Pro. Learn how we protect and handle your personal information." />
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

<!-- Content -->
<section class="py-16 bg-white">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<h1 class="text-4xl font-bold mb-8">Privacy Policy</h1>
		<p class="text-neutral-600 mb-8">Last updated: January 2026</p>

		<div class="prose prose-lg max-w-none space-y-8">
			<section>
				<h2 class="text-2xl font-bold mb-4">1. Introduction</h2>
				<p class="text-neutral-700 mb-4">
					Insurance Broker Pro ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
				</p>
			</section>

			<section>
				<h2 class="text-2xl font-bold mb-4">2. Information We Collect</h2>
				<p class="text-neutral-700 mb-4">We collect information that you provide directly to us, including:</p>
				<ul class="list-disc pl-6 space-y-2 text-neutral-700">
					<li>Personal information (name, email, phone number)</li>
					<li>Business information (company name, license numbers)</li>
					<li>Insurance application data</li>
					<li>Payment information (processed securely through third-party providers)</li>
					<li>Usage data and analytics</li>
				</ul>
			</section>

			<section>
				<h2 class="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
				<p class="text-neutral-700 mb-4">We use the information we collect to:</p>
				<ul class="list-disc pl-6 space-y-2 text-neutral-700">
					<li>Provide and maintain our services</li>
					<li>Process insurance applications and quotes</li>
					<li>Communicate with you about your account and services</li>
					<li>Improve our platform and develop new features</li>
					<li>Comply with legal obligations</li>
				</ul>
			</section>

			<section>
				<h2 class="text-2xl font-bold mb-4">4. Data Security</h2>
				<p class="text-neutral-700 mb-4">
					We implement industry-standard security measures including encryption, secure data storage, and access controls to protect your information from unauthorized access, alteration, disclosure, or destruction.
				</p>
			</section>

			<section>
				<h2 class="text-2xl font-bold mb-4">5. Data Sharing</h2>
				<p class="text-neutral-700 mb-4">
					We do not sell your personal information. We may share your information with:
				</p>
				<ul class="list-disc pl-6 space-y-2 text-neutral-700">
					<li>Insurance carriers for quote processing</li>
					<li>Service providers who assist in our operations</li>
					<li>Legal authorities when required by law</li>
				</ul>
			</section>

			<section>
				<h2 class="text-2xl font-bold mb-4">6. Your Rights</h2>
				<p class="text-neutral-700 mb-4">You have the right to:</p>
				<ul class="list-disc pl-6 space-y-2 text-neutral-700">
					<li>Access your personal data</li>
					<li>Correct inaccurate data</li>
					<li>Request deletion of your data</li>
					<li>Object to processing of your data</li>
					<li>Data portability</li>
				</ul>
			</section>

			<section>
				<h2 class="text-2xl font-bold mb-4">7. Contact Us</h2>
				<p class="text-neutral-700 mb-4">
					If you have questions about this Privacy Policy, please contact us at:
				</p>
				<p class="text-neutral-700">
					Email: <a href="mailto:support@Scalovate.com" class="text-primary-600 hover:underline">support@Scalovate.com</a><br>
					Scalovate Systems Solutions
				</p>
			</section>
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

