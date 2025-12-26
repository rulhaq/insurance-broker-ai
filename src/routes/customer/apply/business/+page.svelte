<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { currentUser } from '$lib/services/auth';
	import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let loading = false;
	let currentStep = 1;
	const totalSteps = 4;
	let isEditMode = false;
	let editApplicationId = '';

	let formData = {
		// Business Information
		businessName: '',
		businessType: 'llc',
		industry: '',
		yearsInBusiness: '',
		numberOfEmployees: '',
		annualRevenue: '',
		businessAddress: {
			street: '',
			city: '',
			state: 'CA',
			zipCode: ''
		},
		
		// Contact Information
		firstName: '',
		lastName: '',
		title: '',
		email: '',
		phone: '',
		
		// Coverage Information
		generalLiability: {
			selected: true,
			limit: 1000000
		},
		professionalLiability: {
			selected: false,
			limit: 1000000
		},
		productLiability: {
			selected: false,
			limit: 1000000
		},
		cyberLiability: {
			selected: false,
			limit: 1000000
		},
		workersComp: {
			selected: true,
			numberOfEmployees: ''
		},
		businessProperty: {
			selected: true,
			propertyValue: ''
		},
		businessInterruption: {
			selected: false,
			coveragePeriod: '12'
		},
		
		// Risk Information
		previousClaims: '',
		safetyPrograms: [],
		riskFactors: ''
	};

	const businessTypes = [
		{ value: 'sole_proprietorship', label: 'Sole Proprietorship' },
		{ value: 'partnership', label: 'Partnership' },
		{ value: 'llc', label: 'LLC' },
		{ value: 'corporation', label: 'Corporation' },
		{ value: 'non_profit', label: 'Non-Profit' }
	];

	const industries = [
		'Accounting', 'Advertising', 'Architecture', 'Automotive', 'Construction',
		'Consulting', 'Education', 'Engineering', 'Finance', 'Food Service',
		'Healthcare', 'Insurance', 'Legal', 'Manufacturing', 'Marketing',
		'Real Estate', 'Retail', 'Technology', 'Transportation', 'Other'
	];

	const liabilityLimits = [
		{ value: 500000, label: '$500,000' },
		{ value: 1000000, label: '$1,000,000' },
		{ value: 2000000, label: '$2,000,000' },
		{ value: 5000000, label: '$5,000,000' }
	];

	const safetyProgramOptions = [
		'Employee Safety Training',
		'Workplace Safety Inspections',
		'Safety Equipment Protocols',
		'Emergency Response Plans',
		'Cybersecurity Training',
		'Data Protection Measures'
	];

	const states = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];

	onMount(async () => {
		if (!$currentUser) {
			goto('/customer/login');
			return;
		}
		
		// Check if editing existing application
		editApplicationId = $page.url.searchParams.get('edit') || '';
		isEditMode = !!editApplicationId;
		
		if (isEditMode) {
			await loadExistingApplication();
		} else {
			// Pre-fill user data for new applications
			if ($currentUser) {
				formData.firstName = $currentUser.firstName || '';
				formData.lastName = $currentUser.lastName || '';
				formData.email = $currentUser.email || '';
			}
		}
	});

	async function loadExistingApplication() {
		if (!editApplicationId) return;
		
		try {
			loading = true;
			console.log('🔍 Loading existing business application for edit:', editApplicationId);
			
			const applicationDoc = await getDoc(doc(db, 'quotes', editApplicationId));
			if (!applicationDoc.exists()) {
				console.error('❌ Application not found');
				goto('/customer/applications');
				return;
			}
			
			const applicationData = applicationDoc.data();
			
			// Verify ownership
			if (applicationData.customerId !== $currentUser.uid) {
				console.error('❌ Unauthorized access to application');
				goto('/customer/applications');
				return;
			}
			
			// Populate form with existing data
			if (applicationData.applicationData) {
				console.log('📋 Populating business form with existing data');
				formData = { ...applicationData.applicationData };
			}
			
		} catch (error) {
			console.error('❌ Error loading existing application:', error);
			goto('/customer/applications');
		} finally {
			loading = false;
		}
	}

	function nextStep() {
		if (currentStep < totalSteps) {
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}

	async function submitApplication() {
		if (!$currentUser) return;

		loading = true;
		try {
			const submissionData = {
				applicationData: formData,
				updatedAt: serverTimestamp()
			};

			if (isEditMode && editApplicationId) {
				// Update existing application
				console.log('📝 Updating existing business application:', editApplicationId);
				await updateDoc(doc(db, 'quotes', editApplicationId), submissionData);
				goto(`/customer/applications/${editApplicationId}?updated=true`);
			} else {
				// Create new application
				console.log('📝 Creating new business application');
				const newApplicationData = {
					customerId: $currentUser.uid,
					customerEmail: $currentUser.email,
					customerName: `${formData.firstName} ${formData.lastName}`,
					coverageType: 'business',
					status: 'submitted',
					submittedAt: serverTimestamp(),
					createdAt: serverTimestamp(),
					...submissionData
				};

				await addDoc(collection(db, 'quotes'), newApplicationData);
				goto('/customer/applications?success=business-insurance');
			}
			
		} catch (error) {
			console.error('Error submitting application:', error);
			alert('Error submitting application. Please try again.');
		} finally {
			loading = false;
		}
	}

	function calculateEstimatedPremium() {
		let basePremium = 150;
		
		// Adjust for business size
		const employees = parseInt(formData.numberOfEmployees) || 0;
		basePremium += employees * 25;
		
		// Adjust for revenue
		const revenue = parseInt(formData.annualRevenue) || 0;
		basePremium += (revenue / 100000) * 10;
		
		// Adjust for coverage selections
		if (formData.generalLiability.selected) basePremium += 100;
		if (formData.professionalLiability.selected) basePremium += 150;
		if (formData.productLiability.selected) basePremium += 200;
		if (formData.cyberLiability.selected) basePremium += 75;
		if (formData.workersComp.selected) basePremium += employees * 15;
		if (formData.businessProperty.selected) basePremium += 50;
		if (formData.businessInterruption.selected) basePremium += 100;
		
		return Math.round(basePremium);
	}
</script>

<svelte:head>
	<title>Business Insurance Application - X Insurance Brokers</title>
	<meta name="description" content="Protect your business with comprehensive commercial insurance coverage." />
</svelte:head>

<div class="min-h-screen bg-neutral-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">Business Insurance Application</h1>
					<p class="text-neutral-600 mt-1">Protect your business with comprehensive coverage</p>
				</div>
				<div class="text-right">
					<p class="text-sm text-neutral-500">Step {currentStep} of {totalSteps}</p>
					<div class="w-32 bg-neutral-200 rounded-full h-2 mt-1">
						<div class="bg-primary-600 h-2 rounded-full transition-all duration-300" style="width: {(currentStep / totalSteps) * 100}%"></div>
					</div>
				</div>
			</div>
		</div>

		<!-- Form Steps -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
			{#if currentStep === 1}
				<!-- Step 1: Business Information -->
				<div class="space-y-6">
					<h2 class="text-xl font-semibold text-neutral-900 mb-6">Business Information</h2>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="md:col-span-2">
							<label for="businessName" class="block text-sm font-medium text-neutral-700 mb-2">
								Business Name *
							</label>
							<input
								id="businessName"
								type="text"
								bind:value={formData.businessName}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="businessType" class="block text-sm font-medium text-neutral-700 mb-2">
								Business Type *
							</label>
							<select
								id="businessType"
								bind:value={formData.businessType}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							>
								{#each businessTypes as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="industry" class="block text-sm font-medium text-neutral-700 mb-2">
								Industry *
							</label>
							<select
								id="industry"
								bind:value={formData.industry}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							>
								<option value="">Select Industry</option>
								{#each industries as industry}
									<option value={industry}>{industry}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="yearsInBusiness" class="block text-sm font-medium text-neutral-700 mb-2">
								Years in Business *
							</label>
							<input
								id="yearsInBusiness"
								type="number"
								bind:value={formData.yearsInBusiness}
								required
								min="0"
								max="100"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="numberOfEmployees" class="block text-sm font-medium text-neutral-700 mb-2">
								Number of Employees *
							</label>
							<input
								id="numberOfEmployees"
								type="number"
								bind:value={formData.numberOfEmployees}
								required
								min="0"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="annualRevenue" class="block text-sm font-medium text-neutral-700 mb-2">
								Annual Revenue *
							</label>
							<input
								id="annualRevenue"
								type="number"
								bind:value={formData.annualRevenue}
								required
								min="0"
								placeholder="Enter annual revenue in USD"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>
					</div>

					<!-- Business Address -->
					<div class="pt-6 border-t border-neutral-200">
						<h3 class="text-lg font-medium text-neutral-900 mb-4">Business Address</h3>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div class="md:col-span-2">
								<label for="street" class="block text-sm font-medium text-neutral-700 mb-2">
									Street Address *
								</label>
								<input
									id="street"
									type="text"
									bind:value={formData.businessAddress.street}
									required
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								/>
							</div>

							<div>
								<label for="city" class="block text-sm font-medium text-neutral-700 mb-2">
									City *
								</label>
								<input
									id="city"
									type="text"
									bind:value={formData.businessAddress.city}
									required
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								/>
							</div>

							<div>
								<label for="state" class="block text-sm font-medium text-neutral-700 mb-2">
									State *
								</label>
								<select
									id="state"
									bind:value={formData.businessAddress.state}
									required
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								>
									{#each states as state}
										<option value={state}>{state}</option>
									{/each}
								</select>
							</div>

							<div>
								<label for="zipCode" class="block text-sm font-medium text-neutral-700 mb-2">
									ZIP Code *
								</label>
								<input
									id="zipCode"
									type="text"
									bind:value={formData.businessAddress.zipCode}
									required
									pattern="[0-9]{5}"
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								/>
							</div>
						</div>
					</div>
				</div>

			{:else if currentStep === 2}
				<!-- Step 2: Contact Information -->
				<div class="space-y-6">
					<h2 class="text-xl font-semibold text-neutral-900 mb-6">Contact Information</h2>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label for="firstName" class="block text-sm font-medium text-neutral-700 mb-2">
								First Name *
							</label>
							<input
								id="firstName"
								type="text"
								bind:value={formData.firstName}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="lastName" class="block text-sm font-medium text-neutral-700 mb-2">
								Last Name *
							</label>
							<input
								id="lastName"
								type="text"
								bind:value={formData.lastName}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="title" class="block text-sm font-medium text-neutral-700 mb-2">
								Job Title *
							</label>
							<input
								id="title"
								type="text"
								bind:value={formData.title}
								required
								placeholder="e.g., CEO, Owner, Manager"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="email" class="block text-sm font-medium text-neutral-700 mb-2">
								Email Address *
							</label>
							<input
								id="email"
								type="email"
								bind:value={formData.email}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="phone" class="block text-sm font-medium text-neutral-700 mb-2">
								Phone Number *
							</label>
							<input
								id="phone"
								type="tel"
								bind:value={formData.phone}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>
					</div>
				</div>

			{:else if currentStep === 3}
				<!-- Step 3: Coverage Selection -->
				<div class="space-y-6">
					<h2 class="text-xl font-semibold text-neutral-900 mb-6">Coverage Selection</h2>
					
					<!-- General Liability -->
					<div class="border border-neutral-200 rounded-lg p-6">
						<div class="flex items-center justify-between mb-4">
							<div>
								<label class="flex items-center">
									<input
										type="checkbox"
										bind:checked={formData.generalLiability.selected}
										class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
									/>
									<span class="ml-2 font-medium text-neutral-900">General Liability Insurance</span>
								</label>
								<p class="text-sm text-neutral-600 ml-6">Protects against claims of bodily injury, property damage, and personal injury</p>
							</div>
							{#if formData.generalLiability.selected}
								<select
									bind:value={formData.generalLiability.limit}
									class="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								>
									{#each liabilityLimits as limit}
										<option value={limit.value}>{limit.label}</option>
									{/each}
								</select>
							{/if}
						</div>
					</div>

					<!-- Professional Liability -->
					<div class="border border-neutral-200 rounded-lg p-6">
						<div class="flex items-center justify-between mb-4">
							<div>
								<label class="flex items-center">
									<input
										type="checkbox"
										bind:checked={formData.professionalLiability.selected}
										class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
									/>
									<span class="ml-2 font-medium text-neutral-900">Professional Liability Insurance</span>
								</label>
								<p class="text-sm text-neutral-600 ml-6">Covers errors, omissions, and negligence in professional services</p>
							</div>
							{#if formData.professionalLiability.selected}
								<select
									bind:value={formData.professionalLiability.limit}
									class="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								>
									{#each liabilityLimits as limit}
										<option value={limit.value}>{limit.label}</option>
									{/each}
								</select>
							{/if}
						</div>
					</div>

					<!-- Workers' Compensation -->
					<div class="border border-neutral-200 rounded-lg p-6">
						<div class="flex items-center justify-between mb-4">
							<div>
								<label class="flex items-center">
									<input
										type="checkbox"
										bind:checked={formData.workersComp.selected}
										class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
									/>
									<span class="ml-2 font-medium text-neutral-900">Workers' Compensation</span>
								</label>
								<p class="text-sm text-neutral-600 ml-6">Required coverage for workplace injuries and illnesses</p>
							</div>
						</div>
					</div>

					<!-- Business Property -->
					<div class="border border-neutral-200 rounded-lg p-6">
						<div class="flex items-center justify-between mb-4">
							<div>
								<label class="flex items-center">
									<input
										type="checkbox"
										bind:checked={formData.businessProperty.selected}
										class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
									/>
									<span class="ml-2 font-medium text-neutral-900">Business Property Insurance</span>
								</label>
								<p class="text-sm text-neutral-600 ml-6">Protects buildings, equipment, inventory, and other business property</p>
							</div>
							{#if formData.businessProperty.selected}
								<input
									type="number"
									bind:value={formData.businessProperty.propertyValue}
									placeholder="Property value"
									min="0"
									class="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-32"
								/>
							{/if}
						</div>
					</div>

					<!-- Cyber Liability -->
					<div class="border border-neutral-200 rounded-lg p-6">
						<div class="flex items-center justify-between mb-4">
							<div>
								<label class="flex items-center">
									<input
										type="checkbox"
										bind:checked={formData.cyberLiability.selected}
										class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
									/>
									<span class="ml-2 font-medium text-neutral-900">Cyber Liability Insurance</span>
								</label>
								<p class="text-sm text-neutral-600 ml-6">Protects against data breaches and cyber attacks</p>
							</div>
							{#if formData.cyberLiability.selected}
								<select
									bind:value={formData.cyberLiability.limit}
									class="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								>
									{#each liabilityLimits as limit}
										<option value={limit.value}>{limit.label}</option>
									{/each}
								</select>
							{/if}
						</div>
					</div>
				</div>

			{:else if currentStep === 4}
				<!-- Step 4: Risk Assessment & Review -->
				<div class="space-y-6">
					<h2 class="text-xl font-semibold text-neutral-900 mb-6">Risk Assessment</h2>
					
					<div>
						<label for="previousClaims" class="block text-sm font-medium text-neutral-700 mb-2">
							Previous Claims (Last 5 Years)
						</label>
						<textarea
							id="previousClaims"
							rows="3"
							bind:value={formData.previousClaims}
							placeholder="Describe any previous insurance claims, incidents, or lawsuits..."
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						></textarea>
					</div>

					<div>
						<label class="block text-sm font-medium text-neutral-700 mb-2">
							Safety Programs in Place
						</label>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
							{#each safetyProgramOptions as program}
								<label class="flex items-center">
									<input
										type="checkbox"
										bind:group={formData.safetyPrograms}
										value={program}
										class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
									/>
									<span class="ml-2 text-neutral-700">{program}</span>
								</label>
							{/each}
						</div>
					</div>

					<div>
						<label for="riskFactors" class="block text-sm font-medium text-neutral-700 mb-2">
							Additional Risk Factors
						</label>
						<textarea
							id="riskFactors"
							rows="3"
							bind:value={formData.riskFactors}
							placeholder="Describe any unique risks associated with your business operations..."
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						></textarea>
					</div>

					<!-- Coverage Summary -->
					<div class="bg-primary-50 border border-primary-200 rounded-lg p-6">
						<h3 class="text-lg font-medium text-primary-900 mb-2">Estimated Monthly Premium</h3>
						<p class="text-3xl font-bold text-primary-600">${calculateEstimatedPremium()}</p>
						<p class="text-sm text-primary-700 mt-1">*Final premium subject to underwriting review</p>
						
						<div class="mt-4 text-sm text-primary-800">
							<p class="font-medium mb-1">Selected Coverage:</p>
							<ul class="space-y-1">
								{#if formData.generalLiability.selected}
									<li>• General Liability: ${formData.generalLiability.limit.toLocaleString()}</li>
								{/if}
								{#if formData.professionalLiability.selected}
									<li>• Professional Liability: ${formData.professionalLiability.limit.toLocaleString()}</li>
								{/if}
								{#if formData.workersComp.selected}
									<li>• Workers' Compensation</li>
								{/if}
								{#if formData.businessProperty.selected}
									<li>• Business Property Insurance</li>
								{/if}
								{#if formData.cyberLiability.selected}
									<li>• Cyber Liability: ${formData.cyberLiability.limit.toLocaleString()}</li>
								{/if}
							</ul>
						</div>
					</div>
				</div>
			{/if}

			<!-- Navigation Buttons -->
			<div class="flex justify-between mt-8 pt-6 border-t border-neutral-200">
				<div>
					{#if currentStep > 1}
						<button
							type="button"
							on:click={prevStep}
							class="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-6 py-2 rounded-md font-medium transition-colors"
						>
							Previous
						</button>
					{/if}
				</div>

				<div>
					{#if currentStep < totalSteps}
						<button
							type="button"
							on:click={nextStep}
							class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
						>
							Next
						</button>
					{:else}
						<button
							type="button"
							on:click={submitApplication}
							disabled={loading}
							class="bg-success-600 hover:bg-success-700 disabled:bg-neutral-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center"
						>
							{#if loading}
								<LoadingSpinner size="sm" />
								<span class="ml-2">Submitting...</span>
							{:else}
								Submit Application
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Help Section -->
		<div class="mt-8 bg-neutral-100 rounded-lg p-6">
			<h3 class="text-lg font-medium text-neutral-900 mb-2">Need Help?</h3>
			<p class="text-neutral-600 mb-4">Our commercial insurance specialists can help you determine the right coverage for your business risks.</p>
			<div class="flex flex-col sm:flex-row gap-4">
				<a
					href="/contact"
					class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-center transition-colors"
				>
					Contact Specialist
				</a>
				<a
					href="tel:+15551234567"
					class="border border-neutral-300 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-md text-center transition-colors"
				>
					Call (555) 123-4567
				</a>
			</div>
		</div>
	</div>
</div> 