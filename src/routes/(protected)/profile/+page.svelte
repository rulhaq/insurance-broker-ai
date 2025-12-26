<script lang="ts">
	import { currentUser, authService } from '$lib/services/auth';
	import { onMount } from 'svelte';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let isEditing = false;
	let isLoading = false;
	let message = '';
	let formData = {
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		licenseNumber: '',
		role: ''
	};

	onMount(() => {
		if ($currentUser) {
			formData = {
				firstName: $currentUser.firstName || '',
				lastName: $currentUser.lastName || '',
				email: $currentUser.email || '',
				phone: $currentUser.phone || '',
				licenseNumber: $currentUser.licenseNumber || '',
				role: $currentUser.role || ''
			};
		}
	});

	async function handleSave() {
		if (!$currentUser) return;

		isLoading = true;
		try {
			await authService.updateUserProfile({
				firstName: formData.firstName,
				lastName: formData.lastName,
				phone: formData.phone,
				licenseNumber: formData.licenseNumber
			});
			
			message = 'Profile updated successfully!';
			isEditing = false;
			setTimeout(() => message = '', 3000);
		} catch (error) {
			console.error('Profile update error:', error);
			message = 'Failed to update profile';
		} finally {
			isLoading = false;
		}
	}

	function handleCancel() {
		if ($currentUser) {
			formData = {
				firstName: $currentUser.firstName || '',
				lastName: $currentUser.lastName || '',
				email: $currentUser.email || '',
				phone: $currentUser.phone || '',
				licenseNumber: $currentUser.licenseNumber || '',
				role: $currentUser.role || ''
			};
		}
		isEditing = false;
		message = '';
	}
</script>

<svelte:head>
	<title>Profile - Insurance Broker Pro</title>
</svelte:head>

<div class="min-h-full">
	<div class="bg-white shadow">
		<div class="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
			<div class="py-6">
				<div class="lg:flex lg:items-center lg:justify-between">
					<div class="flex-1 min-w-0">
						<h1 class="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
							User Profile
						</h1>
						<div class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
							<div class="mt-2 flex items-center text-sm text-neutral-500">
								<svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
								{formData.role ? formData.role.charAt(0).toUpperCase() + formData.role.slice(1) : 'User'}
							</div>
						</div>
					</div>
					<div class="mt-5 flex lg:mt-0 lg:ml-4">
						{#if !isEditing}
							<button
								on:click={() => isEditing = true}
								class="sm:ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
							>
								Edit Profile
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8 py-8">
		{#if message}
			<div class="mb-6 p-4 rounded-lg {message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}">
				{message}
			</div>
		{/if}

		<div class="bg-white shadow rounded-lg">
			<div class="px-4 py-5 sm:p-6">
				<h3 class="text-lg leading-6 font-medium text-neutral-900 mb-4">Personal Information</h3>
				
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<div>
						<label for="firstName" class="block text-sm font-medium text-neutral-700">First Name</label>
						<input
							type="text"
							id="firstName"
							bind:value={formData.firstName}
							disabled={!isEditing}
							class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-neutral-50 disabled:text-neutral-500"
						/>
					</div>

					<div>
						<label for="lastName" class="block text-sm font-medium text-neutral-700">Last Name</label>
						<input
							type="text"
							id="lastName"
							bind:value={formData.lastName}
							disabled={!isEditing}
							class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-neutral-50 disabled:text-neutral-500"
						/>
					</div>

					<div>
						<label for="email" class="block text-sm font-medium text-neutral-700">Email Address</label>
						<input
							type="email"
							id="email"
							bind:value={formData.email}
							disabled
							class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm bg-neutral-50 text-neutral-500 sm:text-sm"
						/>
						<p class="mt-1 text-xs text-neutral-500">Email cannot be changed</p>
					</div>

					<div>
						<label for="phone" class="block text-sm font-medium text-neutral-700">Phone Number</label>
						<input
							type="tel"
							id="phone"
							bind:value={formData.phone}
							disabled={!isEditing}
							placeholder="+1 (555) 123-4567"
							class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-neutral-50 disabled:text-neutral-500"
						/>
					</div>

					<div>
						<label for="licenseNumber" class="block text-sm font-medium text-neutral-700">License Number</label>
						<input
							type="text"
							id="licenseNumber"
							bind:value={formData.licenseNumber}
							disabled={!isEditing}
							placeholder="LIC-2024-001"
							class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-neutral-50 disabled:text-neutral-500"
						/>
					</div>

					<div>
						<label for="role" class="block text-sm font-medium text-neutral-700">Role</label>
						<input
							type="text"
							id="role"
							bind:value={formData.role}
							disabled
							class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm bg-neutral-50 text-neutral-500 sm:text-sm"
						/>
						<p class="mt-1 text-xs text-neutral-500">Role is managed by administrators</p>
					</div>
				</div>

				{#if isEditing}
					<div class="mt-6 flex justify-end space-x-3">
						<button
							type="button"
							on:click={handleCancel}
							class="bg-white py-2 px-4 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
						>
							Cancel
						</button>
						<button
							type="button"
							on:click={handleSave}
							disabled={isLoading}
							class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
						>
							{#if isLoading}
								<LoadingSpinner size="sm" color="white" />
								<span class="ml-2">Saving...</span>
							{:else}
								Save Changes
							{/if}
						</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Account Security Section -->
		<div class="mt-6 bg-white shadow rounded-lg">
			<div class="px-4 py-5 sm:p-6">
				<h3 class="text-lg leading-6 font-medium text-neutral-900 mb-4">Account Security</h3>
				
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<h4 class="text-sm font-medium text-neutral-900">Password</h4>
							<p class="text-sm text-neutral-500">Last updated: Not available</p>
						</div>
						<button
							type="button"
							class="bg-white py-2 px-4 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
						>
							Change Password
						</button>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<h4 class="text-sm font-medium text-neutral-900">Two-Factor Authentication</h4>
							<p class="text-sm text-neutral-500">Add an extra layer of security to your account</p>
						</div>
						<button
							type="button"
							class="bg-white py-2 px-4 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
						>
							Enable 2FA
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div> 