export interface CorporateClient {
  id: string;
  name: string;
  insuranceCompanyId: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  status: CorporateClientStatus;
  createdAt: string;
  updatedAt: string;
  totalEmployees: number;
  coveragePlans: CoveragePlan[];
}

export enum CorporateClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

export interface CoveragePlan {
  id: string;
  name: string;
  description: string;
  corporateClientId: string;
  coverageDetails: string;
  monthlyPremium: number;
  deductible: number;
  coInsurance: number;
  outOfPocketMax: number;
  status: CoveragePlanStatus;
  createdAt: string;
  updatedAt: string;
}

export enum CoveragePlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

// Mock data for corporate clients
export const MOCK_CORPORATE_CLIENTS: CorporateClient[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    insuranceCompanyId: '1',
    contactPersonName: 'John Smith',
    contactEmail: 'jsmith@acme.com',
    contactPhone: '555-123-4567',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    status: CorporateClientStatus.ACTIVE,
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-04-20T00:00:00Z',
    totalEmployees: 250,
    coveragePlans: [
      {
        id: '1',
        name: 'Acme Premium Plan',
        description: 'Comprehensive coverage for Acme employees',
        corporateClientId: '1',
        coverageDetails: 'Full medical, dental, and vision coverage',
        monthlyPremium: 450,
        deductible: 500,
        coInsurance: 20,
        outOfPocketMax: 3000,
        status: CoveragePlanStatus.ACTIVE,
        createdAt: '2023-01-20T00:00:00Z',
        updatedAt: '2023-01-20T00:00:00Z',
      },
      {
        id: '2',
        name: 'Acme Basic Plan',
        description: 'Basic coverage for Acme employees',
        corporateClientId: '1',
        coverageDetails: 'Basic medical coverage',
        monthlyPremium: 250,
        deductible: 1000,
        coInsurance: 30,
        outOfPocketMax: 5000,
        status: CoveragePlanStatus.ACTIVE,
        createdAt: '2023-01-20T00:00:00Z',
        updatedAt: '2023-01-20T00:00:00Z',
      }
    ]
  },
  {
    id: '2',
    name: 'Globex Corporation',
    insuranceCompanyId: '1',
    contactPersonName: 'Jane Doe',
    contactEmail: 'jdoe@globex.com',
    contactPhone: '555-987-6543',
    address: '456 Park Ave',
    city: 'Boston',
    state: 'MA',
    zipCode: '02108',
    country: 'USA',
    status: CorporateClientStatus.ACTIVE,
    createdAt: '2023-02-10T00:00:00Z',
    updatedAt: '2023-05-15T00:00:00Z',
    totalEmployees: 500,
    coveragePlans: [
      {
        id: '3',
        name: 'Globex Elite Plan',
        description: 'Premium coverage for Globex employees',
        corporateClientId: '2',
        coverageDetails: 'Comprehensive medical, dental, vision, and mental health coverage',
        monthlyPremium: 550,
        deductible: 300,
        coInsurance: 10,
        outOfPocketMax: 2000,
        status: CoveragePlanStatus.ACTIVE,
        createdAt: '2023-02-15T00:00:00Z',
        updatedAt: '2023-02-15T00:00:00Z',
      }
    ]
  },
  {
    id: '3',
    name: 'Initech',
    insuranceCompanyId: '2',
    contactPersonName: 'Bill Lumbergh',
    contactEmail: 'blumbergh@initech.com',
    contactPhone: '555-789-0123',
    address: '789 Office Space Blvd',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75001',
    country: 'USA',
    status: CorporateClientStatus.PENDING,
    createdAt: '2023-03-05T00:00:00Z',
    updatedAt: '2023-03-05T00:00:00Z',
    totalEmployees: 120,
    coveragePlans: []
  }
]; 