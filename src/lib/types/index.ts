import type { Timestamp } from 'firebase/firestore';

// User Types
export interface User {
	uid: string;
	email: string;
	firstName: string;
	lastName: string;
	role: 'admin' | 'broker' | 'assistant' | 'customer';
	licenseNumber?: string;
	phone?: string;
	avatar?: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	preferences: UserPreferences;
	activity: UserActivity;
}

export interface UserPreferences {
	theme: 'light' | 'dark' | 'auto';
	notifications: NotificationSettings;
	language: string;
	dashboardLayout: string[];
	timezone: string;
}

export interface NotificationSettings {
	email: boolean;
	push: boolean;
	sms: boolean;
	taskReminders: boolean;
	renewalAlerts: boolean;
	quotesExpiring: boolean;
}

export interface UserActivity {
	lastLogin: Timestamp;
	loginCount: number;
	lastAction: Timestamp;
	actionsToday: number;
}

// Client Types
export interface Client {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	businessName?: string;
	industry?: string;
	address: Address;
	dateOfBirth?: Timestamp;
	employeeCount?: number;
	annualRevenue?: number;
	brokerId: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	riskAssessment: RiskAssessment;
	tags: string[];
	notes: string;
	status: 'active' | 'inactive' | 'prospect';
}

export interface Address {
	street: string;
	city: string;
	state: string;
	zipCode: string;
	country: string;
}

export interface RiskAssessment {
	level: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
	score: number;
	factors: string[];
	lastUpdated: Timestamp;
	aiInsights: AIInsights;
	recommendations: string[];
}

export interface AIInsights {
	summary: string;
	confidence: number;
	keyFactors: string[];
	recommendations: string[];
	generatedAt: Timestamp;
}

// Quote Types
export interface Quote {
	id: string;
	clientId: string;
	brokerId: string;
	carrier: string;
	productType: InsuranceProductType;
	premium: Premium;
	coverage: Coverage;
	deductibles: Record<string, number>;
	status: QuoteStatus;
	validUntil: Timestamp;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	aiAnalysis?: QuoteAIAnalysis;
	documents: string[];
	notes: string;
}

export type InsuranceProductType = 
	| 'general_liability' 
	| 'professional_liability' 
	| 'commercial_property' 
	| 'workers_compensation' 
	| 'commercial_auto' 
	| 'cyber_liability' 
	| 'directors_officers' 
	| 'personal_auto' 
	| 'homeowners' 
	| 'life' 
	| 'health';

export interface Premium {
	annual: number;
	monthly?: number;
	quarterly?: number;
	semiAnnual?: number;
	paymentTerms: string;
	fees: Record<string, number>;
}

export interface Coverage {
	limits: Record<string, number>;
	exclusions: string[];
	endorsements: string[];
	territory: string;
}

export type QuoteStatus = 'draft' | 'pending' | 'quoted' | 'bound' | 'declined' | 'expired';

export interface QuoteAIAnalysis {
	riskScore: number;
	valueScore: number;
	competitiveness: 'low' | 'medium' | 'high';
	recommendations: string[];
	coverageGaps: string[];
	strengths: string[];
	concerns: string[];
	updatedAt: Timestamp;
}

// Policy Types
export interface Policy {
	id: string;
	policyNumber: string;
	clientId: string;
	brokerId: string;
	carrier: string;
	productType: InsuranceProductType;
	premium: Premium;
	coverage: Coverage;
	effectiveDate: Timestamp;
	expirationDate: Timestamp;
	status: PolicyStatus;
	documents: PolicyDocument[];
	claims: Claim[];
	createdAt: Timestamp;
	updatedAt: Timestamp;
	aiSummary?: PolicyAISummary;
}

export type PolicyStatus = 'active' | 'expired' | 'cancelled' | 'non_renewed' | 'pending';

export interface PolicyDocument {
	id: string;
	fileName: string;
	type: 'policy' | 'certificate' | 'endorsement' | 'declaration' | 'claim';
	downloadURL: string;
	uploadDate: Timestamp;
	aiExtractedData?: DocumentAIData;
}

export interface PolicyAISummary {
	keyPoints: string[];
	renewalPredictions: RenewalPrediction;
	riskChanges: RiskChange[];
	recommendations: string[];
	generatedAt: Timestamp;
}

export interface RenewalPrediction {
	likelihood: number;
	factors: string[];
	recommendedActions: string[];
	optimalTiming: Timestamp;
}

export interface RiskChange {
	factor: string;
	previousLevel: string;
	currentLevel: string;
	impact: 'positive' | 'negative' | 'neutral';
	recommendation: string;
}

