<script lang="ts">
  import { goto } from '$app/navigation';
  import { authService } from '$lib/services/auth';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
  import { fade } from 'svelte/transition';

  let email = '';
  let loading = false;
  let sent = false;
  let error = '';

  async function handleResetPassword() {
    if (!email) {
      error = 'Please enter your email address';
      return;
    }

    loading = true;
    error = '';

    try {
      await authService.resetPassword(email);
      sent = true;
    } catch (err: any) {
      error = err.message || 'Failed to send reset email';
    } finally {
      loading = false;
    }
  }

  function goToLogin() {
    goto('/auth/login');
  }
</script>

<svelte:head>
  <title>Reset Password - Insurance Broker Pro</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-neutral-900">
        Reset your password
      </h2>
      <p class="mt-2 text-center text-sm text-neutral-600">
        Enter your email address and we'll send you a link to reset your password.
      </p>
    </div>

    {#if !sent}
      <form class="mt-8 space-y-6" on:submit|preventDefault={handleResetPassword}>
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email" class="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              bind:value={email}
              class="appearance-none rounded-md relative block w-full px-3 py-2 border border-neutral-300 placeholder-neutral-500 text-neutral-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
        </div>

        {#if error}
          <div class="bg-red-50 border border-red-200 rounded-md p-4" transition:fade>
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        {/if}

        <div>
          <button
            type="submit"
            disabled={loading}
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if loading}
              <LoadingSpinner size="sm" color="white" />
              <span class="ml-2">Sending...</span>
            {:else}
              Send reset link
            {/if}
          </button>
        </div>

        <div class="text-center">
          <button
            type="button"
            on:click={goToLogin}
            class="font-medium text-primary-600 hover:text-primary-500"
          >
            Back to login
          </button>
        </div>
      </form>
    {:else}
      <div class="bg-green-50 border border-green-200 rounded-md p-6" transition:fade>
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">Email sent!</h3>
            <p class="mt-2 text-sm text-green-700">
              We've sent a password reset link to {email}. Check your inbox and follow the instructions to reset your password.
            </p>
          </div>
        </div>
        
        <div class="mt-4">
          <button
            type="button"
            on:click={goToLogin}
            class="font-medium text-primary-600 hover:text-primary-500"
          >
            Back to login
          </button>
        </div>
      </div>
    {/if}
  </div>
</div> 