import { AdminType, UserType, Resource } from '../types/enums';


/**
 * Component access codes for role-based access control
 * Each component in the system should have a unique component ID
 */
export enum ComponentId {
  // Common components
  LOGIN = 'com.login',
  HEADER = 'com.header',
  DASHBOARD = 'com.dashboard',
  PROVIDER_DASHBOARD = 'provider.dashboard',
  
  // User management components
  USER_LIST = 'users.list',
  USER_CREATE = 'users.create',
  USER_EDIT = 'users.edit',
  USER_DELETE = 'users.delete',
  
  // Insurance company components
  INSURANCE_LIST = 'insurance.list',
  INSURANCE_CREATE = 'insurance.create',
  INSURANCE_EDIT = 'insurance.edit',
  INSURANCE_DELETE = 'insurance.delete',
  INSURANCE_ADMIN_DASHBOARD = "insurance.admin.dashboard",
  
  // Policy components
  POLICY_LIST = 'policy.list',
  POLICY_CREATE = 'policy.create',
  POLICY_EDIT = 'policy.edit',
  POLICY_DELETE = 'policy.delete',
  
  // Claims components
  CLAIM_LIST = 'claim.list',
  CLAIM_CREATE = 'claim.create',
  CLAIM_EDIT = 'claim.edit',
  CLAIM_APPROVE = 'claim.approve',
  CLAIM_REJECT = 'claim.reject',
  
  // Invoice components
  INVOICE_LIST = 'invoice.list',
  INVOICE_CREATE = 'invoice.create',
  INVOICE_EDIT = 'invoice.edit',
  INVOICE_APPROVE = 'invoice.approve',
  INVOICE_REJECT = 'invoice.reject',
  
  // Medical Catalog components
  MEDICAL_CATALOG_SERVICES = 'medical_catalog.services',
  MEDICAL_CATALOG_PROCEDURES = 'medical_catalog.procedures',
  MEDICAL_CATALOG_MEDICATIONS = 'medical_catalog.medications',
  MEDICAL_CATALOG_EQUIPMENT = 'medical_catalog.equipment',
  
  // Corporate client components
  CORPORATE_LIST = 'corporate.list',
  CORPORATE_CREATE = 'corporate.create',
  CORPORATE_EDIT = 'corporate.edit',
  CORPORATE_DELETE = 'corporate.delete',
  CORPORATE_ADMIN_DASHBOARD = "corporate.admin.dashboard",
  
  // Coverage plan components
  COVERAGE_LIST = 'coverage.list',
  COVERAGE_CREATE = 'coverage.create',
  COVERAGE_EDIT = 'coverage.edit',
  COVERAGE_DELETE = 'coverage.delete',
  
  // Profile components
  PROFILE_VIEW = 'profile.view',
  PROFILE_EDIT = 'profile.edit',
  
  // Settings components
  SETTINGS_VIEW = 'settings.view',
  SETTINGS_EDIT = 'settings.edit',
  
  // Admin management components
  ADMIN_LIST = 'admin.list',
  ADMIN_CREATE = 'admin.create',
  ADMIN_EDIT = 'admin.edit',
  ADMIN_DELETE = 'admin.delete',
  
  // Permission management components
  PERMISSION_VIEW = 'permission-view',
  PERMISSION_EDIT = 'permission-edit',
  
