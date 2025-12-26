<script lang="ts">
  import { authService } from '$lib/services/auth';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/config/firebase';
  import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

  let email = 'demo@insurancebroker.pro';
  let password = 'Demo123!';
  let loading = false;
  let message = '';
  let detailedError = '';

  async function testSignUp() {
    loading = true;
    message = '';
    detailedError = '';
    
    try {
      const user = await authService.signUp({
        email,
        password,
        firstName: 'Demo',
        lastName: 'User',
        role: 'broker'
      });
      message = `✅ Sign up successful! User: ${user.email}`;
    } catch (error: any) {
      message = `❌ Sign up failed: ${error.message}`;
      detailedError = `Error Code: ${error.code || 'Unknown'}\nFull Error: ${JSON.stringify(error, null, 2)}`;
    } finally {
      loading = false;
    }
  }

  async function testSignIn() {
    loading = true;
    message = '';
    detailedError = '';
    
    try {
      const user = await authService.signIn({ email, password });
      message = `✅ Sign in successful! User: ${user.email}`;
      setTimeout(() => goto('/dashboard'), 2000);
    } catch (error: any) {
      message = `❌ Sign in failed: ${error.message}`;
      detailedError = `Error Code: ${error.code || 'Unknown'}\nFull Error: ${JSON.stringify(error, null, 2)}`;
    } finally {
      loading = false;
    }
  }

  async function testGoogleSignIn() {
    loading = true;
    message = '';
    detailedError = '';
    
    try {
      console.log('Testing Google Sign In...');
      console.log('Auth object:', auth);
      console.log('Current domain:', window.location.hostname);
      
      const user = await authService.signInWithGoogle();
      message = `✅ Google sign in successful! User: ${user.email}`;
      setTimeout(() => goto('/dashboard'), 2000);
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      message = `❌ Google sign in failed: ${error.message}`;
      detailedError = `Error Code: ${error.code || 'Unknown'}\nError Message: ${error.message}\nFull Error: ${JSON.stringify(error, null, 2)}`;
    } finally {
      loading = false;
    }
  }

  async function testDirectGoogleAuth() {
    loading = true;
    message = '';
    detailedError = '';
    
    try {
      console.log('Testing Direct Google Auth...');
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      console.log('Provider configured:', provider);
      console.log('Auth instance:', auth);
      
      const result = await signInWithPopup(auth, provider);
      console.log('Direct Google auth result:', result);
      
      message = `✅ Direct Google auth successful! User: ${result.user.email}`;
    } catch (error: any) {
      console.error('Direct Google Auth Error:', error);
      message = `❌ Direct Google auth failed: ${error.message}`;
      detailedError = `Error Code: ${error.code || 'Unknown'}\nError Message: ${error.message}\nFull Error: ${JSON.stringify(error, null, 2)}`;
      
      // Provide specific guidance based on error code
      if (error.code === 'auth/unauthorized-domain') {
        detailedError += '\n\n🔧 SOLUTION: Add your domain to Firebase Console:\n1. Go to Firebase Console > Authentication > Settings > Authorized domains\n2. Add your current domain: ' + window.location.hostname;
      } else if (error.code === 'auth/operation-not-allowed') {
        detailedError += '\n\n🔧 SOLUTION: Enable Google Sign-In in Firebase Console:\n1. Go to Firebase Console > Authentication > Sign-in method\n2. Enable Google provider';
      } else if (error.code === 'auth/popup-blocked') {
        detailedError += '\n\n🔧 SOLUTION: Allow popups for this site or try redirect instead of popup';
      }
    } finally {
      loading = false;
    }
  }

  function clearMessages() {
    message = '';
    detailedError = '';
  }
</script>

<svelte:head>
  <title>Auth Test - Insurance Broker Pro</title>
</svelte:head>

<div class="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-2xl w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-neutral-900">
        Authentication Testing
      </h2>
      <p class="mt-2 text-center text-sm text-neutral-600">
        Test different authentication methods and diagnose issues
      </p>
    </div>

    <div class="bg-white shadow rounded-lg p-6 space-y-6">
      <!-- Email/Password Testing -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-neutral-900">Email/Password Authentication</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700">Email</label>
            <input
              type="email"
              bind:value={email}
              class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-700">Password</label>
            <input
              type="password"
              bind:value={password}
              class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <div class="flex space-x-4">
          <button
            on:click={testSignUp}
            disabled={loading}
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            Test Sign Up
          </button>
          <button
            on:click={testSignIn}
            disabled={loading}
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            Test Sign In
          </button>
        </div>
      </div>

      <!-- Google Authentication Testing -->
      <div class="border-t pt-6 space-y-4">
        <h3 class="text-lg font-medium text-neutral-900">Google Authentication</h3>
        <div class="flex space-x-4">
          <button
            on:click={testGoogleSignIn}
            disabled={loading}
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50 flex items-center"
          >
            <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Test Google (via Service)
          </button>
          <button
            on:click={testDirectGoogleAuth}
            disabled={loading}
            class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            Test Direct Google Auth
          </button>
        </div>
      </div>

      <!-- Clear Messages -->
      <div class="border-t pt-6">
        <button
          on:click={clearMessages}
          class="bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded-md"
        >
          Clear Messages
        </button>
      </div>

      <!-- Loading Indicator -->
      {#if loading}
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      {/if}

      <!-- Messages -->
      {#if message}
        <div class="bg-neutral-50 border border-neutral-200 rounded-md p-4">
          <h4 class="text-sm font-medium text-neutral-900 mb-2">Result:</h4>
          <p class="text-sm text-neutral-700 whitespace-pre-wrap">{message}</p>
        </div>
      {/if}

      <!-- Detailed Error -->
      {#if detailedError}
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 class="text-sm font-medium text-red-900 mb-2">Detailed Error Information:</h4>
          <pre class="text-xs text-red-700 whitespace-pre-wrap overflow-x-auto">{detailedError}</pre>
        </div>
      {/if}

      <!-- Configuration Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 class="text-sm font-medium text-blue-900 mb-2">Current Configuration:</h4>
        <div class="text-xs text-blue-700 space-y-1">
          <p><strong>Domain:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'Unknown'}</p>
          <p><strong>Protocol:</strong> {typeof window !== 'undefined' ? window.location.protocol : 'Unknown'}</p>
          <p><strong>Full URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Unknown'}</p>
        </div>
      </div>
    </div>

    <div class="text-center">
      <a
        href="/auth/login"
        class="text-primary-600 hover:text-primary-500 text-sm font-medium"
      >
        ← Back to Login
      </a>
    </div>
  </div>
</div> 