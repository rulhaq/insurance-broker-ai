<script lang="ts">
	import { goto } from '$app/navigation';

	const faqs = [
		{
			question: "How do I create a new client?",
			answer: "Navigate to the Clients page and click the 'Add New Client' button. Fill in the required information including contact details, business information, and risk assessment data."
		},
		{
			question: "How do I generate a quote comparison?",
			answer: "Go to the Quotes section, click 'Generate Quote', select your client, choose coverage types, and our AI will automatically compare quotes from multiple carriers."
		},
		{
			question: "What file types can I upload for documents?",
			answer: "You can upload PDF, DOC, DOCX, JPG, PNG, and other common document formats. Our AI will automatically extract key information from insurance documents."
		},
		{
			question: "How does the AI risk assessment work?",
			answer: "Our AI analyzes client data including industry, location, claims history, and other factors to provide a comprehensive risk assessment and coverage recommendations."
		},
		{
			question: "Can I customize my dashboard layout?",
			answer: "Yes! Go to Settings > Preferences to customize your dashboard widgets and layout to match your workflow."
		},
		{
			question: "How do I set up automated renewals?",
			answer: "In the Policies section, select a policy and click 'Configure Renewals'. You can set renewal reminders and automated follow-up schedules."
		}
	];

	const quickActions = [
		{
			title: "Contact Support",
			description: "Get help from our support team",
			icon: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7",
			action: () => window.open('mailto:support@insurancebroker.pro', '_blank')
		},
		{
			title: "Video Tutorials",
			description: "Watch step-by-step tutorials",
			icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
			action: () => window.open('https://help.insurancebroker.pro/videos', '_blank')
		},
		{
			title: "User Guide",
			description: "Complete documentation",
			icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
			action: () => window.open('https://help.insurancebroker.pro/guide', '_blank')
		},
		{
			title: "Feature Requests",
			description: "Suggest new features",
			icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
			action: () => window.open('https://feedback.insurancebroker.pro', '_blank')
		}
	];

	let searchQuery = '';
	let filteredFaqs = faqs;

	function handleSearch() {
		if (searchQuery.trim()) {
			filteredFaqs = faqs.filter(faq => 
				faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
				faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
			);
		} else {
			filteredFaqs = faqs;
		}
	}

	function resetSearch() {
		searchQuery = '';
		filteredFaqs = faqs;
	}
</script>

<svelte:head>
	<title>Help Center - Insurance Broker Pro</title>
</svelte:head>

<div class="min-h-full">
	<!-- Header -->
	<div class="bg-white shadow">
		<div class="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
			<div class="py-6">
				<div class="lg:flex lg:items-center lg:justify-between">
					<div class="flex-1 min-w-0">
						<h1 class="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
							Help Center
						</h1>
						<div class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
							<div class="mt-2 flex items-center text-sm text-neutral-500">
								<svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								Find answers to common questions and get support
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8 py-8">
		<!-- Search -->
		<div class="mb-8">
			<div class="max-w-lg mx-auto">
				<label for="search" class="sr-only">Search help articles</label>
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<svg class="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					<input
						id="search"
						bind:value={searchQuery}
						on:input={handleSearch}
						type="text"
						placeholder="Search help articles..."
						class="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:placeholder-neutral-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
					/>
					{#if searchQuery}
						<button
							on:click={resetSearch}
							class="absolute inset-y-0 right-0 pr-3 flex items-center"
						>
							<svg class="h-5 w-5 text-neutral-400 hover:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="mb-8">
			<h2 class="text-lg font-medium text-neutral-900 mb-4">Quick Actions</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each quickActions as action}
					<button
						on:click={action.action}
						class="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow"
					>
						<div>
							<span class="rounded-lg inline-flex p-3 bg-primary-50 text-primary-600 group-hover:bg-primary-100">
								<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={action.icon} />
								</svg>
							</span>
						</div>
						<div class="mt-4">
							<h3 class="text-lg font-medium text-neutral-900">
								{action.title}
							</h3>
							<p class="mt-2 text-sm text-neutral-500">
								{action.description}
							</p>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- FAQs -->
		<div class="bg-white shadow rounded-lg">
			<div class="px-4 py-5 sm:p-6">
				<h2 class="text-lg font-medium text-neutral-900 mb-6">
					Frequently Asked Questions
					{#if searchQuery}
						<span class="text-sm font-normal text-neutral-500">
							({filteredFaqs.length} results for "{searchQuery}")
						</span>
					{/if}
				</h2>
				
				{#if filteredFaqs.length > 0}
					<div class="space-y-6">
						{#each filteredFaqs as faq}
							<div class="border-b border-neutral-200 pb-6 last:border-b-0 last:pb-0">
								<h3 class="text-base font-medium text-neutral-900 mb-2">
									{faq.question}
								</h3>
								<p class="text-sm text-neutral-600 leading-relaxed">
									{faq.answer}
								</p>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8">
						<svg class="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						<h3 class="mt-2 text-sm font-medium text-neutral-900">No results found</h3>
						<p class="mt-1 text-sm text-neutral-500">Try searching with different keywords or browse our quick actions above.</p>
						<div class="mt-6">
							<button
								on:click={resetSearch}
								class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
							>
								View All FAQs
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Contact Support -->
		<div class="mt-8 bg-primary-50 border border-primary-200 rounded-lg">
			<div class="px-4 py-5 sm:p-6">
				<h3 class="text-lg font-medium text-primary-900 mb-2">
					Still need help?
				</h3>
				<p class="text-sm text-primary-700 mb-4">
					Can't find what you're looking for? Our support team is here to help you get the most out of your insurance management system.
				</p>
				<div class="flex flex-col sm:flex-row gap-3">
					<button
						on:click={() => window.open('mailto:support@insurancebroker.pro', '_blank')}
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
					>
						<svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						Email Support
					</button>
					<button
						on:click={() => window.open('tel:+1-555-HELP-INS', '_blank')}
						class="inline-flex items-center px-4 py-2 border border-primary-300 text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
					>
						<svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
						</svg>
						Call Support
					</button>
				</div>
			</div>
		</div>
	</div>
</div> 