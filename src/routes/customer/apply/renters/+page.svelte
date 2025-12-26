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
	const totalSteps = 3;
	let isEditMode = false;
	let editApplicationId = '';

	let formData = {
		// Personal Information
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		dateOfBirth: '',
		
		// Rental Property Information
		rentalAddress: {
			street: '',
			city: '',
			state: 'CA',
			zipCode: ''
		},
		propertyType: 'apartment',
		moveInDate: '',
		leaseEndDate: '',
		landlordInfo: {
			name: '',
			phone: '',
			email: ''
		},
		
		// Coverage Information
		personalProperty: 25000,
		liability: 100000,
		medicalPayments: 5000,
		lossOfUse: 7500,
		deductible: 500,
		
		// Additional Coverage
		jewelry: {
			selected: false,
			value: 0
		},
		electronics: {
			selected: false,
			value: 0
		},
		collectibles: {
			selected: false,
			value: 0
		},
		
		// Safety Features
		safetyFeatures: [],
		
		// Previous Insurance
		previousInsurer: '',
		continuousCoverage: true,
		reasonForSwitching: ''
	};

	const propertyTypes = [
		{ value: 'apartment', label: 'Apartment' },
		{ value: 'condo', label: 'Condominium' },
		{ value: 'townhouse', label: 'Townhouse' },
		{ value: 'single_family', label: 'Single Family Home' },
		{ value: 'duplex', label: 'Duplex' },
		{ value: 'other', label: 'Other' }
	];

	const personalPropertyValues = [
		{ value: 15000, label: '$15,000' },
		{ value: 25000, label: '$25,000' },
		{ value: 35000, label: '$35,000' },
		{ value: 50000, label: '$50,000' },
		{ value: 75000, label: '$75,000' },
		{ value: 100000, label: '$100,000' }
	];

	const liabilityValues = [
		{ value: 100000, label: '$100,000' },
		{ value: 300000, label: '$300,000' },
		{ value: 500000, label: '$500,000' }
	];

	const deductibleOptions = [
		{ value: 250, label: '$250' },
		{ value: 500, label: '$500' },
		{ value: 1000, label: '$1,000' },
		{ value: 2500, label: '$2,500' }
	];

	const safetyFeatureOptions = [
		'Smoke Detectors',
		'Fire Extinguisher',
		'Security System',
		'Deadbolt Locks',
		'Sprinkler System',
		'Security Cameras',
		'Gated Community',
		'Doorman/Concierge'
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
			console.log('🔍 Loading existing renters application for edit:', editApplicationId);
			
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
				console.log('📋 Populating renters form with existing data');
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
				console.log('📝 Updating existing renters application:', editApplicationId);
				await updateDoc(doc(db, 'quotes', editApplicationId), submissionData);
				goto(`/customer/applications/${editApplicationId}?updated=true`);
			} else {
				// Create new application
				console.log('📝 Creating new renters application');
				const newApplicationData = {
					customerId: $currentUser.uid,
					customerEmail: $currentUser.email,
					customerName: `${formData.firstName} ${formData.lastName}`,
					coverageType: 'renters',
					status: 'submitted',
					submittedAt: serverTimestamp(),
					createdAt: serverTimestamp(),
					...submissionData
				};

				await addDoc(collection(db, 'quotes'), newApplicationData);
				goto('/customer/applications?success=renters-insurance');
			}
			
		} catch (error) {
			console.error('Error submitting application:', error);
			alert('Error submitting application. Please try again.');
		} finally {
			loading = false;
		}
	}

	function calculateEstimatedPremium() {
		let basePremium = 12;
		
		// Adjust for personal property coverage
		basePremium += (formData.personalProperty / 10000) * 2;
		
		// Adjust for liability coverage
		if (formData.liability >= 300000) basePremium += 3;
		if (formData.liability >= 500000) basePremium += 5;
		
		// Adjust for deductible
		basePremium -= (formData.deductible / 250) * 1;
		
		// Adjust for additional coverage
		if (formData.jewelry.selected) basePremium += 5;
		if (formData.electronics.selected) basePremium += 3;
		if (formData.collectibles.selected) basePremium += 4;
		
		// Adjust for safety features
		const safetyDiscount = Math.min(formData.safetyFeatures.length * 0.5, 3);
		basePremium -= safetyDiscount;
		
		return Math.max(Math.round(basePremium), 8);
	}
