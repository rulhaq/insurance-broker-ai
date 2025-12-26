<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser, authService } from '$lib/services/auth';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
  import Toast from '$lib/components/ui/Toast.svelte';
  import { fade } from 'svelte/transition';
  
  let loading = false;
  let saving = false;
  let activeTab = 'profile';
  let showToast = false;
  let toastMessage = '';
  let toastType: 'success' | 'error' = 'success';

  // Profile settings
  let profile = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    company: '',
    title: '',
    bio: ''
  };

  // Notification settings
  let notifications = {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
    policyReminders: true,
    claimUpdates: true,
    systemUpdates: true
  };

  // Appearance settings
  let appearance = {
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD'
  };

  // Security settings
  let security = {
    twoFactorEnabled: false,
    sessionTimeout: 60,
    loginNotifications: true
  };

  let tabs = [
    { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'appearance', label: 'Appearance', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707' },
    { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }
  ];



  onMount(async () => {
    loadSettings();
  });

  function loadSettings() {
    // Load current user data
    if ($currentUser) {
      profile = {
        firstName: $currentUser.firstName || '',
        lastName: $currentUser.lastName || '',
        email: $currentUser.email || '',
        phone: $currentUser.phone || '',
        licenseNumber: $currentUser.licenseNumber || '',
        company: $currentUser.company || '',
        title: $currentUser.title || '',
        bio: $currentUser.bio || ''
      };
    }

    // Load settings from localStorage or defaults
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      notifications = { ...notifications, ...JSON.parse(savedNotifications) };
    }

    const savedAppearance = localStorage.getItem('appearance');
    if (savedAppearance) {
      appearance = { ...appearance, ...JSON.parse(savedAppearance) };
    }

    const savedSecurity = localStorage.getItem('security');
    if (savedSecurity) {
      security = { ...security, ...JSON.parse(savedSecurity) };
    }
  }

  async function saveProfile() {
    saving = true;
    
    try {
      await authService.updateProfile(profile);
      showSuccessToast('Profile updated successfully');
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to update profile');
    } finally {
      saving = false;
    }
  }

  async function saveNotifications() {
    saving = true;
    
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
      await new Promise(resolve => setTimeout(resolve, 500)); // Mock save
      showSuccessToast('Notification preferences saved');
    } catch (error: any) {
      showErrorToast('Failed to save notification preferences');
    } finally {
      saving = false;
    }
  }

  async function saveAppearance() {
    saving = true;
    
    try {
      localStorage.setItem('appearance', JSON.stringify(appearance));
      await new Promise(resolve => setTimeout(resolve, 500)); // Mock save
      showSuccessToast('Appearance settings saved');
    } catch (error: any) {
      showErrorToast('Failed to save appearance settings');
    } finally {
      saving = false;
    }
  }

  async function saveSecurity() {
    saving = true;
    
    try {
      localStorage.setItem('security', JSON.stringify(security));
      await new Promise(resolve => setTimeout(resolve, 500)); // Mock save
      showSuccessToast('Security settings saved');
    } catch (error: any) {
      showErrorToast('Failed to save security settings');
    } finally {
      saving = false;
    }
  }

  function showSuccessToast(message: string) {
    toastMessage = message;
    toastType = 'success';
    showToast = true;
  }

  function showErrorToast(message: string) {
    toastMessage = message;
    toastType = 'error';
    showToast = true;
  }

  async function resetPassword() {
    if (!profile.email) return;
    
    try {
      await authService.resetPassword(profile.email);
      showSuccessToast('Password reset email sent');
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to send reset email');
    }
  }

  function enableTwoFactor() {
    // Mock implementation
    security.twoFactorEnabled = true;
    showSuccessToast('Two-factor authentication will be enabled after setup');
  }
</script>

