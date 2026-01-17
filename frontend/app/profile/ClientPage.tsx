// app/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { useAuth } from '@/lib/rbac/auth-context';
import { UserType } from '@/lib/rbac/models';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { Camera, Mail, User as UserIcon, Users, Building, Phone, Briefcase, Calendar, Save, Edit, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';


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
  address?: string | null;
  bio?: string | null;
  is_active?: boolean;
  created_at?: string;
  manager_id?: number;
  profile_image_url?: string;
}


const PRIMARY_COLOR = (props: any) => props.theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = (props: any) => props.theme.colors.textSecondary || '#666';
const BORDER_COLOR = (props: any) => props.theme.colors.border;
const BACKGROUND_CARD = (props: any) => props.theme.colors.background || '#ffffff';
const BACKGROUND_SECONDARY = (props: any) => props.theme.colors.backgroundSecondary || '#f5f6fa';

const CardShadow = (props: any) => props.theme.mode === 'dark'
  ? '0 4px 20px rgba(0,0,0,0.4)'
  : `0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.03)`;

// Styled components
const Container = styled.div`
  max-width: 1200px;
  margin: 20px auto;
  padding: ${props => props.theme.spacing.md};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  padding-bottom: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${BORDER_COLOR};
`;

const Title = styled.h1`
  font-size: clamp(24px, 3vw, 32px);
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
`;

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: ${props => props.theme.spacing.xl};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProfileSidebar = styled.div`
  background-color: ${BACKGROUND_CARD};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${BORDER_COLOR};
  box-shadow: ${CardShadow};
`;

const ProfileImage = styled.div`
  width: 100%;
  height: 180px;
  background-color: ${BACKGROUND_SECONDARY};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: ${props => props.theme.borderRadius.md} ${props => props.theme.borderRadius.md} 0 0;
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
  font-weight: ${props => props.theme.typography.fontWeights.bold};
`;

const UploadButton = styled.button`
  position: absolute;
  bottom: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  background-color: ${BACKGROUND_CARD};
  border: 1px solid ${BORDER_COLOR};
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all ${props => props.theme.transitions.default};

  &:hover {
    background-color: ${BACKGROUND_SECONDARY};
    transform: scale(1.05);
  }
`;

const ProfileInfo = styled.div`
  padding: ${props => props.theme.spacing.lg};
`;

const ProfileName = styled.h2`
  font-size: ${props => props.theme.typography.fontSizes.lg};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
  color: ${TEXT_COLOR_DARK};
`;

const ProfileRole = styled.p`
  font-size: ${props => props.theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
`;

const ProfileDetail = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};

  svg {
    min-width: 16px;
    color: ${TEXT_COLOR_MUTED};
  }
`;

const Card = styled.div`
  background-color: ${BACKGROUND_CARD};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${BORDER_COLOR};
  box-shadow: ${CardShadow};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const CardHeader = styled.div`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${BORDER_COLOR};
`;

const CardTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSizes.md};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
`;

const CardContent = styled.div`
  padding: ${props => props.theme.spacing.lg};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing.xl};
  
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
  gap: ${props => props.theme.spacing.xs};
`;

const Label = styled.label`
  display: block;
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
`;

const StyledInput = styled.input`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 10px 14px;
  border: 1.5px solid ${BORDER_COLOR};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${BACKGROUND_CARD};
  color: ${TEXT_COLOR_DARK};
  transition: all ${props => props.theme.transitions.default};
  outline: none;
  box-sizing: border-box;
  margin: 0;

  &:focus {
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
    background: ${BACKGROUND_CARD};
  }

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db'};
  }

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.6;
  }

  &:disabled {
    background-color: ${BACKGROUND_SECONDARY};
    color: ${TEXT_COLOR_MUTED};
    cursor: not-allowed;
    opacity: 0.7;
    border-color: ${BORDER_COLOR};
  }
