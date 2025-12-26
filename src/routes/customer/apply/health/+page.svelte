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
		address: {
			street: '',
			city: '',
			state: 'CA',
			zipCode: ''
		},
		
		// Health Information
		height: '',
		weight: '',
		smoker: false,
		medicalConditions: '',
		prescriptions: '',
		primaryDoctor: '',
		lastPhysical: '',
		
		// Coverage Information
		planType: 'bronze',
		effectiveDate: '',
		dependents: [],
		preferredProviders: []
	};

	const planTypes = [
		{ value: 'bronze', label: 'Bronze Plan', premium: 320, deductible: 6000, description: 'Basic coverage with lower monthly costs' },
		{ value: 'silver', label: 'Silver Plan', premium: 450, deductible: 4000, description: 'Balanced coverage and costs' },
		{ value: 'gold', label: 'Gold Plan', premium: 580, deductible: 2000, description: 'More coverage, higher monthly costs' },
		{ value: 'platinum', label: 'Platinum Plan', premium: 720, deductible: 1000, description: 'Maximum coverage and benefits' }
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
			console.log('🔍 Loading existing health application for edit:', editApplicationId);
			
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
				console.log('📋 Populating health form with existing data');
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

	function addDependent() {
		formData.dependents = [...formData.dependents, {
			name: '',
			relationship: 'spouse',
			dateOfBirth: '',
			gender: ''
		}];
	}

	function removeDependent(index) {
		formData.dependents = formData.dependents.filter((_, i) => i !== index);
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
				console.log('📝 Updating existing health application:', editApplicationId);
				await updateDoc(doc(db, 'quotes', editApplicationId), submissionData);
				goto(`/customer/applications/${editApplicationId}?updated=true`);
			} else {
				// Create new application
				console.log('📝 Creating new health application');
				const newApplicationData = {
					customerId: $currentUser.uid,
					customerEmail: $currentUser.email,
					customerName: `${formData.firstName} ${formData.lastName}`,
					coverageType: 'health',
					status: 'submitted',
					submittedAt: serverTimestamp(),
					createdAt: serverTimestamp(),
					...submissionData
				};

				await addDoc(collection(db, 'quotes'), newApplicationData);
				goto('/customer/applications?success=health-insurance');
			}
			
		} catch (error) {
			console.error('Error submitting application:', error);
			alert('Error submitting application. Please try again.');
		} finally {
			loading = false;
		}
	}

	function getSelectedPlan() {
		return planTypes.find(plan => plan.value === formData.planType) || planTypes[0];
	}
</script>

<svelte:head>
	<title>Health Insurance Application - X Insurance Brokers</title>
	<meta name="description" content="Apply for comprehensive health insurance coverage." />
</svelte:head>

