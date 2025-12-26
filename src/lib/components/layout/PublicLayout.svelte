<script lang="ts">
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';

  // Navigation items
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' }
  ];

  function handleGetStarted() {
    if ($currentUser) {
      goto('/dashboard');
    } else {
      goto('/auth/signup');
    }
  }

  function handleLogin() {
    goto('/auth/login');
  }

  let mobileMenuOpen = false;
</script>

<!-- Navigation Header -->
<nav class="bg-white shadow-soft sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center py-4">
      <!-- Logo -->
      <div class="flex items-center">
        <a href="/" class="flex items-center">
          <div class="h-10 w-10 gradient-primary rounded-lg flex items-center justify-center">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div class="ml-3">
            <h1 class="text-xl font-bold text-neutral-900">Insurance Broker Pro</h1>
          </div>
        </a>
      </div>

      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center space-x-8">
        {#each navigation as item}
          <a 
            href={item.href}
            class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {item.name}
          </a>
        {/each}
      </div>

      <!-- Desktop Auth Buttons -->
      <div class="hidden md:flex items-center space-x-4">
        {#if $currentUser}
          <button
            on:click={() => goto('/dashboard')}
            class="btn btn-primary"
          >
            Dashboard
          </button>
        {:else}
          <button
            on:click={handleLogin}
            class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Login
          </button>
          <button
            on:click={handleGetStarted}
            class="btn btn-primary"
          >
            Get Started
          </button>
        {/if}
      </div>

      <!-- Mobile menu button -->
      <div class="md:hidden">
        <button
          on:click={() => mobileMenuOpen = !mobileMenuOpen}
          class="text-neutral-400 hover:text-neutral-600 focus:outline-none focus:text-neutral-600"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation -->
    {#if mobileMenuOpen}
      <div class="md:hidden py-4 border-t border-neutral-200">
        <div class="space-y-2">
          {#each navigation as item}
            <a 
              href={item.href}
              class="block px-3 py-2 text-neutral-700 hover:text-primary-600 font-medium transition-colors"
            >
              {item.name}
            </a>
          {/each}
          
          <div class="pt-4 border-t border-neutral-200 mt-4">
            {#if $currentUser}
              <button
                on:click={() => goto('/dashboard')}
                class="block w-full text-left px-3 py-2 text-primary-600 font-medium"
              >
                Dashboard
              </button>
            {:else}
              <button
                on:click={handleLogin}
                class="block w-full text-left px-3 py-2 text-neutral-700 hover:text-primary-600 font-medium transition-colors"
              >
                Login
              </button>
              <button
                on:click={handleGetStarted}
                class="mt-2 w-full btn btn-primary"
              >
                Get Started
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</nav>

<!-- Main Content -->
<main>
  <slot />
</main>

<!-- Footer -->
<footer class="bg-neutral-900 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <!-- Company Info -->
      <div class="col-span-1 lg:col-span-2">
        <div class="flex items-center mb-4">
          <div class="h-8 w-8 gradient-primary rounded-lg flex items-center justify-center">
            <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span class="ml-2 text-xl font-bold">Insurance Broker Pro</span>
        </div>
        <p class="text-neutral-300 mb-4 max-w-md">
          Revolutionizing insurance brokerage with AI-powered tools for client management, quote comparison, and risk assessment.
        </p>
        <div class="flex space-x-4">
          <a href="#" class="text-neutral-400 hover:text-white transition-colors">
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
            </svg>
          </a>
          <a href="#" class="text-neutral-400 hover:text-white transition-colors">
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
            </svg>
          </a>
          <a href="#" class="text-neutral-400 hover:text-white transition-colors">
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Quick Links -->
      <div>
        <h3 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h3>
        <ul class="space-y-2">
          <li><a href="/services" class="text-neutral-300 hover:text-white transition-colors">Services</a></li>
          <li><a href="/about" class="text-neutral-300 hover:text-white transition-colors">About Us</a></li>
          <li><a href="/contact" class="text-neutral-300 hover:text-white transition-colors">Contact</a></li>
          <li><a href="/auth/login" class="text-neutral-300 hover:text-white transition-colors">Login</a></li>
          <li><a href="/auth/signup" class="text-neutral-300 hover:text-white transition-colors">Get Started</a></li>
        </ul>
      </div>

      <!-- Mobile App -->
      <div>
        <h3 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Mobile App</h3>
        <div class="space-y-3">
          <a href="#" class="flex items-center space-x-2 text-neutral-300 hover:text-white transition-colors group">
            <div class="bg-neutral-800 group-hover:bg-neutral-700 rounded-lg p-2 transition-colors">
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <div>
              <div class="text-sm font-medium">Download on the</div>
              <div class="text-xs text-neutral-400">App Store</div>
            </div>
          </a>
          <a href="#" class="flex items-center space-x-2 text-neutral-300 hover:text-white transition-colors group">
            <div class="bg-neutral-800 group-hover:bg-neutral-700 rounded-lg p-2 transition-colors">
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
            </div>
            <div>
              <div class="text-sm font-medium">Get it on</div>
              <div class="text-xs text-neutral-400">Google Play</div>
            </div>
          </a>
        </div>
      </div>

      <!-- Support -->
      <div>
        <h3 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h3>
        <ul class="space-y-2">
          <li><a href="/help" class="text-neutral-300 hover:text-white transition-colors">Help Center</a></li>
          <li><a href="/features" class="text-neutral-300 hover:text-white transition-colors">Features</a></li>
          <li><a href="/pricing" class="text-neutral-300 hover:text-white transition-colors">Pricing</a></li>
          <li><a href="/integrations" class="text-neutral-300 hover:text-white transition-colors">Integrations</a></li>
          <li><a href="/security" class="text-neutral-300 hover:text-white transition-colors">Security</a></li>
          <li><a href="/privacy" class="text-neutral-300 hover:text-white transition-colors">Privacy Policy</a></li>
          <li><a href="/terms" class="text-neutral-300 hover:text-white transition-colors">Terms of Service</a></li>
        </ul>
      </div>
    </div>

    <div class="mt-12 pt-8 border-t border-neutral-800">
      <div class="flex flex-col items-center text-center">
        <p class="text-neutral-400 text-sm">
          Insurance Broker Pro by © 2026 <a href="https://www.scalovate.com/products" target="_blank" rel="noopener noreferrer" class="text-white hover:text-primary-400 transition-colors font-semibold">Scalovate Systems Solutions</a>, . All rights reserved.
        </p>
        <p class="text-neutral-400 text-sm mt-2">
          contact: <a href="mailto:support@Scalovate.com" class="text-white hover:text-primary-400 transition-colors">support@Scalovate.com</a>
        </p>
      </div>
    </div>
  </div>
</footer> 