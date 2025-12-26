import { 
	addDoc, 
	collection, 
	serverTimestamp
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';

interface GroqAPIResponse {
	choices: Array<{
		message: {
			content: string;
		};
	}>;
}

class GroqAIService {
	private apiKey: string;
	private baseURL: string;

	constructor() {
		// Try to load API key from environment
		this.apiKey = '';
		this.baseURL = 'https://api.groq.com/openai/v1';
		
		// Check if we're in browser and try to access Vite env
		if (typeof window !== 'undefined') {
			try {
				// @ts-ignore - Vite injects this
				this.apiKey = import.meta.env?.VITE_GROQ_API_KEY || '';
			} catch (e) {
				console.log('Could not load environment variables');
			}
		}
		
		console.log('🔧 Groq AI Service Initialized');
		console.log('🔑 API Key Status:', this.apiKey ? 'Available' : 'Missing');
		
		if (!this.apiKey) {
			console.warn('⚠️ No Groq API key configured. Create .env file with VITE_GROQ_API_KEY');
			console.info('💡 AI will use fallback responses until API key is added');
		}
	}

	// Main chat function
	async getChatResponse(message: string, userContext: any): Promise<string> {
		console.log('🎯 Chat Request:', { message, role: userContext.userRole });
		
		try {
			// If no API key, use fallback
			if (!this.apiKey) {
				console.log('🤖 Using fallback response (no API key)');
				const response = this.getFallbackResponse(message, userContext);
				console.log('📤 Fallback response:', response.substring(0, 100) + '...');
				return response;
			}

			// Try real Groq API
			console.log('🚀 Calling Groq API...');
			const prompt = this.buildChatPrompt(message, userContext);
			const response = await this.callGroqAPI(prompt);
			
			console.log('✅ Groq API Success');
			return response;
			
		} catch (error) {
			console.error('❌ Groq API Error:', error);
			console.log('🔄 Falling back to local responses...');
			return this.getFallbackResponse(message, userContext);
		}
	}

	// Groq API call
	private async callGroqAPI(prompt: string): Promise<string> {
		const response = await fetch(`${this.baseURL}/chat/completions`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'llama3-8b-8192',
				messages: [
					{
						role: 'system',
						content: 'You are a helpful insurance assistant. Provide clear, professional, and helpful responses.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				temperature: 0.7,
				max_tokens: 1024
			})
		});

		if (!response.ok) {
			throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
		}

		const data: GroqAPIResponse = await response.json();
		return data.choices[0].message.content;
	}

	// Build chat prompt
	private buildChatPrompt(message: string, userContext: any): string {
		const role = userContext.userRole || 'visitor';
		return `User (${role}): ${message}

Please provide a helpful response as an insurance platform AI assistant.`;
	}

	// Fallback responses when API is not available
	private getFallbackResponse(message: string, userContext: any): string {
		const role = userContext.userRole || 'visitor';
		const lowerMessage = message.toLowerCase();

		console.log(`🤖 Generating fallback for ${role}: "${message}"`);

		// Role-specific responses
		if (role === 'admin') {
			if (lowerMessage.includes('user') || lowerMessage.includes('manage')) {
				return "🔧 **Admin Panel Access**: You can manage users through the 'App Admin Area' in the sidebar. From there, you can view user activity, manage permissions, and configure system settings.";
			}
			if (lowerMessage.includes('currency') || lowerMessage.includes('money')) {
				return "💰 **Currency Management**: Configure global currency settings in App Admin Area > Currency Settings. This updates currency formatting throughout the entire application for all users.";
			}
			if (lowerMessage.includes('product') || lowerMessage.includes('insurance')) {
				return "📋 **Product Management**: Manage insurance product types and categories in App Admin Area > Product Types. You can add new categories, create product types, and set base premiums.";
			}
			return "🔧 **Admin Dashboard**: As an admin, you have access to system management tools in the App Admin Area. You can manage users, configure settings, oversee business operations, and view comprehensive analytics. What specific area would you like help with?";
			
		} else if (role === 'broker') {
			if (lowerMessage.includes('client') || lowerMessage.includes('customer')) {
				return "👥 **Client Management**: You can manage clients through the Clients section. Create new client profiles, track their policies and quotes, and use AI-powered risk assessment to better serve them.";
			}
			if (lowerMessage.includes('quote') || lowerMessage.includes('price')) {
				return "💼 **Quote Generation**: Create and compare quotes using our intelligent quote system. The platform automatically compares rates across multiple carriers and provides AI-powered recommendations.";
			}
			if (lowerMessage.includes('commission') || lowerMessage.includes('revenue')) {
				return "📊 **Revenue Tracking**: Track your commission and revenue through the Dashboard analytics. You can view real-time performance metrics and generate detailed reports.";
			}
			return "💼 **Broker Tools**: As a broker, you have access to comprehensive client management, quote generation, policy administration, and business analytics tools. How can I help you grow your business today?";
			
		} else if (role === 'customer') {
			if (lowerMessage.includes('policy') || lowerMessage.includes('coverage')) {
				return "📄 **Policy Access**: You can view all your policies in the Policies section of your dashboard. Each policy shows coverage details, premium information, and renewal dates.";
			}
			if (lowerMessage.includes('claim') || lowerMessage.includes('file')) {
				return "🆘 **Claims Support**: To file a claim, go to the Claims section in your dashboard. You can upload supporting documents and track the status of your claims in real-time.";
			}
			if (lowerMessage.includes('payment') || lowerMessage.includes('premium')) {
				return "💳 **Payment Management**: Manage your payments and view premium schedules in your dashboard. You can set up autopay or make one-time payments securely online.";
			}
			return "🏠 **Customer Portal**: As a customer, you can manage your policies, file claims, make payments, and track coverage through your secure dashboard. What would you like help with today?";
			
		} else {
			// Visitor responses
			if (lowerMessage.includes('insurance') || lowerMessage.includes('coverage')) {
				return "🛡️ **Insurance Solutions**: We offer comprehensive insurance solutions including Auto, Home, Life, Health, Business, and Renters insurance. Each policy is tailored to your specific needs with competitive rates.";
			}
			if (lowerMessage.includes('quote') || lowerMessage.includes('price')) {
				return "💰 **Get a Quote**: Getting a quote is easy! You can apply online through our 'Apply' section, or contact one of our licensed agents. Our AI-powered system provides instant comparisons across multiple carriers.";
			}
			if (lowerMessage.includes('agent') || lowerMessage.includes('broker')) {
				return "👨‍💼 **Professional Support**: Our licensed insurance professionals are here to help you find the right coverage. You can contact us through the Contact page or schedule a consultation online.";
			}
			return "🎯 **Welcome!** I'm here to help you understand our insurance solutions and how our AI-powered platform can serve your needs. What specific information are you looking for?";
		}
	}

	// Set API key (for manual configuration)
	setApiKey(apiKey: string) {
		this.apiKey = apiKey;
		console.log('🔑 API Key updated:', apiKey ? 'Set' : 'Cleared');
	}
}

// Export singleton instance
export const groqAI = new GroqAIService();

// Export main function for chat
export async function getChatAssistance(message: string, context: any): Promise<string> {
	return groqAI.getChatResponse(message, context);
}

// Export utility to set API key
export function setGroqApiKey(apiKey: string) {
	groqAI.setApiKey(apiKey);
} 