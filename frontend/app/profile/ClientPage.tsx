// app/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '@/lib/rbac/auth-context';
import { UserType } from '@/lib/rbac/models';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { Camera, Mail, User as UserIcon, Users, Building, Phone, Briefcase, Calendar, Save, Edit, X, CheckCircle, AlertCircle } from 'lucide-react';
import {Button} from '@/components/ui/button';
import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';
import { theme } from '@/components/common/theme';

// Type definitions for error handling
type ErrorWithDetails = {
  code?: string;
  message?: string;
  response?: {
    status: number;
    data?: {
      detail?: string;
    };
  };
};

interface ApiUser {
  id?: number | string;
  full_name?: string | null;
  username?: string;
  email?: string;
  role?: string;
  department?: string | null;
  phone?: string | null;
  is_active?: boolean;
  created_at?: string;
  manager_id?: number;
}

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

// Styled components
const Container = styled.div`
  max-width: 1200px;
  margin: 20px auto;
  padding: ${theme.spacing.md};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
`;

const Title = styled.h1`
  font-size: clamp(24px, 3vw, 32px);
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
`;

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: ${theme.spacing.xl};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProfileSidebar = styled.div`
  background-color: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.03);
`;

const ProfileImage = styled.div`
  width: 100%;
  height: 180px;
  background-color: ${theme.colors.backgroundSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: ${theme.borderRadius.md} ${theme.borderRadius.md} 0 0;
`;

const Avatar = styled.div<{ $bgColor: string }>`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: ${(props) => props.$bgColor};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: ${theme.typography.fontWeights.bold};
`;

const UploadButton = styled.button`
  position: absolute;
  bottom: ${theme.spacing.md};
  right: ${theme.spacing.md};
  background-color: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all ${theme.transitions.default};

  &:hover {
    background-color: ${theme.colors.backgroundSecondary};
    transform: scale(1.05);
  }
`;

const ProfileInfo = styled.div`
  padding: ${theme.spacing.lg};
`;

const ProfileName = styled.h2`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  margin: 0 0 ${theme.spacing.xs} 0;
  color: ${TEXT_COLOR_DARK};
`;

const ProfileRole = styled.p`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  margin: 0 0 ${theme.spacing.lg} 0;
`;

const ProfileDetail = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};

  svg {
    min-width: 16px;
    color: ${TEXT_COLOR_MUTED};
  }
`;

const Card = styled.div`
  background-color: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.03);
  margin-bottom: ${theme.spacing.lg};
`;

const CardHeader = styled.div`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${theme.colors.border};
`;

const CardTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
`;

const CardContent = styled.div`
  padding: ${theme.spacing.lg};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.xl};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const Label = styled.label`
  display: block;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
