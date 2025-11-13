
// lib/services/corporate-client-service.ts
import { 
  CorporateClient, 
  CorporateClientStatus, 
  CoveragePlan, 
  CoveragePlanStatus, 
  MOCK_CORPORATE_CLIENTS 
} from '../models/corporate-client';

// In-memory data store for demo purposes
let corporateClients = [...MOCK_CORPORATE_CLIENTS];

export const CorporateClientService = {
  /**
   * Create a new corporate client
   */
  createCorporateClient: async (client: Omit<CorporateClient, 'id' | 'createdAt' | 'updatedAt' | 'coveragePlans'>): Promise<CorporateClient> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newClient: CorporateClient = {
      ...client,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      coveragePlans: []
    };
    
    corporateClients.push(newClient);
    return newClient;
  },
  
  /**
   * Get all corporate clients
   */
  getAllCorporateClients: async (): Promise<CorporateClient[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return corporateClients;
  },
  
  /**
   * Get a corporate client by ID
   */
  getCorporateClientById: async (id: string): Promise<CorporateClient | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const client = corporateClients.find(c => c.id === id);
    return client || null;
  },
  
  /**
   * Get corporate clients by insurance company ID
   */
  getCorporateClientsByInsuranceCompanyId: async (insuranceCompanyId: string): Promise<CorporateClient[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return corporateClients.filter(c => c.insuranceCompanyId === insuranceCompanyId);
  },
  
  /**
   * Update corporate client status
   */
  updateCorporateClientStatus: async (id: string, status: CorporateClientStatus): Promise<CorporateClient | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const clientIndex = corporateClients.findIndex(c => c.id === id);
    if (clientIndex === -1) return null;
    
    const updatedClient = {
      ...corporateClients[clientIndex],
      status,
      updatedAt: new Date().toISOString()
    };
    
    corporateClients[clientIndex] = updatedClient;
    return updatedClient;
  },
  
  /**
   * Add a new coverage plan to a corporate client
   */
  addCoveragePlan: async (
    corporateClientId: string, 
    plan: Omit<CoveragePlan, 'id' | 'createdAt' | 'updatedAt' | 'corporateClientId'>
  ): Promise<CoveragePlan | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const clientIndex = corporateClients.findIndex(c => c.id === corporateClientId);
    if (clientIndex === -1) return null;
    
    const newPlan: CoveragePlan = {
      ...plan,
      id: Date.now().toString(),
      corporateClientId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    corporateClients[clientIndex].coveragePlans.push(newPlan);
    return newPlan;
  },
  
  /**
   * Update a coverage plan
   */
  updateCoveragePlan: async (
    corporateClientId: string,
    planId: string,
    updates: Partial<CoveragePlan>
  ): Promise<CoveragePlan | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const clientIndex = corporateClients.findIndex(c => c.id === corporateClientId);
    if (clientIndex === -1) return null;
    
    const planIndex = corporateClients[clientIndex].coveragePlans.findIndex(p => p.id === planId);
    if (planIndex === -1) return null;
    
    const updatedPlan = {
      ...corporateClients[clientIndex].coveragePlans[planIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    corporateClients[clientIndex].coveragePlans[planIndex] = updatedPlan;
    return updatedPlan;
  }
}; 