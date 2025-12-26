<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { currentUser, authService } from '$lib/services/auth';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let loading = false;
	let message = '';
	let isEditing = false;

	let profileData = {
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		dateOfBirth: '',
		address: {
			street: '',
			city: '',
			state: '',
			zipCode: ''
		}
	};

	onMount(() => {
		if (!$currentUser) {
			goto('/customer/login');
			return;
		}
		
		// Load current user data
		if ($currentUser) {
			profileData.firstName = $currentUser.firstName || '';
			profileData.lastName = $currentUser.lastName || '';
			profileData.email = $currentUser.email || '';
			profileData.phone = $currentUser.phone || '';
			profileData.dateOfBirth = $currentUser.dateOfBirth || '';
			if ($currentUser.address) {
				profileData.address = { ...$currentUser.address };
			}
		}
	});

	async function saveProfile() {
		loading = true;
		message = '';

		try {
			await authService.updateUserProfile(profileData);
			message = 'Profile updated successfully!';
			isEditing = false;
		} catch (error) {
			console.error('Error updating profile:', error);
			message = 'Error updating profile. Please try again.';
		} finally {
			loading = false;
		}
	}

	function cancelEdit() {
		isEditing = false;
		// Reset to original data
		if ($currentUser) {
			profileData.firstName = $currentUser.firstName || '';
			profileData.lastName = $currentUser.lastName || '';
			profileData.email = $currentUser.email || '';
			profileData.phone = $currentUser.phone || '';
			profileData.dateOfBirth = $currentUser.dateOfBirth || '';
			if ($currentUser.address) {
				profileData.address = { ...$currentUser.address };
			}
		}
	}
</script>

<svelte:head>
	<title>My Profile - X Insurance Brokers</title>
	<meta name="description" content="Manage your personal information and account details." />
</svelte:head>

<div class="min-h-screen bg-neutral-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">My Profile</h1>
					<p class="text-neutral-600 mt-1">Manage your personal information and account settings</p>
				</div>
				<a
					href="/customer/dashboard"
					class="text-primary-600 hover:text-primary-700 font-medium transition-colors"
				>
					← Back to Dashboard
				</a>
			</div>
		</div>

		<!-- Profile Form -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-xl font-semibold text-neutral-900">Personal Information</h2>
				{#if !isEditing}
					<button
						on:click={() => isEditing = true}
						class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
					>
						Edit Profile
					</button>
				{/if}
			</div>

			{#if message}
				<div class="mb-6 p-4 rounded-lg {message.includes('success') ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-red-50 text-red-700 border border-red-200'}">
					{message}
				</div>
			{/if}

			<form on:submit|preventDefault={saveProfile} class="space-y-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="firstName" class="block text-sm font-medium text-neutral-700 mb-2">
							First Name
						</label>
						<input
							id="firstName"
							type="text"
							bind:value={profileData.firstName}
							disabled={!isEditing}
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500"
						/>
					</div>

					<div>
						<label for="lastName" class="block text-sm font-medium text-neutral-700 mb-2">
							Last Name
						</label>
						<input
							id="lastName"
							type="text"
							bind:value={profileData.lastName}
							disabled={!isEditing}
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500"
						/>
					</div>

					<div>
						<label for="email" class="block text-sm font-medium text-neutral-700 mb-2">
							Email Address
						</label>
						<input
							id="email"
							type="email"
							bind:value={profileData.email}
							disabled={true}
							class="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50 text-neutral-500"
						/>
						<p class="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
					</div>

					<div>
						<label for="phone" class="block text-sm font-medium text-neutral-700 mb-2">
							Phone Number
						</label>
						<input
							id="phone"
							type="tel"
							bind:value={profileData.phone}
							disabled={!isEditing}
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500"
						/>
					</div>

					<div>
						<label for="dateOfBirth" class="block text-sm font-medium text-neutral-700 mb-2">
							Date of Birth
						</label>
						<input
							id="dateOfBirth"
							type="date"
							bind:value={profileData.dateOfBirth}
							disabled={!isEditing}
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500"
						/>
					</div>
				</div>

				<!-- Address Section -->
				<div class="pt-6 border-t border-neutral-200">
					<h3 class="text-lg font-medium text-neutral-900 mb-4">Address</h3>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="md:col-span-2">
							<label for="street" class="block text-sm font-medium text-neutral-700 mb-2">
								Street Address
							</label>
							<input
								id="street"
								type="text"
								bind:value={profileData.address.street}
								disabled={!isEditing}
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500"
							/>
						</div>

						<div>
							<label for="city" class="block text-sm font-medium text-neutral-700 mb-2">
								City
							</label>
							<input
								id="city"
								type="text"
								bind:value={profileData.address.city}
								disabled={!isEditing}
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500"
							/>
						</div>

						<div>
							<label for="state" class="block text-sm font-medium text-neutral-700 mb-2">
								State
							</label>
							<input
								id="state"
								type="text"
								bind:value={profileData.address.state}
								disabled={!isEditing}
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500"
							/>
						</div>

						<div>
							<label for="zipCode" class="block text-sm font-medium text-neutral-700 mb-2">
								ZIP Code
							</label>
							<input
								id="zipCode"
								type="text"
								bind:value={profileData.address.zipCode}
								disabled={!isEditing}
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500"
							/>
						</div>
					</div>
				</div>

				{#if isEditing}
					<div class="flex justify-end space-x-4 pt-6 border-t border-neutral-200">
						<button
							type="button"
							on:click={cancelEdit}
							class="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-6 py-2 rounded-md font-medium transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							class="bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center"
						>
							{#if loading}
								<LoadingSpinner size="sm" />
								<span class="ml-2">Saving...</span>
							{:else}
								Save Changes
							{/if}
						</button>
					</div>
				{/if}
			</form>
		</div>

		<!-- Account Security -->
		<div class="mt-8 bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
			<h2 class="text-xl font-semibold text-neutral-900 mb-6">Account Security</h2>
			
			<div class="space-y-4">
				<div class="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
					<div>
						<h3 class="font-medium text-neutral-900">Password</h3>
						<p class="text-sm text-neutral-600">Last updated 30 days ago</p>
					</div>
					<button class="text-primary-600 hover:text-primary-700 font-medium transition-colors">
						Change Password
					</button>
				</div>

				<div class="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
					<div>
						<h3 class="font-medium text-neutral-900">Two-Factor Authentication</h3>
						<p class="text-sm text-neutral-600">Add an extra layer of security to your account</p>
					</div>
					<button class="text-primary-600 hover:text-primary-700 font-medium transition-colors">
						Enable 2FA
					</button>
				</div>
			</div>
		</div>
	</div>
</div> 