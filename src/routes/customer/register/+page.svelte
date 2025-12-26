<script lang="ts">
	import { goto } from '$app/navigation';
	import { authService, authError, authLoading } from '$lib/services/auth';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';
	import { onMount } from 'svelte';

	let formData = {
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		confirmPassword: '',
		phone: '',
		dateOfBirth: '',
		// Company Information
		companyName: '',
		jobTitle: '',
		companySize: '',
		industry: '',
		// Address Information
		address: {
			street: '',
			city: '',
			state: '',
			postalCode: '',
			country: ''
		},
		agreeToTerms: false,
		marketingOptIn: false
	};

	let formErrors: Record<string, string> = {};
	let showPassword = false;
	let showConfirmPassword = false;
	let isSubmitting = false;
	let errorMessage = '';
	let successMessage = '';

	// Check if user was trying to apply for specific insurance
	let pendingApplication = '';
	onMount(() => {
		pendingApplication = localStorage.getItem('pendingApplication') || '';
	});

	// Validate form
	function validateForm() {
		formErrors = {};
		
		if (!formData.firstName) {
			formErrors.firstName = 'First name is required';
		}
		
		if (!formData.lastName) {
			formErrors.lastName = 'Last name is required';
		}
		
		if (!formData.email) {
			formErrors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			formErrors.email = 'Please enter a valid email address';
		}
		
		if (!formData.password) {
			formErrors.password = 'Password is required';
		} else if (formData.password.length < 8) {
			formErrors.password = 'Password must be at least 8 characters';
		}
		
		if (!formData.confirmPassword) {
			formErrors.confirmPassword = 'Please confirm your password';
		} else if (formData.password !== formData.confirmPassword) {
			formErrors.confirmPassword = 'Passwords do not match';
		}
		
		if (!formData.phone) {
			formErrors.phone = 'Phone number is required';
		}
		
		if (!formData.dateOfBirth) {
			formErrors.dateOfBirth = 'Date of birth is required';
		}
		
		if (!formData.address.street) {
			formErrors.street = 'Street address is required';
		}
		
		if (!formData.address.city) {
			formErrors.city = 'City is required';
		}
		
		if (!formData.address.state) {
			formErrors.state = 'State is required';
		}
		
		if (!formData.address.postalCode) {
			formErrors.postalCode = 'Postal code is required';
		}
		
		if (!formData.address.country) {
			formErrors.country = 'Country is required';
		}
		
		if (!formData.agreeToTerms) {
			formErrors.agreeToTerms = 'You must agree to the terms and conditions';
		}
		
		return Object.keys(formErrors).length === 0;
	}

	// Handle form submission
	async function handleSubmit() {
		if (!validateForm()) return;
		
		isSubmitting = true;
		errorMessage = '';
		successMessage = '';
		
		try {
			// Create customer account with role 'customer'
			await authService.signUp({
				email: formData.email,
				password: formData.password,
				firstName: formData.firstName,
				lastName: formData.lastName,
				phone: formData.phone,
				role: 'customer',
				dateOfBirth: formData.dateOfBirth,
				companyName: formData.companyName,
				jobTitle: formData.jobTitle,
				companySize: formData.companySize,
				industry: formData.industry,
				address: formData.address,
				marketingOptIn: formData.marketingOptIn
			});
			
			successMessage = 'Account created successfully! Redirecting...';
			
			// Redirect based on pending application or to dashboard
			setTimeout(() => {
				if (pendingApplication) {
					localStorage.removeItem('pendingApplication');
					goto(`/customer/apply/${pendingApplication}`);
				} else {
					goto('/customer/dashboard');
				}
			}, 2000);
			
		} catch (error: any) {
			errorMessage = error.message;
		} finally {
			isSubmitting = false;
		}
	}

	// Handle sign in redirect
	function handleSignIn() {
		goto('/customer/login');
	}

	// Common industries for dropdown
	const industries = [
		'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
		'Retail', 'Construction', 'Agriculture', 'Transportation', 'Energy',
		'Telecommunications', 'Media', 'Real Estate', 'Consulting', 'Other'
	];
</script>

