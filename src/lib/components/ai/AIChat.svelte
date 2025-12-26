<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { currentUser } from '$lib/services/auth';
	import { getChatAssistance } from '$lib/services/groq';
	import { writable } from 'svelte/store';
	import { fade, fly } from 'svelte/transition';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	export let isOpen = false;

	const dispatch = createEventDispatcher();
	
	interface ChatMessage {
		id: string;
		content: string;
		sender: 'user' | 'ai';
		timestamp: Date;
		loading?: boolean;
	}

	let messages = writable<ChatMessage[]>([]);
	let currentMessage = '';
	let chatContainer: HTMLElement;
	let isLoading = false;
	let isMinimized = false;

	// Role-specific context and suggestions
	$: userRole = $currentUser?.role || 'visitor';
	$: roleSuggestions = getRoleSuggestions(userRole);
	$: welcomeMessage = getWelcomeMessage(userRole);

	// Initialize chat with welcome message
	onMount(() => {
		messages.set([{
			id: Date.now().toString(),
			content: welcomeMessage,
			sender: 'ai',
			timestamp: new Date()
		}]);
	});

	function getRoleSuggestions(role: string): string[] {
		switch (role) {
			case 'admin':
				return [
					'How do I configure system settings?',
					'Show user activity reports',
					'Help with currency management',
					'Manage product types and categories',
					'View system performance metrics'
				];
			case 'broker':
				return [
					'Find high-value leads for cross-selling',
					'Analyze client risk profiles',
					'Compare quotes and recommendations',
					'Draft professional email to client',
					'Generate renewal reminder campaign'
				];
			case 'assistant':
				return [
					'Help with client onboarding process',
					'Schedule follow-up reminders',
					'Process document uploads',
					'Update client information',
					'Generate status reports'
				];
			case 'customer':
				return [
					'Explain my policy coverage',
					'Help me file a claim',
					'Find ways to save on premiums',
					'Compare different insurance options',
					'Update my personal information'
				];
			default: // visitor
				return [
					'What insurance products do you offer?',
					'How do I get a quote?',
					'Explain different coverage types',
					'What are your competitive advantages?',
					'How do I contact an agent?'
				];
		}
	}

	function getWelcomeMessage(role: string): string {
		const timestamp = new Date().toLocaleTimeString();
		switch (role) {
			case 'admin':
				return `🔧 Hello Admin! I'm your AI assistant ready to help with system management, user oversight, and business analytics. What would you like to accomplish today? [${timestamp}]`;
			case 'broker':
				return `💼 Hi there! I'm your AI-powered insurance assistant. I can help you analyze risks, compare quotes, identify opportunities, and manage client relationships more effectively. [${timestamp}]`;
			case 'assistant':
				return `🤝 Hello! I'm here to help you support brokers and clients efficiently. I can assist with administrative tasks, client communications, and workflow management. [${timestamp}]`;
			case 'customer':
				return `🏠 Welcome! I'm your personal insurance assistant. I can help you understand your policies, file claims, find savings opportunities, and answer any insurance questions. [${timestamp}]`;
			default:
				return `🎯 Welcome to our insurance platform! I'm an AI assistant that can help you understand our services, get quotes, and connect with the right insurance solutions for your needs. [${timestamp}]`;
		}
	}

	function getContextForRole(role: string) {
		const baseContext = {
			userId: $currentUser?.uid || 'visitor',
			userRole: role,
			platform: 'insurance_broker',
			capabilities: ['quotes', 'policies', 'claims', 'risk_analysis']
		};

		switch (role) {
			case 'admin':
				return {
					...baseContext,
					permissions: ['system_config', 'user_management', 'analytics', 'reports'],
					specialties: ['system administration', 'business analytics', 'user management'],
					clientCount: 'all_system_users'
				};
			case 'broker':
				return {
					...baseContext,
					permissions: ['client_management', 'quote_creation', 'policy_management'],
					specialties: ['risk assessment', 'quote comparison', 'client relationship management'],
					clientCount: $currentUser?.clientCount || 0
				};
			case 'assistant':
				return {
					...baseContext,
					permissions: ['client_support', 'document_processing', 'basic_admin'],
					specialties: ['customer service', 'administrative support', 'document management']
				};
			case 'customer':
				return {
					...baseContext,
					permissions: ['policy_view', 'claims_filing', 'profile_management'],
					specialties: ['policy understanding', 'claims assistance', 'cost optimization']
				};
			default:
				return {
					...baseContext,
					permissions: ['general_info', 'quote_request'],
					specialties: ['product information', 'general guidance', 'lead conversion']
				};
		}
	}

	async function sendMessage() {
		if (!currentMessage.trim() || isLoading) return;

		const userMessage: ChatMessage = {
			id: Date.now().toString(),
			content: currentMessage,
			sender: 'user',
			timestamp: new Date()
		};

		// Add user message
		messages.update(msgs => [...msgs, userMessage]);
		
		// Clear input and set loading
		const messageToSend = currentMessage;
		currentMessage = '';
		isLoading = true;

		// Add loading AI message
		const loadingMessage: ChatMessage = {
			id: (Date.now() + 1).toString(),
			content: '',
			sender: 'ai',
			timestamp: new Date(),
			loading: true
		};
		messages.update(msgs => [...msgs, loadingMessage]);

		try {
			// Get AI response with role-specific context
			const context = getContextForRole(userRole);
			const aiResponse = await getChatAssistance(messageToSend, context);

			// Remove loading message and add actual response
			messages.update(msgs => {
				const filtered = msgs.filter(m => !m.loading);
				return [...filtered, {
					id: (Date.now() + 2).toString(),
					content: aiResponse,
					sender: 'ai',
					timestamp: new Date()
				}];
			});

		} catch (error) {
			console.error('AI Chat Error:', error);
			// Remove loading message and add error message
			messages.update(msgs => {
				const filtered = msgs.filter(m => !m.loading);
				return [...filtered, {
					id: (Date.now() + 2).toString(),
					content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment or contact support if the issue persists.",
					sender: 'ai',
					timestamp: new Date()
				}];
			});
		} finally {
			isLoading = false;
			scrollToBottom();
		}
	}

	function scrollToBottom() {
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 100);
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function useSuggestion(suggestion: string) {
		currentMessage = suggestion;
		sendMessage();
	}

	function closeChat() {
		dispatch('close');
	}

	function toggleMinimize() {
		isMinimized = !isMinimized;
	}

	function clearChat() {
		messages.set([{
			id: Date.now().toString(),
			content: welcomeMessage,
			sender: 'ai',
			timestamp: new Date()
		}]);
	}