`;

const StyledTextArea = styled.textarea`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 10px 14px;
  border: 1.5px solid ${BORDER_COLOR};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${BACKGROUND_CARD};
  color: ${TEXT_COLOR_DARK};
  transition: all ${props => props.theme.transitions.default};
  outline: none;
  box-sizing: border-box;
  margin: 0;
  resize: vertical;

  &:focus {
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
    background: ${BACKGROUND_CARD};
  }

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db'};
  }

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.6;
  }

  &:disabled {
    background-color: ${BACKGROUND_SECONDARY};
    color: ${TEXT_COLOR_MUTED};
    cursor: not-allowed;
    opacity: 0.7;
    border-color: ${BORDER_COLOR};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
`;

const Message = styled.div<{ type: 'error' | 'success' }>`
  background-color: ${props => props.type === 'error'
    ? (props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)')
    : (props.theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')};
  border: 1px solid ${props => props.type === 'error'
    ? (props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)')
    : (props.theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.3)')};
  color: ${props => props.type === 'error'
    ? (props.theme.mode === 'dark' ? '#fca5a5' : '#dc2626')
    : (props.theme.mode === 'dark' ? '#6ee7b7' : '#059669')};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSizes.sm};
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
  profileImageUrl?: string;
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
    address: apiUser.address || '',
    bio: apiUser.bio || '',
    department: apiUser.department || '',
    position: '', // Not in backend schema
    joinDate: apiUser.created_at ? new Date(apiUser.created_at).toISOString().split('T')[0] : '',
    userType: userType,
    role: backendRole,
    isActive: apiUser.is_active !== undefined ? apiUser.is_active : true,
    createdAt: apiUser.created_at ? new Date(apiUser.created_at).toISOString() : undefined,
    profileImageUrl: apiUser.profile_image_url || undefined,
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
        address?: string | null;
        bio?: string | null;
      } = {
        full_name: userData.name,
        email: userData.email,
        phone: userData.phoneNumber || null,
        department: userData.department || null,
        address: userData.address || null,
        bio: userData.bio || null,
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

  // Image upload handling

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5MB.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.uploadProfileImage(file);

      if (response.data) {
        const updatedUser = mapApiUserToExtended(response.data as ApiUser);
        setUserData(updatedUser);
        await fetchCurrentUser(); // Update global store
        setSuccess('Profile picture updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || 'Failed to upload image';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.removeProfileImage();

      if (response.data) {
        const updatedUser = mapApiUserToExtended(response.data as ApiUser);
        setUserData(updatedUser);
        await fetchCurrentUser(); // Update global store
        setSuccess('Profile picture removed successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || 'Failed to remove image';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name || name.trim() === '') {
      return '?';
    }
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
              <Avatar
                $bgColor={userData.profileImageUrl ? 'transparent' : getUserColor(userData.userType)}
                onClick={handleImageClick}
                style={{ cursor: isEditing || !userData.profileImageUrl ? 'pointer' : 'default', overflow: 'hidden' }}
              >
                {userData.profileImageUrl ? (
                  <img
                    src={userData.profileImageUrl.startsWith('http') ? userData.profileImageUrl : `http://localhost:8000${userData.profileImageUrl}`}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  getInitials(userData.name)
                )}
              </Avatar>
              {isEditing && (
                <UploadButton onClick={handleImageClick}>
                  <Camera size={16} />
                </UploadButton>
              )}
              {isEditing && userData.profileImageUrl && (
                <UploadButton
                  onClick={handleRemoveImage}
                  style={{ right: 'auto', left: '16px', backgroundColor: '#fee2e2', color: '#dc2626' }}
                  title="Remove Photo"
                >
                  <X size={16} />
                </UploadButton>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif,image/webp"
                style={{ display: 'none' }}
              />
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
                      disabled={!isEditing || userData.userType === UserType.ACCOUNTANT || userData.userType === UserType.EMPLOYEE}
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
                      disabled={!isEditing || userData.userType === UserType.ACCOUNTANT || userData.userType === UserType.EMPLOYEE}
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