  // Sidebar components
  SIDEBAR_DASHBOARD = 'sidebar.dashboard',
  SIDEBAR_INSURANCE_COMPANIES = 'sidebar.insurance_companies',
  SIDEBAR_CREATE_INSURANCE = 'sidebar.create_insurance',
  SIDEBAR_INSURANCE_CREATE = 'sidebar.insurance_create',
  SIDEBAR_INSURANCE_LIST = 'sidebar.insurance_list',
  SIDEBAR_INSURANCE_EDIT = 'sidebar.insurance_edit',
  SIDEBAR_INSURANCE_DELETE = 'sidebar.insurance_delete',
  SIDEBAR_ADMINS = 'sidebar.admins',
  SIDEBAR_PROFILE = 'sidebar.profile',
  SIDEBAR_SETTINGS = 'sidebar.settings',
  SIDEBAR_POLICIES = 'sidebar.policies',
  SIDEBAR_CLAIMS = 'sidebar.claims',
  SIDEBAR_COVERAGE = 'sidebar.coverage',
  SIDEBAR_POLICY_CONTRACT = 'sidebar.policy_contract',
  SIDEBAR_PROVIDERS = 'sidebar.providers',
  SIDEBAR_CORPORATE = 'sidebar.corporate',
  SIDEBAR_STAFF = 'sidebar.staff',
  SIDEBAR_MEMBERS = 'sidebar.members',
  SIDEBAR_USERS = 'sidebar.users',
  SIDEBAR_PERMISSIONS = 'sidebar.permissions',
  SIDEBAR_INVOICES = 'sidebar.invoices',
  SIDEBAR_MEDICAL_CATALOG = 'sidebar.medical_catalog',
  
  // Provider management components
  PROVIDER_LIST = 'provider.list',
  PROVIDER_CREATE = 'provider.create',
  PROVIDER_EDIT = 'provider.edit',
  PROVIDER_DELETE = 'provider.delete',
  PROVIDER_ADMIN_DASHBOARD = 'provider.admin.dashboard',
  PROVIDER_ADMIN_LIST = 'provider.admin.list',
  PROVIDER_ADMIN_CREATE = 'provider.admin.create',
  PROVIDER_ADMIN_EDIT = 'provider.admin.edit',
  PROVIDER_ADMIN_DELETE = 'provider.admin.delete',
  PROVIDER_ADMIN_PERMISSION = 'provider.admin.permission',
  
  // Corporate management components
  CORPORATE_ADMIN_LIST = 'corporate.admin.list',
  CORPORATE_ADMIN_CREATE = 'corporate.admin.create',
  CORPORATE_ADMIN_EDIT = 'corporate.admin.edit',
  CORPORATE_ADMIN_DELETE = 'corporate.admin.delete',
  CORPORATE_ADMIN_PERMISSION = 'corporate.admin.permission',
  
  // Staff management components
  STAFF_LIST = 'staff.list',
  STAFF_CREATE = 'staff.create',
  STAFF_EDIT = 'staff.edit',
  STAFF_DELETE = 'staff.delete',
  STAFF_PERMISSION = 'staff.permission',
  STAFF_DASHBOARD = "staff.dashboard",
  
  // Member management components
  MEMBER_LIST = 'member.list',
  MEMBER_CREATE = 'member.create',
  MEMBER_EDIT = 'member.edit',
  MEMBER_DELETE = 'member.delete',
  MEMBER_DASHBOARD = "member.dashboard",
  
  // Provider member management components
  PROVIDER_MEMBER_LIST = 'provider.member.list',
  PROVIDER_MEMBER_CREATE = 'provider.member.create',
  PROVIDER_MEMBER_EDIT = 'provider.member.edit',
  PROVIDER_MEMBER_DELETE = 'provider.member.delete',
  
  // Sidebar sections for insurance admin
  SIDEBAR_PROVIDERS_ADMIN = 'sidebar.providers.admin',
  INSURANCE_ADMIN_PERMISSIONS = 'insurance-admin-permissions',
  CORPORATE_ADMIN_PERMISSIONS = 'corporate-admin-permissions',
  PROVIDER_ADMIN_PERMISSIONS = 'provider-admin-permissions',
  
  // Staff specific components
  STAFF_CLAIMS_LIST = 'staff.claims.list',
  STAFF_CLAIMS_PROCESS = 'staff.claims.process',
  STAFF_PROVIDERS_LIST = 'staff.providers.list',
  STAFF_PROVIDERS_CREATE = 'staff.providers.create',
  STAFF_PROVIDERS_EDIT = 'staff.providers.edit',
}

/**
 * Maps user types to the components they can access
 */
