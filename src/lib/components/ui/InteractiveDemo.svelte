<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	
	// Demo state management
	let currentStep = 0;
	let isPlaying = false;
	let autoPlayInterval: NodeJS.Timeout;
	
	// Simulated data for the demo
	const demoData = writable({
		clients: 1247,
		policies: 3892,
		quotes: 156,
		revenue: 2847293,
		riskScore: 0.72,
		conversionRate: 0.34
	});
	
	// Demo steps with interactive content
	const demoSteps = [
		{
			id: 'dashboard',
			title: 'AI-Powered Dashboard',
			description: 'Real-time analytics and insights at your fingertips',
			content: 'dashboard',
			duration: 4000
		},
		{
			id: 'risk-assessment',
			title: 'Smart Risk Assessment',
			description: 'AI analyzes 500+ data points in real-time',
			content: 'risk',
			duration: 5000
		},
		{
			id: 'quote-comparison',
			title: 'Instant Quote Comparison',
			description: 'Compare quotes from 50+ carriers instantly',
			content: 'quotes',
			duration: 4500
		},
		{
			id: 'automation',
			title: 'Workflow Automation',
			description: 'Automate routine tasks and focus on growth',
			content: 'automation',
			duration: 4000
		}
	];
	
	// Simulate live data updates
	function updateLiveData() {
		demoData.update(data => ({
			...data,
			clients: data.clients + Math.floor(Math.random() * 3),
			quotes: data.quotes + Math.floor(Math.random() * 5),
			revenue: data.revenue + Math.floor(Math.random() * 10000),
			riskScore: Math.max(0.1, Math.min(0.9, data.riskScore + (Math.random() - 0.5) * 0.1)),
			conversionRate: Math.max(0.1, Math.min(0.9, data.conversionRate + (Math.random() - 0.5) * 0.05))
		}));
	}
	
	function startDemo() {
		if (isPlaying) return;
		isPlaying = true;
		currentStep = 0;
		playStep();
	}
	
	function stopDemo() {
		isPlaying = false;
		if (autoPlayInterval) {
			clearTimeout(autoPlayInterval);
		}
	}
	
	function playStep() {
		if (!isPlaying || currentStep >= demoSteps.length) {
			isPlaying = false;
			return;
		}
		
		const step = demoSteps[currentStep];
		autoPlayInterval = setTimeout(() => {
			currentStep = (currentStep + 1) % demoSteps.length;
			playStep();
		}, step.duration);
	}
	
	function goToStep(stepIndex: number) {
		stopDemo();
		currentStep = stepIndex;
	}
	
	// Start live data simulation
	onMount(() => {
		const dataInterval = setInterval(updateLiveData, 2000);
		return () => {
			clearInterval(dataInterval);
			stopDemo();
		};
	});
	
	// Reactive data for display
	$: currentStepData = demoSteps[currentStep];
	$: progressPercentage = ((currentStep + 1) / demoSteps.length) * 100;
</script>

