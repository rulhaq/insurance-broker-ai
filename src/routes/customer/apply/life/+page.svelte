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
		gender: '',
		maritalStatus: 'single',
		occupation: '',
		annualIncome: '',
		
		// Coverage Information
		coverageType: 'term',
		coverageAmount: 250000,
		termLength: 20,
		
		// Health Information
		height: '',
		weight: '',
		smoker: false,
		medicalConditions: '',
		prescriptions: '',
		familyHistory: '',
		
		// Beneficiaries
		beneficiaries: [{
			name: '',
			relationship: 'spouse',
			percentage: 100,
			dateOfBirth: ''
		}]
	};

	const coverageAmounts = [
		{ value: 100000, label: '$100,000' },
		{ value: 250000, label: '$250,000' },
		{ value: 500000, label: '$500,000' },
		{ value: 750000, label: '$750,000' },
		{ value: 1000000, label: '$1,000,000' },
		{ value: 1500000, label: '$1,500,000' },
		{ value: 2000000, label: '$2,000,000' }
	];

	const termLengths = [
		{ value: 10, label: '10 Years' },
		{ value: 15, label: '15 Years' },
		{ value: 20, label: '20 Years' },
		{ value: 30, label: '30 Years' }
	];

	const relationships = [
		{ value: 'spouse', label: 'Spouse' },
		{ value: 'child', label: 'Child' },
		{ value: 'parent', label: 'Parent' },
		{ value: 'sibling', label: 'Sibling' },
		{ value: 'other', label: 'Other' }
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
			console.log('🔍 Loading existing life application for edit:', editApplicationId);
			
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
				console.log('📋 Populating life form with existing data');
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

	function addBeneficiary() {
		formData.beneficiaries = [...formData.beneficiaries, {
			name: '',
			relationship: 'child',
			percentage: 0,
			dateOfBirth: ''
		}];
	}

	function removeBeneficiary(index) {
		formData.beneficiaries = formData.beneficiaries.filter((_, i) => i !== index);
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
				console.log('📝 Updating existing life application:', editApplicationId);
				await updateDoc(doc(db, 'quotes', editApplicationId), submissionData);
				goto(`/customer/applications/${editApplicationId}?updated=true`);
			} else {
				// Create new application
				console.log('📝 Creating new life application');
				const newApplicationData = {
					customerId: $currentUser.uid,
					customerEmail: $currentUser.email,
					customerName: `${formData.firstName} ${formData.lastName}`,
					coverageType: 'life',
					status: 'submitted',
					submittedAt: serverTimestamp(),
					createdAt: serverTimestamp(),
					...submissionData
				};

				await addDoc(collection(db, 'quotes'), newApplicationData);
				goto('/customer/applications?success=life-insurance');
			}
			
		} catch (error) {
			console.error('Error submitting application:', error);
			alert('Error submitting application. Please try again.');
		} finally {
			loading = false;
		}
	}

	function calculateEstimatedPremium() {
		let basePremium = 25;
		
		// Adjust for coverage amount
		basePremium += (formData.coverageAmount / 100000) * 15;
		
		// Adjust for age (estimate from current date)
		const birthYear = new Date(formData.dateOfBirth).getFullYear();
		const age = new Date().getFullYear() - birthYear;
		if (age > 30) basePremium += (age - 30) * 2;
		
		// Adjust for smoker
		if (formData.smoker) basePremium *= 2.5;
		
		// Adjust for coverage type
		if (formData.coverageType === 'whole') basePremium *= 8;
		
		return Math.round(basePremium);
	}
</script>

<svelte:head>
	<title>Life Insurance Application - X Insurance Brokers</title>
	<meta name="description" content="Apply for life insurance to protect your family's financial future." />
</svelte:head>