export const USER_TYPE_COMPONENT_MAP: Record<UserType, ComponentId[]> = {
  [UserType.ADMIN]: [
    // Common components
    ComponentId.LOGIN,
    ComponentId.HEADER,
    ComponentId.DASHBOARD,
    ComponentId.SIDEBAR_DASHBOARD,
    ComponentId.SIDEBAR_PROFILE,
    ComponentId.SIDEBAR_SETTINGS,
    
    // All admin components
    ComponentId.SIDEBAR_INSURANCE_LIST,
    ComponentId.SIDEBAR_INSURANCE_CREATE,
    ComponentId.SIDEBAR_INSURANCE_EDIT,
    ComponentId.SIDEBAR_INSURANCE_DELETE,
    ComponentId.ADMIN_LIST,
    ComponentId.ADMIN_CREATE,
    ComponentId.ADMIN_EDIT,
    ComponentId.ADMIN_DELETE,
    ComponentId.USER_LIST,
    ComponentId.USER_CREATE,
    ComponentId.USER_EDIT,
    ComponentId.USER_DELETE,
    ComponentId.PERMISSION_VIEW,
    ComponentId.PERMISSION_EDIT,
    ComponentId.PROFILE_VIEW,
    ComponentId.PROFILE_EDIT,
    ComponentId.SETTINGS_VIEW,
    ComponentId.SETTINGS_EDIT,
    ComponentId.SIDEBAR_INSURANCE_COMPANIES,
    ComponentId.SIDEBAR_CREATE_INSURANCE,
    ComponentId.SIDEBAR_ADMINS,
    ComponentId.SIDEBAR_INVOICES,
    ComponentId.SIDEBAR_MEDICAL_CATALOG,
    ComponentId.INVOICE_LIST,
    ComponentId.INVOICE_CREATE,
    ComponentId.INVOICE_EDIT,
    ComponentId.INVOICE_APPROVE,
    ComponentId.INVOICE_REJECT,
    ComponentId.MEDICAL_CATALOG_SERVICES,
    ComponentId.MEDICAL_CATALOG_PROCEDURES,
    ComponentId.MEDICAL_CATALOG_MEDICATIONS,
    ComponentId.MEDICAL_CATALOG_EQUIPMENT,
  ],
  
  [UserType.INSURANCE_ADMIN]: [
    // Common components
    ComponentId.LOGIN,
    ComponentId.HEADER,
    ComponentId.INSURANCE_ADMIN_DASHBOARD,
    ComponentId.SIDEBAR_DASHBOARD,
    ComponentId.SIDEBAR_PROFILE,
    ComponentId.SIDEBAR_SETTINGS,
    ComponentId.SIDEBAR_POLICIES,
    ComponentId.SIDEBAR_CLAIMS,
    ComponentId.SIDEBAR_COVERAGE,
    ComponentId.SIDEBAR_PROVIDERS,
    ComponentId.SIDEBAR_CORPORATE,
    ComponentId.SIDEBAR_STAFF,
    ComponentId.SIDEBAR_MEMBERS,
    ComponentId.SIDEBAR_USERS,
    ComponentId.SIDEBAR_PERMISSIONS,
    
    // Insurance admin specific components
    ComponentId.POLICY_LIST,
    ComponentId.POLICY_CREATE,
    ComponentId.POLICY_EDIT,
    ComponentId.POLICY_DELETE,
    ComponentId.CLAIM_LIST,
    ComponentId.CLAIM_EDIT,
    ComponentId.CLAIM_APPROVE,
    ComponentId.CLAIM_REJECT,
    ComponentId.COVERAGE_LIST,
    ComponentId.COVERAGE_CREATE,
    ComponentId.COVERAGE_EDIT,
    ComponentId.COVERAGE_DELETE,
    ComponentId.PROVIDER_LIST,
    ComponentId.PROVIDER_CREATE,
    ComponentId.PROVIDER_EDIT,
    ComponentId.PROVIDER_DELETE,
    ComponentId.CORPORATE_LIST,
    ComponentId.CORPORATE_CREATE,
    ComponentId.CORPORATE_EDIT,
    ComponentId.CORPORATE_DELETE,
    ComponentId.STAFF_LIST,
    ComponentId.STAFF_CREATE,
    ComponentId.STAFF_EDIT,
    ComponentId.STAFF_DELETE,
    ComponentId.MEMBER_LIST,
    ComponentId.MEMBER_CREATE,
    ComponentId.MEMBER_EDIT,
    ComponentId.MEMBER_DELETE,
    ComponentId.PROFILE_VIEW,
    ComponentId.PROFILE_EDIT,
    ComponentId.SETTINGS_VIEW,
    ComponentId.SETTINGS_EDIT,
    ComponentId.SIDEBAR_PROVIDERS_ADMIN,
    ComponentId.SIDEBAR_POLICY_CONTRACT,
    ComponentId.SIDEBAR_INVOICES,
    ComponentId.SIDEBAR_MEDICAL_CATALOG,
    ComponentId.INVOICE_LIST,
    ComponentId.INVOICE_CREATE,
    ComponentId.INVOICE_EDIT,
    ComponentId.MEDICAL_CATALOG_SERVICES,
    ComponentId.MEDICAL_CATALOG_PROCEDURES,
    ComponentId.MEDICAL_CATALOG_MEDICATIONS,
    ComponentId.MEDICAL_CATALOG_EQUIPMENT,
  ],
  
  [UserType.INSURANCE_STAFF]: [
    ComponentId.LOGIN,
    ComponentId.HEADER,
    ComponentId.STAFF_DASHBOARD,
    ComponentId.SIDEBAR_DASHBOARD,
    ComponentId.SIDEBAR_PROFILE,
    ComponentId.POLICY_LIST,
    ComponentId.CLAIM_LIST,
    ComponentId.CLAIM_EDIT,
    ComponentId.PROFILE_VIEW,
    ComponentId.PROFILE_EDIT,
  ],
  
  [UserType.CORPORATE_ADMIN]: [
    // Core navigation
    ComponentId.LOGIN,
    ComponentId.HEADER,
    ComponentId.CORPORATE_ADMIN_DASHBOARD,
    ComponentId.SIDEBAR_DASHBOARD,
    ComponentId.SIDEBAR_PROFILE,
    ComponentId.SIDEBAR_SETTINGS,
    // Claims management
    ComponentId.SIDEBAR_CLAIMS,
    ComponentId.CLAIM_LIST,
    ComponentId.CLAIM_CREATE,
    ComponentId.CLAIM_EDIT,
    ComponentId.CLAIM_APPROVE,
    ComponentId.CLAIM_REJECT,
    // Members management
    ComponentId.SIDEBAR_MEMBERS,
    ComponentId.MEMBER_LIST,
    ComponentId.MEMBER_CREATE,
    ComponentId.MEMBER_EDIT,
    ComponentId.MEMBER_DELETE,
    // Profile
    ComponentId.PROFILE_VIEW,
    ComponentId.PROFILE_EDIT,
    // Settings
    ComponentId.SETTINGS_VIEW,
    ComponentId.SETTINGS_EDIT,
    // (Optional) Add invoice/medical service ComponentIds here if you have them
    ComponentId.SIDEBAR_INVOICES,
    ComponentId.INVOICE_LIST,
    ComponentId.INVOICE_CREATE,
    ComponentId.INVOICE_EDIT,
  ],
  
  [UserType.PROVIDER]: [
    ComponentId.LOGIN,
    ComponentId.HEADER,
    ComponentId.DASHBOARD,
    ComponentId.SIDEBAR_DASHBOARD,
    ComponentId.SIDEBAR_PROFILE,
    ComponentId.SIDEBAR_SETTINGS,
    ComponentId.SIDEBAR_CLAIMS,
    ComponentId.SIDEBAR_MEMBERS,
    ComponentId.SIDEBAR_INVOICES,
    ComponentId.SIDEBAR_MEDICAL_CATALOG,
    ComponentId.SIDEBAR_PROVIDERS,
    ComponentId.CLAIM_LIST,
    ComponentId.CLAIM_CREATE,
    ComponentId.CLAIM_EDIT,
    ComponentId.PROFILE_VIEW,
    ComponentId.PROFILE_EDIT,
    ComponentId.SETTINGS_VIEW,
    ComponentId.SETTINGS_EDIT,
    ComponentId.COVERAGE_LIST,
    ComponentId.INVOICE_LIST,
    ComponentId.INVOICE_CREATE,
    ComponentId.INVOICE_EDIT,
    ComponentId.MEDICAL_CATALOG_SERVICES,
    ComponentId.MEDICAL_CATALOG_PROCEDURES,
    ComponentId.MEDICAL_CATALOG_MEDICATIONS,
    ComponentId.MEDICAL_CATALOG_EQUIPMENT,
    ComponentId.PROVIDER_LIST,
    ComponentId.PROVIDER_CREATE,
    ComponentId.PROVIDER_EDIT,
    ComponentId.MEMBER_LIST,
    ComponentId.MEMBER_CREATE,
    ComponentId.MEMBER_EDIT,
  ],
  
  [UserType.PROVIDER_ADMIN]: [
    ComponentId.LOGIN,
    ComponentId.HEADER,
    ComponentId.PROVIDER_ADMIN_DASHBOARD,
    ComponentId.SIDEBAR_DASHBOARD,
    ComponentId.SIDEBAR_PROFILE,
    ComponentId.SIDEBAR_SETTINGS,
    ComponentId.CLAIM_LIST,
    ComponentId.CLAIM_CREATE,
    ComponentId.CLAIM_EDIT,
    ComponentId.CLAIM_APPROVE,
    ComponentId.CLAIM_REJECT,
    ComponentId.PROFILE_VIEW,
    ComponentId.PROFILE_EDIT,
    ComponentId.SETTINGS_VIEW,
    ComponentId.SETTINGS_EDIT,
    ComponentId.SIDEBAR_CLAIMS,
    ComponentId.SIDEBAR_INVOICES,
    ComponentId.SIDEBAR_MEDICAL_CATALOG,
    ComponentId.INVOICE_LIST,
    ComponentId.INVOICE_CREATE,
    ComponentId.INVOICE_EDIT,
    ComponentId.MEDICAL_CATALOG_SERVICES,
    ComponentId.MEDICAL_CATALOG_PROCEDURES,
    ComponentId.MEDICAL_CATALOG_MEDICATIONS,
    ComponentId.MEDICAL_CATALOG_EQUIPMENT,
  ],
  
  [UserType.STAFF]: [
    ComponentId.LOGIN,
    ComponentId.HEADER,
    ComponentId.STAFF_DASHBOARD,
    ComponentId.SIDEBAR_DASHBOARD,
    ComponentId.SIDEBAR_PROFILE,
    ComponentId.PROFILE_VIEW,
    ComponentId.PROFILE_EDIT,
    ComponentId.STAFF_CLAIMS_LIST,
    ComponentId.STAFF_CLAIMS_PROCESS,
    ComponentId.STAFF_PROVIDERS_LIST,
    ComponentId.STAFF_PROVIDERS_CREATE,
    ComponentId.STAFF_PROVIDERS_EDIT,
    ComponentId.SIDEBAR_CLAIMS,
    ComponentId.SIDEBAR_PROVIDERS,
    ComponentId.SIDEBAR_INVOICES,
    ComponentId.SIDEBAR_MEDICAL_CATALOG,
    ComponentId.INVOICE_LIST,
    ComponentId.INVOICE_CREATE,
    ComponentId.INVOICE_EDIT,
    ComponentId.MEDICAL_CATALOG_SERVICES,
    ComponentId.MEDICAL_CATALOG_PROCEDURES,
    ComponentId.MEDICAL_CATALOG_MEDICATIONS,
    ComponentId.MEDICAL_CATALOG_EQUIPMENT,
  ],
  
  [UserType.MEMBER]: [
    ComponentId.LOGIN,
    ComponentId.HEADER,
    ComponentId.MEMBER_DASHBOARD,
    ComponentId.SIDEBAR_DASHBOARD,
    ComponentId.SIDEBAR_PROFILE,
    ComponentId.POLICY_LIST,
    ComponentId.CLAIM_LIST,
    ComponentId.CLAIM_CREATE,
    ComponentId.PROFILE_VIEW,
    ComponentId.PROFILE_EDIT,
    ComponentId.COVERAGE_LIST,
    ComponentId.SIDEBAR_INVOICES,
    ComponentId.INVOICE_LIST,
    ComponentId.MEDICAL_CATALOG_SERVICES,
    ComponentId.MEDICAL_CATALOG_PROCEDURES,
    ComponentId.MEDICAL_CATALOG_MEDICATIONS,
  ],
};