</script>

{#if isOpen}
	<div 
		class="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-2xl border-l border-neutral-200 flex flex-col"
		transition:fly="{{ x: 400, duration: 300 }}"
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
			<div class="flex items-center space-x-3">
				<div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
					</svg>
				</div>
				<div>
					<h3 class="font-semibold">AI Assistant</h3>
					<p class="text-xs text-white/80 capitalize">{userRole} Support</p>
				</div>
			</div>
			<div class="flex items-center space-x-2">
				<button
					on:click={toggleMinimize}
					class="p-1 hover:bg-white/20 rounded transition-colors"
					title={isMinimized ? 'Expand' : 'Minimize'}
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						{#if isMinimized}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
						{/if}
					</svg>
				</button>
				<button
					on:click={clearChat}
					class="p-1 hover:bg-white/20 rounded transition-colors"
					title="Clear Chat"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
				</button>
				<button
					on:click={closeChat}
					class="p-1 hover:bg-white/20 rounded transition-colors"
					title="Close"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>

		{#if !isMinimized}
			<!-- Quick Suggestions -->
			<div class="p-3 bg-neutral-50 border-b border-neutral-200">
				<p class="text-xs font-medium text-neutral-600 mb-2">Quick Actions:</p>
				<div class="flex flex-wrap gap-1">
					{#each roleSuggestions.slice(0, 3) as suggestion}
						<button
							on:click={() => useSuggestion(suggestion)}
							class="px-2 py-1 text-xs bg-white border border-neutral-300 rounded-full hover:bg-neutral-100 transition-colors"
							disabled={isLoading}
						>
							{suggestion.length > 30 ? suggestion.substring(0, 30) + '...' : suggestion}
						</button>
					{/each}
				</div>
			</div>

			<!-- Chat Messages -->
			<div 
				bind:this={chatContainer}
				class="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-25"
			>
				{#each $messages as message (message.id)}
					<div class="flex {message.sender === 'user' ? 'justify-end' : 'justify-start'}">
						<div class="flex items-start space-x-2 max-w-[80%] {message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}">
							<!-- Avatar -->
							<div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold {message.sender === 'user' ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-700'}">
								{message.sender === 'user' ? 'U' : 'AI'}
							</div>
							
							<!-- Message Content -->
							<div class="flex flex-col {message.sender === 'user' ? 'items-end' : 'items-start'}">
								<div class="px-3 py-2 rounded-lg {message.sender === 'user' ? 'bg-primary-600 text-white' : 'bg-white border border-neutral-200 text-neutral-900'}">
									{#if message.loading}
										<div class="flex items-center space-x-2">
											<LoadingSpinner size="sm" />
											<span class="text-sm text-neutral-500">AI is thinking...</span>
										</div>
									{:else}
										<p class="text-sm whitespace-pre-wrap">{message.content}</p>
									{/if}
								</div>
								<span class="text-xs text-neutral-500 mt-1">
									{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Input Area -->
			<div class="p-4 bg-white border-t border-neutral-200">
				<div class="flex space-x-2">
					<div class="flex-1">
						<textarea
							bind:value={currentMessage}
							on:keydown={handleKeyPress}
							placeholder="Ask me anything about insurance..."
							rows="2"
							disabled={isLoading}
							class="w-full px-3 py-2 border border-neutral-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
						></textarea>
					</div>
					<button
						on:click={sendMessage}
						disabled={!currentMessage.trim() || isLoading}
						class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
					>
						{#if isLoading}
							<LoadingSpinner size="sm" />
						{:else}
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
							</svg>
						{/if}
					</button>
				</div>
				
				<!-- Additional Suggestions -->
				<div class="mt-2 flex flex-wrap gap-1">
					{#each roleSuggestions.slice(3) as suggestion}
						<button
							on:click={() => useSuggestion(suggestion)}
							class="px-2 py-1 text-xs text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
							disabled={isLoading}
						>
							{suggestion.length > 25 ? suggestion.substring(0, 25) + '...' : suggestion}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Backdrop -->
	<div 
		class="fixed inset-0 bg-black bg-opacity-25 z-40"
		transition:fade="{{ duration: 300 }}"
		on:click={closeChat}
	></div>
{/if}

<style>
	.bg-neutral-25 {
		background-color: #fafafa;
	}
</style> 