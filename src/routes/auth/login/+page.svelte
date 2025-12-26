<script lang="ts">
	import { goto } from '$app/navigation';
	import { authService, authError, authLoading } from '$lib/services/auth';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';
	import Toast from '$components/ui/Toast.svelte';
	import { onMount } from 'svelte';
	import { createAllTestUsers, signInTestUser, testUsers } from '$lib/utils/authTest';

	let formData = {
		email: '',
		password: ''
	};

	let formErrors: Record<string, string> = {};
	let showPassword = false;
	let isSubmitting = false;
	let errorMessage = '';

	// Validate form
	function validateForm() {
		formErrors = {};
		
		if (!formData.email) {
			formErrors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			formErrors.email = 'Please enter a valid email address';
		}
		
		if (!formData.password) {
			formErrors.password = 'Password is required';
		} else if (formData.password.length < 6) {
			formErrors.password = 'Password must be at least 6 characters';
		}
		
		return Object.keys(formErrors).length === 0;
	}

	// Handle form submission
	async function handleSubmit() {
		if (!validateForm()) return;
		
		isSubmitting = true;
		errorMessage = '';
		
		try {
			await authService.signIn(formData);
			goto('/dashboard');
		} catch (error: any) {
			errorMessage = error.message;
		} finally {
			isSubmitting = false;
		}
	}

	// Handle Google sign in
	async function handleGoogleSignIn() {
		try {
			await authService.signInWithGoogle();
			goto('/dashboard');
		} catch (error: any) {
			errorMessage = error.message;
		}
	}

	// Handle forgot password
	function handleForgotPassword() {
		goto('/auth/reset-password');
	}

	// Handle signup
	function handleSignUp() {
		goto('/auth/signup');
	}

	onMount(() => {
		// Clear any existing auth errors
		authError.set(null);
	});
</script>

<svelte:head>
	<title>Sign In - Insurance Broker Pro</title>
	<meta name="description" content="Sign in to your Insurance Broker Pro account to access AI-powered tools for client management and quote comparison." />
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
			Sign in to your account
		</h2>
		<p class="mt-2 text-center text-sm text-neutral-600">
			Or
			<button 
				on:click={handleSignUp}
				class="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline transition-colors"
			>
				create a new account
			</button>
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="card">
			<div class="card-body">
				<!-- Quick Login Options -->
				<div class="mb-6">
					<div class="text-sm text-neutral-600 mb-4">
						<strong>Demo Accounts:</strong>
					</div>
					<div class="grid grid-cols-1 gap-2 text-xs">
						<button
							type="button"
							on:click={() => {formData.email = 'admin@insurancebroker.pro'; formData.password = 'Admin123!'}}
							class="text-left p-2 bg-neutral-50 rounded border hover:bg-neutral-100 transition-colors"
						>
							<div class="font-medium text-neutral-900">Admin User</div>
							<div class="text-neutral-600">admin@insurancebroker.pro / Admin123!</div>
						</button>
						<button
							type="button"
							on:click={() => {formData.email = 'broker@insurancebroker.pro'; formData.password = 'Broker123!'}}
							class="text-left p-2 bg-neutral-50 rounded border hover:bg-neutral-100 transition-colors"
						>
							<div class="font-medium text-neutral-900">Senior Broker</div>
							<div class="text-neutral-600">broker@insurancebroker.pro / Broker123!</div>
						</button>
						<button
							type="button"
							on:click={() => {formData.email = 'junior@insurancebroker.pro'; formData.password = 'Junior123!'}}
							class="text-left p-2 bg-neutral-50 rounded border hover:bg-neutral-100 transition-colors"
						>
							<div class="font-medium text-neutral-900">Junior Broker</div>
							<div class="text-neutral-600">junior@insurancebroker.pro / Junior123!</div>
						</button>
					</div>
				</div>

				<!-- Email/Password Form -->
				<form on:submit|preventDefault={handleSubmit} class="space-y-6">
					<!-- Email -->
					<div>
						<label for="email" class="block text-sm font-medium text-neutral-700 mb-2">
							Email address
						</label>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={formData.email}
							class="input {formErrors.email ? 'input-error' : ''}"
							placeholder="Enter your email"
							disabled={isSubmitting}
						/>
						{#if formErrors.email}
							<p class="mt-1 text-sm text-red-600">{formErrors.email}</p>
						{/if}
					</div>

					<!-- Password -->
					<div>
						<label for="password" class="block text-sm font-medium text-neutral-700 mb-2">
							Password
						</label>
						<div class="relative">
							{#if showPassword}
								<input
									id="password"
									name="password"
									type="text"
									autocomplete="current-password"
									required
									bind:value={formData.password}
									class="input pr-10 {formErrors.password ? 'input-error' : ''}"
									placeholder="Enter your password"
									disabled={isSubmitting}
								/>
							{:else}
								<input
									id="password"
									name="password"
									type="password"
									autocomplete="current-password"
									required
									bind:value={formData.password}
									class="input pr-10 {formErrors.password ? 'input-error' : ''}"
									placeholder="Enter your password"
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
					</div>

					<!-- Remember me & Forgot password -->
					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<input
								id="remember-me"
								name="remember-me"
								type="checkbox"
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
							/>
							<label for="remember-me" class="ml-2 block text-sm text-neutral-900">
								Remember me
							</label>
						</div>

						<div class="text-sm">
							<button
								type="button"
								on:click={handleForgotPassword}
								class="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline transition-colors"
							>
								Forgot your password?
							</button>
						</div>
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
								<span class="ml-2">Signing in...</span>
							{:else}
								Sign in
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>

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
				Don't have an account?
				<button 
					on:click={handleSignUp}
					class="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline transition-colors"
				>
					Sign up for free
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