</script>

<svelte:head>
	<title>Renters Insurance Application - X Insurance Brokers</title>
	<meta name="description" content="Protect your personal belongings with affordable renters insurance." />
</svelte:head>

<div class="min-h-screen bg-neutral-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">Renters Insurance Application</h1>
					<p class="text-neutral-600 mt-1">Protect your personal belongings and liability</p>
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
				<!-- Step 1: Personal & Property Information -->
				<div class="space-y-6">
					<h2 class="text-xl font-semibold text-neutral-900 mb-6">Personal Information</h2>
					
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

						<div>
							<label for="dateOfBirth" class="block text-sm font-medium text-neutral-700 mb-2">
								Date of Birth *
							</label>
							<input
								id="dateOfBirth"
								type="date"
								bind:value={formData.dateOfBirth}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>
					</div>

					<!-- Rental Property Information -->
					<div class="pt-6 border-t border-neutral-200">
						<h3 class="text-lg font-medium text-neutral-900 mb-4">Rental Property Information</h3>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div class="md:col-span-2">
								<label for="street" class="block text-sm font-medium text-neutral-700 mb-2">
									Rental Address *
								</label>
								<input
									id="street"
									type="text"
									bind:value={formData.rentalAddress.street}
									required
									placeholder="Street address"
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
									bind:value={formData.rentalAddress.city}
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
									bind:value={formData.rentalAddress.state}
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
									bind:value={formData.rentalAddress.zipCode}
									required
									pattern="[0-9]{5}"
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								/>
							</div>

							<div>
								<label for="propertyType" class="block text-sm font-medium text-neutral-700 mb-2">
									Property Type *
								</label>
								<select
									id="propertyType"
									bind:value={formData.propertyType}
									required
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								>
									{#each propertyTypes as type}
										<option value={type.value}>{type.label}</option>
									{/each}
								</select>
							</div>

							<div>
								<label for="moveInDate" class="block text-sm font-medium text-neutral-700 mb-2">
									Move-in Date *
								</label>
								<input
									id="moveInDate"
									type="date"
									bind:value={formData.moveInDate}
									required
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								/>
							</div>

							<div>
								<label for="leaseEndDate" class="block text-sm font-medium text-neutral-700 mb-2">
									Lease End Date
								</label>
								<input
									id="leaseEndDate"
									type="date"
									bind:value={formData.leaseEndDate}
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								/>
							</div>
						</div>

						<!-- Landlord Information -->
						<div class="pt-6 border-t border-neutral-200 mt-6">
							<h4 class="text-md font-medium text-neutral-900 mb-4">Landlord Information (Optional)</h4>
							
							<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div>
									<label for="landlordName" class="block text-sm font-medium text-neutral-700 mb-2">
										Landlord Name
									</label>
									<input
										id="landlordName"
										type="text"
										bind:value={formData.landlordInfo.name}
										placeholder="Full name or company"
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									/>
								</div>

								<div>
									<label for="landlordPhone" class="block text-sm font-medium text-neutral-700 mb-2">
										Landlord Phone
									</label>
									<input
										id="landlordPhone"
										type="tel"
										bind:value={formData.landlordInfo.phone}
										placeholder="Phone number"
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									/>
								</div>

								<div>
									<label for="landlordEmail" class="block text-sm font-medium text-neutral-700 mb-2">
										Landlord Email
									</label>
									<input
										id="landlordEmail"
										type="email"
										bind:value={formData.landlordInfo.email}
										placeholder="Email address"
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

			{:else if currentStep === 2}
				<!-- Step 2: Coverage Selection -->
				<div class="space-y-6">
					<h2 class="text-xl font-semibold text-neutral-900 mb-6">Coverage Selection</h2>
					
					<!-- Basic Coverage -->
					<div class="border border-neutral-200 rounded-lg p-6">
						<h3 class="text-lg font-medium text-neutral-900 mb-4">Basic Coverage</h3>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label for="personalProperty" class="block text-sm font-medium text-neutral-700 mb-2">
									Personal Property Coverage *
								</label>
								<select
									id="personalProperty"
									bind:value={formData.personalProperty}
									required
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								>
									{#each personalPropertyValues as value}
										<option value={value.value}>{value.label}</option>
									{/each}
								</select>
								<p class="text-sm text-neutral-600 mt-1">Covers your belongings like furniture, electronics, and clothing</p>
							</div>

							<div>
								<label for="liability" class="block text-sm font-medium text-neutral-700 mb-2">
									Personal Liability Coverage *
								</label>
								<select
									id="liability"
									bind:value={formData.liability}
									required
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								>
									{#each liabilityValues as value}
										<option value={value.value}>{value.label}</option>
									{/each}
								</select>
								<p class="text-sm text-neutral-600 mt-1">Protects you if someone is injured in your rental</p>
							</div>

							<div>
								<label for="medicalPayments" class="block text-sm font-medium text-neutral-700 mb-2">
									Medical Payments to Others
								</label>
								<input
									id="medicalPayments"
									type="number"
									bind:value={formData.medicalPayments}
									min="1000"
									max="25000"
									step="1000"
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								/>
								<p class="text-sm text-neutral-600 mt-1">Covers minor medical expenses for guests</p>
							</div>

							<div>
								<label for="lossOfUse" class="block text-sm font-medium text-neutral-700 mb-2">
									Loss of Use Coverage
								</label>
								<input
									id="lossOfUse"
									type="number"
									bind:value={formData.lossOfUse}
									min="2500"
									max="50000"
									step="2500"
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								/>
								<p class="text-sm text-neutral-600 mt-1">Covers temporary living expenses if your rental becomes uninhabitable</p>
							</div>

							<div>
								<label for="deductible" class="block text-sm font-medium text-neutral-700 mb-2">
									Deductible *
								</label>
								<select
									id="deductible"
									bind:value={formData.deductible}
									required
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								>
									{#each deductibleOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
								<p class="text-sm text-neutral-600 mt-1">Amount you pay before insurance coverage begins</p>
							</div>
						</div>
					</div>

					<!-- Additional Coverage -->
					<div class="border border-neutral-200 rounded-lg p-6">
						<h3 class="text-lg font-medium text-neutral-900 mb-4">Additional Coverage (Optional)</h3>
						
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<div>
									<label class="flex items-center">
										<input
											type="checkbox"
											bind:checked={formData.jewelry.selected}
											class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
										/>
										<span class="ml-2 font-medium text-neutral-900">Jewelry Coverage</span>
									</label>
									<p class="text-sm text-neutral-600 ml-6">Additional coverage for expensive jewelry items</p>
								</div>
								{#if formData.jewelry.selected}
									<input
										type="number"
										bind:value={formData.jewelry.value}
										placeholder="Total value"
										min="0"
										class="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-32"
									/>
								{/if}
							</div>

							<div class="flex items-center justify-between">
								<div>
									<label class="flex items-center">
										<input
											type="checkbox"
											bind:checked={formData.electronics.selected}
											class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
										/>
										<span class="ml-2 font-medium text-neutral-900">Electronics Coverage</span>
									</label>
									<p class="text-sm text-neutral-600 ml-6">Extra protection for computers, cameras, and high-end electronics</p>
								</div>
								{#if formData.electronics.selected}
									<input
										type="number"
										bind:value={formData.electronics.value}
										placeholder="Total value"
										min="0"
										class="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-32"
									/>
								{/if}
							</div>

							<div class="flex items-center justify-between">
								<div>
									<label class="flex items-center">
										<input
											type="checkbox"
											bind:checked={formData.collectibles.selected}
											class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
										/>
										<span class="ml-2 font-medium text-neutral-900">Collectibles Coverage</span>
									</label>
									<p class="text-sm text-neutral-600 ml-6">Coverage for art, antiques, and other collectible items</p>
								</div>
								{#if formData.collectibles.selected}
									<input
										type="number"
										bind:value={formData.collectibles.value}
										placeholder="Total value"
										min="0"
										class="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-32"
									/>
								{/if}
							</div>
						</div>
					</div>
				</div>

			{:else if currentStep === 3}
				<!-- Step 3: Safety Features & Review -->
				<div class="space-y-6">
					<h2 class="text-xl font-semibold text-neutral-900 mb-6">Safety Features & Review</h2>
					
					<!-- Safety Features -->
					<div>
						<h3 class="text-lg font-medium text-neutral-900 mb-4">Safety Features</h3>
						<p class="text-sm text-neutral-600 mb-4">Select all safety features present in your rental. These may qualify you for discounts.</p>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
							{#each safetyFeatureOptions as feature}
								<label class="flex items-center">
									<input
										type="checkbox"
										bind:group={formData.safetyFeatures}
										value={feature}
										class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
									/>
									<span class="ml-2 text-neutral-700">{feature}</span>
								</label>
							{/each}
						</div>
					</div>

					<!-- Previous Insurance -->
					<div class="pt-6 border-t border-neutral-200">
						<h3 class="text-lg font-medium text-neutral-900 mb-4">Previous Insurance</h3>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label for="previousInsurer" class="block text-sm font-medium text-neutral-700 mb-2">
									Previous Insurance Company
								</label>
								<input
									id="previousInsurer"
									type="text"
									bind:value={formData.previousInsurer}
									placeholder="Enter previous insurer name"
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								/>
							</div>

							<div class="flex items-center">
								<label class="flex items-center">
									<input
										type="checkbox"
										bind:checked={formData.continuousCoverage}
										class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
									/>
									<span class="ml-2 text-neutral-700">I have had continuous insurance coverage</span>
								</label>
							</div>
						</div>

						{#if formData.previousInsurer}
							<div class="mt-4">
								<label for="reasonForSwitching" class="block text-sm font-medium text-neutral-700 mb-2">
									Reason for Switching (Optional)
								</label>
								<textarea
									id="reasonForSwitching"
									rows="2"
									bind:value={formData.reasonForSwitching}
									placeholder="Why are you switching insurance companies?"
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								></textarea>
							</div>
						{/if}
					</div>

					<!-- Coverage Summary -->
					<div class="bg-primary-50 border border-primary-200 rounded-lg p-6">
						<h3 class="text-lg font-medium text-primary-900 mb-2">Estimated Monthly Premium</h3>
						<p class="text-3xl font-bold text-primary-600">${calculateEstimatedPremium()}</p>
						<p class="text-sm text-primary-700 mt-1">*Final premium may vary based on underwriting</p>
						
						<div class="mt-4 text-sm text-primary-800">
							<p class="font-medium mb-1">Coverage Summary:</p>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
								<div>
									<ul class="space-y-1">
										<li>• Personal Property: ${formData.personalProperty.toLocaleString()}</li>
										<li>• Liability: ${formData.liability.toLocaleString()}</li>
										<li>• Medical Payments: ${formData.medicalPayments.toLocaleString()}</li>
										<li>• Loss of Use: ${formData.lossOfUse.toLocaleString()}</li>
										<li>• Deductible: ${formData.deductible}</li>
									</ul>
								</div>
								<div>
									{#if formData.jewelry.selected || formData.electronics.selected || formData.collectibles.selected}
										<p class="font-medium mb-1">Additional Coverage:</p>
										<ul class="space-y-1">
											{#if formData.jewelry.selected}
												<li>• Jewelry: ${formData.jewelry.value.toLocaleString()}</li>
											{/if}
											{#if formData.electronics.selected}
												<li>• Electronics: ${formData.electronics.value.toLocaleString()}</li>
											{/if}
											{#if formData.collectibles.selected}
												<li>• Collectibles: ${formData.collectibles.value.toLocaleString()}</li>
											{/if}
										</ul>
									{/if}
									{#if formData.safetyFeatures.length > 0}
										<p class="font-medium mb-1 mt-2">Safety Features:</p>
										<p class="text-xs">{formData.safetyFeatures.length} features selected (may qualify for discounts)</p>
									{/if}
								</div>
							</div>
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
			<p class="text-neutral-600 mb-4">Our renters insurance specialists can help you determine the right coverage for your needs and budget.</p>
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