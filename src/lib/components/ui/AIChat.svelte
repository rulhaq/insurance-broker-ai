<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { currentUser } from '$lib/services/auth';
	import { groqAI } from '$lib/services/groq';
	import LoadingSpinner from './LoadingSpinner.svelte';

	const dispatch = createEventDispatcher();

	export let isOpen = false;

	let messages: Array<{
		id: string;
		content: string;
		sender: 'user' | 'ai';
		timestamp: Date;
		typing?: boolean;
	}> = [
		{
			id: '1',
			content: "Hi! I'm your AI insurance assistant. I can help you with risk assessments, policy questions, compliance guidance, and more. How can I assist you today?",
			sender: 'ai',
			timestamp: new Date()
		}
	];

	let inputMessage = '';
	let isLoading = false;
	let chatContainer: HTMLElement;

	const quickActions = [
		{ text: "Analyze client risk", action: "analyze_risk" },
		{ text: "Compare quotes", action: "compare_quotes" },
		{ text: "Policy recommendations", action: "policy_recs" },
		{ text: "Compliance check", action: "compliance" }
	];

	function toggleChat() {
		isOpen = !isOpen;
		if (isOpen) {
			setTimeout(() => scrollToBottom(), 100);
		}
	}

	function closeChat() {
		isOpen = false;
	}

	async function sendMessage() {
		if (!inputMessage.trim() || isLoading) return;

		const userMessage = {
			id: Date.now().toString(),
			content: inputMessage.trim(),
			sender: 'user' as const,
			timestamp: new Date()
		};

		messages = [...messages, userMessage];
		const currentInput = inputMessage;
		inputMessage = '';
		isLoading = true;

		// Add typing indicator
		const typingMessage = {
			id: 'typing',
			content: '',
			sender: 'ai' as const,
			timestamp: new Date(),
			typing: true
		};
		messages = [...messages, typingMessage];

		setTimeout(() => scrollToBottom(), 100);

		try {
			// Simulate AI response (replace with actual Groq API call)
			const aiResponse = await getAIResponse(currentInput);
			
			// Remove typing indicator
			messages = messages.filter(m => m.id !== 'typing');
			
			// Add AI response
			const aiMessage = {
				id: (Date.now() + 1).toString(),
				content: aiResponse,
				sender: 'ai' as const,
				timestamp: new Date()
			};
			messages = [...messages, aiMessage];
		} catch (error) {
			// Remove typing indicator
			messages = messages.filter(m => m.id !== 'typing');
			
			const errorMessage = {
				id: (Date.now() + 1).toString(),
				content: "I apologize, but I'm having trouble connecting right now. Please try again later or contact support for assistance.",
				sender: 'ai' as const,
				timestamp: new Date()
			};
			messages = [...messages, errorMessage];
		} finally {
			isLoading = false;
			setTimeout(() => scrollToBottom(), 100);
		}
	}

	async function handleQuickAction(action: string) {
		const quickResponses = {
			analyze_risk: "I can help you analyze client risk! Please provide the client's industry, annual revenue, employee count, and any specific risk factors you'd like me to evaluate.",
			compare_quotes: "I'll help you compare insurance quotes. Share the quote details including carrier, coverage limits, premiums, and I'll provide analysis and recommendations.",
			policy_recs: "For policy recommendations, I need to know the client's business type, current coverage, risk profile, and budget. What specific insurance needs are you addressing?",
			compliance: "I can check compliance requirements. What type of insurance, jurisdiction, and specific regulations do you need help with?"
		};

		const response = quickResponses[action as keyof typeof quickResponses] || "How can I assist you with that?";
		
		const aiMessage = {
			id: Date.now().toString(),
			content: response,
			sender: 'ai' as const,
			timestamp: new Date()
		};
		messages = [...messages, aiMessage];
		setTimeout(() => scrollToBottom(), 100);
	}

	async function getAIResponse(userInput: string): Promise<string> {
		// Simulate AI processing time
		await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

		// Enhanced responses based on input context
		const input = userInput.toLowerCase();
		
		if (input.includes('risk') || input.includes('assess')) {
			return "For risk assessment, I analyze multiple factors including industry type, financial stability, claims history, and operational characteristics. I can provide risk scores from 1-100 with detailed recommendations. What specific client would you like me to assess?";
		}
		
		if (input.includes('quote') || input.includes('price') || input.includes('premium')) {
			return "I can help compare quotes across multiple carriers. I analyze coverage limits, deductibles, exclusions, and pricing to identify the best value. I also flag any pricing anomalies or coverage gaps. Would you like me to analyze specific quotes?";
		}
		
		if (input.includes('policy') || input.includes('coverage')) {
			return "I can recommend optimal policy structures based on your client's risk profile, industry requirements, and budget constraints. I consider factors like liability limits, deductibles, and special coverages. What type of business are we covering?";
		}
		
		if (input.includes('compliance') || input.includes('regulation')) {
			return "I stay updated on insurance regulations and compliance requirements across different jurisdictions. I can help ensure your policies meet legal requirements and industry standards. Which state or industry regulations do you need guidance on?";
		}
		
		if (input.includes('claim') || input.includes('loss')) {
			return "For claims analysis, I can help evaluate claim frequency, severity patterns, and loss ratios. This helps in underwriting decisions and risk management strategies. Are you dealing with a specific claim situation?";
		}
		
		// Default intelligent response
		return "I understand you're asking about insurance matters. I can assist with risk assessment, quote analysis, policy recommendations, compliance guidance, and claims evaluation. Could you provide more specific details about what you'd like help with?";
	}

	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	onMount(() => {
		if (isOpen) {
			setTimeout(() => scrollToBottom(), 100);
		}
	});
