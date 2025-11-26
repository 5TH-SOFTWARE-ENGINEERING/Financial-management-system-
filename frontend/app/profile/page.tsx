// app/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '@/lib/rbac/auth-context';
import { User, UserType } from '@/lib/rbac/models';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { Camera, Mail, User as UserIcon, Users, Building, Phone, Briefcase, Calendar, Save, Edit, X, CheckCircle, AlertCircle } from 'lucide-react';
import {Button} from '@/components/ui/button';
import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';


// Styled components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
`;

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProfileSidebar = styled.div`
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ProfileImage = styled.div`
  width: 100%;
  height: 180px;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
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
  font-weight: 600;
`;

const UploadButton = styled.button`
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  background-color: white;
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s;

  &:hover {
    background-color: #f9fafb;
  }
`;

const ProfileInfo = styled.div`
  padding: 1.25rem;
`;

const ProfileName = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #111827;
`;

const ProfileRole = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.25rem;
`;

const ProfileDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.875rem;
  font-size: 0.875rem;
  color: #4b5563;

  svg {
    min-width: 16px;
    color: #6b7280;
  }
`;

const Card = styled.div`
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.25rem;
`;

const CardHeader = styled.div`
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
`;

const CardContent = styled.div`
  padding: 1.25rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: #4b5563;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const Message = styled.div<{ type: 'error' | 'success' }>`
  background-color: ${props => props.type === 'error' ? '#fee2e2' : '#dcfce7'};
  color: ${props => props.type === 'error' ? '#b91c1c' : '#166534'};
  padding: 0.75rem;
  border-radius: 0.25rem;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
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
const mapApiUserToExtended = (apiUser: any): ExtendedUser => {
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
        const extendedUser = mapApiUserToExtended(response.data);
        setUserData(extendedUser);
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || err.response?.data?.error || 'Failed to load profile data';
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
      const updatePayload: any = {
        full_name: userData.name,
        email: userData.email,
        phone: userData.phoneNumber || null,
        department: userData.department || null,
      };

      // Remove undefined/null values
      Object.keys(updatePayload).forEach(key => {
        if (updatePayload[key] === undefined || updatePayload[key] === '') {
          updatePayload[key] = null;
        }
      });

      // Call API to update profile
      const response = await apiClient.updateCurrentUser(updatePayload);
      
      // Update local state with response
      const updatedUser = mapApiUserToExtended(response.data);
      setUserData(updatedUser);
      
      // Refresh user store
      await fetchCurrentUser();
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || 'Failed to update profile. Please try again.';
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
      const extendedUser = mapApiUserToExtended(response.data);
      setUserData(extendedUser);
    } catch (err: any) {
      // If API fails, just reset editing mode
      console.error('Failed to reload user data:', err);
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
                    <Input
                      id="name"
                      name="name"
                      value={userData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
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
                    <Input
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
                    <Input
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
                    <Input
                      id="username"
                      name="username"
                      value={userData.username}
                      disabled={true} // Username cannot be changed
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="userType">Role</Label>
                    <Input
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
                    <Input
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
                      <Input
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
                  <TextArea
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