<svelte:head>
  <title>Settings - Insurance Broker Pro</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-neutral-900">Settings</h1>
    <p class="mt-1 text-sm text-neutral-600">
      Manage your account settings and preferences
    </p>
  </div>

  <!-- Tabs -->
  <div class="border-b border-neutral-200">
    <nav class="-mb-px flex space-x-8">
      {#each tabs as tab}
        <button
          on:click={() => activeTab = tab.id}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}"
        >
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tab.icon} />
            </svg>
            <span>{tab.label}</span>
          </div>
        </button>
      {/each}
    </nav>
  </div>

  <!-- Profile Tab -->
  {#if activeTab === 'profile'}
    <div class="bg-white p-6 rounded-lg shadow-sm border border-neutral-200" transition:fade>
      <h3 class="text-lg font-semibold text-neutral-900 mb-6">Profile Information</h3>
      
      <form on:submit|preventDefault={saveProfile} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="firstName" class="block text-sm font-medium text-neutral-700 mb-2">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              bind:value={profile.firstName}
              class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div>
            <label for="lastName" class="block text-sm font-medium text-neutral-700 mb-2">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              bind:value={profile.lastName}
              class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-neutral-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            bind:value={profile.email}
            class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="phone" class="block text-sm font-medium text-neutral-700 mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              bind:value={profile.phone}
              class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div>
            <label for="licenseNumber" class="block text-sm font-medium text-neutral-700 mb-2">
              License Number
            </label>
            <input
              id="licenseNumber"
              type="text"
              bind:value={profile.licenseNumber}
              class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="company" class="block text-sm font-medium text-neutral-700 mb-2">
              Company
            </label>
            <input
              id="company"
              type="text"
              bind:value={profile.company}
              class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div>
            <label for="title" class="block text-sm font-medium text-neutral-700 mb-2">
              Job Title
            </label>
            <input
              id="title"
              type="text"
              bind:value={profile.title}
              class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div>
          <label for="bio" class="block text-sm font-medium text-neutral-700 mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            rows="4"
            bind:value={profile.bio}
            class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Tell us about yourself..."
          ></textarea>
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if saving}
              <LoadingSpinner size="sm" color="white" />
              <span class="ml-2">Saving...</span>
            {:else}
              Save Profile
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Notifications Tab -->
  {#if activeTab === 'notifications'}
    <div class="bg-white p-6 rounded-lg shadow-sm border border-neutral-200" transition:fade>
      <h3 class="text-lg font-semibold text-neutral-900 mb-6">Notification Preferences</h3>
      
      <form on:submit|preventDefault={saveNotifications} class="space-y-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-neutral-700">Email Notifications</label>
              <p class="text-sm text-neutral-500">Receive notifications via email</p>
            </div>
            <input
              type="checkbox"
              bind:checked={notifications.emailNotifications}
              class="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
            />
          </div>

          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-neutral-700">SMS Notifications</label>
              <p class="text-sm text-neutral-500">Receive notifications via SMS</p>
            </div>
            <input
              type="checkbox"
              bind:checked={notifications.smsNotifications}
              class="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
            />
          </div>

          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-neutral-700">Push Notifications</label>
              <p class="text-sm text-neutral-500">Receive browser push notifications</p>
            </div>
            <input
              type="checkbox"
              bind:checked={notifications.pushNotifications}
              class="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
            />
          </div>

          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-neutral-700">Policy Reminders</label>
              <p class="text-sm text-neutral-500">Reminders for policy renewals and deadlines</p>
            </div>
            <input
              type="checkbox"
              bind:checked={notifications.policyReminders}
              class="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
            />
          </div>

          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-neutral-700">Claim Updates</label>
              <p class="text-sm text-neutral-500">Updates about claim processing and status</p>
            </div>
            <input
              type="checkbox"
              bind:checked={notifications.claimUpdates}
              class="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
            />
          </div>
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if saving}
              <LoadingSpinner size="sm" color="white" />
              <span class="ml-2">Saving...</span>
            {:else}
              Save Preferences
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Security Tab -->
  {#if activeTab === 'security'}
    <div class="bg-white p-6 rounded-lg shadow-sm border border-neutral-200" transition:fade>
      <h3 class="text-lg font-semibold text-neutral-900 mb-6">Security Settings</h3>
      
      <div class="space-y-6">
        <div class="flex items-center justify-between py-4 border-b border-neutral-200">
          <div>
            <h4 class="text-sm font-medium text-neutral-700">Password</h4>
            <p class="text-sm text-neutral-500">Change your account password</p>
          </div>
          <button
            on:click={resetPassword}
            class="text-primary-600 hover:text-primary-900 text-sm font-medium"
          >
            Reset Password
          </button>
        </div>

        <div class="flex items-center justify-between py-4 border-b border-neutral-200">
          <div>
            <h4 class="text-sm font-medium text-neutral-700">Two-Factor Authentication</h4>
            <p class="text-sm text-neutral-500">Add an extra layer of security to your account</p>
          </div>
          <button
            on:click={enableTwoFactor}
            disabled={security.twoFactorEnabled}
            class="text-primary-600 hover:text-primary-900 text-sm font-medium disabled:text-green-600 disabled:cursor-default"
          >
            {security.twoFactorEnabled ? 'Enabled' : 'Enable'}
          </button>
        </div>

        <form on:submit|preventDefault={saveSecurity}>
          <div class="space-y-4">
            <div>
              <label for="sessionTimeout" class="block text-sm font-medium text-neutral-700 mb-2">
                Session Timeout (minutes)
              </label>
              <select
                id="sessionTimeout"
                bind:value={security.sessionTimeout}
                class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={480}>8 hours</option>
              </select>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-neutral-700">Login Notifications</label>
                <p class="text-sm text-neutral-500">Get notified of new login attempts</p>
              </div>
              <input
                type="checkbox"
                bind:checked={security.loginNotifications}
                class="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500"
              />
            </div>
          </div>

          <div class="flex justify-end mt-6">
            <button
              type="submit"
              disabled={saving}
              class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if saving}
                <LoadingSpinner size="sm" color="white" />
                <span class="ml-2">Saving...</span>
              {:else}
                Save Settings
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}


</div>

<!-- Toast Notifications -->
{#if showToast}
  <Toast
    type={toastType}
    message={toastMessage}
    onClose={() => showToast = false}
  />
{/if} 