</script>

<!-- Chat Toggle Button -->
{#if !isOpen}
	<button
		on:click={toggleChat}
		class="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 z-50 group"
		aria-label="Open AI Assistant"
	>
		<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
		</svg>
		<div class="absolute -top-2 -left-2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
		<div class="absolute -top-12 right-0 bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
			AI Assistant
		</div>
	</button>
{/if}

<!-- Chat Window -->
{#if isOpen}
	<div class="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-neutral-200 z-50 flex flex-col overflow-hidden">
		<!-- Header -->
		<div class="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 flex items-center justify-between">
			<div class="flex items-center space-x-3">
				<div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
					</svg>
				</div>
				<div>
					<h3 class="font-semibold">AI Assistant</h3>
					<p class="text-xs text-white text-opacity-80">Insurance Expert</p>
				</div>
			</div>
			<button
				on:click={closeChat}
				class="text-white hover:text-neutral-200 transition-colors"
				aria-label="Close chat"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Messages -->
		<div 
			bind:this={chatContainer}
			class="flex-1 p-4 space-y-4 overflow-y-auto bg-neutral-50"
		>
			{#each messages as message (message.id)}
				<div class="flex {message.sender === 'user' ? 'justify-end' : 'justify-start'}">
					<div class="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl {
						message.sender === 'user' 
							? 'bg-primary-600 text-white' 
							: 'bg-white text-neutral-800 shadow-sm border'
					}">
						{#if message.typing}
							<div class="flex space-x-1">
								<div class="w-2 h-2 bg-neutral-400 rounded-full animate-pulse"></div>
								<div class="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
								<div class="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
							</div>
						{:else}
							<p class="text-sm leading-relaxed">{message.content}</p>
							<p class="text-xs mt-1 opacity-70">
								{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
							</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Quick Actions -->
		<div class="px-4 py-2 border-t border-neutral-200 bg-white">
			<div class="flex flex-wrap gap-2 mb-3">
				{#each quickActions as action}
					<button
						on:click={() => handleQuickAction(action.action)}
						class="text-xs px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition-colors"
					>
						{action.text}
					</button>
				{/each}
			</div>
		</div>

		<!-- Input -->
		<div class="p-4 border-t border-neutral-200 bg-white">
			<div class="flex space-x-2">
				<input
					bind:value={inputMessage}
					on:keydown={handleKeyDown}
					placeholder="Ask me about insurance..."
					disabled={isLoading}
					class="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:opacity-50"
				/>
				<button
					on:click={sendMessage}
					disabled={isLoading || !inputMessage.trim()}
					class="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
				>
					{#if isLoading}
						<LoadingSpinner size="sm" color="white" />
					{:else}
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
						</svg>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if} 