<div class="bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
	<!-- Demo Header -->
	<div class="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
		<div class="flex items-center justify-between">
			<div>
				<h3 class="text-2xl font-bold mb-2">Interactive Platform Demo</h3>
				<p class="text-primary-100">Experience the power of AI-driven insurance management</p>
			</div>
			<div class="flex items-center space-x-3">
				<button
					on:click={startDemo}
					disabled={isPlaying}
					class="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
				>
					{isPlaying ? 'Playing...' : 'Start Tour'}
				</button>
				{#if isPlaying}
					<button
						on:click={stopDemo}
						class="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
					>
						Stop
					</button>
				{/if}
			</div>
		</div>
		
		<!-- Progress Bar -->
		<div class="mt-4">
			<div class="flex justify-between text-sm text-primary-100 mb-2">
				<span>Step {currentStep + 1} of {demoSteps.length}</span>
				<span>{Math.round(progressPercentage)}% Complete</span>
			</div>
			<div class="w-full bg-primary-800/30 rounded-full h-2">
				<div 
					class="bg-white rounded-full h-2 transition-all duration-500 ease-out"
					style="width: {progressPercentage}%"
				></div>
			</div>
		</div>
	</div>
	
	<!-- Demo Content -->
	<div class="p-6">
		<!-- Step Navigation -->
		<div class="flex flex-wrap gap-2 mb-6">
			{#each demoSteps as step, index}
				<button
					on:click={() => goToStep(index)}
					class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 {
						index === currentStep 
							? 'bg-primary-600 text-white shadow-lg' 
							: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
					}"
				>
					{step.title}
				</button>
			{/each}
		</div>
		
		<!-- Current Step Content -->
		<div class="min-h-[400px]">
			<div class="text-center mb-6">
				<h4 class="text-2xl font-bold text-neutral-900 mb-2">{currentStepData.title}</h4>
				<p class="text-lg text-neutral-600">{currentStepData.description}</p>
			</div>
			
			<!-- Dynamic Content Based on Current Step -->
			{#if currentStepData.content === 'dashboard'}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
						<div class="flex items-center justify-between mb-4">
							<div class="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
								<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
							</div>
							<span class="text-2xl">📈</span>
						</div>
						<p class="text-sm text-blue-600 font-medium mb-1">Total Clients</p>
						<p class="text-3xl font-bold text-blue-900">{$demoData.clients.toLocaleString()}</p>
					</div>
					
					<div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
						<div class="flex items-center justify-between mb-4">
							<div class="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center">
								<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<span class="text-2xl">🛡️</span>
						</div>
						<p class="text-sm text-green-600 font-medium mb-1">Active Policies</p>
						<p class="text-3xl font-bold text-green-900">{$demoData.policies.toLocaleString()}</p>
					</div>
					
					<div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
						<div class="flex items-center justify-between mb-4">
							<div class="h-12 w-12 bg-orange-600 rounded-lg flex items-center justify-center">
								<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
								</svg>
							</div>
							<span class="text-2xl">💰</span>
						</div>
						<p class="text-sm text-orange-600 font-medium mb-1">Pending Quotes</p>
						<p class="text-3xl font-bold text-orange-900">{$demoData.quotes}</p>
					</div>
					
					<div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
						<div class="flex items-center justify-between mb-4">
							<div class="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
								<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
								</svg>
							</div>
							<span class="text-2xl">💸</span>
						</div>
						<p class="text-sm text-purple-600 font-medium mb-1">Annual Revenue</p>
						<p class="text-3xl font-bold text-purple-900">${($demoData.revenue / 1000000).toFixed(1)}M</p>
					</div>
				</div>
				
			{:else if currentStepData.content === 'risk'}
				<div class="max-w-4xl mx-auto">
					<div class="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-8 border border-orange-200">
						<div class="text-center mb-8">
							<div class="h-20 w-20 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
								<svg class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
								</svg>
							</div>
							<h5 class="text-2xl font-bold text-orange-900 mb-2">AI Risk Analysis</h5>
							<p class="text-orange-700">Analyzing client profile: Tech Startup Inc.</p>
						</div>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<h6 class="font-semibold text-orange-900 mb-4">Risk Factors</h6>
								<div class="space-y-3">
									<div class="flex items-center justify-between">
										<span class="text-sm text-orange-700">Industry Risk</span>
										<div class="flex items-center">
											<div class="w-24 bg-orange-200 rounded-full h-2 mr-3">
												<div class="bg-orange-600 h-2 rounded-full" style="width: 65%"></div>
											</div>
											<span class="text-sm font-medium text-orange-900">65%</span>
										</div>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-sm text-orange-700">Location Risk</span>
										<div class="flex items-center">
											<div class="w-24 bg-orange-200 rounded-full h-2 mr-3">
												<div class="bg-orange-600 h-2 rounded-full" style="width: 40%"></div>
											</div>
											<span class="text-sm font-medium text-orange-900">40%</span>
										</div>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-sm text-orange-700">Financial Risk</span>
										<div class="flex items-center">
											<div class="w-24 bg-orange-200 rounded-full h-2 mr-3">
												<div class="bg-orange-600 h-2 rounded-full" style="width: 30%"></div>
											</div>
											<span class="text-sm font-medium text-orange-900">30%</span>
										</div>
									</div>
								</div>
							</div>
							
							<div>
								<h6 class="font-semibold text-orange-900 mb-4">Overall Risk Score</h6>
								<div class="relative">
									<div class="h-32 w-32 mx-auto">
										<svg class="transform -rotate-90 w-32 h-32">
											<circle
												cx="64"
												cy="64"
												r="56"
												stroke="currentColor"
												stroke-width="8"
												fill="transparent"
												class="text-orange-200"
											/>
											<circle
												cx="64"
												cy="64"
												r="56"
												stroke="currentColor"
												stroke-width="8"
												fill="transparent"
												stroke-dasharray="351.86"
												stroke-dashoffset={351.86 * (1 - $demoData.riskScore)}
												class="text-orange-600 transition-all duration-1000"
											/>
										</svg>
										<div class="absolute inset-0 flex items-center justify-center">
											<div class="text-center">
												<div class="text-2xl font-bold text-orange-900">{Math.round($demoData.riskScore * 100)}%</div>
												<div class="text-sm text-orange-700">Risk Level</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				
			{:else if currentStepData.content === 'quotes'}
				<div class="max-w-6xl mx-auto">
					<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{#each [
							{ carrier: 'Progressive', premium: 2840, coverage: 'Comprehensive', rating: 4.5, savings: 15 },
							{ carrier: 'State Farm', premium: 3120, coverage: 'Full Coverage', rating: 4.8, savings: 8 },
							{ carrier: 'Allstate', premium: 2995, coverage: 'Premium Plus', rating: 4.3, savings: 12 }
						] as quote, index}
							<div class="bg-white rounded-xl border-2 {index === 0 ? 'border-green-400 bg-green-50' : 'border-neutral-200'} p-6 relative">
								{#if index === 0}
									<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
										<span class="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">Best Value</span>
									</div>
								{/if}
								
								<div class="text-center mb-4">
									<h6 class="text-xl font-bold text-neutral-900 mb-2">{quote.carrier}</h6>
									<div class="text-3xl font-bold text-primary-600 mb-1">${quote.premium}/year</div>
									<p class="text-sm text-neutral-600">{quote.coverage}</p>
								</div>
								
								<div class="space-y-3 mb-6">
									<div class="flex items-center justify-between">
										<span class="text-sm text-neutral-600">Rating</span>
										<div class="flex items-center">
											{#each Array(5) as _, i}
												<svg class="h-4 w-4 {i < Math.floor(quote.rating) ? 'text-yellow-400' : 'text-neutral-300'}" fill="currentColor" viewBox="0 0 20 20">
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
											{/each}
											<span class="ml-2 text-sm text-neutral-600">{quote.rating}</span>
										</div>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-sm text-neutral-600">Potential Savings</span>
										<span class="text-sm font-medium text-green-600">{quote.savings}%</span>
									</div>
								</div>
								
								<button class="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition-colors">
									View Details
								</button>
							</div>
						{/each}
					</div>
				</div>
				
			{:else if currentStepData.content === 'automation'}
				<div class="max-w-4xl mx-auto">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
						<div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
							<h6 class="text-lg font-bold text-indigo-900 mb-4">Automated Workflows</h6>
							<div class="space-y-4">
								{#each [
									{ task: 'Policy Renewal Reminders', status: 'active', count: 23 },
									{ task: 'Risk Assessment Updates', status: 'processing', count: 7 },
									{ task: 'Client Follow-ups', status: 'scheduled', count: 15 },
									{ task: 'Document Processing', status: 'active', count: 31 }
								] as workflow}
									<div class="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-100">
										<div class="flex items-center">
											<div class="h-3 w-3 rounded-full {
												workflow.status === 'active' ? 'bg-green-400' :
												workflow.status === 'processing' ? 'bg-yellow-400' :
												'bg-blue-400'
											} mr-3"></div>
											<span class="text-sm font-medium text-neutral-900">{workflow.task}</span>
										</div>
										<span class="text-sm text-neutral-600">{workflow.count} tasks</span>
									</div>
								{/each}
							</div>
						</div>
						
						<div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
							<h6 class="text-lg font-bold text-green-900 mb-4">Performance Metrics</h6>
							<div class="space-y-4">
								<div>
									<div class="flex justify-between text-sm mb-2">
										<span class="text-green-700">Conversion Rate</span>
										<span class="font-medium text-green-900">{Math.round($demoData.conversionRate * 100)}%</span>
									</div>
									<div class="w-full bg-green-200 rounded-full h-2">
										<div class="bg-green-600 h-2 rounded-full transition-all duration-1000" style="width: {$demoData.conversionRate * 100}%"></div>
									</div>
								</div>
								<div>
									<div class="flex justify-between text-sm mb-2">
										<span class="text-green-700">Time Savings</span>
										<span class="font-medium text-green-900">78%</span>
									</div>
									<div class="w-full bg-green-200 rounded-full h-2">
										<div class="bg-green-600 h-2 rounded-full" style="width: 78%"></div>
									</div>
								</div>
								<div>
									<div class="flex justify-between text-sm mb-2">
										<span class="text-green-700">Client Satisfaction</span>
										<span class="font-medium text-green-900">94%</span>
									</div>
									<div class="w-full bg-green-200 rounded-full h-2">
										<div class="bg-green-600 h-2 rounded-full" style="width: 94%"></div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Demo Controls -->
		<div class="mt-8 flex items-center justify-center space-x-4">
			<button
				on:click={() => goToStep(Math.max(0, currentStep - 1))}
				disabled={currentStep === 0}
				class="flex items-center px-4 py-2 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 rounded-lg font-medium transition-colors"
			>
				<svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Previous
			</button>
			
			<div class="flex items-center space-x-2">
				{#each demoSteps as _, index}
					<button
						on:click={() => goToStep(index)}
						class="h-3 w-3 rounded-full transition-all duration-300 {
							index === currentStep ? 'bg-primary-600' : 'bg-neutral-300 hover:bg-neutral-400'
						}"
					></button>
				{/each}
			</div>
			
			<button
				on:click={() => goToStep(Math.min(demoSteps.length - 1, currentStep + 1))}
				disabled={currentStep === demoSteps.length - 1}
				class="flex items-center px-4 py-2 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 rounded-lg font-medium transition-colors"
			>
				Next
				<svg class="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
	</div>
</div>

<style>
	.slide-enter {
		animation: slideIn 0.5s ease-out;
	}
	
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style> 