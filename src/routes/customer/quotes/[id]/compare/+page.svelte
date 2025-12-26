<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { currentUser } from '$lib/services/auth';
	import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let loading = true;
	let generating = false;
	let application = null;
	let quotes = [];
	let selectedQuoteId = '';
	let errorMessage = '';
	let successMessage = '';

	const quoteId = $page.params.id;

	// Mock insurance carriers with different pricing models
	const carriers = [
		{
			id: 'state_farm',
			name: 'State Farm',
			logo: '🏛️',
			rating: 4.5,
			marketShare: 18.5,
			specialties: ['Auto', 'Home', 'Life'],
			discountFactors: {
				goodDriver: 0.15,
				multiVehicle: 0.10,
				bundleHome: 0.12,
				loyalCustomer: 0.08
			},
			basePremiumMultiplier: 1.0
		},
		{
			id: 'geico',
			name: 'GEICO',
			logo: '🦎',
			rating: 4.3,
			marketShare: 15.2,
			specialties: ['Auto', 'Motorcycle'],
			discountFactors: {
				goodDriver: 0.20,
				multiVehicle: 0.12,
				military: 0.15,
				federal: 0.10
			},
			basePremiumMultiplier: 0.85
		},
		{
			id: 'progressive',
			name: 'Progressive',
			logo: '📈',
			rating: 4.2,
			marketShare: 13.8,
			specialties: ['Auto', 'Commercial'],
			discountFactors: {
				goodDriver: 0.18,
				multiVehicle: 0.14,
				snapshot: 0.16,
				bundleHome: 0.10
			},
			basePremiumMultiplier: 0.90
		},
		{
			id: 'allstate',
			name: 'Allstate',
			logo: '🤝',
			rating: 4.1,
			marketShare: 12.3,
			specialties: ['Auto', 'Home', 'Life'],
			discountFactors: {
				goodDriver: 0.16,
				multiVehicle: 0.11,
				bundleHome: 0.15,
				newCustomer: 0.12
			},
			basePremiumMultiplier: 1.05
		},
		{
			id: 'usaa',
			name: 'USAA',
			logo: '🇺🇸',
			rating: 4.7,
			marketShare: 8.9,
			specialties: ['Auto', 'Home', 'Life'],
			discountFactors: {
				military: 0.25,
				goodDriver: 0.20,
				multiVehicle: 0.15,
				bundleHome: 0.18
			},
			basePremiumMultiplier: 0.75,
			eligibilityRequirement: 'Military service required'
		},
		{
			id: 'liberty_mutual',
			name: 'Liberty Mutual',
			logo: '🗽',
			rating: 4.0,
			marketShare: 7.4,
			specialties: ['Auto', 'Home', 'Commercial'],
			discountFactors: {
				goodDriver: 0.14,
				multiVehicle: 0.09,
				bundleHome: 0.13,
				newCustomer: 0.10
			},
			basePremiumMultiplier: 1.10
		}
	];

	onMount(async () => {
		if (!$currentUser) {
			goto('/customer/login');
			return;
		}
		await loadApplication();
		await generateQuotes();
	});

	async function loadApplication() {
		try {
			const applicationDoc = await getDoc(doc(db, 'quotes', quoteId));
			if (applicationDoc.exists()) {
				application = { id: applicationDoc.id, ...applicationDoc.data() };
			} else {
				errorMessage = 'Application not found';
				goto('/customer/dashboard');
			}
		} catch (error) {
			console.error('Error loading application:', error);
			errorMessage = 'Failed to load application';
		}
	}

	async function generateQuotes() {
		if (!application) return;

		generating = true;
		
		// Simulate AI processing time
		await new Promise(resolve => setTimeout(resolve, 3000));

		try {
			// Generate quotes from each carrier
			quotes = carriers.map(carrier => generateCarrierQuote(carrier, application));
			
			// Sort by total premium (best deal first)
			quotes.sort((a, b) => a.totalPremium - b.totalPremium);

			// Update application status
			await updateDoc(doc(db, 'quotes', quoteId), {
				status: 'quoted',
				quotes: quotes,
				quotedAt: serverTimestamp(),
				updatedAt: serverTimestamp()
			});

		} catch (error) {
			console.error('Error generating quotes:', error);
			errorMessage = 'Failed to generate quotes';
		} finally {
			generating = false;
			loading = false;
		}
	}

	function generateCarrierQuote(carrier, application) {
		const vehicleData = application.applicationData.vehicles[0]; // Use first vehicle for demo
		const coverage = application.applicationData.coverage;
		const drivingExp = application.applicationData.drivingExperience;

		// Base premium calculation (simplified algorithm)
		let basePremium = 1200; // Starting base

		// Vehicle factors
		const currentYear = new Date().getFullYear();
		const vehicleAge = currentYear - parseInt(vehicleData.year);
		if (vehicleAge < 3) basePremium *= 1.3; // Newer cars cost more
		if (vehicleAge > 10) basePremium *= 0.9; // Older cars cost less

		// Driving experience factor
		if (drivingExp === '0-2') basePremium *= 1.5;
		else if (drivingExp === '3-5') basePremium *= 1.2;
		else if (drivingExp === '16+') basePremium *= 0.8;

		// Coverage level adjustments
		if (coverage.collision.selected) {
			const deductible = parseInt(coverage.collision.deductible);
			basePremium += 400 - (deductible / 10); // Lower deductible = higher premium
		}

		if (coverage.comprehensive.selected) {
			const deductible = parseInt(coverage.comprehensive.deductible);
			basePremium += 300 - (deductible / 12);
		}

		// Apply carrier-specific multiplier
		basePremium *= carrier.basePremiumMultiplier;

		// Calculate discounts
		let totalDiscount = 0;
		const appliedDiscounts = [];

		// Good driver discount (assume yes for demo)
		if (carrier.discountFactors.goodDriver) {
			totalDiscount += carrier.discountFactors.goodDriver;
			appliedDiscounts.push({
				name: 'Good Driver Discount',
				percentage: carrier.discountFactors.goodDriver * 100,
				savings: basePremium * carrier.discountFactors.goodDriver
			});
		}

		// Multi-vehicle discount (if multiple vehicles)
		if (application.applicationData.vehicles.length > 1 && carrier.discountFactors.multiVehicle) {
			totalDiscount += carrier.discountFactors.multiVehicle;
			appliedDiscounts.push({
				name: 'Multi-Vehicle Discount',
				percentage: carrier.discountFactors.multiVehicle * 100,
				savings: basePremium * carrier.discountFactors.multiVehicle
			});
		}

		// New customer discount
		if (carrier.discountFactors.newCustomer) {
			totalDiscount += carrier.discountFactors.newCustomer;
			appliedDiscounts.push({
				name: 'New Customer Discount',
				percentage: carrier.discountFactors.newCustomer * 100,
				savings: basePremium * carrier.discountFactors.newCustomer
			});
		}

		const discountAmount = basePremium * totalDiscount;
		const finalPremium = basePremium - discountAmount;

		// Generate policy features
		const features = [
			'24/7 Claims Service',
			'Mobile App',
			'Roadside Assistance',
			coverage.collision.selected ? 'Collision Coverage' : null,
			coverage.comprehensive.selected ? 'Comprehensive Coverage' : null,
			coverage.rentalReimbursement.selected ? 'Rental Car Coverage' : null,
			'Accident Forgiveness Available'
		].filter(Boolean);

		// Add carrier-specific features
		if (carrier.id === 'geico') features.push('15-Minute Claims Process');
		if (carrier.id === 'progressive') features.push('Snapshot Telematics');
		if (carrier.id === 'state_farm') features.push('Drive Safe & Save');
		if (carrier.id === 'usaa') features.push('Military Benefits');

		return {
			id: `quote_${carrier.id}_${Date.now()}`,
			carrierId: carrier.id,
			carrierName: carrier.name,
			carrierLogo: carrier.logo,
			carrierRating: carrier.rating,
			basePremium: Math.round(basePremium),
			discounts: appliedDiscounts,
			totalDiscount: Math.round(discountAmount),
			totalPremium: Math.round(finalPremium),
			monthlyPremium: Math.round(finalPremium / 12),
			features: features,
			coverageDetails: {
				liability: `$${coverage.liability.bodilyInjury}/$${coverage.liability.propertyDamage}`,
				collision: coverage.collision.selected ? `$${coverage.collision.deductible} deductible` : 'Not included',
				comprehensive: coverage.comprehensive.selected ? `$${coverage.comprehensive.deductible} deductible` : 'Not included',
				uninsuredMotorist: coverage.uninsuredMotorist.selected ? coverage.uninsuredMotorist.limit : 'Not included'
			},
			aiScore: Math.round(85 + Math.random() * 10), // AI recommendation score
			validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
			eligibilityNote: carrier.eligibilityRequirement || null
		};
	}

	async function selectQuote(quote) {
		selectedQuoteId = quote.id;
		
		try {
			// Update application with selected quote
			await updateDoc(doc(db, 'quotes', quoteId), {
				selectedQuote: quote,
				status: 'quote_selected',
				updatedAt: serverTimestamp()
			});

			successMessage = 'Quote selected! Proceeding to checkout...';
			
			// Redirect to checkout
			setTimeout(() => {
				goto(`/customer/checkout/${quoteId}`);
			}, 1500);

		} catch (error) {
			console.error('Error selecting quote:', error);
			errorMessage = 'Failed to select quote';
		}
	}

	function formatCurrency(amount) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function formatDate(date) {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getAIRecommendation(quote, allQuotes) {
		const avgPremium = allQuotes.reduce((sum, q) => sum + q.totalPremium, 0) / allQuotes.length;
		const savingsPercentage = ((avgPremium - quote.totalPremium) / avgPremium) * 100;
		
		if (savingsPercentage > 15) return { level: 'excellent', text: 'Best Value' };
		if (savingsPercentage > 5) return { level: 'good', text: 'Good Deal' };
		if (quote.carrierRating >= 4.5) return { level: 'good', text: 'Top Rated' };
		return { level: 'neutral', text: 'Standard' };
	}
</script>

<svelte:head>
	<title>Compare Insurance Quotes - X Insurance Brokers</title>
	<meta name="description" content="Compare auto insurance quotes from top carriers and choose the best coverage for your needs." />
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	<!-- Header -->
	<div class="bg-white shadow-sm border-b border-neutral-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">Your Insurance Quotes</h1>
					<p class="text-neutral-600">Compare rates from top insurance carriers</p>
				</div>
				<a
					href="/customer/dashboard"
					class="text-neutral-600 hover:text-neutral-900 font-medium"
				>
					← Back to Dashboard
				</a>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{#if loading || generating}
			<div class="text-center py-12">
				<div class="max-w-md mx-auto">
					<div class="mb-8">
						<div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<LoadingSpinner size="lg" />
						</div>
						<h2 class="text-xl font-semibold text-neutral-900 mb-2">
							{generating ? 'AI is Analyzing Your Application' : 'Loading Application'}
						</h2>
						<p class="text-neutral-600">
							{generating ? 'Comparing rates from multiple carriers to find you the best deal...' : 'Please wait while we load your information'}
						</p>
					</div>

					{#if generating}
						<div class="space-y-3 text-sm text-neutral-600">
							<div class="flex items-center justify-center space-x-2">
								<div class="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
								<span>Analyzing your driving profile...</span>
							</div>
							<div class="flex items-center justify-center space-x-2">
								<div class="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
								<span>Calculating risk factors...</span>
							</div>
							<div class="flex items-center justify-center space-x-2">
								<div class="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
								<span>Comparing carrier rates...</span>
							</div>
							<div class="flex items-center justify-center space-x-2">
								<div class="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
								<span>Optimizing discounts...</span>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{:else if errorMessage}
			<div class="text-center py-12">
				<div class="max-w-md mx-auto">
					<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<h2 class="text-xl font-semibold text-neutral-900 mb-2">Something went wrong</h2>
					<p class="text-neutral-600 mb-6">{errorMessage}</p>
					<button
						on:click={() => goto('/customer/dashboard')}
						class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
					>
						Return to Dashboard
					</button>
				</div>
			</div>
		{:else}
			<!-- Application Summary -->
			{#if application}
				<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8">
					<h2 class="text-lg font-semibold text-neutral-900 mb-4">Application Summary</h2>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div>
							<h3 class="font-medium text-neutral-900 mb-2">Coverage Type</h3>
							<p class="text-neutral-600 capitalize">{application.coverageType} Insurance</p>
						</div>
						<div>
							<h3 class="font-medium text-neutral-900 mb-2">Vehicle</h3>
							<p class="text-neutral-600">
								{application.applicationData.vehicles[0]?.year} 
								{application.applicationData.vehicles[0]?.make} 
								{application.applicationData.vehicles[0]?.model || ''}
							</p>
						</div>
						<div>
							<h3 class="font-medium text-neutral-900 mb-2">Status</h3>
							<span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
								Quotes Ready
							</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Success Message -->
			{#if successMessage}
				<div class="mb-6 p-4 bg-success-50 border border-success-200 rounded-md">
					<div class="flex">
						<svg class="h-5 w-5 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<p class="ml-3 text-sm text-success-800">{successMessage}</p>
					</div>
				</div>
			{/if}

			<!-- Quotes Comparison -->
			<div class="space-y-6">
				<div class="text-center mb-8">
					<h2 class="text-2xl font-bold text-neutral-900 mb-2">
						We found {quotes.length} quotes for you
					</h2>
					<p class="text-neutral-600">
						Powered by AI • Updated in real-time • Valid for 30 days
					</p>
				</div>

				<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
					{#each quotes as quote, index}
						{@const recommendation = getAIRecommendation(quote, quotes)}
						<div class="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden relative {selectedQuoteId === quote.id ? 'ring-2 ring-primary-500' : ''}">
							<!-- Best Deal Badge -->
							{#if index === 0}
								<div class="absolute top-4 right-4 z-10">
									<span class="bg-success-600 text-white px-3 py-1 rounded-full text-xs font-medium">
										Best Deal
									</span>
								</div>
							{/if}

							<!-- AI Recommendation Badge -->
							{#if recommendation.level === 'excellent'}
								<div class="absolute top-4 left-4 z-10">
									<span class="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-medium">
										🤖 AI Recommended
									</span>
								</div>
							{/if}

							<div class="p-6">
								<!-- Carrier Header -->
								<div class="flex items-center justify-between mb-4">
									<div class="flex items-center space-x-3">
										<div class="text-2xl">{quote.carrierLogo}</div>
										<div>
											<h3 class="font-semibold text-neutral-900">{quote.carrierName}</h3>
											<div class="flex items-center space-x-1">
												{#each Array(5) as _, i}
													<svg class="w-4 h-4 {i < Math.floor(quote.carrierRating) ? 'text-yellow-400' : 'text-neutral-300'}" fill="currentColor" viewBox="0 0 20 20">
														<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
													</svg>
												{/each}
												<span class="text-sm text-neutral-600 ml-1">{quote.carrierRating}</span>
											</div>
										</div>
									</div>
									<div class="text-right">
										<div class="text-xs text-neutral-500">AI Score</div>
										<div class="text-sm font-medium text-neutral-900">{quote.aiScore}/100</div>
									</div>
								</div>

								<!-- Pricing -->
								<div class="mb-6">
									<div class="text-center">
										<div class="text-3xl font-bold text-neutral-900 mb-1">
											{formatCurrency(quote.monthlyPremium)}
											<span class="text-base font-normal text-neutral-600">/month</span>
										</div>
										<div class="text-sm text-neutral-600">
											{formatCurrency(quote.totalPremium)} annually
										</div>
									</div>

									{#if quote.totalDiscount > 0}
										<div class="mt-3 p-3 bg-success-50 rounded-lg">
											<div class="text-center">
												<div class="text-sm font-medium text-success-800">
													You save {formatCurrency(quote.totalDiscount)} per year!
												</div>
												<div class="text-xs text-success-600 mt-1">
													Was {formatCurrency(quote.basePremium)} annually
												</div>
											</div>
										</div>
									{/if}
								</div>

								<!-- Coverage Details -->
								<div class="space-y-3 mb-6">
									<h4 class="font-medium text-neutral-900">Coverage Details</h4>
									<div class="space-y-2 text-sm">
										<div class="flex justify-between">
											<span class="text-neutral-600">Liability:</span>
											<span class="text-neutral-900">{quote.coverageDetails.liability}</span>
										</div>
										<div class="flex justify-between">
											<span class="text-neutral-600">Collision:</span>
											<span class="text-neutral-900">{quote.coverageDetails.collision}</span>
										</div>
										<div class="flex justify-between">
											<span class="text-neutral-600">Comprehensive:</span>
											<span class="text-neutral-900">{quote.coverageDetails.comprehensive}</span>
										</div>
									</div>
								</div>

								<!-- Features -->
								<div class="space-y-3 mb-6">
									<h4 class="font-medium text-neutral-900">Included Features</h4>
									<div class="space-y-1">
										{#each quote.features.slice(0, 4) as feature}
											<div class="flex items-center space-x-2 text-sm">
												<svg class="w-4 h-4 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
												</svg>
												<span class="text-neutral-700">{feature}</span>
											</div>
										{/each}
										{#if quote.features.length > 4}
											<div class="text-xs text-neutral-500">
												+{quote.features.length - 4} more features
											</div>
										{/if}
									</div>
								</div>

								<!-- Discounts Applied -->
								{#if quote.discounts.length > 0}
									<div class="space-y-3 mb-6">
										<h4 class="font-medium text-neutral-900">Applied Discounts</h4>
										<div class="space-y-1">
											{#each quote.discounts as discount}
												<div class="flex justify-between text-sm">
													<span class="text-neutral-600">{discount.name}:</span>
													<span class="text-success-600 font-medium">-{formatCurrency(discount.savings)}</span>
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Eligibility Note -->
								{#if quote.eligibilityNote}
									<div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
										<div class="text-sm text-yellow-800">
											<strong>Note:</strong> {quote.eligibilityNote}
										</div>
									</div>
								{/if}

								<!-- Select Button -->
								<button
									on:click={() => selectQuote(quote)}
									disabled={selectedQuoteId === quote.id}
									class="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-success-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
								>
									{selectedQuoteId === quote.id ? '✓ Selected' : 'Select This Quote'}
								</button>

								<!-- Quote Expiration -->
								<div class="mt-3 text-center text-xs text-neutral-500">
									Quote valid until {formatDate(quote.validUntil)}
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Need Help Section -->
				<div class="mt-12 bg-primary-50 rounded-xl p-8 text-center">
					<h3 class="text-lg font-semibold text-neutral-900 mb-2">Need Help Choosing?</h3>
					<p class="text-neutral-600 mb-6">
						Our insurance experts are here to help you find the perfect coverage for your needs.
					</p>
					<div class="flex flex-col sm:flex-row gap-4 justify-center">
						<button
							on:click={() => goto('/customer/support')}
							class="bg-white text-primary-600 hover:bg-neutral-50 border border-primary-200 px-6 py-2 rounded-lg font-medium transition-colors"
						>
							Chat with Expert
						</button>
						<a
							href="tel:1-800-INSURANCE"
							class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
						>
							Call (800) 467-8726
						</a>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div> 