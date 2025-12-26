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
      if ($currentUser.role === 'customer') {
        goto('/customer/dashboard');
      } else {
        goto('/dashboard');
      }
    } else {
      goto('/auth/signup');
    }
  }

  function handleLogin() {
    goto('/auth/login');
  }

  let mobileMenuOpen = false;
</script>

<svelte:head>
  <title>About Us - Insurance Broker Pro</title>
  <meta name="description" content="Learn about Insurance Broker Pro - leading insurance brokerage with AI-powered solutions for comprehensive coverage and risk management." />
</svelte:head>

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
            <h1 class="text-xl font-bold text-neutral-900">X Insurance Brokers</h1>
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
          <a
            href={$currentUser.role === 'customer' ? '/customer/dashboard' : '/dashboard'}
            class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {$currentUser.role === 'customer' ? 'My Account' : 'Broker Portal'}
          </a>
        {:else}
          <a
            href="/customer/login"
            class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Customer Login
          </a>
          <button
            on:click={handleLogin}
            class="text-neutral-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Broker Login
          </button>
          <button
            on:click={handleGetStarted}
            class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Get Started
          </button>
        {/if}
      </div>

      <!-- Mobile menu button -->
      <div class="md:hidden">
        <button
          on:click={() => mobileMenuOpen = !mobileMenuOpen}
          class="text-neutral-500 hover:text-neutral-700 focus:outline-none focus:text-neutral-700"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {#if mobileMenuOpen}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            {:else}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            {/if}
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    {#if mobileMenuOpen}
      <div class="md:hidden border-t border-neutral-200 py-4">
        <div class="space-y-2">
          {#each navigation as item}
            <a
              href={item.href}
              class="block px-3 py-2 text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors"
              on:click={() => mobileMenuOpen = false}
            >
              {item.name}
            </a>
          {/each}
          <div class="pt-4 border-t border-neutral-200 space-y-2">
            {#if $currentUser}
              <a
                href="/dashboard"
                class="block px-3 py-2 text-base font-medium bg-primary-600 text-white rounded-md"
                on:click={() => mobileMenuOpen = false}
              >
                Dashboard
              </a>
            {:else}
              <button
                on:click={() => { handleLogin(); mobileMenuOpen = false; }}
                class="block w-full text-left px-3 py-2 text-base font-medium text-neutral-700"
              >
                Sign In
              </button>
              <button
                on:click={() => { handleGetStarted(); mobileMenuOpen = false; }}
                class="block w-full text-left px-3 py-2 text-base font-medium bg-primary-600 text-white rounded-md"
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
<!-- Hero Section -->
<section class="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
    <div class="text-center">
      <h1 class="text-4xl md:text-6xl font-bold mb-6">
        About Insurance Broker Pro
      </h1>
      <p class="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
        Revolutionizing insurance brokerage with AI-powered solutions, delivering personalized protection and exceptional service since 2020.
      </p>
    </div>
  </div>
</section>

<!-- Our Story Section -->
<section class="py-16 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <h2 class="text-3xl font-bold text-neutral-900 mb-6">Our Story</h2>
        <div class="space-y-4 text-neutral-600">
          <p>
            Founded in 2020, Insurance Broker Pro emerged from a simple vision: to transform the insurance industry through technology and personalized service. Our founders, experienced insurance professionals and tech innovators, recognized the need for a modern approach to insurance brokerage.
          </p>
          <p>
            Today, we serve thousands of individuals and businesses, providing comprehensive insurance solutions powered by artificial intelligence and backed by human expertise. Our platform streamlines the insurance process, making it easier for clients to understand, compare, and secure the coverage they need.
          </p>
          <p>
            We believe insurance should be transparent, accessible, and tailored to each client's unique circumstances. That's why we've built a platform that combines cutting-edge AI technology with the personal touch that only experienced brokers can provide.
          </p>
        </div>
      </div>
      <div class="bg-primary-50 rounded-lg p-8">
        <div class="grid grid-cols-2 gap-6 text-center">
          <div>
            <div class="text-3xl font-bold text-primary-600">10,000+</div>
            <div class="text-neutral-600">Happy Clients</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-primary-600">$2B+</div>
            <div class="text-neutral-600">Coverage Written</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-primary-600">50+</div>
            <div class="text-neutral-600">Insurance Partners</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-primary-600">99.8%</div>
            <div class="text-neutral-600">Client Satisfaction</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Mission & Values Section -->
<section class="py-16 bg-neutral-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-neutral-900 mb-4">Our Mission & Values</h2>
      <p class="text-xl text-neutral-600 max-w-3xl mx-auto">
        We're committed to protecting what matters most to our clients through innovative technology and unwavering dedication.
      </p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-neutral-100 hover:border-blue-200 hover:-translate-y-1">
        <div class="relative mb-6">
          <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="absolute -inset-4 bg-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
        <h3 class="text-xl font-bold text-neutral-900 mb-4 group-hover:text-blue-600 transition-colors">Innovation</h3>
        <p class="text-neutral-600 leading-relaxed mb-4">
          We leverage cutting-edge AI and technology to provide faster, more accurate insurance solutions that adapt to our clients' evolving needs.
        </p>
        <div class="flex items-center text-sm text-blue-600 font-medium">
          <span>AI-Powered Solutions</span>
          <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      
      <div class="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-neutral-100 hover:border-green-200 hover:-translate-y-1">
        <div class="relative mb-6">
          <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div class="absolute -inset-4 bg-green-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
        <h3 class="text-xl font-bold text-neutral-900 mb-4 group-hover:text-green-600 transition-colors">Trust</h3>
        <p class="text-neutral-600 leading-relaxed mb-4">
          We build lasting relationships through transparency, honesty, and unwavering commitment to our clients' best interests.
        </p>
        <div class="flex items-center text-sm text-green-600 font-medium">
          <span>99.8% Client Satisfaction</span>
          <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      
      <div class="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-neutral-100 hover:border-purple-200 hover:-translate-y-1">
        <div class="relative mb-6">
          <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div class="absolute -inset-4 bg-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
        <h3 class="text-xl font-bold text-neutral-900 mb-4 group-hover:text-purple-600 transition-colors">Excellence</h3>
        <p class="text-neutral-600 leading-relaxed mb-4">
          We strive for excellence in every interaction, ensuring our clients receive the highest quality service and coverage options.
        </p>
        <div class="flex items-center text-sm text-purple-600 font-medium">
          <span>Award-Winning Service</span>
          <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Team Section -->
<section class="py-16 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-neutral-900 mb-4">Meet Our Leadership Team</h2>
      <p class="text-xl text-neutral-600 max-w-3xl mx-auto">
        Our experienced team combines decades of insurance expertise with innovative technology leadership.
      </p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="text-center">
        <div class="w-32 h-32 bg-primary-200 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg class="w-16 h-16 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-neutral-900 mb-2">Sarah Johnson</h3>
        <p class="text-primary-600 mb-4">CEO & Founder</p>
        <p class="text-neutral-600">
          20+ years in insurance brokerage, former VP at major insurance firm. Expert in risk management and client relations.
        </p>
      </div>
      
      <div class="text-center">
        <div class="w-32 h-32 bg-primary-200 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg class="w-16 h-16 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-neutral-900 mb-2">Michael Chen</h3>
        <p class="text-primary-600 mb-4">CTO & Co-Founder</p>
        <p class="text-neutral-600">
          Former tech lead at Fortune 500 companies. Specializes in AI/ML applications and scalable platform architecture.
        </p>
      </div>
      
      <div class="text-center">
        <div class="w-32 h-32 bg-primary-200 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg class="w-16 h-16 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-neutral-900 mb-2">Emily Rodriguez</h3>
        <p class="text-primary-600 mb-4">Head of Operations</p>
        <p class="text-neutral-600">
          15+ years operations experience. Leads our broker team and ensures exceptional client service delivery.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-16 bg-primary-600">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-3xl font-bold text-white mb-4">
      Ready to Experience the Difference?
    </h2>
    <p class="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
      Join thousands of satisfied clients who trust Insurance Broker Pro for their insurance needs.
    </p>
    <div class="space-x-4">
      <button
        on:click={() => goto('/auth/signup')}
        class="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 rounded-md font-medium transition-colors"
      >
        Get Started Today
      </button>
      <button
        on:click={() => goto('/contact')}
        class="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-md font-medium transition-colors"
      >
        Contact Us
      </button>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-neutral-900 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      <!-- Company Info -->
      <div>
        <div class="flex items-center mb-4">
          <div class="h-8 w-8 gradient-primary rounded-lg flex items-center justify-center">
            <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span class="ml-2 text-xl font-bold">Insurance Broker Pro</span>
        </div>
        <p class="text-neutral-300 text-sm">
          Revolutionizing insurance brokerage with AI-powered tools.
        </p>
      </div>

      <!-- Mobile App -->
      <div>
        <h3 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Mobile App</h3>
        <div class="space-y-3">
          <a href="#" class="flex items-center space-x-2 text-neutral-300 hover:text-white transition-colors group">
            <div class="bg-neutral-800 group-hover:bg-neutral-700 rounded-lg p-2 transition-colors">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <div>
              <div class="text-xs font-medium">Download on the</div>
              <div class="text-xs text-neutral-400">App Store</div>
            </div>
          </a>
          <a href="#" class="flex items-center space-x-2 text-neutral-300 hover:text-white transition-colors group">
            <div class="bg-neutral-800 group-hover:bg-neutral-700 rounded-lg p-2 transition-colors">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
            </div>
            <div>
              <div class="text-xs font-medium">Get it on</div>
              <div class="text-xs text-neutral-400">Google Play</div>
            </div>
          </a>
        </div>
      </div>

      <!-- Quick Links -->
      <div>
        <h3 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h3>
        <ul class="space-y-2">
          <li><a href="/" class="text-neutral-300 hover:text-white transition-colors text-sm">Home</a></li>
          <li><a href="/services" class="text-neutral-300 hover:text-white transition-colors text-sm">Services</a></li>
          <li><a href="/contact" class="text-neutral-300 hover:text-white transition-colors text-sm">Contact</a></li>
          <li><a href="/auth/login" class="text-neutral-300 hover:text-white transition-colors text-sm">Login</a></li>
        </ul>
      </div>
    </div>

    <div class="border-t border-neutral-800 pt-8 text-center">
      <p class="text-neutral-400 text-sm mb-2">
        Insurance Broker Pro by © 2026 <a href="https://www.scalovate.com/products" target="_blank" rel="noopener noreferrer" class="text-white hover:text-primary-400 transition-colors font-semibold">Scalovate Systems Solutions</a>, . All rights reserved.
      </p>
      <p class="text-neutral-400 text-sm">
        contact: <a href="mailto:support@Scalovate.com" class="text-white hover:text-primary-400 transition-colors">support@Scalovate.com</a>
      </p>
    </div>
  </div>
</footer> 