// lib/services/corporate-client-service.ts
import {
  CorporateClient,
  FinancialPlan,
  FinancialPlanStatus,
  MOCK_CORPORATE_CLIENTS
} from '../models/corporate-client';

// In-memory data store for demo purposes
let corporateClients = [...MOCK_CORPORATE_CLIENTS];

export const FinanceClientService = {
  /**
   * Create a new corporate client
   */
  createCorporateClient: async (
    client: Omit<CorporateClient, 'id' | 'createdAt' | 'updatedAt' | 'financialPlans'>
  ): Promise<CorporateClient> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newClient: CorporateClient = {
      ...client,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      financialPlans: []
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
   * Get corporate clients by finance company ID
   */
  getCorporateClientsByFinanceCompanyId: async (financeCompanyId: string): Promise<CorporateClient[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return corporateClients.filter(c => c.financeCompanyId === financeCompanyId);
  },
  
  /**
   * Update corporate client (no status field used)
   */
  updateCorporateClient: async (
    id: string,
    updates: Partial<CorporateClient>
  ): Promise<CorporateClient | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const clientIndex = corporateClients.findIndex(c => c.id === id);
    if (clientIndex === -1) return null;
    
    const updatedClient = {
      ...corporateClients[clientIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    corporateClients[clientIndex] = updatedClient;
    return updatedClient;
  },
  
  /**
   * Add a new financial plan to a corporate client
   */
  addFinancialPlan: async (
    corporateClientId: string,
    plan: Omit<FinancialPlan, 'id' | 'createdAt' | 'updatedAt' | 'corporateClientId'>
  ): Promise<FinancialPlan | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const clientIndex = corporateClients.findIndex(c => c.id === corporateClientId);
    if (clientIndex === -1) return null;
    
    const newPlan: FinancialPlan = {
      ...plan,
      id: Date.now().toString(),
      corporateClientId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    corporateClients[clientIndex].financialPlans.push(newPlan);
    return newPlan;
  },
  
  /**
   * Update a financial plan
   */
  updateFinancialPlan: async (
    corporateClientId: string,
    planId: string,
    updates: Partial<FinancialPlan>
  ): Promise<FinancialPlan | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const clientIndex = corporateClients.findIndex(c => c.id === corporateClientId);
    if (clientIndex === -1) return null;
    
    const planIndex = corporateClients[clientIndex].financialPlans.findIndex(p => p.id === planId);
    if (planIndex === -1) return null;
    
    const updatedPlan = {
      ...corporateClients[clientIndex].financialPlans[planIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    corporateClients[clientIndex].financialPlans[planIndex] = updatedPlan;
    return updatedPlan;
  },
  
  /**
   * Delete a financial plan
   */
  deleteFinancialPlan: async (
    corporateClientId: string,
    planId: string
  ): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const clientIndex = corporateClients.findIndex(c => c.id === corporateClientId);
    if (clientIndex === -1) return false;
    
    const initialLength = corporateClients[clientIndex].financialPlans.length;
    corporateClients[clientIndex].financialPlans =
      corporateClients[clientIndex].financialPlans.filter(p => p.id !== planId);
    
    return corporateClients[clientIndex].financialPlans.length < initialLength;
  }
};