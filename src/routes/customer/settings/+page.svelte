<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { currentUser, authService } from '$lib/services/auth';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let loading = false;
	let message = '';

	let settings = {
		notifications: {
			email: true,
			sms: true,
			push: true,
			policyUpdates: true,
			paymentReminders: true,
			renewalNotices: true,
			claimsUpdates: true
		},
		privacy: {
			marketing: false,
			thirdPartySharing: false,
			dataCollection: true
		},
		preferences: {
			language: 'en',
			currency: 'USD',
			dateFormat: 'MM/DD/YYYY',
			theme: 'light'
		}
	};

	onMount(() => {
		if (!$currentUser) {
			goto('/customer/login');
			return;
		}
		
		// Load current settings from user profile
		if ($currentUser?.preferences) {
			settings.notifications = { ...settings.notifications, ...$currentUser.preferences.notifications };
			settings.privacy = { ...settings.privacy, ...$currentUser.preferences.privacy };
			settings.preferences = { ...settings.preferences, ...$currentUser.preferences.ui };
		}
	});

	async function saveSettings() {
		loading = true;
		message = '';

		try {
			await authService.updateUserProfile({
				preferences: {
					notifications: settings.notifications,
					privacy: settings.privacy,
					ui: settings.preferences
				}
			});
			message = 'Settings updated successfully!';
		} catch (error) {
			console.error('Error updating settings:', error);
			message = 'Error updating settings. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function signOut() {
		try {
			await authService.signOut();
			goto('/');
		} catch (error) {
			console.error('Error signing out:', error);
		}
	}
</script>

<svelte:head>
	<title>Settings - X Insurance Brokers</title>
	<meta name="description" content="Manage your account settings and preferences." />
</svelte:head>

<div class="min-h-screen bg-neutral-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">Settings</h1>
					<p class="text-neutral-600 mt-1">Manage your account preferences and privacy settings</p>
				</div>
				<a
					href="/customer/dashboard"
					class="text-primary-600 hover:text-primary-700 font-medium transition-colors"
				>
					← Back to Dashboard
				</a>
			</div>
		</div>

		{#if message}
			<div class="mb-8 p-4 rounded-lg {message.includes('success') ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-red-50 text-red-700 border border-red-200'}">
				{message}
			</div>
		{/if}

		<!-- Notifications Settings -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 mb-8">
			<h2 class="text-xl font-semibold text-neutral-900 mb-6">Notification Preferences</h2>
			
			<div class="space-y-6">
				<div>
					<h3 class="text-lg font-medium text-neutral-900 mb-4">Delivery Methods</h3>
					<div class="space-y-3">
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={settings.notifications.email}
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
							/>
							<span class="ml-3 text-neutral-700">Email notifications</span>
						</label>

						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={settings.notifications.sms}
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
							/>
							<span class="ml-3 text-neutral-700">SMS/Text messages</span>
						</label>

						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={settings.notifications.push}
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
							/>
							<span class="ml-3 text-neutral-700">Push notifications</span>
						</label>
					</div>
				</div>

				<div class="pt-6 border-t border-neutral-200">
					<h3 class="text-lg font-medium text-neutral-900 mb-4">Notification Types</h3>
					<div class="space-y-3">
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={settings.notifications.policyUpdates}
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
							/>
							<span class="ml-3 text-neutral-700">Policy updates and changes</span>
						</label>

						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={settings.notifications.paymentReminders}
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
							/>
							<span class="ml-3 text-neutral-700">Payment reminders</span>
						</label>

						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={settings.notifications.renewalNotices}
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
							/>
							<span class="ml-3 text-neutral-700">Policy renewal notices</span>
						</label>

						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={settings.notifications.claimsUpdates}
								class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
							/>
							<span class="ml-3 text-neutral-700">Claims status updates</span>
						</label>
					</div>
				</div>
			</div>
		</div>

		<!-- Privacy Settings -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 mb-8">
			<h2 class="text-xl font-semibold text-neutral-900 mb-6">Privacy & Data</h2>
			
			<div class="space-y-4">
				<label class="flex items-center justify-between">
					<div>
						<span class="text-neutral-700 font-medium">Marketing Communications</span>
						<p class="text-sm text-neutral-500">Receive promotional emails and offers</p>
					</div>
					<input
						type="checkbox"
						bind:checked={settings.privacy.marketing}
						class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
					/>
				</label>

				<label class="flex items-center justify-between">
					<div>
						<span class="text-neutral-700 font-medium">Third-Party Sharing</span>
						<p class="text-sm text-neutral-500">Allow sharing data with trusted partners</p>
					</div>
					<input
						type="checkbox"
						bind:checked={settings.privacy.thirdPartySharing}
						class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
					/>
				</label>

				<label class="flex items-center justify-between">
					<div>
						<span class="text-neutral-700 font-medium">Data Collection for Improvements</span>
						<p class="text-sm text-neutral-500">Help us improve our services with usage data</p>
					</div>
					<input
						type="checkbox"
						bind:checked={settings.privacy.dataCollection}
						class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
					/>
				</label>
			</div>
		</div>

		<!-- App Preferences -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 mb-8">
			<h2 class="text-xl font-semibold text-neutral-900 mb-6">App Preferences</h2>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<label for="language" class="block text-sm font-medium text-neutral-700 mb-2">
						Language
					</label>
					<select
						id="language"
						bind:value={settings.preferences.language}
						class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
					>
						<option value="en">English</option>
						<option value="es">Spanish</option>
						<option value="fr">French</option>
					</select>
				</div>

				<div>
					<label for="currency" class="block text-sm font-medium text-neutral-700 mb-2">
						Currency
					</label>
					<select
						id="currency"
						bind:value={settings.preferences.currency}
						class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
					>
						<option value="USD">USD ($)</option>
						<option value="EUR">EUR (€)</option>
						<option value="GBP">GBP (£)</option>
					</select>
				</div>

				<div>
					<label for="dateFormat" class="block text-sm font-medium text-neutral-700 mb-2">
						Date Format
					</label>
					<select
						id="dateFormat"
						bind:value={settings.preferences.dateFormat}
						class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
					>
						<option value="MM/DD/YYYY">MM/DD/YYYY</option>
						<option value="DD/MM/YYYY">DD/MM/YYYY</option>
						<option value="YYYY-MM-DD">YYYY-MM-DD</option>
					</select>
				</div>

				<div>
					<label for="theme" class="block text-sm font-medium text-neutral-700 mb-2">
						Theme
					</label>
					<select
						id="theme"
						bind:value={settings.preferences.theme}
						class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
					>
						<option value="light">Light</option>
						<option value="dark">Dark</option>
						<option value="auto">Auto</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Account Actions -->
		<div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
			<h2 class="text-xl font-semibold text-neutral-900 mb-6">Account Actions</h2>
			
			<div class="space-y-4">
				<div class="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
					<div>
						<h3 class="font-medium text-neutral-900">Download Your Data</h3>
						<p class="text-sm text-neutral-600">Get a copy of all your account data</p>
					</div>
					<button class="text-primary-600 hover:text-primary-700 font-medium transition-colors">
						Request Data
					</button>
				</div>

				<div class="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
					<div>
						<h3 class="font-medium text-red-900">Delete Account</h3>
						<p class="text-sm text-red-600">Permanently delete your account and all data</p>
					</div>
					<button class="text-red-600 hover:text-red-700 font-medium transition-colors">
						Delete Account
					</button>
				</div>
			</div>
		</div>

		<!-- Save Button -->
		<div class="mt-8 flex justify-end space-x-4">
			<button
				on:click={signOut}
				class="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-6 py-2 rounded-md font-medium transition-colors"
			>
				Sign Out
			</button>
			<button
				on:click={saveSettings}
				disabled={loading}
				class="bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center"
			>
				{#if loading}
					<LoadingSpinner size="sm" />
					<span class="ml-2">Saving...</span>
				{:else}
					Save Settings
				{/if}
			</button>
		</div>
	</div>
</div> 