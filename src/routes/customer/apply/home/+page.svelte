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
		
		// Property Information
		propertyType: 'single-family',
		address: {
			street: '',
			city: '',
			state: 'CA',
			zipCode: ''
		},
		yearBuilt: '',
		squareFootage: '',
		bedrooms: '',
		bathrooms: '',
		
		// Coverage Information
		dwellingCoverage: 300000,
		personalProperty: 150000,
		liability: 300000,
		deductible: 1000,
		additionalCoverage: {
			flood: false,
			earthquake: false,
			jewelry: false,
			electronics: false
		}
	};

	const propertyTypes = [
		{ value: 'single-family', label: 'Single Family Home' },
		{ value: 'condo', label: 'Condominium' },
		{ value: 'townhouse', label: 'Townhouse' },
		{ value: 'duplex', label: 'Duplex' },
		{ value: 'mobile-home', label: 'Mobile Home' }
	];

	const coverageAmounts = [
		{ value: 200000, label: '$200,000' },
		{ value: 300000, label: '$300,000' },
		{ value: 400000, label: '$400,000' },
		{ value: 500000, label: '$500,000' },
		{ value: 750000, label: '$750,000' },
		{ value: 1000000, label: '$1,000,000' }
	];

	const deductibles = [
		{ value: 500, label: '$500' },
		{ value: 1000, label: '$1,000' },
		{ value: 2500, label: '$2,500' },
		{ value: 5000, label: '$5,000' }
	];

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
			console.log('🔍 Loading existing application for edit:', editApplicationId);
			
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
				console.log('📋 Populating form with existing data');
				const existingData = applicationData.applicationData;
				
				// Personal Info
				if (existingData.personalInfo) {
					formData.firstName = existingData.personalInfo.firstName || '';
					formData.lastName = existingData.personalInfo.lastName || '';
					formData.email = existingData.personalInfo.email || '';
					formData.phone = existingData.personalInfo.phone || '';
					formData.dateOfBirth = existingData.personalInfo.dateOfBirth || '';
					if (existingData.personalInfo.address) {
						formData.address = { ...existingData.personalInfo.address };
					}
				}
				
				// Property Info
				if (existingData.propertyInfo) {
					formData.propertyType = existingData.propertyInfo.type || 'single-family';
					formData.yearBuilt = existingData.propertyInfo.yearBuilt?.toString() || '';
					formData.squareFootage = existingData.propertyInfo.squareFootage?.toString() || '';
					formData.bedrooms = existingData.propertyInfo.bedrooms?.toString() || '';
					formData.bathrooms = existingData.propertyInfo.bathrooms?.toString() || '';
				}
				
				// Coverage Info
				if (existingData.coverageInfo) {
					formData.dwellingCoverage = existingData.coverageInfo.dwellingCoverage || 300000;
					formData.personalProperty = existingData.coverageInfo.personalProperty || 150000;
					formData.liability = existingData.coverageInfo.liability || 300000;
					formData.deductible = existingData.coverageInfo.deductible || 1000;
					if (existingData.coverageInfo.additionalCoverage) {
						formData.additionalCoverage = { ...existingData.coverageInfo.additionalCoverage };
					}
				}
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
			const applicationData = {
				applicationData: {
					personalInfo: {
						firstName: formData.firstName,
						lastName: formData.lastName,
						email: formData.email,
						phone: formData.phone,
						dateOfBirth: formData.dateOfBirth,
						address: formData.address
					},
					propertyInfo: {
						type: formData.propertyType,
						address: formData.address,
						yearBuilt: parseInt(formData.yearBuilt),
						squareFootage: parseInt(formData.squareFootage),
						bedrooms: parseInt(formData.bedrooms),
						bathrooms: parseInt(formData.bathrooms)
					},
					coverageInfo: {
						dwellingCoverage: formData.dwellingCoverage,
						personalProperty: formData.personalProperty,
						liability: formData.liability,
						deductible: formData.deductible,
						additionalCoverage: formData.additionalCoverage
					}
				},
				updatedAt: serverTimestamp()
			};

			if (isEditMode && editApplicationId) {
				// Update existing application
				console.log('📝 Updating existing application:', editApplicationId);
				await updateDoc(doc(db, 'quotes', editApplicationId), applicationData);
				goto(`/customer/applications/${editApplicationId}?updated=true`);
			} else {
				// Create new application
				console.log('📝 Creating new application');
				const newApplicationData = {
					customerId: $currentUser.uid,
					customerEmail: $currentUser.email,
					customerName: `${formData.firstName} ${formData.lastName}`,
					coverageType: 'home',
					status: 'submitted',
					submittedAt: serverTimestamp(),
					createdAt: serverTimestamp(),
					...applicationData
				};
				
				await addDoc(collection(db, 'quotes'), newApplicationData);
				goto('/customer/applications?success=home-insurance');
			}
			
		} catch (error) {
			console.error('Error submitting application:', error);
			alert('Error submitting application. Please try again.');
		} finally {
			loading = false;
		}
	}

	function calculateEstimatedPremium() {
		// Simple premium calculation for demo
		let basePremium = 800;
		
		// Adjust for dwelling coverage
		basePremium += (formData.dwellingCoverage / 100000) * 50;
		
		// Adjust for deductible
		basePremium -= (formData.deductible / 1000) * 20;
		
		// Adjust for property type
		if (formData.propertyType === 'condo') basePremium *= 0.8;
		if (formData.propertyType === 'mobile-home') basePremium *= 1.2;
		
		return Math.round(basePremium);
	}
</script>

<svelte:head>
	<title>Home Insurance Application - X Insurance Brokers</title>
	<meta name="description" content="Apply for comprehensive home insurance coverage with competitive rates." />
