<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';

	let searchQuery = '';
	let selectedCategory = 'all';
	let showContactForm = false;
	let contactFormData = {
		subject: '',
		message: '',
		urgency: 'normal'
	};

	const supportCategories = [
		{ value: 'all', label: 'All Topics' },
		{ value: 'policies', label: 'Policies' },
		{ value: 'claims', label: 'Claims' },
		{ value: 'billing', label: 'Billing' },
		{ value: 'account', label: 'Account' },
		{ value: 'technical', label: 'Technical' }
	];

	const faqs = [
		{
			category: 'policies',
			question: 'How do I add a vehicle to my auto policy?',
			answer: 'You can add a vehicle through your customer portal by going to Policies > Manage Coverage > Add Vehicle. You\'ll need the VIN, make, model, year, and usage information. Changes are effective immediately upon approval.'
		},
		{
			category: 'policies',
			question: 'When does my coverage become effective?',
			answer: 'Most policies become effective immediately upon payment confirmation. However, some policies may have a waiting period. Check your policy documents or contact us for specific details about your coverage start date.'
		},
		{
			category: 'claims',
			question: 'How do I file a claim?',
			answer: 'You can file a claim 24/7 through your customer portal, by calling our claims hotline at (555) 123-CLAIM, or through our mobile app. Have your policy number, incident details, and any photos ready.'
		},
		{
			category: 'claims',
			question: 'How long does the claims process take?',
			answer: 'Simple claims are typically processed within 3-5 business days. Complex claims involving investigations may take 2-4 weeks. You\'ll receive regular updates on your claim status through email and your customer portal.'
		},
		{
			category: 'billing',
			question: 'When is my premium due?',
			answer: 'Premium due dates depend on your payment schedule (monthly, quarterly, or annually). You can view your next due date in your customer portal under Billing. We send reminders 7 days before the due date.'
		},
		{
			category: 'billing',
			question: 'What payment methods do you accept?',
			answer: 'We accept credit cards (Visa, MasterCard, American Express), debit cards, bank transfers (ACH), and electronic checks. Automatic payments can be set up for convenience.'
		},
		{
			category: 'account',
			question: 'How do I update my contact information?',
			answer: 'Log into your customer portal and go to Profile > Personal Information. You can update your address, phone number, and email. Some changes may require verification.'
		},
		{
			category: 'account',
			question: 'How do I reset my password?',
			answer: 'Click "Forgot Password" on the login page and enter your email address. We\'ll send you a secure reset link. For additional security, you may need to verify your identity with personal information.'
		},
		{
			category: 'technical',
			question: 'I can\'t log into my account. What should I do?',
			answer: 'First, try resetting your password. If that doesn\'t work, clear your browser cache and cookies, or try a different browser. If you\'re still having trouble, contact our technical support team.'
		},
		{
			category: 'technical',
			question: 'Is the customer portal mobile-friendly?',
			answer: 'Yes! Our customer portal is fully optimized for mobile devices. You can also download our mobile app from the App Store or Google Play for even better mobile experience.'
		}
	];

	const supportOptions = [
		{
			title: 'Live Chat',
			description: 'Get instant help from our support team',
			icon: '💬',
			availability: 'Available 24/7',
			action: () => alert('Live chat feature coming soon!')
		},
		{
			title: 'Phone Support',
			description: 'Speak directly with a support representative',
			icon: '📞',
			availability: 'Mon-Fri 8AM-8PM EST',
			action: () => window.open('tel:+15551234567')
		},
		{
			title: 'Email Support',
			description: 'Send us a detailed message',
			icon: '✉️',
			availability: 'Response within 24 hours',
			action: () => showContactForm = true
		},
		{
			title: 'Video Call',
			description: 'Schedule a face-to-face consultation',
			icon: '📹',
			availability: 'By appointment only',
			action: () => alert('Video call scheduling coming soon!')
		}
	];

	onMount(() => {
		if (!$currentUser) {
			goto('/customer/login');
			return;
		}
	});

	function submitContactForm() {
		// Simulate form submission
		alert('Your message has been sent! We\'ll respond within 24 hours.');
		showContactForm = false;
		contactFormData = {
			subject: '',
			message: '',
			urgency: 'normal'
		};
	}

	$: filteredFaqs = faqs.filter(faq => {
		const matchesSearch = !searchQuery || 
			faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
			faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;

		return matchesSearch && matchesCategory;
	});
</script>

<svelte:head>
	<title>Customer Support - X Insurance Brokers</title>
	<meta name="description" content="Get help with your insurance policies, claims, and account questions." />
</svelte:head>

