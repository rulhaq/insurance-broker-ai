<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { currentUser } from '$lib/services/auth';
	import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	// Check authentication
	onMount(async () => {
		if (!$currentUser) {
			localStorage.setItem('pendingApplication', 'auto');
			goto('/customer/login');
			return;
		}
		
		// Check if editing existing application
		editApplicationId = $page.url.searchParams.get('edit') || '';
		isEditMode = !!editApplicationId;
		
		if (isEditMode) {
			await loadExistingApplication();
		}
	});

	let currentStep = 1;
	const totalSteps = 4;
	let isSubmitting = false;
	let errorMessage = '';
	let successMessage = '';
	let isEditMode = false;
	let editApplicationId = '';

	// Form data
	let applicationData = {
		// Personal Information
		drivingExperience: '',
		licenseState: '',
		licenseNumber: '',
		
		// Vehicle Information
		vehicles: [{
			year: '',
			make: '',
			model: '',
			vin: '',
			usage: 'personal', // personal, business, pleasure
			annualMileage: '',
			garagedAddress: '',
			ownership: 'owned', // owned, leased, financed
			modifications: []
		}],

		// Coverage Preferences
		coverage: {
			liability: {
				bodilyInjury: '100000/300000',
				propertyDamage: '100000'
			},
			collision: {
				selected: true,
				deductible: '500'
			},
			comprehensive: {
				selected: true,
				deductible: '500'
			},
			uninsuredMotorist: {
				selected: true,
				limit: '100000/300000'
			},
			pip: {
				selected: false,
				limit: '10000'
			},
			rentalReimbursement: {
				selected: false,
				dailyLimit: '30',
				maxDays: '30'
			},
			roadside: {
				selected: true
			}
		},

		// Claims History
		claims: [],
		violations: [],
		
		// Previous Insurance
		previousInsurance: {
			hasInsurance: '',
			carrier: '',
			policyExpiration: '',
			reasonForSwitching: ''
		}
	};

	// Vehicle makes (simplified list)
	const vehicleMakes = [
		'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge',
		'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia', 'Lexus',
		'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Ram', 'Subaru',
		'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
	];

	// US States
	const states = [
		'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
		'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
		'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
		'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
		'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
	];

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

	function addVehicle() {
		applicationData.vehicles = [...applicationData.vehicles, {
			year: '',
			make: '',
			model: '',
			vin: '',
			usage: 'personal',
			annualMileage: '',
			garagedAddress: '',
			ownership: 'owned',
			modifications: []
		}];
	}

	function removeVehicle(index: number) {
		applicationData.vehicles = applicationData.vehicles.filter((_, i) => i !== index);
	}

	function addClaim() {
		applicationData.claims = [...applicationData.claims, {
			date: '',
			type: '',
			amount: '',
			atFault: false,
			description: ''
		}];
	}

	function removeClaim(index: number) {
		applicationData.claims = applicationData.claims.filter((_, i) => i !== index);
	}

	function addViolation() {
		applicationData.violations = [...applicationData.violations, {
			date: '',
			type: '',
			description: ''
		}];
	}

	function removeViolation(index: number) {
		applicationData.violations = applicationData.violations.filter((_, i) => i !== index);
	}

	async function loadExistingApplication() {
		if (!editApplicationId) return;
		
		try {
			isSubmitting = true;
			console.log('🔍 Loading existing auto application for edit:', editApplicationId);
			
			const applicationDoc = await getDoc(doc(db, 'quotes', editApplicationId));
			if (!applicationDoc.exists()) {
				console.error('❌ Application not found');
				goto('/customer/applications');
				return;
			}
			
			const appData = applicationDoc.data();
			
			// Verify ownership
			if (appData.customerId !== $currentUser.uid) {
				console.error('❌ Unauthorized access to application');
				goto('/customer/applications');
				return;
			}
			
			// Populate form with existing data
			if (appData.applicationData) {
				console.log('📋 Populating auto form with existing data');
				applicationData = { ...appData.applicationData };
			}
			
		} catch (error) {
			console.error('❌ Error loading existing application:', error);
			goto('/customer/applications');
		} finally {
			isSubmitting = false;
		}
	}

	async function submitApplication() {
		if (!$currentUser) return;

		isSubmitting = true;
		errorMessage = '';
		successMessage = '';

		try {
			const submissionData = {
				applicationData,
				updatedAt: serverTimestamp()
			};

			if (isEditMode && editApplicationId) {
				// Update existing application
				console.log('📝 Updating existing auto application:', editApplicationId);
				await updateDoc(doc(db, 'quotes', editApplicationId), submissionData);
				successMessage = 'Application updated successfully! Redirecting...';
				setTimeout(() => {
					goto(`/customer/applications/${editApplicationId}?updated=true`);
				}, 2000);
			} else {
				// Create new application
				console.log('📝 Creating new auto application');
				const newApplicationData = {
					customerId: $currentUser.uid,
					customerEmail: $currentUser.email,
					customerName: `${$currentUser.firstName} ${$currentUser.lastName}`,
					coverageType: 'auto',
					status: 'submitted',
					submittedAt: serverTimestamp(),
					createdAt: serverTimestamp(),
					...submissionData
				};
				
				const applicationRef = await addDoc(collection(db, 'quotes'), newApplicationData);
				successMessage = 'Application submitted successfully! Redirecting to rate comparison...';
				setTimeout(() => {
					goto(`/customer/quotes/${applicationRef.id}/compare`);
				}, 2000);
			}

		} catch (error) {
			console.error('Error submitting application:', error);
			errorMessage = 'Failed to submit application. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	function calculateProgress() {
		return (currentStep / totalSteps) * 100;
	}

	function getStepTitle(step: number) {
		switch (step) {
			case 1: return 'Personal Information';
			case 2: return 'Vehicle Details';
			case 3: return 'Coverage Options';
			case 4: return 'Review & Submit';
			default: return '';
		}
	}
</script>

<svelte:head>
	<title>Auto Insurance Application - X Insurance Brokers</title>
	<meta name="description" content="Apply for auto insurance coverage with competitive rates and comprehensive protection." />
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	<!-- Header -->
	<div class="bg-white shadow-sm border-b border-neutral-200">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">Auto Insurance Application</h1>
					<p class="text-neutral-600">Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}</p>
				</div>
				<a
					href="/customer/dashboard"
					class="text-neutral-600 hover:text-neutral-900 font-medium"
				>
					← Back to Dashboard
				</a>
			</div>
			
			<!-- Progress Bar -->
			<div class="mt-6">
				<div class="bg-neutral-200 rounded-full h-2">
					<div 
						class="bg-primary-600 h-2 rounded-full transition-all duration-300"
						style="width: {calculateProgress()}%"
					></div>
				</div>
			</div>
		</div>
	</div>

	<!-- Form Content -->
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
			{#if currentStep === 1}
				<!-- Step 1: Personal Information -->
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-semibold text-neutral-900 mb-4">Personal Information</h2>
						<p class="text-neutral-600 mb-6">Tell us about your driving experience and license information.</p>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label class="block text-sm font-medium text-neutral-700 mb-2">
								Years of Driving Experience
							</label>
							<select
								bind:value={applicationData.drivingExperience}
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							>
								<option value="">Select years</option>
								<option value="0-2">0-2 years</option>
								<option value="3-5">3-5 years</option>
								<option value="6-10">6-10 years</option>
								<option value="11-15">11-15 years</option>
								<option value="16+">16+ years</option>
							</select>
						</div>

						<div>
							<label class="block text-sm font-medium text-neutral-700 mb-2">
								License State
							</label>
							<select
								bind:value={applicationData.licenseState}
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							>
								<option value="">Select state</option>
								{#each states as state}
									<option value={state}>{state}</option>
								{/each}
							</select>
						</div>

						<div class="md:col-span-2">
							<label class="block text-sm font-medium text-neutral-700 mb-2">
								Driver's License Number
							</label>
							<input
								bind:value={applicationData.licenseNumber}
								type="text"
								placeholder="Enter your license number"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>
					</div>

					<!-- Previous Insurance -->
					<div class="border-t border-neutral-200 pt-6">
						<h3 class="text-lg font-medium text-neutral-900 mb-4">Previous Insurance</h3>
						
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Do you currently have auto insurance?
								</label>
								<div class="flex space-x-4">
									<label class="flex items-center">
										<input
											bind:group={applicationData.previousInsurance.hasInsurance}
											value="yes"
											type="radio"
											class="text-primary-600 focus:ring-primary-500"
										/>
										<span class="ml-2 text-neutral-700">Yes</span>
									</label>
									<label class="flex items-center">
										<input
											bind:group={applicationData.previousInsurance.hasInsurance}
											value="no"
											type="radio"
											class="text-primary-600 focus:ring-primary-500"
										/>
										<span class="ml-2 text-neutral-700">No</span>
									</label>
								</div>
							</div>

							{#if applicationData.previousInsurance.hasInsurance === 'yes'}
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label class="block text-sm font-medium text-neutral-700 mb-2">
											Current Insurance Carrier
										</label>
										<input
											bind:value={applicationData.previousInsurance.carrier}
											type="text"
											placeholder="Insurance company name"
											class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										/>
									</div>

									<div>
										<label class="block text-sm font-medium text-neutral-700 mb-2">
											Policy Expiration Date
										</label>
										<input
											bind:value={applicationData.previousInsurance.policyExpiration}
											type="date"
											class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										/>
									</div>

									<div class="md:col-span-2">
										<label class="block text-sm font-medium text-neutral-700 mb-2">
											Reason for Switching (Optional)
										</label>
										<textarea
											bind:value={applicationData.previousInsurance.reasonForSwitching}
											rows="3"
											placeholder="Why are you looking for new insurance?"
											class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										></textarea>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

			{:else if currentStep === 2}
				<!-- Step 2: Vehicle Information -->
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-semibold text-neutral-900 mb-4">Vehicle Information</h2>
						<p class="text-neutral-600 mb-6">Add details about the vehicles you want to insure.</p>
					</div>

					{#each applicationData.vehicles as vehicle, index}
						<div class="border border-neutral-200 rounded-lg p-6">
							<div class="flex items-center justify-between mb-4">
								<h3 class="text-lg font-medium text-neutral-900">Vehicle {index + 1}</h3>
								{#if applicationData.vehicles.length > 1}
									<button
										on:click={() => removeVehicle(index)}
										class="text-red-600 hover:text-red-800 text-sm font-medium"
									>
										Remove Vehicle
									</button>
								{/if}
							</div>

							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<label class="block text-sm font-medium text-neutral-700 mb-2">Year</label>
									<select
										bind:value={vehicle.year}
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									>
										<option value="">Year</option>
										{#each Array.from({length: 30}, (_, i) => 2024 - i) as year}
											<option value={year}>{year}</option>
										{/each}
									</select>
								</div>

								<div>
									<label class="block text-sm font-medium text-neutral-700 mb-2">Make</label>
									<select
										bind:value={vehicle.make}
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									>
										<option value="">Make</option>
										{#each vehicleMakes as make}
											<option value={make}>{make}</option>
										{/each}
									</select>
								</div>

								<div>
									<label class="block text-sm font-medium text-neutral-700 mb-2">Model</label>
									<input
										bind:value={vehicle.model}
										type="text"
										placeholder="Model"
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									/>
								</div>

								<div class="md:col-span-2">
									<label class="block text-sm font-medium text-neutral-700 mb-2">VIN (17 characters)</label>
									<input
										bind:value={vehicle.vin}
										type="text"
										placeholder="Vehicle Identification Number"
										maxlength="17"
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									/>
								</div>

								<div>
									<label class="block text-sm font-medium text-neutral-700 mb-2">Annual Mileage</label>
									<select
										bind:value={vehicle.annualMileage}
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									>
										<option value="">Select mileage</option>
										<option value="0-5000">0-5,000 miles</option>
										<option value="5001-10000">5,001-10,000 miles</option>
										<option value="10001-15000">10,001-15,000 miles</option>
										<option value="15001-20000">15,001-20,000 miles</option>
										<option value="20001+">20,001+ miles</option>
									</select>
								</div>

								<div>
									<label class="block text-sm font-medium text-neutral-700 mb-2">Primary Use</label>
									<select
										bind:value={vehicle.usage}
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									>
										<option value="personal">Personal</option>
										<option value="business">Business</option>
										<option value="pleasure">Pleasure Only</option>
									</select>
								</div>

								<div>
									<label class="block text-sm font-medium text-neutral-700 mb-2">Ownership</label>
									<select
										bind:value={vehicle.ownership}
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									>
										<option value="owned">Owned</option>
										<option value="leased">Leased</option>
										<option value="financed">Financed</option>
									</select>
								</div>

								<div class="md:col-span-3">
									<label class="block text-sm font-medium text-neutral-700 mb-2">Garaged Address</label>
									<input
										bind:value={vehicle.garagedAddress}
										type="text"
										placeholder="Where is the vehicle primarily parked?"
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									/>
								</div>
							</div>
						</div>
					{/each}

					<button
						on:click={addVehicle}
						class="w-full border-2 border-dashed border-neutral-300 rounded-lg p-6 hover:border-primary-400 hover:bg-primary-50 transition-colors"
					>
						<div class="text-center">
							<svg class="mx-auto h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							<p class="mt-2 text-sm text-neutral-600">Add Another Vehicle</p>
						</div>
					</button>
				</div>

			{:else if currentStep === 3}
				<!-- Step 3: Coverage Options -->
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-semibold text-neutral-900 mb-4">Coverage Options</h2>
						<p class="text-neutral-600 mb-6">Select your preferred coverage levels and deductibles.</p>
					</div>

					<!-- Liability Coverage -->
					<div class="border border-neutral-200 rounded-lg p-6">
						<h3 class="text-lg font-medium text-neutral-900 mb-4">Liability Coverage (Required)</h3>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Bodily Injury Liability
								</label>
								<select
									bind:value={applicationData.coverage.liability.bodilyInjury}
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								>
									<option value="50000/100000">$50,000/$100,000</option>
									<option value="100000/300000">$100,000/$300,000 (Recommended)</option>
									<option value="250000/500000">$250,000/$500,000</option>
									<option value="500000/1000000">$500,000/$1,000,000</option>
								</select>
							</div>

							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Property Damage Liability
								</label>
								<select
									bind:value={applicationData.coverage.liability.propertyDamage}
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								>
									<option value="50000">$50,000</option>
									<option value="100000">$100,000 (Recommended)</option>
									<option value="250000">$250,000</option>
									<option value="500000">$500,000</option>
								</select>
							</div>
						</div>
					</div>

					<!-- Collision Coverage -->
					<div class="border border-neutral-200 rounded-lg p-6">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-medium text-neutral-900">Collision Coverage</h3>
							<label class="flex items-center">
								<input
									bind:checked={applicationData.coverage.collision.selected}
									type="checkbox"
									class="text-primary-600 focus:ring-primary-500 rounded"
								/>
								<span class="ml-2 text-sm text-neutral-700">Include Collision</span>
							</label>
						</div>

						{#if applicationData.coverage.collision.selected}
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Collision Deductible
								</label>
								<select
									bind:value={applicationData.coverage.collision.deductible}
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								>
									<option value="250">$250</option>
									<option value="500">$500 (Most Popular)</option>
									<option value="1000">$1,000</option>
									<option value="2500">$2,500</option>
								</select>
							</div>
						{/if}
					</div>

					<!-- Comprehensive Coverage -->
					<div class="border border-neutral-200 rounded-lg p-6">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-medium text-neutral-900">Comprehensive Coverage</h3>
							<label class="flex items-center">
								<input
									bind:checked={applicationData.coverage.comprehensive.selected}
									type="checkbox"
									class="text-primary-600 focus:ring-primary-500 rounded"
								/>
								<span class="ml-2 text-sm text-neutral-700">Include Comprehensive</span>
							</label>
						</div>

						{#if applicationData.coverage.comprehensive.selected}
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Comprehensive Deductible
								</label>
								<select
									bind:value={applicationData.coverage.comprehensive.deductible}
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								>
									<option value="250">$250</option>
									<option value="500">$500 (Most Popular)</option>
									<option value="1000">$1,000</option>
									<option value="2500">$2,500</option>
								</select>
							</div>
						{/if}
					</div>

					<!-- Additional Coverages -->
					<div class="border border-neutral-200 rounded-lg p-6">
						<h3 class="text-lg font-medium text-neutral-900 mb-4">Additional Coverages</h3>
						
						<div class="space-y-4">
							<!-- Uninsured Motorist -->
							<div class="flex items-center justify-between">
								<div>
									<h4 class="font-medium text-neutral-900">Uninsured/Underinsured Motorist</h4>
									<p class="text-sm text-neutral-600">Protects you if hit by uninsured driver</p>
								</div>
								<label class="flex items-center">
									<input
										bind:checked={applicationData.coverage.uninsuredMotorist.selected}
										type="checkbox"
										class="text-primary-600 focus:ring-primary-500 rounded"
									/>
									<span class="ml-2 text-sm text-neutral-700">Include</span>
								</label>
							</div>

							<!-- Rental Reimbursement -->
							<div class="flex items-center justify-between">
								<div>
									<h4 class="font-medium text-neutral-900">Rental Car Reimbursement</h4>
									<p class="text-sm text-neutral-600">Covers rental car while yours is being repaired</p>
								</div>
								<label class="flex items-center">
									<input
										bind:checked={applicationData.coverage.rentalReimbursement.selected}
										type="checkbox"
										class="text-primary-600 focus:ring-primary-500 rounded"
									/>
									<span class="ml-2 text-sm text-neutral-700">Include</span>
								</label>
							</div>

							<!-- Roadside Assistance -->
							<div class="flex items-center justify-between">
								<div>
									<h4 class="font-medium text-neutral-900">24/7 Roadside Assistance</h4>
									<p class="text-sm text-neutral-600">Towing, jump starts, lockout service</p>
								</div>
								<label class="flex items-center">
									<input
										bind:checked={applicationData.coverage.roadside.selected}
										type="checkbox"
										class="text-primary-600 focus:ring-primary-500 rounded"
									/>
									<span class="ml-2 text-sm text-neutral-700">Include</span>
								</label>
							</div>
						</div>
					</div>
				</div>

			{:else if currentStep === 4}
				<!-- Step 4: Review & Submit -->
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-semibold text-neutral-900 mb-4">Review Your Application</h2>
						<p class="text-neutral-600 mb-6">Please review your information before submitting.</p>
					</div>

					<!-- Summary Cards -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<!-- Personal Info Summary -->
						<div class="bg-neutral-50 rounded-lg p-6">
							<h3 class="font-medium text-neutral-900 mb-3">Personal Information</h3>
							<div class="space-y-2 text-sm">
								<div class="flex justify-between">
									<span class="text-neutral-600">Driving Experience:</span>
									<span class="text-neutral-900">{applicationData.drivingExperience || 'Not specified'}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-neutral-600">License State:</span>
									<span class="text-neutral-900">{applicationData.licenseState || 'Not specified'}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-neutral-600">Previous Insurance:</span>
									<span class="text-neutral-900">{applicationData.previousInsurance.hasInsurance === 'yes' ? 'Yes' : 'No'}</span>
								</div>
							</div>
						</div>

						<!-- Vehicle Summary -->
						<div class="bg-neutral-50 rounded-lg p-6">
							<h3 class="font-medium text-neutral-900 mb-3">Vehicles ({applicationData.vehicles.length})</h3>
							<div class="space-y-2">
								{#each applicationData.vehicles as vehicle, index}
									<div class="text-sm">
										<span class="text-neutral-900 font-medium">
											{vehicle.year} {vehicle.make} {vehicle.model || 'Model not specified'}
										</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Coverage Summary -->
						<div class="bg-neutral-50 rounded-lg p-6 md:col-span-2">
							<h3 class="font-medium text-neutral-900 mb-3">Selected Coverage</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
								<div>
									<span class="text-neutral-600">Bodily Injury Liability:</span>
									<span class="text-neutral-900 ml-2">${applicationData.coverage.liability.bodilyInjury.replace('/', '/$')}</span>
								</div>
								<div>
									<span class="text-neutral-600">Property Damage:</span>
									<span class="text-neutral-900 ml-2">${applicationData.coverage.liability.propertyDamage}</span>
								</div>
								<div>
									<span class="text-neutral-600">Collision:</span>
									<span class="text-neutral-900 ml-2">
										{applicationData.coverage.collision.selected ? `$${applicationData.coverage.collision.deductible} deductible` : 'Not selected'}
									</span>
								</div>
								<div>
									<span class="text-neutral-600">Comprehensive:</span>
									<span class="text-neutral-900 ml-2">
										{applicationData.coverage.comprehensive.selected ? `$${applicationData.coverage.comprehensive.deductible} deductible` : 'Not selected'}
									</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Terms and Conditions -->
					<div class="border border-neutral-200 rounded-lg p-6">
						<h3 class="font-medium text-neutral-900 mb-3">Terms & Conditions</h3>
						<div class="text-sm text-neutral-600 space-y-2">
							<p>By submitting this application, I certify that:</p>
							<ul class="list-disc list-inside space-y-1 ml-4">
								<li>All information provided is true and accurate to the best of my knowledge</li>
								<li>I understand that false information may void my coverage</li>
								<li>I authorize X Insurance Brokers to obtain my motor vehicle record</li>
								<li>I understand that coverage is subject to underwriting approval</li>
							</ul>
						</div>
					</div>

					<!-- Messages -->
					{#if successMessage}
						<div class="p-4 bg-success-50 border border-success-200 rounded-md">
							<div class="flex">
								<svg class="h-5 w-5 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<p class="ml-3 text-sm text-success-800">{successMessage}</p>
							</div>
						</div>
					{/if}

					{#if errorMessage}
						<div class="p-4 bg-red-50 border border-red-200 rounded-md">
							<div class="flex">
								<svg class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<p class="ml-3 text-sm text-red-800">{errorMessage}</p>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Navigation Buttons -->
			<div class="flex justify-between pt-8 border-t border-neutral-200">
				<button
					on:click={prevStep}
					disabled={currentStep === 1}
					class="px-6 py-2 border border-neutral-300 rounded-md font-medium text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					← Previous
				</button>

				{#if currentStep < totalSteps}
					<button
						on:click={nextStep}
						class="px-6 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors"
					>
						Next →
					</button>
				{:else}
					<button
						on:click={submitApplication}
						disabled={isSubmitting}
						class="px-8 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
					>
						{#if isSubmitting}
							<LoadingSpinner size="sm" color="white" />
							<span class="ml-2">Submitting...</span>
						{:else}
							Submit Application
						{/if}
					</button>
				{/if}
			</div>
		</div>
	</div>
</div> 