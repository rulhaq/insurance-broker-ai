<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { currentUser } from '$lib/services/auth';
	import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let loading = true;
	let processing = false;
	let application = null;
	let selectedQuote = null;
	let errorMessage = '';
	let successMessage = '';
	let currentStep = 1; // 1: Review, 2: Payment, 3: Confirmation

	const quoteId = $page.params.id;

	// Payment form data
	let paymentData = {
		paymentMethod: 'credit_card', // credit_card, bank_transfer, autopay
		billingFrequency: 'monthly', // monthly, quarterly, annually
		
		// Credit Card Info
		cardNumber: '',
		expiryMonth: '',
		expiryYear: '',
		cvv: '',
		cardName: '',
		
		// Billing Address
		billingAddress: {
			street: '',
			city: '',
			state: '',
			zipCode: '',
			sameAsCustomer: true
		},
		
		// Autopay Settings
		autopay: {
			enabled: true,
			dayOfMonth: 1 // 1-28
		},
		
		// Legal Agreements
		agreements: {
			terms: false,
			privacy: false,
			electronicDelivery: true,
			autopayAuth: false
		}
	};

	let formErrors = {};

	// Payment method options
	const paymentMethods = [
		{
			id: 'credit_card',
			name: 'Credit/Debit Card',
			icon: '💳',
			description: 'Visa, Mastercard, American Express, Discover',
			processingFee: 0
		},
		{
			id: 'bank_transfer',
			name: 'Bank Transfer (ACH)',
			icon: '🏦',
			description: 'Direct from your checking account',
			processingFee: 0,
			savings: 'Save $5/month'
		},
		{
			id: 'autopay',
			name: 'AutoPay Setup',
			icon: '🔄',
			description: 'Automatic monthly payments',
			processingFee: 0,
			savings: 'Additional 5% discount'
		}
	];

	// Billing frequency options
	const billingOptions = [
		{
			id: 'monthly',
			name: 'Monthly',
			description: 'Pay every month',
			multiplier: 1,
			fee: 5
		},
		{
			id: 'quarterly',
			name: 'Quarterly',
			description: 'Pay every 3 months',
			multiplier: 3,
			fee: 0,
			savings: 'No processing fees'
		},
		{
			id: 'annually',
			name: 'Annual',
			description: 'Pay once per year',
			multiplier: 12,
			fee: 0,
			savings: 'Save 8% annually'
		}
	];

	const states = [
		'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
		'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
		'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
		'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
		'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
	];

	onMount(async () => {
		if (!$currentUser) {
			goto('/customer/login');
			return;
		}
		await loadApplicationAndQuote();
		
		// Pre-fill billing address from user profile
		if ($currentUser.address) {
			paymentData.billingAddress = {
				...paymentData.billingAddress,
				...$currentUser.address
			};
		}
	});

	async function loadApplicationAndQuote() {
		try {
			const applicationDoc = await getDoc(doc(db, 'quotes', quoteId));
			if (applicationDoc.exists()) {
				application = { id: applicationDoc.id, ...applicationDoc.data() };
				selectedQuote = application.selectedQuote;
				
				if (!selectedQuote) {
					errorMessage = 'No quote selected. Please select a quote first.';
					goto(`/customer/quotes/${quoteId}/compare`);
					return;
				}
			} else {
				errorMessage = 'Application not found';
				goto('/customer/dashboard');
				return;
			}
		} catch (error) {
			console.error('Error loading application:', error);
			errorMessage = 'Failed to load application';
		} finally {
			loading = false;
		}
	}

	function calculatePaymentAmount() {
		if (!selectedQuote) return 0;
		
		const billingOption = billingOptions.find(b => b.id === paymentData.billingFrequency);
		let amount = selectedQuote.monthlyPremium * billingOption.multiplier;
		
		// Add processing fees
		amount += billingOption.fee;
		
		// Apply discounts
		if (paymentData.billingFrequency === 'annually') {
			amount *= 0.92; // 8% annual discount
		}
		
		if (paymentData.autopay.enabled && paymentData.paymentMethod === 'autopay') {
			amount *= 0.95; // 5% autopay discount
		}
		
		return Math.round(amount);
	}

	function validatePayment() {
		formErrors = {};
		
		if (paymentData.paymentMethod === 'credit_card') {
			if (!paymentData.cardNumber || paymentData.cardNumber.length < 15) {
				formErrors.cardNumber = 'Valid card number required';
			}
			if (!paymentData.expiryMonth || !paymentData.expiryYear) {
				formErrors.expiry = 'Expiration date required';
			}
			if (!paymentData.cvv || paymentData.cvv.length < 3) {
				formErrors.cvv = 'CVV required';
			}
			if (!paymentData.cardName) {
				formErrors.cardName = 'Cardholder name required';
			}
		}
		
		if (!paymentData.billingAddress.sameAsCustomer) {
			if (!paymentData.billingAddress.street) formErrors.street = 'Street address required';
			if (!paymentData.billingAddress.city) formErrors.city = 'City required';
			if (!paymentData.billingAddress.state) formErrors.state = 'State required';
			if (!paymentData.billingAddress.zipCode) formErrors.zipCode = 'ZIP code required';
		}
		
		if (!paymentData.agreements.terms) {
			formErrors.terms = 'Must accept terms and conditions';
		}
		if (!paymentData.agreements.privacy) {
			formErrors.privacy = 'Must accept privacy policy';
		}
		
		return Object.keys(formErrors).length === 0;
	}

	async function processPayment() {
		if (!validatePayment()) return;
		
		processing = true;
		errorMessage = '';
		
		try {
			// Simulate payment processing
			await new Promise(resolve => setTimeout(resolve, 3000));
			
			// Simulate payment success (90% success rate for demo)
			if (Math.random() < 0.9) {
				// Create policy document
				const policyData = {
					customerId: $currentUser.uid,
					customerEmail: $currentUser.email,
					customerName: `${$currentUser.firstName} ${$currentUser.lastName}`,
					applicationId: quoteId,
					
					// Policy Details
					policyNumber: generatePolicyNumber(),
					coverageType: application.coverageType,
					carrier: selectedQuote.carrierName,
					carrierId: selectedQuote.carrierId,
					
					// Coverage Details
					coverage: application.applicationData.coverage,
					vehicles: application.applicationData.vehicles,
					
					// Premium and Payment
					premium: {
						monthly: selectedQuote.monthlyPremium,
						annual: selectedQuote.totalPremium,
						billingFrequency: paymentData.billingFrequency,
						paymentMethod: paymentData.paymentMethod,
						autopay: paymentData.autopay.enabled
					},
					
					// Policy Dates
					dates: {
						effective: new Date(),
						expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
						issued: new Date()
					},
					
					// Status
					status: 'active',
					paymentStatus: 'current',
					
					// Payment Information
					payment: {
						transactionId: `txn_${Date.now()}`,
						amount: calculatePaymentAmount(),
						currency: 'USD',
						method: paymentData.paymentMethod,
						processedAt: serverTimestamp(),
						nextDueDate: calculateNextDueDate()
					},
					
					// Documents
					documents: [],
					
					// Metadata
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp()
				};
				
				// Save policy to Firestore
				const policyRef = await addDoc(collection(db, 'policies'), policyData);
				
				// Update quote status
				await updateDoc(doc(db, 'quotes', quoteId), {
					status: 'purchased',
					policyId: policyRef.id,
					purchasedAt: serverTimestamp(),
					updatedAt: serverTimestamp()
				});
				
				// Generate policy documents (simulate)
				await generatePolicyDocuments(policyRef.id, policyData);
				
				currentStep = 3;
				successMessage = 'Payment successful! Your policy is now active.';
				
			} else {
				// Simulate payment failure
				errorMessage = 'Payment failed. Please check your payment information and try again.';
			}
			
		} catch (error) {
			console.error('Payment processing error:', error);
			errorMessage = 'Payment processing failed. Please try again.';
		} finally {
			processing = false;
		}
	}

	function generatePolicyNumber() {
		const prefix = selectedQuote.carrierId.toUpperCase().slice(0, 2);
		const timestamp = Date.now().toString().slice(-8);
		const random = Math.random().toString(36).substr(2, 4).toUpperCase();
		return `${prefix}-${timestamp}-${random}`;
	}

	function calculateNextDueDate() {
		const now = new Date();
		switch (paymentData.billingFrequency) {
			case 'monthly':
				return new Date(now.getFullYear(), now.getMonth() + 1, paymentData.autopay.dayOfMonth);
			case 'quarterly':
				return new Date(now.getFullYear(), now.getMonth() + 3, paymentData.autopay.dayOfMonth);
			case 'annually':
				return new Date(now.getFullYear() + 1, now.getMonth(), paymentData.autopay.dayOfMonth);
			default:
				return new Date(now.getFullYear(), now.getMonth() + 1, paymentData.autopay.dayOfMonth);
		}
	}

	async function generatePolicyDocuments(policyId, policyData) {
		// Simulate document generation
		const documents = [
			{
				type: 'policy_certificate',
				name: 'Insurance Policy Certificate',
				url: `https://docs.example.com/policy/${policyId}/certificate.pdf`,
				generatedAt: new Date()
			},
			{
				type: 'id_cards',
				name: 'Insurance ID Cards',
				url: `https://docs.example.com/policy/${policyId}/id_cards.pdf`,
				generatedAt: new Date()
			},
			{
				type: 'payment_receipt',
				name: 'Payment Receipt',
				url: `https://docs.example.com/policy/${policyId}/receipt.pdf`,
				generatedAt: new Date()
			}
		];
		
		// Update policy with document links
		await updateDoc(doc(db, 'policies', policyId), {
			documents: documents,
			documentsGenerated: true,
			updatedAt: serverTimestamp()
		});
	}

	function formatCurrency(amount) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function formatCardNumber(value) {
		// Remove all non-digit characters
		const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
		
		// Add spaces every 4 digits
		const matches = v.match(/\d{4,16}/g);
		const match = matches && matches[0] || '';
		const parts = [];
		
		for (let i = 0, len = match.length; i < len; i += 4) {
			parts.push(match.substring(i, i + 4));
		}
		
		if (parts.length) {
			return parts.join(' ');
		} else {
			return v;
		}
	}

	function handleCardInput(event) {
		const formatted = formatCardNumber(event.target.value);
		paymentData.cardNumber = formatted;
	}

	function nextStep() {
		if (currentStep === 1 && validatePayment()) {
			currentStep = 2;
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}
</script>

<svelte:head>
	<title>Checkout - X Insurance Brokers</title>
	<meta name="description" content="Complete your insurance purchase with secure payment processing." />
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	<!-- Header -->
	<div class="bg-white shadow-sm border-b border-neutral-200">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">Secure Checkout</h1>
					<p class="text-neutral-600">Complete your insurance purchase</p>
				</div>
				<div class="flex items-center space-x-2 text-sm text-neutral-600">
					<svg class="w-4 h-4 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
					<span>SSL Encrypted</span>
				</div>
			</div>
			
			<!-- Step Indicator -->
			<div class="mt-6 flex items-center justify-center">
				<div class="flex items-center space-x-4">
					{#each ['Review', 'Payment', 'Confirmation'] as step, index}
						<div class="flex items-center {index < 2 ? 'mr-4' : ''}">
							<div class="flex items-center justify-center w-8 h-8 rounded-full {currentStep > index + 1 ? 'bg-success-500' : currentStep === index + 1 ? 'bg-primary-600' : 'bg-neutral-300'} text-white text-sm font-medium">
								{currentStep > index + 1 ? '✓' : index + 1}
							</div>
							<span class="ml-2 text-sm font-medium text-neutral-700">{step}</span>
							{#if index < 2}
								<div class="ml-4 w-12 h-0.5 {currentStep > index + 1 ? 'bg-success-500' : 'bg-neutral-300'}"></div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-24">
			<LoadingSpinner size="lg" />
		</div>
	{:else if errorMessage && currentStep < 3}
		<div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div class="text-center py-12">
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
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Main Content -->
				<div class="lg:col-span-2">
					{#if currentStep === 1}
						<!-- Step 1: Review -->
						<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
							<h2 class="text-xl font-semibold text-neutral-900 mb-6">Review Your Selection</h2>
							
							{#if selectedQuote}
								<!-- Selected Quote Summary -->
								<div class="border border-neutral-200 rounded-lg p-6 mb-6">
									<div class="flex items-center justify-between mb-4">
										<div class="flex items-center space-x-3">
											<div class="text-2xl">{selectedQuote.carrierLogo}</div>
											<div>
												<h3 class="font-semibold text-neutral-900">{selectedQuote.carrierName}</h3>
												<div class="flex items-center space-x-1">
													{#each Array(5) as _, i}
														<svg class="w-4 h-4 {i < Math.floor(selectedQuote.carrierRating) ? 'text-yellow-400' : 'text-neutral-300'}" fill="currentColor" viewBox="0 0 20 20">
															<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
														</svg>
													{/each}
													<span class="text-sm text-neutral-600 ml-1">{selectedQuote.carrierRating}</span>
												</div>
											</div>
										</div>
										<span class="bg-success-100 text-success-800 px-3 py-1 rounded-full text-sm font-medium">
											Selected
										</span>
									</div>
									
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
										<div>
											<span class="text-neutral-600">Monthly Premium:</span>
											<span class="text-neutral-900 font-medium ml-2">{formatCurrency(selectedQuote.monthlyPremium)}</span>
										</div>
										<div>
											<span class="text-neutral-600">Annual Premium:</span>
											<span class="text-neutral-900 font-medium ml-2">{formatCurrency(selectedQuote.totalPremium)}</span>
										</div>
										<div>
											<span class="text-neutral-600">Coverage Type:</span>
											<span class="text-neutral-900 font-medium ml-2 capitalize">{application.coverageType}</span>
										</div>
										<div>
											<span class="text-neutral-600">Policy Term:</span>
											<span class="text-neutral-900 font-medium ml-2">12 months</span>
										</div>
									</div>
								</div>

								<!-- Billing Frequency Selection -->
								<div class="space-y-4 mb-6">
									<h3 class="text-lg font-medium text-neutral-900">Choose Billing Frequency</h3>
									<div class="grid grid-cols-1 gap-3">
										{#each billingOptions as option}
											<label class="flex items-center justify-between p-4 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 {paymentData.billingFrequency === option.id ? 'border-primary-500 bg-primary-50' : ''}">
												<div class="flex items-center">
													<input
														bind:group={paymentData.billingFrequency}
														value={option.id}
														type="radio"
														class="text-primary-600 focus:ring-primary-500"
													/>
													<div class="ml-3">
														<div class="font-medium text-neutral-900">{option.name}</div>
														<div class="text-sm text-neutral-600">{option.description}</div>
														{#if option.savings}
															<div class="text-sm text-success-600 font-medium">{option.savings}</div>
														{/if}
													</div>
												</div>
												<div class="text-right">
													<div class="font-medium text-neutral-900">
														{formatCurrency(selectedQuote.monthlyPremium * option.multiplier + option.fee)}
													</div>
													{#if option.fee > 0}
														<div class="text-xs text-neutral-500">+{formatCurrency(option.fee)} fee</div>
													{/if}
												</div>
											</label>
										{/each}
									</div>
								</div>

								<!-- Legal Agreements -->
								<div class="space-y-4">
									<h3 class="text-lg font-medium text-neutral-900">Legal Agreements</h3>
									<div class="space-y-3">
										<label class="flex items-start">
											<input
												bind:checked={paymentData.agreements.terms}
												type="checkbox"
												class="mt-1 text-primary-600 focus:ring-primary-500 rounded"
											/>
											<span class="ml-2 text-sm text-neutral-700">
												I agree to the <a href="/terms" class="text-primary-600 hover:text-primary-500 underline" target="_blank">Terms and Conditions</a> *
											</span>
										</label>
										{#if formErrors.terms}
											<p class="text-sm text-red-600">{formErrors.terms}</p>
										{/if}
										
										<label class="flex items-start">
											<input
												bind:checked={paymentData.agreements.privacy}
												type="checkbox"
												class="mt-1 text-primary-600 focus:ring-primary-500 rounded"
											/>
											<span class="ml-2 text-sm text-neutral-700">
												I agree to the <a href="/privacy" class="text-primary-600 hover:text-primary-500 underline" target="_blank">Privacy Policy</a> *
											</span>
										</label>
										{#if formErrors.privacy}
											<p class="text-sm text-red-600">{formErrors.privacy}</p>
										{/if}
										
										<label class="flex items-start">
											<input
												bind:checked={paymentData.agreements.electronicDelivery}
												type="checkbox"
												class="mt-1 text-primary-600 focus:ring-primary-500 rounded"
											/>
											<span class="ml-2 text-sm text-neutral-700">
												I consent to electronic delivery of policy documents and communications
											</span>
										</label>
									</div>
								</div>
							{/if}
						</div>

					{:else if currentStep === 2}
						<!-- Step 2: Payment -->
						<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
							<h2 class="text-xl font-semibold text-neutral-900 mb-6">Payment Information</h2>
							
							<!-- Payment Method Selection -->
							<div class="space-y-4 mb-6">
								<h3 class="text-lg font-medium text-neutral-900">Payment Method</h3>
								<div class="grid grid-cols-1 gap-3">
									{#each paymentMethods as method}
										<label class="flex items-center justify-between p-4 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 {paymentData.paymentMethod === method.id ? 'border-primary-500 bg-primary-50' : ''}">
											<div class="flex items-center">
												<input
													bind:group={paymentData.paymentMethod}
													value={method.id}
													type="radio"
													class="text-primary-600 focus:ring-primary-500"
												/>
												<div class="ml-3">
													<div class="flex items-center">
														<span class="text-lg mr-2">{method.icon}</span>
														<span class="font-medium text-neutral-900">{method.name}</span>
													</div>
													<div class="text-sm text-neutral-600">{method.description}</div>
													{#if method.savings}
														<div class="text-sm text-success-600 font-medium">{method.savings}</div>
													{/if}
												</div>
											</div>
										</label>
									{/each}
								</div>
							</div>

							{#if paymentData.paymentMethod === 'credit_card'}
								<!-- Credit Card Form -->
								<div class="space-y-4 mb-6">
									<h3 class="text-lg font-medium text-neutral-900">Card Information</h3>
									
									<div>
										<label class="block text-sm font-medium text-neutral-700 mb-2">Card Number</label>
										<input
											on:input={handleCardInput}
											value={paymentData.cardNumber}
											type="text"
											placeholder="1234 5678 9012 3456"
											maxlength="19"
											class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
											class:border-red-500={formErrors.cardNumber}
										/>
										{#if formErrors.cardNumber}
											<p class="mt-1 text-sm text-red-600">{formErrors.cardNumber}</p>
										{/if}
									</div>

									<div class="grid grid-cols-3 gap-4">
										<div>
											<label class="block text-sm font-medium text-neutral-700 mb-2">Month</label>
											<select
												bind:value={paymentData.expiryMonth}
												class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
												class:border-red-500={formErrors.expiry}
											>
												<option value="">Month</option>
												{#each Array(12) as _, i}
													<option value={String(i + 1).padStart(2, '0')}>{String(i + 1).padStart(2, '0')}</option>
												{/each}
											</select>
										</div>
										<div>
											<label class="block text-sm font-medium text-neutral-700 mb-2">Year</label>
											<select
												bind:value={paymentData.expiryYear}
												class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
												class:border-red-500={formErrors.expiry}
											>
												<option value="">Year</option>
												{#each Array(15) as _, i}
													<option value={2024 + i}>{2024 + i}</option>
												{/each}
											</select>
										</div>
										<div>
											<label class="block text-sm font-medium text-neutral-700 mb-2">CVV</label>
											<input
												bind:value={paymentData.cvv}
												type="text"
												placeholder="123"
												maxlength="4"
												class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
												class:border-red-500={formErrors.cvv}
											/>
										</div>
									</div>
									{#if formErrors.expiry}
										<p class="text-sm text-red-600">{formErrors.expiry}</p>
									{/if}
									{#if formErrors.cvv}
										<p class="text-sm text-red-600">{formErrors.cvv}</p>
									{/if}

									<div>
										<label class="block text-sm font-medium text-neutral-700 mb-2">Cardholder Name</label>
										<input
											bind:value={paymentData.cardName}
											type="text"
											placeholder="John Doe"
											class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
											class:border-red-500={formErrors.cardName}
										/>
										{#if formErrors.cardName}
											<p class="mt-1 text-sm text-red-600">{formErrors.cardName}</p>
										{/if}
									</div>
								</div>
							{/if}

							<!-- Billing Address -->
							<div class="space-y-4 mb-6">
								<h3 class="text-lg font-medium text-neutral-900">Billing Address</h3>
								
								<label class="flex items-center">
									<input
										bind:checked={paymentData.billingAddress.sameAsCustomer}
										type="checkbox"
										class="text-primary-600 focus:ring-primary-500 rounded"
									/>
									<span class="ml-2 text-sm text-neutral-700">Same as customer address</span>
								</label>

								{#if !paymentData.billingAddress.sameAsCustomer}
									<div class="grid grid-cols-1 gap-4">
										<div>
											<label class="block text-sm font-medium text-neutral-700 mb-2">Street Address</label>
											<input
												bind:value={paymentData.billingAddress.street}
												type="text"
												class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
												class:border-red-500={formErrors.street}
											/>
											{#if formErrors.street}
												<p class="mt-1 text-sm text-red-600">{formErrors.street}</p>
											{/if}
										</div>

										<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div>
												<label class="block text-sm font-medium text-neutral-700 mb-2">City</label>
												<input
													bind:value={paymentData.billingAddress.city}
													type="text"
													class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
													class:border-red-500={formErrors.city}
												/>
												{#if formErrors.city}
													<p class="mt-1 text-sm text-red-600">{formErrors.city}</p>
												{/if}
											</div>
											<div>
												<label class="block text-sm font-medium text-neutral-700 mb-2">State</label>
												<select
													bind:value={paymentData.billingAddress.state}
													class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
													class:border-red-500={formErrors.state}
												>
													<option value="">State</option>
													{#each states as state}
														<option value={state}>{state}</option>
													{/each}
												</select>
												{#if formErrors.state}
													<p class="mt-1 text-sm text-red-600">{formErrors.state}</p>
												{/if}
											</div>
											<div>
												<label class="block text-sm font-medium text-neutral-700 mb-2">ZIP Code</label>
												<input
													bind:value={paymentData.billingAddress.zipCode}
													type="text"
													class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
													class:border-red-500={formErrors.zipCode}
												/>
												{#if formErrors.zipCode}
													<p class="mt-1 text-sm text-red-600">{formErrors.zipCode}</p>
												{/if}
											</div>
										</div>
									</div>
								{/if}
							</div>

							<!-- AutoPay Setup -->
							<div class="space-y-4">
								<h3 class="text-lg font-medium text-neutral-900">AutoPay Settings</h3>
								
								<label class="flex items-center">
									<input
										bind:checked={paymentData.autopay.enabled}
										type="checkbox"
										class="text-primary-600 focus:ring-primary-500 rounded"
									/>
									<span class="ml-2 text-sm text-neutral-700">
										Enable AutoPay (Save 5% on your premium)
									</span>
								</label>

								{#if paymentData.autopay.enabled}
									<div>
										<label class="block text-sm font-medium text-neutral-700 mb-2">Payment Day of Month</label>
										<select
											bind:value={paymentData.autopay.dayOfMonth}
											class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										>
											{#each Array(28) as _, i}
												<option value={i + 1}>{i + 1}</option>
											{/each}
										</select>
									</div>

									<label class="flex items-start">
										<input
											bind:checked={paymentData.agreements.autopayAuth}
											type="checkbox"
											class="mt-1 text-primary-600 focus:ring-primary-500 rounded"
										/>
										<span class="ml-2 text-sm text-neutral-700">
											I authorize X Insurance Brokers to automatically charge my selected payment method on the scheduled date
										</span>
									</label>
								{/if}
							</div>
						</div>

					{:else if currentStep === 3}
						<!-- Step 3: Confirmation -->
						<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 text-center">
							<div class="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
								<svg class="w-8 h-8 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							</div>
							
							<h2 class="text-2xl font-bold text-neutral-900 mb-4">Payment Successful!</h2>
							<p class="text-neutral-600 mb-8">
								Your insurance policy is now active. We've sent your policy documents to your email.
							</p>

							<div class="space-y-4 mb-8">
								<div class="bg-neutral-50 rounded-lg p-4">
									<h3 class="font-medium text-neutral-900 mb-2">Policy Information</h3>
									<div class="space-y-1 text-sm">
										<div class="flex justify-between">
											<span class="text-neutral-600">Policy Number:</span>
											<span class="text-neutral-900 font-mono">{generatePolicyNumber()}</span>
										</div>
										<div class="flex justify-between">
											<span class="text-neutral-600">Effective Date:</span>
											<span class="text-neutral-900">{new Date().toLocaleDateString()}</span>
										</div>
										<div class="flex justify-between">
											<span class="text-neutral-600">Coverage:</span>
											<span class="text-neutral-900 capitalize">{application.coverageType} Insurance</span>
										</div>
									</div>
								</div>
							</div>

							<div class="flex flex-col sm:flex-row gap-4 justify-center">
								<button
									on:click={() => goto('/customer/dashboard')}
									class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
								>
									View Dashboard
								</button>
								<button
									on:click={() => goto(`/customer/policies/${generatePolicyNumber()}`)}
									class="bg-white text-primary-600 border border-primary-200 hover:bg-primary-50 px-6 py-2 rounded-lg font-medium transition-colors"
								>
									View Policy Details
								</button>
							</div>
						</div>
					{/if}

					<!-- Error Message -->
					{#if errorMessage && currentStep < 3}
						<div class="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
							<div class="flex">
								<svg class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<p class="ml-3 text-sm text-red-800">{errorMessage}</p>
							</div>
						</div>
					{/if}

					<!-- Navigation Buttons -->
					{#if currentStep < 3}
						<div class="flex justify-between mt-8">
							<button
								on:click={prevStep}
								disabled={currentStep === 1}
								class="px-6 py-2 border border-neutral-300 rounded-md font-medium text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								← Previous
							</button>

							{#if currentStep === 1}
								<button
									on:click={nextStep}
									class="px-6 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors"
								>
									Continue to Payment →
								</button>
							{:else if currentStep === 2}
								<button
									on:click={processPayment}
									disabled={processing}
									class="px-8 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
								>
									{#if processing}
										<LoadingSpinner size="sm" color="white" />
										<span class="ml-2">Processing Payment...</span>
									{:else}
										Complete Purchase
									{/if}
								</button>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Order Summary Sidebar -->
				<div class="lg:col-span-1">
					<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sticky top-8">
						<h3 class="text-lg font-semibold text-neutral-900 mb-4">Order Summary</h3>
						
						{#if selectedQuote}
							<div class="space-y-4">
								<!-- Quote Summary -->
								<div class="flex items-center space-x-3 pb-4 border-b border-neutral-200">
									<div class="text-xl">{selectedQuote.carrierLogo}</div>
									<div>
										<div class="font-medium text-neutral-900">{selectedQuote.carrierName}</div>
										<div class="text-sm text-neutral-600 capitalize">{application.coverageType} Insurance</div>
									</div>
								</div>

								<!-- Pricing Breakdown -->
								<div class="space-y-3">
									<div class="flex justify-between text-sm">
										<span class="text-neutral-600">Base Premium ({paymentData.billingFrequency}):</span>
										<span class="text-neutral-900">
											{formatCurrency(selectedQuote.monthlyPremium * billingOptions.find(b => b.id === paymentData.billingFrequency).multiplier)}
										</span>
									</div>

									{#if billingOptions.find(b => b.id === paymentData.billingFrequency).fee > 0}
										<div class="flex justify-between text-sm">
											<span class="text-neutral-600">Processing Fee:</span>
											<span class="text-neutral-900">
												{formatCurrency(billingOptions.find(b => b.id === paymentData.billingFrequency).fee)}
											</span>
										</div>
									{/if}

									{#if paymentData.billingFrequency === 'annually'}
										<div class="flex justify-between text-sm">
											<span class="text-success-600">Annual Discount (8%):</span>
											<span class="text-success-600">
												-{formatCurrency((selectedQuote.monthlyPremium * 12) * 0.08)}
											</span>
										</div>
									{/if}

									{#if paymentData.autopay.enabled}
										<div class="flex justify-between text-sm">
											<span class="text-success-600">AutoPay Discount (5%):</span>
											<span class="text-success-600">
												-{formatCurrency(calculatePaymentAmount() * 0.05 / 0.95)}
											</span>
										</div>
									{/if}
								</div>

								<div class="pt-4 border-t border-neutral-200">
									<div class="flex justify-between">
										<span class="text-lg font-semibold text-neutral-900">
											Total {paymentData.billingFrequency === 'monthly' ? 'Monthly' : paymentData.billingFrequency === 'quarterly' ? 'Quarterly' : 'Annual'} Payment:
										</span>
										<span class="text-lg font-bold text-neutral-900">
											{formatCurrency(calculatePaymentAmount())}
										</span>
									</div>
									{#if paymentData.billingFrequency !== 'monthly'}
										<div class="text-sm text-neutral-600 text-right mt-1">
											({formatCurrency(calculatePaymentAmount() / billingOptions.find(b => b.id === paymentData.billingFrequency).multiplier)}/month)
										</div>
									{/if}
								</div>

								<!-- Policy Details -->
								<div class="pt-4 border-t border-neutral-200 space-y-2 text-sm">
									<div class="flex justify-between">
										<span class="text-neutral-600">Policy Term:</span>
										<span class="text-neutral-900">12 months</span>
									</div>
									<div class="flex justify-between">
										<span class="text-neutral-600">Effective Date:</span>
										<span class="text-neutral-900">{new Date().toLocaleDateString()}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-neutral-600">Payment Method:</span>
										<span class="text-neutral-900 capitalize">{paymentData.paymentMethod.replace('_', ' ')}</span>
									</div>
								</div>

								<!-- Security Notice -->
								<div class="pt-4 border-t border-neutral-200">
									<div class="flex items-center space-x-2 text-sm text-neutral-600">
										<svg class="w-4 h-4 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
										</svg>
										<span>Secure 256-bit SSL encryption</span>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div> 