/**
 * Cache for component access checks to improve performance
 */
const accessCache = new Map<string, boolean>();

/**
 * Enhanced component access check that considers both userType and adminType
 */
export const canAccessComponent = (
    userType: UserType | string, 
    componentId: ComponentId,
    adminType?: string
): boolean => {
    // Create cache key
    const cacheKey = `${userType}:${componentId}:${adminType || ''}`;
    
    // Check cache first
    if (accessCache.has(cacheKey)) {
        return accessCache.get(cacheKey)!;
    }

    // Normalize userType and adminType to uppercase for comparison
    const normalizedUserType = userType.toUpperCase();
    const normalizedAdminType = adminType?.toUpperCase();

    // System admin check
    if (normalizedUserType === UserType.ADMIN && normalizedAdminType === AdminType.SYSTEM_ADMIN) {
        accessCache.set(cacheKey, true);
        return true; // System admins can access everything
    }

    // Get the components allowed for this user type
    const allowedComponents = USER_TYPE_COMPONENT_MAP[userType as UserType] || [];

    // If userType is ADMIN and adminType is INSURANCE_ADMIN, merge in all insurance admin components
    if (normalizedUserType === UserType.ADMIN && normalizedAdminType === AdminType.INSURANCE_ADMIN) {
        const insuranceAdminComponents = USER_TYPE_COMPONENT_MAP[UserType.INSURANCE_ADMIN] || [];
        const hasAccess = allowedComponents.includes(componentId) || insuranceAdminComponents.includes(componentId);
        accessCache.set(cacheKey, hasAccess);
        return hasAccess;
    }
    // If userType is ADMIN and adminType is PROVIDER_ADMIN, merge in all provider admin components
    if (normalizedUserType === UserType.ADMIN && normalizedAdminType === AdminType.PROVIDER_ADMIN) {
        const providerAdminComponents = USER_TYPE_COMPONENT_MAP[UserType.PROVIDER_ADMIN] || [];
        const hasAccess = allowedComponents.includes(componentId) || providerAdminComponents.includes(componentId);
        accessCache.set(cacheKey, hasAccess);
        return hasAccess;
    }
    // If userType is ADMIN and adminType is CORPORATE_ADMIN, merge in all corporate admin components
    if (normalizedUserType === UserType.ADMIN && normalizedAdminType === AdminType.CORPORATE_ADMIN) {
        const corporateAdminComponents = USER_TYPE_COMPONENT_MAP[UserType.CORPORATE_ADMIN] || [];
        const hasAccess = allowedComponents.includes(componentId) || corporateAdminComponents.includes(componentId);
        accessCache.set(cacheKey, hasAccess);
        return hasAccess;
    }

    // Special handling for different admin types
    let hasAccess = false;
    switch (normalizedAdminType) {
        case AdminType.SYSTEM_ADMIN:
            hasAccess = true;
            break;
        case AdminType.INSURANCE_ADMIN:
            hasAccess = allowedComponents.includes(componentId) || [
                ComponentId.SIDEBAR_PROVIDERS,
                ComponentId.SIDEBAR_CORPORATE,
                ComponentId.SIDEBAR_STAFF,
                ComponentId.SIDEBAR_MEMBERS,
                ComponentId.SIDEBAR_DASHBOARD,
                ComponentId.SIDEBAR_POLICIES,
                ComponentId.SIDEBAR_CLAIMS,
                ComponentId.SIDEBAR_COVERAGE,
                ComponentId.SIDEBAR_POLICY_CONTRACT,
                ComponentId.SIDEBAR_PROFILE,
                ComponentId.SIDEBAR_SETTINGS,
                ComponentId.INSURANCE_ADMIN_DASHBOARD,
                ComponentId.INSURANCE_ADMIN_PERMISSIONS
            ].includes(componentId);
            break;
        case AdminType.PROVIDER_ADMIN:
            hasAccess = allowedComponents.includes(componentId) || [
                ComponentId.SIDEBAR_DASHBOARD,
                ComponentId.SIDEBAR_PROFILE,
                ComponentId.SIDEBAR_SETTINGS,
                ComponentId.SIDEBAR_CLAIMS,
                ComponentId.SIDEBAR_MEMBERS,
                ComponentId.SIDEBAR_INVOICES,
                ComponentId.SIDEBAR_MEDICAL_CATALOG,
                ComponentId.PROVIDER_ADMIN_DASHBOARD,
                ComponentId.CLAIM_LIST,
                ComponentId.CLAIM_CREATE,
                ComponentId.CLAIM_EDIT,
                ComponentId.INVOICE_LIST,
                ComponentId.INVOICE_CREATE,
                ComponentId.INVOICE_EDIT,
                ComponentId.MEDICAL_CATALOG_SERVICES,
                ComponentId.MEDICAL_CATALOG_PROCEDURES,
                ComponentId.MEDICAL_CATALOG_MEDICATIONS,
                ComponentId.MEDICAL_CATALOG_EQUIPMENT
            ].includes(componentId);
            break;
        case AdminType.CORPORATE_ADMIN:
            hasAccess = allowedComponents.includes(componentId) || [
                ComponentId.SIDEBAR_CLAIMS,
                ComponentId.SIDEBAR_MEMBERS,
                ComponentId.SIDEBAR_DASHBOARD,
                ComponentId.SIDEBAR_PROFILE,
                ComponentId.SIDEBAR_SETTINGS
            ].includes(componentId);
            break;
        default:
            hasAccess = allowedComponents.includes(componentId);
    }

    // Cache the result
    accessCache.set(cacheKey, hasAccess);
    return hasAccess;
};

