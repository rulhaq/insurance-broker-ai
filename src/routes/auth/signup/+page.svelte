<script lang="ts">
	import { goto } from '$app/navigation';
	import { authService, authError, authLoading } from '$lib/services/auth';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';
	import Toast from '$components/ui/Toast.svelte';
	import { onMount } from 'svelte';

	let formData = {
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		confirmPassword: '',
		licenseNumber: '',
		phone: '',
		agreeToTerms: false
	};

	let formErrors: Record<string, string> = {};
	let showPassword = false;
	let showConfirmPassword = false;
	let isSubmitting = false;
	let errorMessage = '';
	let successMessage = '';

	// Validate form
	function validateForm() {
		formErrors = {};
		
		if (!formData.firstName.trim()) {
			formErrors.firstName = 'First name is required';
		}
		
		if (!formData.lastName.trim()) {
			formErrors.lastName = 'Last name is required';
		}
		
		if (!formData.email) {
			formErrors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			formErrors.email = 'Please enter a valid email address';
		}
		
		if (!formData.password) {
			formErrors.password = 'Password is required';
		} else if (formData.password.length < 6) {
			formErrors.password = 'Password must be at least 6 characters';
		} else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
			formErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
		}
		
		if (!formData.confirmPassword) {
			formErrors.confirmPassword = 'Please confirm your password';
		} else if (formData.password !== formData.confirmPassword) {
			formErrors.confirmPassword = 'Passwords do not match';
		}
		
		if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
			formErrors.phone = 'Please enter a valid phone number';
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
			await authService.signUp({
				email: formData.email,
				password: formData.password,
				firstName: formData.firstName.trim(),
				lastName: formData.lastName.trim(),
				licenseNumber: formData.licenseNumber.trim() || undefined,
				phone: formData.phone.trim() || undefined,
				role: 'broker'
			});
			
			successMessage = 'Account created successfully! Please check your email to verify your account.';
			
			// Redirect to dashboard after a brief delay
			setTimeout(() => {
				goto('/dashboard');
			}, 2000);
			
		} catch (error: any) {
			errorMessage = error.message;
		} finally {
			isSubmitting = false;
		}
	}



	// Handle login redirect
	function handleLogin() {
		goto('/auth/login');
	}

	onMount(() => {
		// Clear any existing auth errors
		authError.set(null);
	});
</script>

<svelte:head>
	<title>Sign Up - Insurance Broker Pro</title>
	<meta name="description" content="Create your Insurance Broker Pro account and start using AI-powered tools for insurance brokerage." />
</svelte:head>