`;

const StyledInput = styled.input`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: #ffffff;
  color: #111827;
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;

  &:focus {
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
    background: #ffffff;
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }
`;

const StyledTextArea = styled.textarea`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: #ffffff;
  color: #111827;
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  resize: vertical;

  &:focus {
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
    background: #ffffff;
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
`;

const Message = styled.div<{ type: 'error' | 'success' }>`
  background-color: ${props => props.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'};
  border: 1px solid ${props => props.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'};
  color: ${props => props.type === 'error' ? '#dc2626' : '#059669'};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.sm};
`;

// Enhanced user data interface
interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  username: string;
  phoneNumber?: string;
  address?: string;
  bio?: string;
  department?: string;
  position?: string;
  joinDate?: string;
  userType: UserType;
  role: string;
  isActive: boolean;
  createdAt?: string;
}

// Get a color based on user type
const getUserColor = (userType: UserType | string): string => {
  const userTypeStr = typeof userType === 'string' ? userType.toUpperCase() : userType;
  const colors: Record<string, string> = {
    [UserType.ADMIN]: '#2563eb', // Blue
    [UserType.FINANCE_ADMIN]: '#7c3aed', // Purple
    [UserType.ACCOUNTANT]: '#8b5cf6', // Light purple
    [UserType.EMPLOYEE]: '#db2777', // Pink
  };
  return colors[userTypeStr] || '#4b5563'; // Default gray
};


const formatUserType = (userType: UserType | string | null | undefined): string => {
  // FIX: Check if userType is a truthy string before attempting to split it.
  if (!userType || typeof userType !== 'string') {
    return 'Unknown Role'; // Return a safe default string
  }
  
  return userType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Map backend role to frontend UserType
const mapRoleToUserType = (role: string | undefined | null): UserType => {
  if (!role) return UserType.EMPLOYEE;
  const roleUpper = role.toUpperCase();
  if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') return UserType.ADMIN;
  if (roleUpper === 'MANAGER' || roleUpper === 'FINANCE_MANAGER' || roleUpper === 'FINANCE_ADMIN') return UserType.FINANCE_ADMIN;
  if (roleUpper === 'ACCOUNTANT') return UserType.ACCOUNTANT;
  return UserType.EMPLOYEE;
};

// Map API user to ExtendedUser
const mapApiUserToExtended = (apiUser: ApiUser): ExtendedUser => {
  const backendRole = apiUser.role || '';
  const userType = mapRoleToUserType(backendRole);
  
  return {
    id: apiUser.id?.toString() || '',
    name: apiUser.full_name || apiUser.username || '',
    email: apiUser.email || '',
    username: apiUser.username || '',
    phoneNumber: apiUser.phone || '',
    address: '', // Not in backend schema
    bio: '', // Not in backend schema
    department: apiUser.department || '',
    position: '', // Not in backend schema
    joinDate: apiUser.created_at ? new Date(apiUser.created_at).toISOString().split('T')[0] : '',
    userType: userType,
    role: backendRole,
    isActive: apiUser.is_active !== undefined ? apiUser.is_active : true,
    createdAt: apiUser.created_at ? new Date(apiUser.created_at).toISOString() : undefined,
  };
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { getCurrentUser: fetchCurrentUser } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<ExtendedUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) {
        setInitialLoading(false);
        return;
      }

      setInitialLoading(true);
      setError(null);
      try {
        // Fetch fresh user data from API
        const response = await apiClient.getCurrentUser();
        const extendedUser = mapApiUserToExtended(response.data as ApiUser);
        setUserData(extendedUser);
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || (error.response?.data as { error?: string })?.error || 'Failed to load profile data';
        setError(errorMessage);
      } finally {
        setInitialLoading(false);
      }
    };

    loadUserProfile();
  }, [user]);

  if (initialLoading || !user || !userData) {
    return (
      <Container>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
            <p>Loading profile data...</p>
          </div>
        </div>
      </Container>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = async () => {
    if (!userData) return;

    try {
      setLoading(true);
      setError(null);
      
      // Prepare update payload - only include fields that are in the backend schema
      const updatePayload: {
        full_name?: string | null;
        email?: string;
        phone?: string | null;
        department?: string | null;
      } = {
        full_name: userData.name,
        email: userData.email,
        phone: userData.phoneNumber || null,
        department: userData.department || null,
      };

      // Remove undefined/null values
      const cleanedPayload: Record<string, string | null> = {};
      Object.keys(updatePayload).forEach(key => {
        const value = updatePayload[key as keyof typeof updatePayload];
        cleanedPayload[key] = value === undefined || value === '' ? null : value;
      });

      // Call API to update profile
      const response = await apiClient.updateCurrentUser(cleanedPayload);
      
      // Update local state with response
      const updatedUser = mapApiUserToExtended(response.data as ApiUser);
      setUserData(updatedUser);
      
      // Refresh user store
      await fetchCurrentUser();
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || (error.response?.data as { error?: string })?.error || 'Failed to update profile. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    // Reset to original data by fetching from API again
    try {
      setError(null);
      const response = await apiClient.getCurrentUser();
      const extendedUser = mapApiUserToExtended(response.data as ApiUser);
      setUserData(extendedUser);
    } catch {
      // If API fails, just reset editing mode
      console.error('Failed to reload user data');
    }
    setIsEditing(false);
  };

  // FIX: Added a check for the 'name' argument to ensure it is a valid string
  const getInitials = (name: string | null | undefined): string => {
    if (!name || name.trim() === '') {
      return '?'; // Return a default value if the name is missing or empty
    }
    // Now it is safe to call split()
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <ComponentGate componentId={ComponentId.PROFILE_VIEW}>
      <Container>
        {error && (
          <Message type="error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </Message>
        )}
        
        {success && (
          <Message type="success">
            <CheckCircle size={16} />
            <span>{success}</span>
          </Message>
        )}
        
        <Header>
          <Title>Profile</Title>
          <ComponentGate componentId={ComponentId.PROFILE_EDIT}>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit size={16} />
                Edit Profile
              </Button>
            ) : (
              <ActionButtons>
                <Button variant="secondary" onClick={handleCancel}>
                  <X size={16} />
                  Discard changes
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  <Save size={16} />
                  Save changes
                </Button>
              </ActionButtons>
            )}
          </ComponentGate>
        </Header>
        
        <ProfileGrid>
          <ProfileSidebar>
            <ProfileImage>
              <Avatar $bgColor={getUserColor(userData.userType)}>
                {getInitials(userData.name)}
              </Avatar>
              {isEditing && (
                <UploadButton>
                  <Camera size={16} />
                </UploadButton>
              )}
            </ProfileImage>
            
            <ProfileInfo>
              <ProfileName>{userData.name}</ProfileName>
              <ProfileRole>{formatUserType(userData.userType)}</ProfileRole>
              
              <ProfileDetail>
                <UserIcon size={16} />
                <span>{userData.username}</span>
              </ProfileDetail>
              
              <ProfileDetail>
                <Mail size={16} />
                <span>{userData.email}</span>
              </ProfileDetail>
              
              {userData.phoneNumber && (
                <ProfileDetail>
                  <Phone size={16} />
                  <span>{userData.phoneNumber}</span>
                </ProfileDetail>
              )}
              
              {userData.address && (
                <ProfileDetail>
                  <Building size={16} />
                  <span>{userData.address}</span>
                </ProfileDetail>
              )}
              
              {userData.department && (
                <ProfileDetail>
                  <Users size={16} />
                  <span>{userData.department}</span>
                </ProfileDetail>
              )}
              
              {userData.position && (
                <ProfileDetail>
                  <Briefcase size={16} />
                  <span>{userData.position}</span>
                </ProfileDetail>
              )}
              
              {userData.joinDate && (
                <ProfileDetail>
                  <Calendar size={16} />
                  <span>Joined: {new Date(userData.joinDate).toLocaleDateString()}</span>
                </ProfileDetail>
              )}
            </ProfileInfo>
          </ProfileSidebar>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <FormGrid>
                  <FormGroup>
                    <Label htmlFor="name">Full Name</Label>
                    <StyledInput
                      id="name"
                      name="name"
                      value={userData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="email">Email Address</Label>
                    <StyledInput
                      id="email"
                      name="email"
                      type="email"
                      value={userData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <StyledInput
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={userData.phoneNumber || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder={isEditing ? "Enter phone number" : ""}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="address">Address</Label>
                    <StyledInput
                      id="address"
                      name="address"
                      value={userData.address || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder={isEditing ? "Enter address" : ""}
                    />
                  </FormGroup>
                </FormGrid>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <FormGrid>
                  <FormGroup>
                    <Label htmlFor="username">Username</Label>
                    <StyledInput
                      id="username"
                      name="username"
                      value={userData.username}
                      disabled={true} // Username cannot be changed
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="userType">Role</Label>
                    <StyledInput
                      id="userType"
                      name="userType"
                      value={formatUserType(userData.userType)}
                      disabled={true} // Role cannot be changed
                    />
                  </FormGroup>
                </FormGrid>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <FormGrid>
                  <FormGroup>
                    <Label htmlFor="department">Department</Label>
                    <StyledInput
                      id="department"
                      name="department"
                      value={userData.department || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder={isEditing ? "Enter department" : ""}
                    />
                  </FormGroup>
                  
                  {userData.joinDate && (
                    <FormGroup>
                      <Label htmlFor="joinDate">Join Date</Label>
                      <StyledInput
                        id="joinDate"
                        name="joinDate"
                        type="date"
                        value={userData.joinDate || ''}
                        onChange={handleInputChange}
                        disabled={true} // Join date is read-only
                      />
                    </FormGroup>
                  )}
                </FormGrid>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Bio</CardTitle>
              </CardHeader>
              <CardContent>
                <FormGroup>
                  <Label htmlFor="bio">About Me</Label>
                  <StyledTextArea
                    id="bio"
                    name="bio"
                    value={userData.bio || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder={isEditing ? "Write a short bio about yourself" : ""}
                    style={{ minHeight: '100px' }}
                  />
                </FormGroup>
              </CardContent>
            </Card>
          </div>
        </ProfileGrid>
      </Container>
    </ComponentGate>
  );
}