/**
 * Helper function to check component access by resource and action
 */
export const canAccessComponentByPermission = (
  resource: Resource, 
  action: string, 
  componentId: ComponentId
): boolean => {
    // Get components allowed for this resource/action combination
    const componentsForAction = getComponentsForResourceAction(resource, action);
    return componentsForAction.includes(componentId);
};

/**
 * Helper function to get components for a resource/action combination
 */
const getComponentsForResourceAction = (
    resource: Resource,
    action: string
): ComponentId[] => {
    // Map resources and actions to component IDs
    const resourceActionMap: Record<string, Record<string, ComponentId[]>> = {
        users: {
            view: [ComponentId.USER_LIST],
            create: [ComponentId.USER_CREATE],
            edit: [ComponentId.USER_EDIT],
            delete: [ComponentId.USER_DELETE]
        },
        insurance: {
            view: [ComponentId.INSURANCE_LIST],
            create: [ComponentId.INSURANCE_CREATE],
            edit: [ComponentId.INSURANCE_EDIT],
            delete: [ComponentId.INSURANCE_DELETE]
        },
        // Add more resource/action mappings as needed
    };

    return resourceActionMap[resource]?.[action] || [];
};

// const isProviderAdminLike = () =>
//   hasUserType(UserType.PROVIDER_ADMIN) || (user?.userType === 'ADMIN' && user?.adminType === 'PROVIDER_ADMIN');

// const isCorporateAdminLike = () =>
//   isCorporateAdmin() || (user?.userType === 'ADMIN' && user?.adminType === 'CORPORATE_ADMIN'); 