<div class="min-h-screen bg-neutral-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">Health Insurance Application</h1>
					<p class="text-neutral-600 mt-1">Get comprehensive health coverage for you and your family</p>
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
					</div>

					<!-- Address -->
					<div class="pt-6 border-t border-neutral-200">
						<h3 class="text-lg font-medium text-neutral-900 mb-4">Address Information</h3>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div class="md:col-span-2">
								<label for="street" class="block text-sm font-medium text-neutral-700 mb-2">
									Street Address *
								</label>
								<input
									id="street"
									type="text"
									bind:value={formData.address.street}
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
									bind:value={formData.address.city}
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
									bind:value={formData.address.state}
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
									bind:value={formData.address.zipCode}
									required
									pattern="[0-9]{5}"
									class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								/>
							</div>
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

						<div>
							<label for="primaryDoctor" class="block text-sm font-medium text-neutral-700 mb-2">
								Primary Care Doctor
							</label>
							<input
								id="primaryDoctor"
								type="text"
								bind:value={formData.primaryDoctor}
								placeholder="Doctor's name and practice"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="lastPhysical" class="block text-sm font-medium text-neutral-700 mb-2">
								Last Physical Exam
							</label>
							<input
								id="lastPhysical"
								type="date"
								bind:value={formData.lastPhysical}
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

					<!-- Dependents -->
					<div class="pt-6 border-t border-neutral-200">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-medium text-neutral-900">Dependents (Optional)</h3>
							<button
								type="button"
								on:click={addDependent}
								class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
							>
								Add Dependent
							</button>
						</div>

						{#each formData.dependents as dependent, index}
							<div class="border border-neutral-200 rounded-lg p-4 mb-4">
								<div class="flex items-center justify-between mb-3">
									<h4 class="font-medium text-neutral-900">Dependent {index + 1}</h4>
									<button
										type="button"
										on:click={() => removeDependent(index)}
										class="text-red-600 hover:text-red-700 text-sm"
									>
										Remove
									</button>
								</div>

								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label class="block text-sm font-medium text-neutral-700 mb-2">
											Full Name *
										</label>
										<input
											type="text"
											bind:value={dependent.name}
											required
											class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										/>
									</div>

									<div>
										<label class="block text-sm font-medium text-neutral-700 mb-2">
											Relationship *
										</label>
										<select
											bind:value={dependent.relationship}
											required
											class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										>
											<option value="spouse">Spouse</option>
											<option value="child">Child</option>
											<option value="other">Other</option>
										</select>
									</div>

									<div>
										<label class="block text-sm font-medium text-neutral-700 mb-2">
											Date of Birth *
										</label>
										<input
											type="date"
											bind:value={dependent.dateOfBirth}
											required
											class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										/>
									</div>

									<div>
										<label class="block text-sm font-medium text-neutral-700 mb-2">
											Gender *
										</label>
										<select
											bind:value={dependent.gender}
											required
											class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
										>
											<option value="">Select Gender</option>
											<option value="male">Male</option>
											<option value="female">Female</option>
											<option value="other">Other</option>
										</select>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

			{:else if currentStep === 3}
				<!-- Step 3: Plan Selection & Review -->
				<div class="space-y-6">
					<h2 class="text-xl font-semibold text-neutral-900 mb-6">Plan Selection</h2>
					
					<div>
						<label for="effectiveDate" class="block text-sm font-medium text-neutral-700 mb-2">
							Desired Effective Date *
						</label>
						<input
							id="effectiveDate"
							type="date"
							bind:value={formData.effectiveDate}
							required
							min={new Date().toISOString().split('T')[0]}
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						/>
					</div>

					<!-- Plan Options -->
					<div class="space-y-4">
						<h3 class="text-lg font-medium text-neutral-900">Choose Your Plan</h3>
						
						{#each planTypes as plan}
							<label class="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors {formData.planType === plan.value ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-primary-300'}">
								<input
									type="radio"
									bind:group={formData.planType}
									value={plan.value}
									class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 mt-1"
								/>
								<div class="ml-4 flex-1">
									<div class="flex items-center justify-between">
										<h4 class="text-lg font-semibold text-neutral-900">{plan.label}</h4>
										<div class="text-right">
											<p class="text-2xl font-bold text-primary-600">${plan.premium}</p>
											<p class="text-sm text-neutral-500">per month</p>
										</div>
									</div>
									<p class="text-neutral-600 mb-2">{plan.description}</p>
									<div class="text-sm text-neutral-700">
										<p><strong>Deductible:</strong> ${plan.deductible.toLocaleString()}</p>
										<p><strong>Out-of-pocket max:</strong> ${(plan.deductible * 2).toLocaleString()}</p>
									</div>
								</div>
							</label>
						{/each}
					</div>

					<!-- Coverage Summary -->
					<div class="bg-primary-50 border border-primary-200 rounded-lg p-6">
						<h3 class="text-lg font-medium text-primary-900 mb-4">Coverage Summary</h3>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<p class="text-sm text-primary-800 mb-1"><strong>Selected Plan:</strong></p>
								<p class="text-lg font-semibold text-primary-900">{getSelectedPlan().label}</p>
							</div>
							
							<div>
								<p class="text-sm text-primary-800 mb-1"><strong>Monthly Premium:</strong></p>
								<p class="text-2xl font-bold text-primary-600">${getSelectedPlan().premium * (1 + formData.dependents.length)}</p>
							</div>
							
							<div>
								<p class="text-sm text-primary-800 mb-1"><strong>Covered Members:</strong></p>
								<p class="text-primary-900">{1 + formData.dependents.length} {formData.dependents.length === 0 ? 'person' : 'people'}</p>
							</div>
							
							<div>
								<p class="text-sm text-primary-800 mb-1"><strong>Effective Date:</strong></p>
								<p class="text-primary-900">{formData.effectiveDate || 'Not selected'}</p>
							</div>
						</div>
						
						<p class="text-sm text-primary-700 mt-4">*Premium includes coverage for all listed dependents</p>
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
			<h3 class="text-lg font-medium text-neutral-900 mb-2">Need Help Choosing a Plan?</h3>
			<p class="text-neutral-600 mb-4">Our health insurance specialists can help you select the right plan for your needs and budget.</p>
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