// Claim Types
export interface Claim {
	id: string;
	claimNumber: string;
	policyId: string;
	clientId: string;
	dateOfLoss: Timestamp;
	reportedDate: Timestamp;
	status: ClaimStatus;
	amount: number;
	description: string;
	documents: PolicyDocument[];
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

export type ClaimStatus = 'reported' | 'investigating' | 'processing' | 'settled' | 'denied' | 'closed';

// Task Types
export interface Task {
	id: string;
	title: string;
	description: string;
	priority: TaskPriority;
	status: TaskStatus;
	dueDate: Timestamp;
	assigneeId: string;
	createdBy: string;
	clientId?: string;
	policyId?: string;
	quoteId?: string;
	tags: string[];
	timeSpent: number; // in minutes
	createdAt: Timestamp;
	updatedAt: Timestamp;
	completedAt?: Timestamp;
	aiPriority?: TaskAIPriority;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface TaskAIPriority {
	score: number;
	reasoning: string;
	urgencyFactors: string[];
	businessImpact: 'low' | 'medium' | 'high';
	calculatedAt: Timestamp;
}

// Document Types
export interface Document {
	id: string;
	fileName: string;
	fileType: string;
	size: number;
	storagePath: string;
	downloadURL: string;
	clientId?: string;
	policyId?: string;
	uploadedBy: string;
	uploadedAt: Timestamp;
	aiData?: DocumentAIData;
	access: DocumentAccess;
	versions: DocumentVersion[];
}

export interface DocumentAIData {
	extractedText: string;
	keyInformation: Record<string, any>;
	confidence: number;
	processingTime: number;
	summary: string;
	extractedAt: Timestamp;
}

export interface DocumentAccess {
	ownerId: string;
	permissions: Record<string, DocumentPermission>;
	isPublic: boolean;
}

export type DocumentPermission = 'read' | 'write' | 'admin';

export interface DocumentVersion {
	version: number;
	uploadDate: Timestamp;
	changes: string;
	uploadedBy: string;
}

// Report Types
export interface Report {
	id: string;
	type: ReportType;
	title: string;
	parameters: ReportParameters;
	data: any;
	createdBy: string;
	createdAt: Timestamp;
	schedule?: ReportSchedule;
	recipients: string[];
	aiInsights?: ReportAIInsights;
}

export type ReportType = 'dashboard' | 'client_summary' | 'revenue' | 'commission' | 'renewal' | 'loss_ratio' | 'custom';

export interface ReportParameters {
	dateRange: {
		start: Timestamp;
		end: Timestamp;
	};
	filters: Record<string, any>;
	groupBy?: string[];
	metrics: string[];
}

export interface ReportSchedule {
	frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
	time: string;
	timezone: string;
	enabled: boolean;
}

export interface ReportAIInsights {
	trends: TrendAnalysis[];
	recommendations: string[];
	anomalies: Anomaly[];
	summary: string;
	generatedAt: Timestamp;
}

export interface TrendAnalysis {
	metric: string;
	direction: 'up' | 'down' | 'stable';
	percentage: number;
	significance: 'low' | 'medium' | 'high';
	interpretation: string;
}

export interface Anomaly {
	metric: string;
	value: number;
	expected: number;
	deviation: number;
	description: string;
}

// Notification Types
export interface Notification {
	id: string;
	title: string;
	message: string;
	type: NotificationType;
	priority: 'low' | 'medium' | 'high' | 'urgent';
	userId: string;
	read: boolean;
	actionUrl?: string;
	data?: Record<string, any>;
	createdAt: Timestamp;
	readAt?: Timestamp;
	expiresAt?: Timestamp;
}

export type NotificationType = 'task' | 'quote' | 'policy' | 'renewal' | 'claim' | 'system' | 'ai_insight';

// UI Types
export interface DashboardWidget {
	id: string;
	type: WidgetType;
	title: string;
	position: { x: number; y: number };
	size: { width: number; height: number };
	config: Record<string, any>;
	visible: boolean;
}

export type WidgetType = 'summary' | 'tasks' | 'recent_clients' | 'quotes' | 'revenue' | 'ai_insights' | 'calendar' | 'notifications';

export interface MenuNavigation {
	label: string;
	href: string;
	icon: string;
	badge?: number;
	children?: MenuNavigation[];
}

// API Response Types
export interface APIResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
	metadata?: {
		page?: number;
		limit?: number;
		total?: number;
		hasNext?: boolean;
		hasPrev?: boolean;
	};
}

export interface PaginatedResponse<T> {
	items: T[];
	page: number;
	limit: number;
	total: number;
	pages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

// Form Types
export interface FormField {
	name: string;
	label: string;
	type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'file';
	required?: boolean;
	placeholder?: string;
	options?: { label: string; value: string }[];
	validation?: {
		pattern?: string;
		min?: number;
		max?: number;
		minLength?: number;
		maxLength?: number;
		custom?: (value: any) => string | null;
	};
}

export interface FormData {
	[key: string]: any;
}

export interface FormErrors {
	[key: string]: string;
}

// AI Service Types
export interface AIPromptConfig {
	template: string;
	model: string;
	temperature: number;
	maxTokens: number;
	systemMessage?: string;
}

export interface AIResponse {
	content: string;
	confidence: number;
	processingTime: number;
	model: string;
	usage: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

// State Management Types
export interface AppState {
	user: User | null;
	loading: boolean;
	error: string | null;
	notifications: Notification[];
	theme: 'light' | 'dark';
}

export interface ClientsState {
	clients: Client[];
	selectedClient: Client | null;
	loading: boolean;
	error: string | null;
	filters: ClientFilters;
	pagination: PaginationState;
}

export interface ClientFilters {
	search: string;
	status: string[];
	industry: string[];
	riskLevel: string[];
	dateRange?: {
		start: Date;
		end: Date;
	};
}

export interface PaginationState {
	page: number;
	limit: number;
	total: number;
	hasNext: boolean;
	hasPrev: boolean;
} 