<div class="min-h-screen bg-neutral-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">Customer Support</h1>
					<p class="text-neutral-600 mt-1">Get help with your insurance needs</p>
				</div>
				<a
					href="/customer/dashboard"
					class="text-primary-600 hover:text-primary-700 font-medium transition-colors"
				>
					← Back to Dashboard
				</a>
			</div>
		</div>

		<!-- Support Options -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			{#each supportOptions as option}
				<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 text-center hover:shadow-md transition-shadow">
					<div class="text-4xl mb-4">{option.icon}</div>
					<h3 class="text-lg font-semibold text-neutral-900 mb-2">{option.title}</h3>
					<p class="text-neutral-600 text-sm mb-3">{option.description}</p>
					<p class="text-xs text-neutral-500 mb-4">{option.availability}</p>
					<button
						on:click={option.action}
						class="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
					>
						Connect Now
					</button>
				</div>
			{/each}
		</div>

		{#if showContactForm}
			<!-- Contact Form Modal -->
			<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 mb-8">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-semibold text-neutral-900">Send us a Message</h2>
					<button
						on:click={() => showContactForm = false}
						class="text-neutral-400 hover:text-neutral-600"
					>
						<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<form on:submit|preventDefault={submitContactForm} class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label for="subject" class="block text-sm font-medium text-neutral-700 mb-2">
								Subject *
							</label>
							<input
								id="subject"
								type="text"
								bind:value={contactFormData.subject}
								required
								placeholder="Brief description of your inquiry"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="urgency" class="block text-sm font-medium text-neutral-700 mb-2">
								Urgency Level
							</label>
							<select
								id="urgency"
								bind:value={contactFormData.urgency}
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							>
								<option value="low">Low - General inquiry</option>
								<option value="normal">Normal - Standard request</option>
								<option value="high">High - Urgent assistance needed</option>
								<option value="critical">Critical - Emergency situation</option>
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
							bind:value={contactFormData.message}
							required
							placeholder="Please provide detailed information about your inquiry..."
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						></textarea>
					</div>

					<div class="flex justify-end space-x-4">
						<button
							type="button"
							on:click={() => showContactForm = false}
							class="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-6 py-2 rounded-md font-medium transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
						>
							Send Message
						</button>
					</div>
				</form>
			</div>
		{/if}

		<!-- FAQ Section -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
			<div class="mb-8">
				<h2 class="text-2xl font-bold text-neutral-900 mb-4">Frequently Asked Questions</h2>
				<p class="text-neutral-600">Find quick answers to common questions about your insurance.</p>
			</div>

			<!-- Search and Filter -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
				<div>
					<label for="search" class="block text-sm font-medium text-neutral-700 mb-2">
						Search FAQs
					</label>
					<input
						id="search"
						type="text"
						placeholder="Search questions and answers..."
						bind:value={searchQuery}
						class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
					/>
				</div>
				<div>
					<label for="category" class="block text-sm font-medium text-neutral-700 mb-2">
						Filter by Category
					</label>
					<select
						id="category"
						bind:value={selectedCategory}
						class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
					>
						{#each supportCategories as category}
							<option value={category.value}>{category.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- FAQ List -->
			{#if filteredFaqs.length === 0}
				<div class="text-center py-8">
					<div class="text-4xl mb-4">🔍</div>
					<h3 class="text-lg font-medium text-neutral-900 mb-2">No FAQs found</h3>
					<p class="text-neutral-600">Try adjusting your search terms or category filter.</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each filteredFaqs as faq}
						<details class="group border border-neutral-200 rounded-lg">
							<summary class="cursor-pointer p-4 hover:bg-neutral-50 transition-colors">
								<div class="flex items-center justify-between">
									<h3 class="font-medium text-neutral-900 pr-4">{faq.question}</h3>
									<svg class="w-5 h-5 text-neutral-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
									</svg>
								</div>
							</summary>
							<div class="p-4 pt-0 border-t border-neutral-200">
								<p class="text-neutral-700 leading-relaxed">{faq.answer}</p>
							</div>
						</details>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Emergency Contact -->
		<div class="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
			<div class="flex items-start">
				<div class="flex-shrink-0">
					<svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-lg font-medium text-red-800">Emergency Claims Hotline</h3>
					<p class="text-red-700 mb-4">
						For urgent claims that require immediate assistance (accidents, theft, fire, etc.), call our 24/7 emergency hotline:
					</p>
					<a
						href="tel:+15551234567"
						class="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
					>
						<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
						</svg>
						Call (555) 123-4567
					</a>
				</div>
			</div>
		</div>
	</div>
</div> 