</svelte:head>

<div class="min-h-screen bg-neutral-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">
						{isEditMode ? 'Edit' : ''} Home Insurance Application
						{#if isEditMode}
							<span class="text-sm font-normal text-primary-600 bg-primary-50 px-2 py-1 rounded ml-2">
								Editing Application
							</span>
						{/if}
					</h1>
					<p class="text-neutral-600 mt-1">
						{isEditMode ? 'Update your home insurance application details' : 'Get comprehensive coverage for your home'}
					</p>
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
				<!-- Step 1: Personal Information -->
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
				</div>

			{:else if currentStep === 2}
				<!-- Step 2: Property Information -->
				<div class="space-y-6">
					<h2 class="text-xl font-semibold text-neutral-900 mb-6">Property Information</h2>
					
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

					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="md:col-span-2">
							<label for="street" class="block text-sm font-medium text-neutral-700 mb-2">
								Property Address *
							</label>
							<input
								id="street"
								type="text"
								bind:value={formData.address.street}
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
								bind:value={formData.address.city}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="zipCode" class="block text-sm font-medium text-neutral-700 mb-2">
								ZIP Code *
							</label>
							<input
								id="zipCode"
								type="text"
								bind:value={formData.address.zipCode}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="yearBuilt" class="block text-sm font-medium text-neutral-700 mb-2">
								Year Built *
							</label>
							<input
								id="yearBuilt"
								type="number"
								bind:value={formData.yearBuilt}
								required
								min="1800"
								max="2024"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="squareFootage" class="block text-sm font-medium text-neutral-700 mb-2">
								Square Footage *
							</label>
							<input
								id="squareFootage"
								type="number"
								bind:value={formData.squareFootage}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="bedrooms" class="block text-sm font-medium text-neutral-700 mb-2">
								Bedrooms *
							</label>
							<input
								id="bedrooms"
								type="number"
								bind:value={formData.bedrooms}
								required
								min="1"
								max="10"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="bathrooms" class="block text-sm font-medium text-neutral-700 mb-2">
								Bathrooms *
							</label>
							<input
								id="bathrooms"
								type="number"
								bind:value={formData.bathrooms}
								required
								min="1"
								max="10"
								step="0.5"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>
					</div>
				</div>

			{:else if currentStep === 3}
				<!-- Step 3: Coverage Information -->
				<div class="space-y-6">
					<h2 class="text-xl font-semibold text-neutral-900 mb-6">Coverage Information</h2>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label for="dwellingCoverage" class="block text-sm font-medium text-neutral-700 mb-2">
								Dwelling Coverage *
							</label>
							<select
								id="dwellingCoverage"
								bind:value={formData.dwellingCoverage}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							>
								{#each coverageAmounts as amount}
									<option value={amount.value}>{amount.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="personalProperty" class="block text-sm font-medium text-neutral-700 mb-2">
								Personal Property *
							</label>
							<select
								id="personalProperty"
								bind:value={formData.personalProperty}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							>
								{#each coverageAmounts.filter(a => a.value <= 500000) as amount}
									<option value={amount.value}>{amount.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="liability" class="block text-sm font-medium text-neutral-700 mb-2">
								Liability Coverage *
							</label>
							<select
								id="liability"
								bind:value={formData.liability}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							>
								{#each coverageAmounts as amount}
									<option value={amount.value}>{amount.label}</option>
								{/each}
							</select>
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
								{#each deductibles as deductible}
									<option value={deductible.value}>{deductible.label}</option>
								{/each}
							</select>
						</div>
					</div>

					<!-- Additional Coverage -->
					<div>
						<h3 class="text-lg font-medium text-neutral-900 mb-4">Additional Coverage (Optional)</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<label class="flex items-center">
								<input
									type="checkbox"
									bind:checked={formData.additionalCoverage.flood}
									class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
								/>
								<span class="ml-2 text-neutral-700">Flood Insurance</span>
							</label>

							<label class="flex items-center">
								<input
									type="checkbox"
									bind:checked={formData.additionalCoverage.earthquake}
									class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
								/>
								<span class="ml-2 text-neutral-700">Earthquake Insurance</span>
							</label>

							<label class="flex items-center">
								<input
									type="checkbox"
									bind:checked={formData.additionalCoverage.jewelry}
									class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
								/>
								<span class="ml-2 text-neutral-700">Jewelry Coverage</span>
							</label>

							<label class="flex items-center">
								<input
									type="checkbox"
									bind:checked={formData.additionalCoverage.electronics}
									class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
								/>
								<span class="ml-2 text-neutral-700">Electronics Coverage</span>
							</label>
						</div>
					</div>

					<!-- Estimated Premium -->
					<div class="bg-primary-50 border border-primary-200 rounded-lg p-6">
						<h3 class="text-lg font-medium text-primary-900 mb-2">Estimated Monthly Premium</h3>
						<p class="text-3xl font-bold text-primary-600">${calculateEstimatedPremium()}</p>
						<p class="text-sm text-primary-700 mt-1">*Final premium subject to underwriting review</p>
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
								{isEditMode ? 'Update Application' : 'Submit Application'}
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Help Section -->
		<div class="mt-8 bg-neutral-100 rounded-lg p-6">
			<h3 class="text-lg font-medium text-neutral-900 mb-2">Need Help?</h3>
			<p class="text-neutral-600 mb-4">Our insurance experts are here to help you choose the right coverage for your home.</p>
			<div class="flex flex-col sm:flex-row gap-4">
				<a
					href="/contact"
					class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-center transition-colors"
				>
					Contact Expert
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