import { 
	collection, 
	doc, 
	updateDoc, 
	addDoc, 
	query, 
	where, 
	getDocs, 
	serverTimestamp,
	onSnapshot 
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import { groqAI } from './groq';

export interface AutomationRule {
	id: string;
	name: string;
	description: string;
	triggerType: 'document_upload' | 'claim_submitted' | 'policy_expiring' | 'payment_overdue' | 'application_submitted';
	conditions: AutomationCondition[];
	actions: AutomationAction[];
	enabled: boolean;
	priority: 'low' | 'medium' | 'high';
	createdAt: Date;
	lastTriggered?: Date;
	triggerCount: number;
}

export interface AutomationCondition {
	field: string;
	operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'date_within';
	value: any;
}

export interface AutomationAction {
	type: 'send_email' | 'create_task' | 'update_status' | 'generate_document' | 'ai_review' | 'notify_broker';
	parameters: Record<string, any>;
}

export interface WorkflowEvent {
	id: string;
	type: string;
	entityId: string;
	entityType: 'quote' | 'policy' | 'claim' | 'customer';
	data: Record<string, any>;
	timestamp: Date;
	processed: boolean;
	automationResults?: AutomationResult[];
}

export interface AutomationResult {
	ruleId: string;
	ruleName: string;
	success: boolean;
	error?: string;
	actionsExecuted: string[];
	executedAt: Date;
}

class AutomationService {
	private listeners: Map<string, () => void> = new Map();

	// Initialize automation listeners
	async initializeAutomation() {
		console.log('🤖 Initializing automation service...');
		
		// Set up real-time listeners for different entity types
		this.setupQuoteListener();
		this.setupClaimListener();
		this.setupPolicyListener();
		this.setupCustomerListener();
		
		// Start periodic tasks
		this.startPeriodicTasks();
	}

	private setupQuoteListener() {
		const quotesRef = collection(db, 'quotes');
		const unsubscribe = onSnapshot(quotesRef, (snapshot) => {
			snapshot.docChanges().forEach((change) => {
				if (change.type === 'added' || change.type === 'modified') {
					const quote = { id: change.doc.id, ...change.doc.data() };
					this.processEvent({
						type: 'quote_updated',
						entityId: quote.id,
						entityType: 'quote',
						data: quote,
						timestamp: new Date()
					});
				}
			});
		});
		
		this.listeners.set('quotes', unsubscribe);
	}

	private setupClaimListener() {
		const claimsRef = collection(db, 'claims');
		const unsubscribe = onSnapshot(claimsRef, (snapshot) => {
			snapshot.docChanges().forEach((change) => {
				if (change.type === 'added' || change.type === 'modified') {
					const claim = { id: change.doc.id, ...change.doc.data() };
					this.processEvent({
						type: 'claim_updated',
						entityId: claim.id,
						entityType: 'claim',
						data: claim,
						timestamp: new Date()
					});
				}
			});
		});
		
		this.listeners.set('claims', unsubscribe);
	}

	private setupPolicyListener() {
		const policiesRef = collection(db, 'policies');
		const unsubscribe = onSnapshot(policiesRef, (snapshot) => {
			snapshot.docChanges().forEach((change) => {
				if (change.type === 'added' || change.type === 'modified') {
					const policy = { id: change.doc.id, ...change.doc.data() };
					this.processEvent({
						type: 'policy_updated',
						entityId: policy.id,
						entityType: 'policy',
						data: policy,
						timestamp: new Date()
					});
				}
			});
		});
		
		this.listeners.set('policies', unsubscribe);
	}

	private setupCustomerListener() {
		const usersRef = collection(db, 'users');
		const unsubscribe = onSnapshot(usersRef, (snapshot) => {
			snapshot.docChanges().forEach((change) => {
				if (change.type === 'added' || change.type === 'modified') {
					const customer = { id: change.doc.id, ...change.doc.data() };
					if (customer.role === 'customer') {
						this.processEvent({
							type: 'customer_updated',
							entityId: customer.id,
							entityType: 'customer',
							data: customer,
							timestamp: new Date()
						});
					}
				}
			});
		});
		
		this.listeners.set('customers', unsubscribe);
	}

	// Process automation events
	private async processEvent(event: Omit<WorkflowEvent, 'id' | 'processed'>) {
		try {
			// Store the event
			const eventRef = await addDoc(collection(db, 'automation_events'), {
				...event,
				processed: false,
				createdAt: serverTimestamp()
			});

			// Get applicable automation rules
			const rules = await this.getApplicableRules(event.type, event.data);
			
			// Execute rules
			const results: AutomationResult[] = [];
			for (const rule of rules) {
				const result = await this.executeRule(rule, event);
				results.push(result);
			}

			// Update event with results
			await updateDoc(doc(db, 'automation_events', eventRef.id), {
				processed: true,
				automationResults: results,
				processedAt: serverTimestamp()
			});

		} catch (error) {
			console.error('Error processing automation event:', error);
		}
	}

	// Get automation rules that apply to an event
	private async getApplicableRules(eventType: string, eventData: any): Promise<AutomationRule[]> {
		try {
			const rulesQuery = query(
				collection(db, 'automation_rules'),
				where('enabled', '==', true)
			);
			
			const rulesSnapshot = await getDocs(rulesQuery);
			const allRules = rulesSnapshot.docs.map(doc => ({ 
				id: doc.id, 
				...doc.data() 
			} as AutomationRule));

			// Filter rules based on trigger type and conditions
			return allRules.filter(rule => {
				// Check trigger type
				if (!this.matchesTriggerType(rule.triggerType, eventType)) {
					return false;
				}

				// Check conditions
				return this.evaluateConditions(rule.conditions, eventData);
			});

		} catch (error) {
			console.error('Error getting applicable rules:', error);
			return [];
		}
	}

	private matchesTriggerType(triggerType: string, eventType: string): boolean {
		const triggerMap: Record<string, string[]> = {
			'application_submitted': ['quote_updated'],
			'claim_submitted': ['claim_updated'],
			'document_upload': ['document_added'],
			'policy_expiring': ['policy_updated'],
			'payment_overdue': ['policy_updated']
		};

		return triggerMap[triggerType]?.includes(eventType) || false;
	}

	private evaluateConditions(conditions: AutomationCondition[], data: any): boolean {
		return conditions.every(condition => {
			const fieldValue = this.getFieldValue(data, condition.field);
			
			switch (condition.operator) {
				case 'equals':
					return fieldValue === condition.value;
				case 'contains':
					return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
				case 'greater_than':
					return Number(fieldValue) > Number(condition.value);
				case 'less_than':
					return Number(fieldValue) < Number(condition.value);
				case 'date_within':
					const date = new Date(fieldValue);
					const now = new Date();
					const daysFromNow = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
					return daysFromNow <= Number(condition.value);
				default:
					return true;
			}
		});
	}

	private getFieldValue(data: any, fieldPath: string): any {
		return fieldPath.split('.').reduce((obj, key) => obj?.[key], data);
	}

	// Execute a specific automation rule
	private async executeRule(rule: AutomationRule, event: Omit<WorkflowEvent, 'id' | 'processed'>): Promise<AutomationResult> {
		const result: AutomationResult = {
			ruleId: rule.id,
			ruleName: rule.name,
			success: true,
			actionsExecuted: [],
			executedAt: new Date()
		};

		try {
			for (const action of rule.actions) {
				await this.executeAction(action, event, rule);
				result.actionsExecuted.push(action.type);
			}

			// Update rule trigger count
			await updateDoc(doc(db, 'automation_rules', rule.id), {
				lastTriggered: serverTimestamp(),
				triggerCount: rule.triggerCount + 1
			});

		} catch (error) {
			result.success = false;
			result.error = error.message;
		}

		return result;
	}

	// Execute a specific automation action
	private async executeAction(action: AutomationAction, event: Omit<WorkflowEvent, 'id' | 'processed'>, rule: AutomationRule) {
		switch (action.type) {
			case 'send_email':
				await this.sendEmail(action.parameters, event);
				break;
			case 'create_task':
				await this.createTask(action.parameters, event);
				break;
			case 'update_status':
				await this.updateStatus(action.parameters, event);
				break;
			case 'generate_document':
				await this.generateDocument(action.parameters, event);
				break;
			case 'ai_review':
				await this.performAIReview(action.parameters, event);
				break;
			case 'notify_broker':
				await this.notifyBroker(action.parameters, event);
				break;
			default:
				console.warn(`Unknown automation action type: ${action.type}`);
		}
	}

	// Action implementations
	private async sendEmail(parameters: any, event: any) {
		// In a real implementation, this would integrate with an email service
		console.log('📧 Sending automated email:', {
			to: parameters.recipient,
			subject: parameters.subject,
			template: parameters.template,
			data: event.data
		});

		// Store email record
		await addDoc(collection(db, 'email_logs'), {
			type: 'automated',
			recipient: parameters.recipient,
			subject: parameters.subject,
			template: parameters.template,
			entityId: event.entityId,
			entityType: event.entityType,
			sentAt: serverTimestamp(),
			status: 'sent'
		});
	}

	private async createTask(parameters: any, event: any) {
		const taskData = {
			title: parameters.title || `Automated task for ${event.entityType} ${event.entityId}`,
			description: parameters.description || 'Task created by automation',
			priority: parameters.priority || 'medium',
			assigneeId: parameters.assigneeId,
			dueDate: parameters.dueDate,
			entityId: event.entityId,
			entityType: event.entityType,
			status: 'pending',
			automated: true,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		};

		await addDoc(collection(db, 'tasks'), taskData);
		console.log('📋 Created automated task:', taskData.title);
	}

	private async updateStatus(parameters: any, event: any) {
		const { collection: collectionName, field, value } = parameters;
		
		await updateDoc(doc(db, collectionName, event.entityId), {
			[field]: value,
			updatedAt: serverTimestamp(),
			automatedUpdate: true
		});

		console.log(`📝 Updated ${collectionName}/${event.entityId} ${field} to ${value}`);
	}

	private async generateDocument(parameters: any, event: any) {
		// In a real implementation, this would generate actual documents
		console.log('📄 Generating automated document:', {
			template: parameters.template,
			entityId: event.entityId,
			entityType: event.entityType
		});

		const documentData = {
			entityId: event.entityId,
			entityType: event.entityType,
			template: parameters.template,
			name: parameters.name || 'Automated Document',
			type: parameters.documentType || 'generated',
			status: 'generated',
			url: `https://docs.example.com/${event.entityId}/${parameters.template}.pdf`,
			generatedAt: serverTimestamp(),
			automated: true
		};

		await addDoc(collection(db, 'documents'), documentData);
	}

	private async performAIReview(parameters: any, event: any) {
		try {
			const prompt = parameters.prompt || this.getDefaultAIPrompt(event.entityType, event.data);
			
			const aiResponse = await groqAI.generateText(prompt, {
				temperature: 0.3,
				maxTokens: 500
			});

			const reviewData = {
				entityId: event.entityId,
				entityType: event.entityType,
				prompt: prompt,
				response: aiResponse,
				confidence: Math.random() * 0.3 + 0.7, // Simulated confidence score
				recommendations: this.extractRecommendations(aiResponse),
				reviewedAt: serverTimestamp(),
				automated: true
			};

			await addDoc(collection(db, 'ai_reviews'), reviewData);
			console.log('🤖 Completed AI review for:', event.entityType, event.entityId);

		} catch (error) {
			console.error('Error performing AI review:', error);
		}
	}

	private async notifyBroker(parameters: any, event: any) {
		const notificationData = {
			type: 'automation_alert',
			title: parameters.title || 'Automation Alert',
			message: parameters.message || `Automated action triggered for ${event.entityType}`,
			priority: parameters.priority || 'medium',
			entityId: event.entityId,
			entityType: event.entityType,
			brokerId: parameters.brokerId,
			read: false,
			createdAt: serverTimestamp()
		};

		await addDoc(collection(db, 'notifications'), notificationData);
		console.log('🔔 Sent broker notification:', notificationData.title);
	}

	// AI helper methods
	private getDefaultAIPrompt(entityType: string, data: any): string {
		switch (entityType) {
			case 'quote':
				return `Analyze this insurance quote application and provide risk assessment and recommendations:\n\n${JSON.stringify(data, null, 2)}`;
			case 'claim':
				return `Review this insurance claim for fraud indicators and processing recommendations:\n\n${JSON.stringify(data, null, 2)}`;
			case 'policy':
				return `Evaluate this insurance policy for renewal recommendations and risk factors:\n\n${JSON.stringify(data, null, 2)}`;
			default:
				return `Analyze this insurance-related data and provide insights:\n\n${JSON.stringify(data, null, 2)}`;
		}
	}

	private extractRecommendations(aiResponse: string): string[] {
		// Simple extraction of recommendations from AI response
		const lines = aiResponse.split('\n');
		const recommendations = lines
			.filter(line => line.toLowerCase().includes('recommend') || line.includes('•') || line.includes('-'))
			.map(line => line.trim())
			.filter(line => line.length > 10);

		return recommendations.slice(0, 5); // Return top 5 recommendations
	}

	// Periodic automation tasks
	private startPeriodicTasks() {
		// Check for expiring policies daily
		setInterval(() => {
			this.checkExpiringPolicies();
		}, 24 * 60 * 60 * 1000); // Daily

		// Check for overdue payments daily
		setInterval(() => {
			this.checkOverduePayments();
		}, 24 * 60 * 60 * 1000); // Daily

		// Process pending claims every hour
		setInterval(() => {
			this.processPendingClaims();
		}, 60 * 60 * 1000); // Hourly

		console.log('⏰ Started periodic automation tasks');
	}

	private async checkExpiringPolicies() {
		try {
			const now = new Date();
			const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

			const policiesQuery = query(
				collection(db, 'policies'),
				where('status', '==', 'active')
			);

			const policiesSnapshot = await getDocs(policiesQuery);
			
			for (const policyDoc of policiesSnapshot.docs) {
				const policy = policyDoc.data();
				const expirationDate = policy.dates?.expiration?.toDate();
				
				if (expirationDate && expirationDate <= thirtyDaysFromNow && expirationDate > now) {
					await this.processEvent({
						type: 'policy_expiring',
						entityId: policyDoc.id,
						entityType: 'policy',
						data: { ...policy, id: policyDoc.id },
						timestamp: now
					});
				}
			}

		} catch (error) {
			console.error('Error checking expiring policies:', error);
		}
	}

	private async checkOverduePayments() {
		try {
			const now = new Date();

			const policiesQuery = query(
				collection(db, 'policies'),
				where('status', '==', 'active'),
				where('paymentStatus', '!=', 'current')
			);

			const policiesSnapshot = await getDocs(policiesQuery);
			
			for (const policyDoc of policiesSnapshot.docs) {
				const policy = policyDoc.data();
				const nextDueDate = policy.payment?.nextDueDate?.toDate();
				
				if (nextDueDate && nextDueDate < now) {
					await this.processEvent({
						type: 'payment_overdue',
						entityId: policyDoc.id,
						entityType: 'policy',
						data: { ...policy, id: policyDoc.id },
						timestamp: now
					});
				}
			}

		} catch (error) {
			console.error('Error checking overdue payments:', error);
		}
	}

	private async processPendingClaims() {
		try {
			const claimsQuery = query(
				collection(db, 'claims'),
				where('status', '==', 'submitted')
			);

			const claimsSnapshot = await getDocs(claimsQuery);
			
			for (const claimDoc of claimsSnapshot.docs) {
				const claim = claimDoc.data();
				const submittedDate = claim.submittedAt?.toDate();
				const now = new Date();
				
				// Auto-acknowledge claims after 24 hours
				if (submittedDate && (now.getTime() - submittedDate.getTime()) > 24 * 60 * 60 * 1000) {
					await updateDoc(doc(db, 'claims', claimDoc.id), {
						status: 'acknowledged',
						'workflow.acknowledgment.date': serverTimestamp(),
						'workflow.acknowledgment.status': 'completed',
						'workflow.investigation.status': 'in_progress',
						updatedAt: serverTimestamp()
					});

					await this.processEvent({
						type: 'claim_acknowledged',
						entityId: claimDoc.id,
						entityType: 'claim',
						data: { ...claim, id: claimDoc.id },
						timestamp: now
					});
				}
			}

		} catch (error) {
			console.error('Error processing pending claims:', error);
		}
	}

	// Public methods for manual automation triggers
	async triggerAutomation(eventType: string, entityId: string, entityType: string, data: any) {
		await this.processEvent({
			type: eventType,
			entityId,
			entityType: entityType as any,
			data,
			timestamp: new Date()
		});
	}

	async createAutomationRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'triggerCount'>) {
		const ruleData = {
			...rule,
			createdAt: serverTimestamp(),
			triggerCount: 0
		};

		const ruleRef = await addDoc(collection(db, 'automation_rules'), ruleData);
		return ruleRef.id;
	}

	async getAutomationRules(): Promise<AutomationRule[]> {
		const rulesSnapshot = await getDocs(collection(db, 'automation_rules'));
		return rulesSnapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data()
		} as AutomationRule));
	}

	async updateAutomationRule(ruleId: string, updates: Partial<AutomationRule>) {
		await updateDoc(doc(db, 'automation_rules', ruleId), {
			...updates,
			updatedAt: serverTimestamp()
		});
	}

	async deleteAutomationRule(ruleId: string) {
		await updateDoc(doc(db, 'automation_rules', ruleId), {
			enabled: false,
			deletedAt: serverTimestamp()
		});
	}

	// Cleanup
	destroy() {
		this.listeners.forEach(unsubscribe => unsubscribe());
		this.listeners.clear();
		console.log('🛑 Automation service destroyed');
	}
}

export const automationService = new AutomationService();

// Initialize automation when this module is imported
if (typeof window !== 'undefined') {
	// Only run in browser environment
	automationService.initializeAutomation().catch(console.error);
} 