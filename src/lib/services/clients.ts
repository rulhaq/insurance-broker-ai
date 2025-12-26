import {
	collection,
	doc,
	addDoc,
	updateDoc,
	deleteDoc,
	getDoc,
	getDocs,
	query,
	where,
	orderBy,
	limit,
	startAfter,
	serverTimestamp,
	writeBatch
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import { groqAI } from './groq';
import type { Client, RiskAssessment, Address, PaginatedResponse } from '$types';

export interface ClientFilters {
	search?: string;
	industry?: string[];
	riskLevel?: string[];
	status?: string[];
	dateRange?: {
		start: Date;
		end: Date;
	};
}

export interface ClientFormData {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	businessName?: string;
	industry?: string;
	address: Address;
	dateOfBirth?: Date;
	employeeCount?: number;
	annualRevenue?: number;
	notes?: string;
	tags?: string[];
}

class ClientService {
	private collectionName = 'clients';

	// Create a new client with AI risk assessment
	async createClient(clientData: ClientFormData, brokerId: string): Promise<Client> {
		try {
			// Prepare client document - only include defined fields
			const newClient: any = {
				firstName: clientData.firstName,
				lastName: clientData.lastName,
				email: clientData.email,
				phone: clientData.phone,
				brokerId,
				status: clientData.status || 'prospect',
				tags: clientData.tags || [],
				notes: clientData.notes || '',
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
				riskAssessment: {
					level: 'MEDIUM',
					score: 50,
					factors: [],
					lastUpdated: serverTimestamp(),
					aiInsights: {
						summary: 'Initial assessment pending',
						confidence: 0,
						keyFactors: [],
						recommendations: [],
						generatedAt: serverTimestamp()
					},
					recommendations: []
				}
			};

			// Only add optional fields if they have values
			if (clientData.businessName) newClient.businessName = clientData.businessName;
			if (clientData.industry) newClient.industry = clientData.industry;
			if (clientData.website) newClient.website = clientData.website;
			if (clientData.description) newClient.description = clientData.description;
			if (clientData.employeeCount) newClient.employeeCount = clientData.employeeCount;
			if (clientData.annualRevenue) newClient.annualRevenue = clientData.annualRevenue;
			if (clientData.address) newClient.address = clientData.address;
			if (clientData.dateOfBirth) newClient.dateOfBirth = new Date(clientData.dateOfBirth);

			// Add client to Firestore
			const docRef = await addDoc(collection(db, this.collectionName), newClient);
			const client: Client = { id: docRef.id, ...newClient } as Client;

			// Perform AI risk assessment asynchronously
			this.performRiskAssessment(client).catch(error => {
				console.error('AI risk assessment failed:', error);
			});

			return client;
		} catch (error) {
			console.error('Error creating client:', error);
			throw new Error('Failed to create client');
		}
	}

	// Get client by ID
	async getClient(clientId: string): Promise<Client | null> {
		try {
			const docRef = doc(db, this.collectionName, clientId);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				return { id: docSnap.id, ...docSnap.data() } as Client;
			}
			return null;
		} catch (error) {
			console.error('Error getting client:', error);
			throw new Error('Failed to get client');
		}
	}

	// Update client
	async updateClient(clientId: string, updates: Partial<ClientFormData>): Promise<Client> {
		try {
			const clientRef = doc(db, this.collectionName, clientId);
			
			// Prepare updates with timestamp
			const updateData = {
				...updates,
				updatedAt: serverTimestamp()
			};

			await updateDoc(clientRef, updateData);

			// Get updated client
			const updatedClient = await this.getClient(clientId);
			if (!updatedClient) {
				throw new Error('Client not found after update');
			}

			// Trigger risk re-assessment if business details changed
			if (updates.industry || updates.annualRevenue || updates.employeeCount) {
				this.performRiskAssessment(updatedClient).catch(error => {
					console.error('AI risk re-assessment failed:', error);
				});
			}

			return updatedClient;
		} catch (error) {
			console.error('Error updating client:', error);
			throw new Error('Failed to update client');
		}
	}

	// Delete client (with GDPR compliance)
	async deleteClient(clientId: string, brokerId: string): Promise<void> {
		try {
			const batch = writeBatch(db);

			// Delete client document
			const clientRef = doc(db, this.collectionName, clientId);
			batch.delete(clientRef);

			// Delete related quotes
			const quotesQuery = query(
				collection(db, 'quotes'),
				where('clientId', '==', clientId)
			);
			const quotesSnapshot = await getDocs(quotesQuery);
			quotesSnapshot.docs.forEach(doc => {
				batch.delete(doc.ref);
			});

			// Delete related policies
			const policiesQuery = query(
				collection(db, 'policies'),
				where('clientId', '==', clientId)
			);
			const policiesSnapshot = await getDocs(policiesQuery);
			policiesSnapshot.docs.forEach(doc => {
				batch.delete(doc.ref);
			});

			// Delete related tasks
			const tasksQuery = query(
				collection(db, 'tasks'),
				where('clientId', '==', clientId)
			);
			const tasksSnapshot = await getDocs(tasksQuery);
			tasksSnapshot.docs.forEach(doc => {
				batch.delete(doc.ref);
			});

			// Delete related documents
			const documentsQuery = query(
				collection(db, 'documents'),
				where('clientId', '==', clientId)
			);
			const documentsSnapshot = await getDocs(documentsQuery);
			documentsSnapshot.docs.forEach(doc => {
				batch.delete(doc.ref);
			});

			// Log deletion for GDPR compliance
			const deletionLog = {
				clientId,
				deletedBy: brokerId,
				deletedAt: serverTimestamp(),
				reason: 'user_request'
			};
			batch.set(doc(collection(db, 'deletion_logs')), deletionLog);

			await batch.commit();
		} catch (error) {
			console.error('Error deleting client:', error);
			throw new Error('Failed to delete client');
		}
	}

	// Get clients with pagination and filters
	async getClients(
		brokerId: string | null, // Allow null for admin access to all clients
		filters: ClientFilters = {},
		page: number = 1,
		pageSize: number = 25
	): Promise<PaginatedResponse<Client>> {
		try {
			let baseQuery;
			
			// Admin sees all clients, brokers see only their own
			if (brokerId === null) {
				baseQuery = query(
					collection(db, this.collectionName),
					orderBy('updatedAt', 'desc')
				);
			} else {
				baseQuery = query(
					collection(db, this.collectionName),
					where('brokerId', '==', brokerId),
					orderBy('updatedAt', 'desc')
				);
			}

			// Apply filters
			if (filters.status && filters.status.length > 0) {
				baseQuery = query(baseQuery, where('status', 'in', filters.status));
			}

			if (filters.industry && filters.industry.length > 0) {
				baseQuery = query(baseQuery, where('industry', 'in', filters.industry));
			}

			// Apply pagination
			const startIndex = (page - 1) * pageSize;
			if (startIndex > 0) {
				// For pagination, we'd need to implement cursor-based pagination
				// This is a simplified version
				baseQuery = query(baseQuery, limit(pageSize));
			} else {
				baseQuery = query(baseQuery, limit(pageSize));
			}

			const snapshot = await getDocs(baseQuery);
			const clients: Client[] = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			})) as Client[];

			// Apply search filter (client-side for demo)
			let filteredClients = clients;
			if (filters.search) {
				const searchTerm = filters.search.toLowerCase();
				filteredClients = clients.filter(client =>
					`${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm) ||
					client.email.toLowerCase().includes(searchTerm) ||
					(client.businessName && client.businessName.toLowerCase().includes(searchTerm))
				);
			}

			// Apply risk level filter
			if (filters.riskLevel && filters.riskLevel.length > 0) {
				filteredClients = filteredClients.filter(client =>
					filters.riskLevel!.includes(client.riskAssessment.level)
				);
			}

			// Calculate pagination info
			const total = filteredClients.length;
			const pages = Math.ceil(total / pageSize);
			const hasNext = page < pages;
			const hasPrev = page > 1;

			return {
				items: filteredClients,
				page,
				limit: pageSize,
				total,
				pages,
				hasNext,
				hasPrev
			};
		} catch (error) {
			console.error('Error getting clients:', error);
			throw new Error('Failed to get clients');
		}
	}

	// Search clients
	async searchClients(brokerId: string | null, searchTerm: string): Promise<Client[]> {
		try {
			console.log('🔍 ClientService.searchClients called with:', { brokerId, searchTerm });
			let clientsQuery;
			
			// Admin sees all clients, brokers see only their own
			if (brokerId === null) {
				clientsQuery = query(collection(db, this.collectionName));
				console.log('🔧 Admin query: getting all clients');
			} else {
				clientsQuery = query(
					collection(db, this.collectionName),
					where('brokerId', '==', brokerId)
				);
				console.log('🔧 Broker query: filtering by brokerId =', brokerId);
			}

			const snapshot = await getDocs(clientsQuery);
			console.log('📊 Raw Firebase results:', snapshot.docs.length, 'documents');
			
			const clients: Client[] = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			})) as Client[];

			console.log('👥 All clients before filtering:', clients.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, brokerId: c.brokerId })));

			// Filter by search term
			const searchLower = searchTerm.toLowerCase();
			const filteredClients = clients.filter(client =>
				`${client.firstName} ${client.lastName}`.toLowerCase().includes(searchLower) ||
				client.email.toLowerCase().includes(searchLower) ||
				(client.businessName && client.businessName.toLowerCase().includes(searchLower))
			);
			
			console.log('🎯 Filtered clients:', filteredClients.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}` })));
			return filteredClients;
		} catch (error) {
			console.error('Error searching clients:', error);
			throw new Error('Failed to search clients');
		}
	}

	// Get client statistics
	async getClientStats(brokerId: string): Promise<any> {
		try {
			const clientsQuery = query(
				collection(db, this.collectionName),
				where('brokerId', '==', brokerId)
			);

			const snapshot = await getDocs(clientsQuery);
			const clients: Client[] = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			})) as Client[];

			const stats = {
				total: clients.length,
				active: clients.filter(c => c.status === 'active').length,
				prospects: clients.filter(c => c.status === 'prospect').length,
				inactive: clients.filter(c => c.status === 'inactive').length,
				riskDistribution: {
					LOW: clients.filter(c => c.riskAssessment.level === 'LOW').length,
					MEDIUM: clients.filter(c => c.riskAssessment.level === 'MEDIUM').length,
					HIGH: clients.filter(c => c.riskAssessment.level === 'HIGH').length,
					VERY_HIGH: clients.filter(c => c.riskAssessment.level === 'VERY_HIGH').length
				},
				industryDistribution: this.calculateIndustryDistribution(clients),
				recentlyAdded: clients.filter(c => {
					const created = c.createdAt as any;
					const thirtyDaysAgo = new Date();
					thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
					return created.toDate() > thirtyDaysAgo;
				}).length
			};

			return stats;
		} catch (error) {
			console.error('Error getting client stats:', error);
			throw new Error('Failed to get client statistics');
		}
	}

	// Perform AI risk assessment
	private async performRiskAssessment(client: Client): Promise<void> {
		try {
			const riskAssessment = await groqAI.analyzeClientRisk(client);
			
			// Update client with AI assessment
			await updateDoc(doc(db, this.collectionName, client.id), {
				riskAssessment,
				updatedAt: serverTimestamp()
			});
		} catch (error) {
			console.error('Error performing risk assessment:', error);
		}
	}

	// Calculate industry distribution
	private calculateIndustryDistribution(clients: Client[]): Record<string, number> {
		const distribution: Record<string, number> = {};
		
		clients.forEach(client => {
			const industry = client.industry || 'Other';
			distribution[industry] = (distribution[industry] || 0) + 1;
		});

		return distribution;
	}

	// Export client data for GDPR compliance
	async exportClientData(clientId: string, brokerId: string): Promise<any> {
		try {
			const client = await this.getClient(clientId);
			if (!client || client.brokerId !== brokerId) {
				throw new Error('Client not found or access denied');
			}

			// Collect all related data
			const exportData = {
				client,
				quotes: await this.getRelatedQuotes(clientId),
				policies: await this.getRelatedPolicies(clientId),
				tasks: await this.getRelatedTasks(clientId),
				documents: await this.getRelatedDocuments(clientId)
			};

			// Log export for compliance
			await addDoc(collection(db, 'export_logs'), {
				clientId,
				exportedBy: brokerId,
				exportedAt: serverTimestamp(),
				dataSize: JSON.stringify(exportData).length
			});

			return exportData;
		} catch (error) {
			console.error('Error exporting client data:', error);
			throw new Error('Failed to export client data');
		}
	}

	// Helper methods for related data
	private async getRelatedQuotes(clientId: string): Promise<any[]> {
		const quotesQuery = query(
			collection(db, 'quotes'),
			where('clientId', '==', clientId)
		);
		const snapshot = await getDocs(quotesQuery);
		return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
	}

	private async getRelatedPolicies(clientId: string): Promise<any[]> {
		const policiesQuery = query(
			collection(db, 'policies'),
			where('clientId', '==', clientId)
		);
		const snapshot = await getDocs(policiesQuery);
		return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
	}

	private async getRelatedTasks(clientId: string): Promise<any[]> {
		const tasksQuery = query(
			collection(db, 'tasks'),
			where('clientId', '==', clientId)
		);
		const snapshot = await getDocs(tasksQuery);
		return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
	}

	private async getRelatedDocuments(clientId: string): Promise<any[]> {
		const documentsQuery = query(
			collection(db, 'documents'),
			where('clientId', '==', clientId)
		);
		const snapshot = await getDocs(documentsQuery);
		return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
	}
}

// Export singleton instance
export const clientService = new ClientService();

// Export utility functions
export async function createClient(clientData: ClientFormData, brokerId: string): Promise<Client> {
	return clientService.createClient(clientData, brokerId);
}

export async function getClient(clientId: string): Promise<Client | null> {
	return clientService.getClient(clientId);
}

export async function updateClient(clientId: string, updates: Partial<ClientFormData>): Promise<Client> {
	return clientService.updateClient(clientId, updates);
}

export async function deleteClient(clientId: string, brokerId: string): Promise<void> {
	return clientService.deleteClient(clientId, brokerId);
}

export async function getClients(
	brokerId: string | null, // Allow null for admin access to all clients
	filters?: ClientFilters,
	page?: number,
	pageSize?: number
): Promise<PaginatedResponse<Client>> {
	return clientService.getClients(brokerId, filters, page, pageSize);
}

export async function searchClients(brokerId: string | null, searchTerm: string): Promise<Client[]> {
	return clientService.searchClients(brokerId, searchTerm);
}

export async function getClientStats(brokerId: string): Promise<any> {
	return clientService.getClientStats(brokerId);
}

export async function exportClientData(clientId: string, brokerId: string): Promise<any> {
	return clientService.exportClientData(clientId, brokerId);
} 