<div class="min-h-screen bg-neutral-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">Life Insurance Application</h1>
					<p class="text-neutral-600 mt-1">Protect your family's financial future</p>
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

						<div>
							<label for="gender" class="block text-sm font-medium text-neutral-700 mb-2">
								Gender *
							</label>
							<select
								id="gender"
								bind:value={formData.gender}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							>
								<option value="">Select Gender</option>
								<option value="male">Male</option>
								<option value="female">Female</option>
								<option value="other">Other</option>
							</select>
						</div>

						<div>
							<label for="maritalStatus" class="block text-sm font-medium text-neutral-700 mb-2">
								Marital Status
							</label>
							<select
								id="maritalStatus"
								bind:value={formData.maritalStatus}
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							>
								<option value="single">Single</option>
								<option value="married">Married</option>
								<option value="divorced">Divorced</option>
								<option value="widowed">Widowed</option>
							</select>
						</div>

						<div>
							<label for="occupation" class="block text-sm font-medium text-neutral-700 mb-2">
								Occupation *
							</label>
							<input
								id="occupation"
								type="text"
								bind:value={formData.occupation}
								required
								placeholder="Your current job title"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="annualIncome" class="block text-sm font-medium text-neutral-700 mb-2">
								Annual Income *
							</label>
							<input
								id="annualIncome"
								type="number"
								bind:value={formData.annualIncome}
								required
								min="0"
								placeholder="Your annual income"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>
					</div>

					<!-- Coverage Selection -->
					<div class="pt-6 border-t border-neutral-200">
						<h3 class="text-lg font-medium text-neutral-900 mb-4">Coverage Selection</h3>
						
						<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div>
								<label class="block text-sm font-medium text-neutral-700 mb-2">
									Coverage Type *
								</label>
								<div class="space-y-2">
									<label class="flex items-center">
										<input
											type="radio"
											bind:group={formData.coverageType}
											value="term"
											class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
										/>
										<span class="ml-2 text-neutral-700">Term Life</span>
									</label>
									<label class="flex items-center">
										<input
											type="radio"
											bind:group={formData.coverageType}
											value="whole"
											class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
										/>
										<span class="ml-2 text-neutral-700">Whole Life</span>
									</label>
								</div>
							</div>

							<div>
								<label for="coverageAmount" class="block text-sm font-medium text-neutral-700 mb-2">
									Coverage Amount *
								</label>
								<select
									id="coverageAmount"
									bind:value={formData.coverageAmount}
									required
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								>
									{#each coverageAmounts as amount}
										<option value={amount.value}>{amount.label}</option>
									{/each}
								</select>
							</div>

							{#if formData.coverageType === 'term'}
								<div>
									<label for="termLength" class="block text-sm font-medium text-neutral-700 mb-2">
										Term Length *
									</label>
									<select
										id="termLength"
										bind:value={formData.termLength}
										required
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									>
										{#each termLengths as term}
											<option value={term.value}>{term.label}</option>
										{/each}
									</select>
								</div>
							{/if}
						</div>
					</div>
				</div>

			{:else if currentStep === 2}
				<!-- Step 2: Health Information -->
				<div class="space-y-6">
					<h2 class="text-xl font-semibold text-neutral-900 mb-6">Health Information</h2>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label for="height" class="block text-sm font-medium text-neutral-700 mb-2">
								Height (inches) *
							</label>
							<input
								id="height"
								type="number"
								bind:value={formData.height}
								required
								min="48"
								max="96"
								placeholder="e.g., 70"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="weight" class="block text-sm font-medium text-neutral-700 mb-2">
								Weight (lbs) *
							</label>
							<input
								id="weight"
								type="number"
								bind:value={formData.weight}
								required
								min="50"
								max="500"
								placeholder="e.g., 150"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>
					</div>

					<div>
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={formData.smoker}
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
							/>
							<span class="ml-2 text-neutral-700">I am a smoker or have used tobacco products in the last 12 months</span>
						</label>
					</div>

					<div>
						<label for="medicalConditions" class="block text-sm font-medium text-neutral-700 mb-2">
							Medical Conditions
						</label>
						<textarea
							id="medicalConditions"
							rows="3"
							bind:value={formData.medicalConditions}
							placeholder="List any current or past medical conditions, surgeries, or hospitalizations..."
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						></textarea>
					</div>

					<div>
						<label for="prescriptions" class="block text-sm font-medium text-neutral-700 mb-2">
							Current Medications
						</label>
						<textarea
							id="prescriptions"
							rows="3"
							bind:value={formData.prescriptions}
							placeholder="List any medications you are currently taking..."
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						></textarea>
					</div>

					<div>
						<label for="familyHistory" class="block text-sm font-medium text-neutral-700 mb-2">
							Family Health History
						</label>
						<textarea
							id="familyHistory"
							rows="3"
							bind:value={formData.familyHistory}
							placeholder="List any significant health conditions in your immediate family (parents, siblings)..."
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						></textarea>
					</div>
				</div>

			{:else if currentStep === 3}
				<!-- Step 3: Beneficiaries & Review -->
				<div class="space-y-6">
					<div class="flex items-center justify-between">
						<h2 class="text-xl font-semibold text-neutral-900">Beneficiaries</h2>
						<button
							type="button"
							on:click={addBeneficiary}
							class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
						>
							Add Beneficiary
						</button>
					</div>
					
					{#each formData.beneficiaries as beneficiary, index}
						<div class="border border-neutral-200 rounded-lg p-6">
							<div class="flex items-center justify-between mb-4">
								<h3 class="font-medium text-neutral-900">Beneficiary {index + 1}</h3>
								{#if formData.beneficiaries.length > 1}
									<button
										type="button"
										on:click={() => removeBeneficiary(index)}
										class="text-red-600 hover:text-red-700 text-sm"
									>
										Remove
									</button>
								{/if}
							</div>

							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label class="block text-sm font-medium text-neutral-700 mb-2">
										Full Name *
									</label>
									<input
										type="text"
										bind:value={beneficiary.name}
										required
										placeholder="Beneficiary's full name"
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									/>
								</div>

								<div>
									<label class="block text-sm font-medium text-neutral-700 mb-2">
										Relationship *
									</label>
									<select
										bind:value={beneficiary.relationship}
										required
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									>
										{#each relationships as relationship}
											<option value={relationship.value}>{relationship.label}</option>
										{/each}
									</select>
								</div>

								<div>
									<label class="block text-sm font-medium text-neutral-700 mb-2">
										Percentage of Benefit *
									</label>
									<input
										type="number"
										bind:value={beneficiary.percentage}
										required
										min="1"
										max="100"
										placeholder="e.g., 100"
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									/>
								</div>

								<div>
									<label class="block text-sm font-medium text-neutral-700 mb-2">
										Date of Birth *
									</label>
									<input
										type="date"
										bind:value={beneficiary.dateOfBirth}
										required
										class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
									/>
								</div>
							</div>
						</div>
					{/each}

					<!-- Estimated Premium -->
					<div class="bg-primary-50 border border-primary-200 rounded-lg p-6">
						<h3 class="text-lg font-medium text-primary-900 mb-2">Estimated Monthly Premium</h3>
						<p class="text-3xl font-bold text-primary-600">${calculateEstimatedPremium()}</p>
						<p class="text-sm text-primary-700 mt-1">*Final premium subject to medical underwriting</p>
						
						<div class="mt-4 text-sm text-primary-800">
							<p class="font-medium mb-1">Coverage Summary:</p>
							<ul class="space-y-1">
								<li>• Coverage Type: {formData.coverageType === 'term' ? `${formData.termLength}-Year Term` : 'Whole Life'}</li>
								<li>• Coverage Amount: ${formData.coverageAmount.toLocaleString()}</li>
								<li>• Smoker Status: {formData.smoker ? 'Yes' : 'No'}</li>
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
			<p class="text-neutral-600 mb-4">Our life insurance specialists can help you determine the right coverage amount and type for your family's needs.</p>
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