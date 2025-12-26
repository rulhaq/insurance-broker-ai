<script lang="ts">
	import { authService, currentUser } from '$lib/services/auth';
	import { doc, updateDoc } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import { goto } from '$app/navigation';

	let selectedRole = 'broker';
	let isUpdating = false;
	let message = '';

	const roles = [
		{ value: 'admin', label: 'Administrator', description: 'Full system access and user management' },
		{ value: 'broker', label: 'Insurance Broker', description: 'Client management and policy operations' },
		{ value: 'assistant', label: 'Assistant', description: 'Support tasks and limited access' }
	];

	async function updateRole() {
		if (!$currentUser) return;

		isUpdating = true;
		try {
			const userRef = doc(db, 'users', $currentUser.uid);
			await updateDoc(userRef, {
				role: selectedRole,
				updatedAt: new Date()
			});

			// Update the current user store
			currentUser.update(user => user ? { ...user, role: selectedRole as any } : null);
			
			message = `Role updated to ${selectedRole}`;
			setTimeout(() => {
				goto('/dashboard');
			}, 1500);
		} catch (error) {
			console.error('Error updating role:', error);
			message = 'Failed to update role';
		} finally {
			isUpdating = false;
		}
	}
</script>

<div class="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
	<div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-bold text-neutral-900">Select Your Role</h1>
			<p class="text-neutral-600 mt-2">Choose your role to access the appropriate features</p>
		</div>

		{#if $currentUser}
			<p class="text-sm text-neutral-600 mb-6">
				Current user: <strong>{$currentUser.email}</strong>
			</p>

			<div class="space-y-4 mb-8">
				{#each roles as role}
					<label class="flex items-start space-x-3 p-4 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 {selectedRole === role.value ? 'border-primary-500 bg-primary-50' : ''}">
						<input 
							type="radio" 
							name="role" 
							value={role.value} 
							bind:group={selectedRole}
							class="mt-1 text-primary-600 focus:ring-primary-500"
						>
						<div class="flex-1">
							<div class="font-medium text-neutral-900">{role.label}</div>
							<div class="text-sm text-neutral-600">{role.description}</div>
						</div>
					</label>
				{/each}
			</div>

			<button 
				on:click={updateRole}
				disabled={isUpdating}
				class="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{isUpdating ? 'Updating...' : 'Set Role & Continue'}
			</button>

			{#if message}
				<div class="mt-4 p-3 rounded-lg {message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}">
					{message}
				</div>
			{/if}
		{:else}
			<div class="text-center">
				<p class="text-neutral-600 mb-4">Please sign in first</p>
				<a href="/auth/login" class="text-primary-600 hover:text-primary-700">Go to Login</a>
			</div>
		{/if}
	</div>
</div> 