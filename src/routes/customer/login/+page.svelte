<script lang="ts">
	import { goto } from '$app/navigation';
	import { authService, authError, authLoading } from '$lib/services/auth';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';
	import { onMount } from 'svelte';

	let formData = {
		email: '',
		password: ''
	};

	let formErrors: Record<string, string> = {};
	let showPassword = false;
	let isSubmitting = false;
	let errorMessage = '';

	// Check if user was trying to apply for specific insurance
	let pendingApplication = '';
	onMount(() => {
		pendingApplication = localStorage.getItem('pendingApplication') || '';
	});

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
			
			// Redirect based on pending application or to dashboard
			if (pendingApplication) {
				localStorage.removeItem('pendingApplication');
				goto(`/customer/apply/${pendingApplication}`);
			} else {
				goto('/customer/dashboard');
			}
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
			
			// Redirect based on pending application or to dashboard
			if (pendingApplication) {
				localStorage.removeItem('pendingApplication');
				goto(`/customer/apply/${pendingApplication}`);
			} else {
				goto('/customer/dashboard');
			}
		} catch (error: any) {
			errorMessage = error.message;
		}
	}

	// Handle forgot password
	function handleForgotPassword() {
		goto('/customer/reset-password');
	}

	// Handle signup
	function handleSignUp() {
		goto('/customer/register');
	}
</script>

<svelte:head>
	<title>Sign In - X Insurance Brokers</title>
	<meta name="description" content="Sign in to your X Insurance Brokers customer account to manage your policies and applications." />
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
			Welcome Back
		</h2>
		<p class="mt-2 text-center text-sm text-neutral-600">
			{#if pendingApplication}
				Sign in to continue with your {pendingApplication} insurance application
			{:else}
				Sign in to your customer account
			{/if}
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10">
			<!-- Quick Login Options -->
			<div class="mb-6">
				<div class="text-sm text-neutral-600 mb-4">
					<strong>Demo Accounts:</strong>
				</div>
				<div class="grid grid-cols-1 gap-2 text-xs">
					<button
						on:click={() => {formData.email = 'customer@demo.com'; formData.password = 'Customer123!'}}
						class="text-left p-2 bg-neutral-50 rounded border hover:bg-neutral-100"
					>
						<div class="font-medium text-neutral-900">Customer Demo</div>
						<div class="text-neutral-600">customer@demo.com / Customer123!</div>
					</button>
				</div>
			</div>

			<form on:submit|preventDefault={handleSubmit} class="space-y-6">
				<!-- Email -->
				<div>
					<label for="email" class="block text-sm font-medium text-neutral-700">
						Email Address
					</label>
					<input
						id="email"
						bind:value={formData.email}
						type="email"
						required
						autocomplete="email"
						class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
						class:border-red-500={formErrors.email}
					/>
					{#if formErrors.email}
						<p class="mt-1 text-sm text-red-600">{formErrors.email}</p>
					{/if}
				</div>

				<!-- Password -->
				<div>
					<label for="password" class="block text-sm font-medium text-neutral-700">
						Password
					</label>
					<div class="mt-1 relative">
						{#if showPassword}
							<input
								id="password"
								bind:value={formData.password}
								type="text"
								required
								autocomplete="current-password"
								placeholder="Enter your password"
								class="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								class:border-red-500={formErrors.password}
							/>
						{:else}
							<input
								id="password"
								bind:value={formData.password}
								type="password"
								required
								autocomplete="current-password"
								placeholder="Enter your password"
								class="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								class:border-red-500={formErrors.password}
							/>
						{/if}
						<button
							type="button"
							on:click={() => showPassword = !showPassword}
							class="absolute inset-y-0 right-0 pr-3 flex items-center"
						>
							{#if showPassword}
								<svg class="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
								</svg>
							{:else}
								<svg class="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
								</svg>
							{/if}
						</button>
					</div>
					{#if formErrors.password}
						<p class="mt-1 text-sm text-red-600">{formErrors.password}</p>
					{/if}
				</div>

				<!-- Forgot Password -->
				<div class="flex items-center justify-between">
					<div></div>
					<button
						type="button"
						on:click={handleForgotPassword}
						class="text-sm text-primary-600 hover:text-primary-500"
					>
						Forgot your password?
					</button>
				</div>

				<!-- Error Message -->
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
							<span class="ml-2">Signing in...</span>
						{:else}
							Sign In
						{/if}
					</button>
				</div>

				<!-- Divider -->
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-neutral-300" />
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-2 bg-white text-neutral-500">Or continue with</span>
					</div>
				</div>

				<!-- Google Sign In -->
				<div>
					<button
						type="button"
						on:click={handleGoogleSignIn}
						class="w-full inline-flex justify-center py-3 px-4 border border-neutral-300 rounded-md shadow-sm bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50"
					>
						<svg class="h-5 w-5 mr-2" viewBox="0 0 24 24">
							<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						Sign in with Google
					</button>
				</div>

				<!-- Sign Up Link -->
				<div class="text-center">
					<p class="text-sm text-neutral-600">
						Don't have an account?
						<button
							type="button"
							on:click={handleSignUp}
							class="text-primary-600 hover:text-primary-500 font-medium"
						>
							Create one here
						</button>
					</p>
				</div>
			</form>
		</div>
	</div>
</div> 