<svelte:head>
	<title>Create Account - X Insurance Brokers</title>
	<meta name="description" content="Create your customer account to apply for insurance coverage with X Insurance Brokers." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="text-center">
			<a href="/" class="inline-flex items-center">
				<div class="h-12 w-12 gradient-primary rounded-lg flex items-center justify-center">
					<svg class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
					</svg>
				</div>
				<span class="ml-3 text-2xl font-bold text-neutral-900">X Insurance Brokers</span>
			</a>
		</div>
		<h2 class="mt-6 text-center text-3xl font-bold text-neutral-900">
			Create Your Account
		</h2>
		<p class="mt-2 text-center text-sm text-neutral-600">
			{#if pendingApplication}
				Complete your account to continue with your {pendingApplication} insurance application
			{:else}
				Join companies worldwide who trust us for their insurance and risk management needs
			{/if}
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
		<div class="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10">
			<form on:submit|preventDefault={handleSubmit} class="space-y-6">
				<!-- Personal Information -->
				<div>
					<h3 class="text-lg font-medium text-neutral-900 mb-4">Personal Information</h3>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<!-- First Name -->
						<div>
							<label for="firstName" class="block text-sm font-medium text-neutral-700">
								First Name *
							</label>
							<input
								id="firstName"
								bind:value={formData.firstName}
								type="text"
								required
								class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								class:border-red-500={formErrors.firstName}
							/>
							{#if formErrors.firstName}
								<p class="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
							{/if}
						</div>

						<!-- Last Name -->
						<div>
							<label for="lastName" class="block text-sm font-medium text-neutral-700">
								Last Name *
							</label>
							<input
								id="lastName"
								bind:value={formData.lastName}
								type="text"
								required
								class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								class:border-red-500={formErrors.lastName}
							/>
							{#if formErrors.lastName}
								<p class="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
							{/if}
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
						<!-- Email -->
						<div>
							<label for="email" class="block text-sm font-medium text-neutral-700">
								Email Address *
							</label>
							<input
								id="email"
								bind:value={formData.email}
								type="email"
								required
								class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								class:border-red-500={formErrors.email}
							/>
							{#if formErrors.email}
								<p class="mt-1 text-sm text-red-600">{formErrors.email}</p>
							{/if}
						</div>

						<!-- Phone -->
						<div>
							<label for="phone" class="block text-sm font-medium text-neutral-700">
								Phone Number *
							</label>
							<input
								id="phone"
								bind:value={formData.phone}
								type="tel"
								required
								placeholder="(555) 123-4567"
								class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								class:border-red-500={formErrors.phone}
							/>
							{#if formErrors.phone}
								<p class="mt-1 text-sm text-red-600">{formErrors.phone}</p>
							{/if}
						</div>
					</div>

					<!-- Date of Birth -->
					<div class="mt-4">
						<label for="dateOfBirth" class="block text-sm font-medium text-neutral-700">
							Date of Birth *
						</label>
						<input
							id="dateOfBirth"
							bind:value={formData.dateOfBirth}
							type="date"
							required
							class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							class:border-red-500={formErrors.dateOfBirth}
						/>
						{#if formErrors.dateOfBirth}
							<p class="mt-1 text-sm text-red-600">{formErrors.dateOfBirth}</p>
						{/if}
					</div>
				</div>

				<!-- Company Information -->
				<div>
					<h3 class="text-lg font-medium text-neutral-900 mb-4">Company Information</h3>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<!-- Company Name -->
						<div>
							<label for="companyName" class="block text-sm font-medium text-neutral-700">
								Company Name
							</label>
							<input
								id="companyName"
								bind:value={formData.companyName}
								type="text"
								class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							/>
						</div>

						<!-- Job Title -->
						<div>
							<label for="jobTitle" class="block text-sm font-medium text-neutral-700">
								Job Title
							</label>
							<input
								id="jobTitle"
								bind:value={formData.jobTitle}
								type="text"
								class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
						<!-- Company Size -->
						<div>
							<label for="companySize" class="block text-sm font-medium text-neutral-700">
								Company Size
							</label>
							<select
								id="companySize"
								bind:value={formData.companySize}
								class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							>
								<option value="">Select Company Size</option>
								<option value="1-10">1-10 Employees</option>
								<option value="11-50">11-50 Employees</option>
								<option value="51-200">51-200 Employees</option>
								<option value="201-500">201-500 Employees</option>
								<option value="501-1000">501-1000 Employees</option>
								<option value="1001-5000">1001-5000 Employees</option>
								<option value="5001-10000">5001-10000 Employees</option>
								<option value="10001+">10001+ Employees</option>
							</select>
						</div>

						<!-- Industry -->
						<div>
							<label for="industry" class="block text-sm font-medium text-neutral-700">
								Industry
							</label>
							<select
								id="industry"
								bind:value={formData.industry}
								class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							>
								<option value="">Select Industry</option>
								{#each industries as industry}
									<option value={industry}>{industry}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>

				<!-- Address Information -->
				<div>
					<h3 class="text-lg font-medium text-neutral-900 mb-4">Address Information</h3>
					
					<!-- Street Address -->
					<div>
						<label for="street" class="block text-sm font-medium text-neutral-700">
							Street Address *
						</label>
						<input
							id="street"
							bind:value={formData.address.street}
							type="text"
							required
							class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							class:border-red-500={formErrors.street}
						/>
						{#if formErrors.street}
							<p class="mt-1 text-sm text-red-600">{formErrors.street}</p>
						{/if}
					</div>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
						<!-- City -->
						<div>
							<label for="city" class="block text-sm font-medium text-neutral-700">
								City *
							</label>
							<input
								id="city"
								bind:value={formData.address.city}
								type="text"
								required
								class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								class:border-red-500={formErrors.city}
							/>
							{#if formErrors.city}
								<p class="mt-1 text-sm text-red-600">{formErrors.city}</p>
							{/if}
						</div>

						<!-- State/Province -->
						<div>
							<label for="state" class="block text-sm font-medium text-neutral-700">
								State/Province *
							</label>
							<input
								id="state"
								bind:value={formData.address.state}
								type="text"
								required
								placeholder="State, Province, or Region"
								class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								class:border-red-500={formErrors.state}
							/>
							{#if formErrors.state}
								<p class="mt-1 text-sm text-red-600">{formErrors.state}</p>
							{/if}
						</div>

						<!-- ZIP Code -->
						<div>
							<label for="postalCode" class="block text-sm font-medium text-neutral-700">
								Postal Code *
							</label>
							<input
								id="postalCode"
								bind:value={formData.address.postalCode}
								type="text"
								required
								placeholder="12345"
								class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								class:border-red-500={formErrors.postalCode}
							/>
							{#if formErrors.postalCode}
								<p class="mt-1 text-sm text-red-600">{formErrors.postalCode}</p>
							{/if}
						</div>
					</div>

					<!-- Country -->
					<div class="mt-4">
						<label for="country" class="block text-sm font-medium text-neutral-700">
							Country *
						</label>
						<select
							id="country"
							bind:value={formData.address.country}
							required
							class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							class:border-red-500={formErrors.country}
						>
							<option value="">Select Country</option>
							<!-- Major Markets -->
							<option value="United States">United States</option>
							<option value="United Kingdom">United Kingdom</option>
							<option value="Canada">Canada</option>
							<option value="Australia">Australia</option>
							<option value="Germany">Germany</option>
							<option value="France">France</option>
							<option value="Netherlands">Netherlands</option>
							<option value="Switzerland">Switzerland</option>
							<option value="Sweden">Sweden</option>
							<option value="Denmark">Denmark</option>
							<option value="Norway">Norway</option>
							<option value="Japan">Japan</option>
							<option value="Singapore">Singapore</option>
							<option value="Hong Kong">Hong Kong</option>
							<option value="South Korea">South Korea</option>
							<option value="India">India</option>
							<option value="Pakistan">Pakistan</option>
							<option value="Brazil">Brazil</option>
							<option value="Mexico">Mexico</option>
							<option value="Argentina">Argentina</option>
							<option value="Chile">Chile</option>
							<option value="South Africa">South Africa</option>
							<option value="New Zealand">New Zealand</option>
							<!-- Middle East & Gulf Countries -->
							<option value="United Arab Emirates">United Arab Emirates</option>
							<option value="Saudi Arabia">Saudi Arabia</option>
							<option value="Qatar">Qatar</option>
							<option value="Kuwait">Kuwait</option>
							<option value="Bahrain">Bahrain</option>
							<option value="Oman">Oman</option>
							<option value="Turkey">Turkey</option>
							<option value="Iran">Iran</option>
							<option value="Iraq">Iraq</option>
							<option value="Jordan">Jordan</option>
							<option value="Lebanon">Lebanon</option>
							<option value="Syria">Syria</option>
							<option value="Yemen">Yemen</option>
							<option value="Afghanistan">Afghanistan</option>
							<option value="Egypt">Egypt</option>
							<option value="Libya">Libya</option>
							<option value="Tunisia">Tunisia</option>
							<option value="Algeria">Algeria</option>
							<option value="Morocco">Morocco</option>
							<option value="Other">Other</option>
						</select>
						{#if formErrors.country}
							<p class="mt-1 text-sm text-red-600">{formErrors.country}</p>
						{/if}
					</div>
				</div>

				<!-- Password Section -->
				<div>
					<h3 class="text-lg font-medium text-neutral-900 mb-4">Account Security</h3>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<!-- Password -->
						<div>
							<label for="password" class="block text-sm font-medium text-neutral-700">
								Password *
							</label>
							<div class="mt-1 relative">
								{#if showPassword}
									<input
										id="password"
										bind:value={formData.password}
										type="text"
										required
										class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 pr-10"
										class:border-red-500={formErrors.password}
									/>
								{:else}
									<input
										id="password"
										bind:value={formData.password}
										type="password"
										required
										class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 pr-10"
										class:border-red-500={formErrors.password}
									/>
								{/if}
								<button
									type="button"
									class="absolute inset-y-0 right-0 pr-3 flex items-center"
									on:click={() => showPassword = !showPassword}
								>
									<svg class="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										{#if showPassword}
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
										{:else}
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
										{/if}
									</svg>
								</button>
							</div>
							{#if formErrors.password}
								<p class="mt-1 text-sm text-red-600">{formErrors.password}</p>
							{/if}
						</div>

						<!-- Confirm Password -->
						<div>
							<label for="confirmPassword" class="block text-sm font-medium text-neutral-700">
								Confirm Password *
							</label>
							<div class="mt-1 relative">
								{#if showConfirmPassword}
									<input
										id="confirmPassword"
										bind:value={formData.confirmPassword}
										type="text"
										required
										class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 pr-10"
										class:border-red-500={formErrors.confirmPassword}
									/>
								{:else}
									<input
										id="confirmPassword"
										bind:value={formData.confirmPassword}
										type="password"
										required
										class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 pr-10"
										class:border-red-500={formErrors.confirmPassword}
									/>
								{/if}
								<button
									type="button"
									class="absolute inset-y-0 right-0 pr-3 flex items-center"
									on:click={() => showConfirmPassword = !showConfirmPassword}
								>
									<svg class="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										{#if showConfirmPassword}
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
										{:else}
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
										{/if}
									</svg>
								</button>
							</div>
							{#if formErrors.confirmPassword}
								<p class="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
							{/if}
						</div>
					</div>
				</div>

				<!-- Terms and Marketing -->
				<div class="space-y-4">
					<div class="flex items-start">
						<input
							id="agreeToTerms"
							bind:checked={formData.agreeToTerms}
							type="checkbox"
							class="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
						/>
						<label for="agreeToTerms" class="ml-2 block text-sm text-neutral-700">
							I agree to the <a href="/terms" class="text-primary-600 hover:text-primary-500">Terms of Service</a> 
							and <a href="/privacy" class="text-primary-600 hover:text-primary-500">Privacy Policy</a> *
						</label>
					</div>
					{#if formErrors.agreeToTerms}
						<p class="text-sm text-red-600">{formErrors.agreeToTerms}</p>
					{/if}

					<div class="flex items-start">
						<input
							id="marketingOptIn"
							bind:checked={formData.marketingOptIn}
							type="checkbox"
							class="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
						/>
						<label for="marketingOptIn" class="ml-2 block text-sm text-neutral-700">
							I would like to receive marketing communications and special offers
						</label>
					</div>
				</div>

				<!-- Error and Success Messages -->
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

				<!-- Submit Button -->
				<div>
					<button
						type="submit"
						disabled={isSubmitting}
						class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if isSubmitting}
							<LoadingSpinner size="sm" color="white" />
							<span class="ml-2">Creating Account...</span>
						{:else}
							Create Account
						{/if}
					</button>
				</div>

				<!-- Sign In Link -->
				<div class="text-center">
					<p class="text-sm text-neutral-600">
						Already have an account?
						<button
							type="button"
							on:click={handleSignIn}
							class="text-primary-600 hover:text-primary-500 font-medium"
						>
							Sign in here
						</button>
					</p>
				</div>
			</form>
		</div>
	</div>
</div> 