<div class="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<!-- Logo -->
		<div class="flex justify-center">
			<div class="flex items-center">
				<div class="h-12 w-12 gradient-primary rounded-lg flex items-center justify-center">
					<svg class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
					</svg>
				</div>
				<div class="ml-3">
					<h1 class="text-lg font-bold text-neutral-900">Insurance Broker Pro</h1>
				</div>
			</div>
		</div>
		
		<h2 class="mt-6 text-center text-3xl font-bold text-neutral-900">
			Create your account
		</h2>
		<p class="mt-2 text-center text-sm text-neutral-600">
			Already have an account?
			<button 
				on:click={handleLogin}
				class="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline transition-colors"
			>
				Sign in here
			</button>
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="card">
			<div class="card-body">


				<!-- Registration Form -->
				<form on:submit|preventDefault={handleSubmit} class="space-y-6">
					<!-- Name Fields -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="firstName" class="block text-sm font-medium text-neutral-700 mb-2">
								First name *
							</label>
							<input
								id="firstName"
								name="firstName"
								type="text"
								autocomplete="given-name"
								required
								bind:value={formData.firstName}
								class="input {formErrors.firstName ? 'input-error' : ''}"
								placeholder="John"
								disabled={isSubmitting}
							/>
							{#if formErrors.firstName}
								<p class="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
							{/if}
						</div>

						<div>
							<label for="lastName" class="block text-sm font-medium text-neutral-700 mb-2">
								Last name *
							</label>
							<input
								id="lastName"
								name="lastName"
								type="text"
								autocomplete="family-name"
								required
								bind:value={formData.lastName}
								class="input {formErrors.lastName ? 'input-error' : ''}"
								placeholder="Doe"
								disabled={isSubmitting}
							/>
							{#if formErrors.lastName}
								<p class="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
							{/if}
						</div>
					</div>

					<!-- Email -->
					<div>
						<label for="email" class="block text-sm font-medium text-neutral-700 mb-2">
							Email address *
						</label>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={formData.email}
							class="input {formErrors.email ? 'input-error' : ''}"
							placeholder="john@example.com"
							disabled={isSubmitting}
						/>
						{#if formErrors.email}
							<p class="mt-1 text-sm text-red-600">{formErrors.email}</p>
						{/if}
					</div>

					<!-- Phone (Optional) -->
					<div>
						<label for="phone" class="block text-sm font-medium text-neutral-700 mb-2">
							Phone number
						</label>
						<input
							id="phone"
							name="phone"
							type="tel"
							autocomplete="tel"
							bind:value={formData.phone}
							class="input {formErrors.phone ? 'input-error' : ''}"
							placeholder="+1 (555) 123-4567"
							disabled={isSubmitting}
						/>
						{#if formErrors.phone}
							<p class="mt-1 text-sm text-red-600">{formErrors.phone}</p>
						{/if}
					</div>

					<!-- License Number (Optional) -->
					<div>
						<label for="licenseNumber" class="block text-sm font-medium text-neutral-700 mb-2">
							Insurance license number
						</label>
						<input
							id="licenseNumber"
							name="licenseNumber"
							type="text"
							bind:value={formData.licenseNumber}
							class="input {formErrors.licenseNumber ? 'input-error' : ''}"
							placeholder="Enter your license number"
							disabled={isSubmitting}
						/>
						{#if formErrors.licenseNumber}
							<p class="mt-1 text-sm text-red-600">{formErrors.licenseNumber}</p>
						{/if}
					</div>

					<!-- Password -->
					<div>
						<label for="password" class="block text-sm font-medium text-neutral-700 mb-2">
							Password *
						</label>
						<div class="relative">
							{#if showPassword}
								<input
									id="password"
									name="password"
									type="text"
									autocomplete="new-password"
									required
									bind:value={formData.password}
									class="input pr-10 {formErrors.password ? 'input-error' : ''}"
									placeholder="Create a strong password"
									disabled={isSubmitting}
								/>
							{:else}
								<input
									id="password"
									name="password"
									type="password"
									autocomplete="new-password"
									required
									bind:value={formData.password}
									class="input pr-10 {formErrors.password ? 'input-error' : ''}"
									placeholder="Create a strong password"
									disabled={isSubmitting}
								/>
							{/if}
							<button
								type="button"
								on:click={() => showPassword = !showPassword}
								class="absolute inset-y-0 right-0 pr-3 flex items-center"
							>
								<svg class="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									{#if showPassword}
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3-3l3 3m0 0l3 3m-3-3l3-3" />
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
						<p class="mt-1 text-xs text-neutral-500">
							Must be at least 6 characters with uppercase, lowercase, and number
						</p>
					</div>

					<!-- Confirm Password -->
					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-neutral-700 mb-2">
							Confirm password *
						</label>
						<div class="relative">
							{#if showConfirmPassword}
								<input
									id="confirmPassword"
									name="confirmPassword"
									type="text"
									autocomplete="new-password"
									required
									bind:value={formData.confirmPassword}
									class="input pr-10 {formErrors.confirmPassword ? 'input-error' : ''}"
									placeholder="Confirm your password"
									disabled={isSubmitting}
								/>
							{:else}
								<input
									id="confirmPassword"
									name="confirmPassword"
									type="password"
									autocomplete="new-password"
									required
									bind:value={formData.confirmPassword}
									class="input pr-10 {formErrors.confirmPassword ? 'input-error' : ''}"
									placeholder="Confirm your password"
									disabled={isSubmitting}
								/>
							{/if}
							<button
								type="button"
								on:click={() => showConfirmPassword = !showConfirmPassword}
								class="absolute inset-y-0 right-0 pr-3 flex items-center"
							>
								<svg class="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									{#if showConfirmPassword}
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3-3l3 3m0 0l3 3m-3-3l3-3" />
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

					<!-- Terms Agreement -->
					<div>
						<div class="flex items-start">
							<input
								id="agreeToTerms"
								name="agreeToTerms"
								type="checkbox"
								bind:checked={formData.agreeToTerms}
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded mt-1"
								disabled={isSubmitting}
							/>
							<label for="agreeToTerms" class="ml-2 block text-sm text-neutral-900">
								I agree to the 
								<a href="/terms" class="text-primary-600 hover:text-primary-500 underline" target="_blank">
									Terms of Service
								</a>
								and 
								<a href="/privacy" class="text-primary-600 hover:text-primary-500 underline" target="_blank">
									Privacy Policy
								</a>
							</label>
						</div>
						{#if formErrors.agreeToTerms}
							<p class="mt-1 text-sm text-red-600">{formErrors.agreeToTerms}</p>
						{/if}
					</div>

					<!-- Submit Button -->
					<div>
						<button
							type="submit"
							disabled={isSubmitting || $authLoading}
							class="btn btn-primary btn-md w-full"
						>
							{#if isSubmitting}
								<LoadingSpinner size="sm" color="white" />
								<span class="ml-2">Creating account...</span>
							{:else}
								Create account
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>

		<!-- Success Message -->
		{#if successMessage}
			<div class="mt-4">
				<Toast 
					type="success" 
					message={successMessage} 
					persistent={true}
				/>
			</div>
		{/if}

		<!-- Error Message -->
		{#if errorMessage}
			<div class="mt-4">
				<Toast 
					type="error" 
					message={errorMessage} 
					onClose={() => errorMessage = ''}
				/>
			</div>
		{/if}

		<!-- Footer Links -->
		<div class="mt-6 text-center">
			<p class="text-sm text-neutral-600">
				Already have an account?
				<button 
					on:click={handleLogin}
					class="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline transition-colors"
				>
					Sign in here
				</button>
			</p>
		</div>

		<div class="mt-4 text-center">
			<a 
				href="/"
				class="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
			>
				← Back to homepage
			</a>
		</div>
	</div>
</div> 