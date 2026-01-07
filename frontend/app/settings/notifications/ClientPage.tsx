'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuth } from '@/lib/rbac/auth-context';
import { Save, Mail, MessageSquare, Bell, BellRing, PhoneCall, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';

// Icon color mapping for different icon types
const getIconColor = (iconType: string, active: boolean = false): string => {
  if (active) {
    // Active state colors (brighter)
    const activeColors: Record<string, string> = {
      'save': '#22c55e',              // Green
      'mail': '#3b82f6',              // Blue
      'message-square': '#8b5cf6',     // Purple
      'bell': '#f59e0b',              // Amber
      'bell-ring': '#10b981',         // Green
      'phone-call': '#06b6d4',        // Cyan
      'bell-off': '#ef4444',          // Red
    };
    return activeColors[iconType] || '#6b7280';
  } else {
    // Inactive state colors (muted but colorful)
    const inactiveColors: Record<string, string> = {
      'save': '#4ade80',              // Light Green
      'mail': '#60a5fa',              // Light Blue
      'message-square': '#a78bfa',    // Light Purple
      'bell': '#fbbf24',              // Light Amber
      'bell-ring': '#34d399',         // Light Green
      'phone-call': '#22d3ee',        // Light Cyan
      'bell-off': '#f87171',          // Light Red
    };
    return inactiveColors[iconType] || '#9ca3af';
  }
};

// Icon styled components
const IconWrapper = styled.div<{ $iconType?: string; $active?: boolean; $size?: number }>`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.$iconType ? getIconColor(props.$iconType, props.$active || false) : '#6b7280'};
    opacity: ${props => props.$active ? 1 : 0.8};
    transition: all 0.2s ease;
    
    svg {
        width: ${props => props.$size ? `${props.$size}px` : '18px'};
        height: ${props => props.$size ? `${props.$size}px` : '18px'};
        transition: all 0.2s ease;
    }

    &:hover {
        opacity: 1;
        transform: scale(1.1);
    }
`;

const CardIcon = styled(IconWrapper)`
    margin-right: 0.5rem;
`;

const NotificationIcon = styled(IconWrapper)`
    margin-right: 0.5rem;
`;

const ChannelIcon = styled(IconWrapper)`
    margin-right: 0.5rem;
`;

const ButtonIcon = styled(IconWrapper)`
    margin-right: 0.5rem;
`;

// Styled components
const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
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
  color: ${props => props.theme.colors.textDark};
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
  color: ${props => props.theme.colors.textDark};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardContent = styled.div`
  padding: 1.25rem;
`;

const NotificationGroup = styled.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const NotificationTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChannelOptions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const ChannelOption = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.backgroundSecondary};
  }
`;

const ChannelLabel = styled.label`
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
`;

const HelperText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3b82f6;
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: #3b82f6;
  }
  
  &:checked + span:before {
    transform: translateX(24px);
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e5e7eb;
  transition: 0.4s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1.5rem 0;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
`;

// Notification types enum for clarity
enum NotificationType {
  CLAIMS = 'claims',
  APPOINTMENTS = 'appointments',
  MESSAGES = 'messages',
  BILLING = 'billing',
  POLICY = 'policy',
  MARKETING = 'marketing',
  SYSTEM = 'system'
}

// Channel types enum
enum ChannelType {
  EMAIL = 'email',
  SMS = 'sms',
  APP = 'app',
  PUSH = 'push'
}

interface NotificationSettings {
  [key: string]: {
    [key: string]: boolean;
  };
}

type NotificationPreferencesState = NotificationSettings;

const defaultQuietHours = {
  enabled: false,
  startTime: '22:00',
  endTime: '08:00',
};

export default function NotificationsSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [quietHours, setQuietHours] = useState(defaultQuietHours);

  // Load settings from backend API and localStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        // Try to load from backend first
        const response = await apiClient.getNotificationPreferences();
        if (response.data) {
          const prefs = response.data as {
            notificationPreferences?: NotificationPreferencesState;
            doNotDisturb?: boolean;
            quietHours?: typeof defaultQuietHours;
          };
          if (prefs.notificationPreferences) {
            setNotificationPreferences(prefs.notificationPreferences);
          }
          if (prefs.doNotDisturb !== undefined) {
            setDoNotDisturb(prefs.doNotDisturb);
          }
          if (prefs.quietHours) {
            setQuietHours(prefs.quietHours);
          }

          // Also save to localStorage for offline access
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_notification_settings', JSON.stringify(prefs));
          }
          return;
        }
      } catch (apiError) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Failed to load from backend, trying localStorage:', apiError);
        }
      }

      // Fallback to localStorage if backend fails
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('user_notification_settings');
          if (stored) {
            const settings = JSON.parse(stored);
            if (settings.notificationPreferences) {
              setNotificationPreferences(settings.notificationPreferences);
            }
            if (settings.doNotDisturb !== undefined) {
              setDoNotDisturb(settings.doNotDisturb);
            }
            if (settings.quietHours) {
              setQuietHours(settings.quietHours);
            }
          }
        } catch (error) {
          console.error('Failed to load notification settings:', error);
        }
      }
    };

    loadSettings();
  }, [user]);

  // Initialize notification preferences for each type and channel
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationSettings>({
    [NotificationType.CLAIMS]: {
      [ChannelType.EMAIL]: true,
      [ChannelType.SMS]: false,
      [ChannelType.APP]: true,
      [ChannelType.PUSH]: true
    },
    [NotificationType.APPOINTMENTS]: {
      [ChannelType.EMAIL]: true,
      [ChannelType.SMS]: true,
      [ChannelType.APP]: true,
      [ChannelType.PUSH]: true
    },
    [NotificationType.MESSAGES]: {
      [ChannelType.EMAIL]: true,
      [ChannelType.SMS]: false,
      [ChannelType.APP]: true,
      [ChannelType.PUSH]: true
    },
    [NotificationType.BILLING]: {
      [ChannelType.EMAIL]: true,
      [ChannelType.SMS]: false,
      [ChannelType.APP]: true,
      [ChannelType.PUSH]: false
    },
    [NotificationType.POLICY]: {
      [ChannelType.EMAIL]: true,
      [ChannelType.SMS]: false,
      [ChannelType.APP]: true,
      [ChannelType.PUSH]: false
    },
    [NotificationType.MARKETING]: {
      [ChannelType.EMAIL]: false,
      [ChannelType.SMS]: false,
      [ChannelType.APP]: false,
      [ChannelType.PUSH]: false
    },
    [NotificationType.SYSTEM]: {
      [ChannelType.EMAIL]: true,
      [ChannelType.SMS]: false,
      [ChannelType.APP]: true,
      [ChannelType.PUSH]: false
    }
  });

  const handleNotificationToggle = (type: NotificationType, channel: ChannelType) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: !prev[type][channel]
      }
    }));
  };

  const handleQuietHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setQuietHours(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setQuietHours(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(null);

    try {
      const settings = {
        notificationPreferences,
        doNotDisturb,
        quietHours,
        lastUpdated: new Date().toISOString()
      };

      // Save to backend API
      try {
        await apiClient.updateNotificationPreferences(settings);
        // Also save to localStorage for offline access
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_notification_settings', JSON.stringify(settings));
        }
        setSuccess('Notification settings saved successfully');
      } catch (apiError: unknown) {
        // If backend fails, still save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_notification_settings', JSON.stringify(settings));
        }

        const errorMessage =
          typeof apiError === 'object' && apiError !== null && 'response' in apiError
            ? (apiError as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to save to server'
            : apiError instanceof Error
              ? apiError.message
              : 'Failed to save to server';
        console.error('Failed to save to backend:', errorMessage);
        setSuccess('Settings saved locally, but failed to sync with server. Please try again.');
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      setSuccess('Failed to save settings. Please try again.');
      setTimeout(() => setSuccess(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container>
        <p>Loading...</p>
      </Container>
    );
  }

  return (
    <ComponentGate componentId={ComponentId.SETTINGS_VIEW}>
      <Container>
        <Header>
          <Title>Notification Settings</Title>
        </Header>

        {success && (
          <div style={{
            backgroundColor: '#dcfce7',
            color: '#166534',
            padding: '0.75rem',
            borderRadius: '0.25rem',
            marginBottom: '1.25rem',
            fontSize: '0.875rem'
          }}>
            {success}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              <CardIcon $iconType="bell-ring" $size={18} $active={true}>
                <BellRing size={18} />
              </CardIcon>
              Global Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SwitchContainer>
              <div>
                <Label htmlFor="doNotDisturb">Do Not Disturb</Label>
                <HelperText>When enabled, all notifications will be muted</HelperText>
              </div>
              <Switch>
                <SwitchInput
                  type="checkbox"
                  id="doNotDisturb"
                  checked={doNotDisturb}
                  onChange={() => setDoNotDisturb(prev => !prev)}
                />
                <SwitchSlider />
              </Switch>
            </SwitchContainer>

            <Divider />

            <div>
              <SwitchContainer>
                <div>
                  <Label htmlFor="quietHoursEnabled">Quiet Hours</Label>
                  <HelperText>Mute notifications during specific hours</HelperText>
                </div>
                <Switch>
                  <SwitchInput
                    type="checkbox"
                    id="quietHoursEnabled"
                    name="enabled"
                    checked={quietHours.enabled}
                    onChange={handleQuietHoursChange}
                  />
                  <SwitchSlider />
                </Switch>
              </SwitchContainer>

              {quietHours.enabled && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <div>
                    <Label htmlFor="startTime">From</Label>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={quietHours.startTime}
                      onChange={handleQuietHoursChange}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem'
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">To</Label>
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      value={quietHours.endTime}
                      onChange={handleQuietHoursChange}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <CardIcon $iconType="bell" $size={18} $active={true}>
                <Bell size={18} />
              </CardIcon>
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationGroup>
              <NotificationTitle>
                <NotificationIcon $iconType="bell-ring" $size={16} $active={true}>
                  <BellRing size={16} />
                </NotificationIcon>
                Claims Notifications
              </NotificationTitle>
              <HelperText>Receive updates about claim submissions, processing, and status changes</HelperText>
              <ChannelOptions>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.CLAIMS, ChannelType.EMAIL)}>
                  <Checkbox
                    type="checkbox"
                    id="claims-email"
                    checked={notificationPreferences[NotificationType.CLAIMS][ChannelType.EMAIL]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="claims-email">
                    <ChannelIcon $iconType="mail" $size={16} $active={notificationPreferences[NotificationType.CLAIMS][ChannelType.EMAIL]}>
                      <Mail size={16} />
                    </ChannelIcon>
                    Email
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.CLAIMS, ChannelType.SMS)}>
                  <Checkbox
                    type="checkbox"
                    id="claims-sms"
                    checked={notificationPreferences[NotificationType.CLAIMS][ChannelType.SMS]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="claims-sms">
                    <ChannelIcon $iconType="message-square" $size={16} $active={notificationPreferences[NotificationType.CLAIMS][ChannelType.SMS]}>
                      <MessageSquare size={16} />
                    </ChannelIcon>
                    SMS
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.CLAIMS, ChannelType.APP)}>
                  <Checkbox
                    type="checkbox"
                    id="claims-app"
                    checked={notificationPreferences[NotificationType.CLAIMS][ChannelType.APP]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="claims-app">
                    <ChannelIcon $iconType="bell" $size={16} $active={notificationPreferences[NotificationType.CLAIMS][ChannelType.APP]}>
                      <Bell size={16} />
                    </ChannelIcon>
                    App Notifications
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.CLAIMS, ChannelType.PUSH)}>
                  <Checkbox
                    type="checkbox"
                    id="claims-push"
                    checked={notificationPreferences[NotificationType.CLAIMS][ChannelType.PUSH]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="claims-push">
                    <ChannelIcon $iconType="phone-call" $size={16} $active={notificationPreferences[NotificationType.CLAIMS][ChannelType.PUSH]}>
                      <PhoneCall size={16} />
                    </ChannelIcon>
                    Push Notifications
                  </ChannelLabel>
                </ChannelOption>
              </ChannelOptions>
            </NotificationGroup>

            <Divider />

            <NotificationGroup>
              <NotificationTitle>
                <NotificationIcon $iconType="bell-ring" $size={16} $active={true}>
                  <BellRing size={16} />
                </NotificationIcon>
                Appointment Notifications
              </NotificationTitle>
              <HelperText>Receive reminders for upcoming appointments and schedule changes</HelperText>
              <ChannelOptions>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.APPOINTMENTS, ChannelType.EMAIL)}>
                  <Checkbox
                    type="checkbox"
                    id="appointments-email"
                    checked={notificationPreferences[NotificationType.APPOINTMENTS][ChannelType.EMAIL]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="appointments-email">
                    <ChannelIcon $iconType="mail" $size={16} $active={notificationPreferences[NotificationType.APPOINTMENTS][ChannelType.EMAIL]}>
                      <Mail size={16} />
                    </ChannelIcon>
                    Email
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.APPOINTMENTS, ChannelType.SMS)}>
                  <Checkbox
                    type="checkbox"
                    id="appointments-sms"
                    checked={notificationPreferences[NotificationType.APPOINTMENTS][ChannelType.SMS]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="appointments-sms">
                    <ChannelIcon $iconType="message-square" $size={16} $active={notificationPreferences[NotificationType.APPOINTMENTS][ChannelType.SMS]}>
                      <MessageSquare size={16} />
                    </ChannelIcon>
                    SMS
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.APPOINTMENTS, ChannelType.APP)}>
                  <Checkbox
                    type="checkbox"
                    id="appointments-app"
                    checked={notificationPreferences[NotificationType.APPOINTMENTS][ChannelType.APP]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="appointments-app">
                    <ChannelIcon $iconType="bell" $size={16} $active={notificationPreferences[NotificationType.APPOINTMENTS][ChannelType.APP]}>
                      <Bell size={16} />
                    </ChannelIcon>
                    App Notifications
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.APPOINTMENTS, ChannelType.PUSH)}>
                  <Checkbox
                    type="checkbox"
                    id="appointments-push"
                    checked={notificationPreferences[NotificationType.APPOINTMENTS][ChannelType.PUSH]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="appointments-push">
                    <ChannelIcon $iconType="phone-call" $size={16} $active={notificationPreferences[NotificationType.APPOINTMENTS][ChannelType.PUSH]}>
                      <PhoneCall size={16} />
                    </ChannelIcon>
                    Push Notifications
                  </ChannelLabel>
                </ChannelOption>
              </ChannelOptions>
            </NotificationGroup>

            <Divider />

            <NotificationGroup>
              <NotificationTitle>
                <NotificationIcon $iconType="bell-ring" $size={16} $active={true}>
                  <BellRing size={16} />
                </NotificationIcon>
                Billing & Payment Notifications
              </NotificationTitle>
              <HelperText>Receive alerts about billing statements, payment confirmations, and due dates</HelperText>
              <ChannelOptions>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.BILLING, ChannelType.EMAIL)}>
                  <Checkbox
                    type="checkbox"
                    id="billing-email"
                    checked={notificationPreferences[NotificationType.BILLING][ChannelType.EMAIL]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="billing-email">
                    <ChannelIcon $iconType="mail" $size={16} $active={notificationPreferences[NotificationType.BILLING][ChannelType.EMAIL]}>
                      <Mail size={16} />
                    </ChannelIcon>
                    Email
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.BILLING, ChannelType.SMS)}>
                  <Checkbox
                    type="checkbox"
                    id="billing-sms"
                    checked={notificationPreferences[NotificationType.BILLING][ChannelType.SMS]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="billing-sms">
                    <ChannelIcon $iconType="message-square" $size={16} $active={notificationPreferences[NotificationType.BILLING][ChannelType.SMS]}>
                      <MessageSquare size={16} />
                    </ChannelIcon>
                    SMS
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.BILLING, ChannelType.APP)}>
                  <Checkbox
                    type="checkbox"
                    id="billing-app"
                    checked={notificationPreferences[NotificationType.BILLING][ChannelType.APP]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="billing-app">
                    <ChannelIcon $iconType="bell" $size={16} $active={notificationPreferences[NotificationType.BILLING][ChannelType.APP]}>
                      <Bell size={16} />
                    </ChannelIcon>
                    App Notifications
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.BILLING, ChannelType.PUSH)}>
                  <Checkbox
                    type="checkbox"
                    id="billing-push"
                    checked={notificationPreferences[NotificationType.BILLING][ChannelType.PUSH]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="billing-push">
                    <ChannelIcon $iconType="phone-call" $size={16} $active={notificationPreferences[NotificationType.BILLING][ChannelType.PUSH]}>
                      <PhoneCall size={16} />
                    </ChannelIcon>
                    Push Notifications
                  </ChannelLabel>
                </ChannelOption>
              </ChannelOptions>
            </NotificationGroup>

            <Divider />

            <NotificationGroup>
              <NotificationTitle>
                <NotificationIcon $iconType="bell-off" $size={16} $active={true}>
                  <BellOff size={16} />
                </NotificationIcon>
                Marketing Communications
              </NotificationTitle>
              <HelperText>Receive updates about new services, promotions, and educational content</HelperText>
              <ChannelOptions>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.MARKETING, ChannelType.EMAIL)}>
                  <Checkbox
                    type="checkbox"
                    id="marketing-email"
                    checked={notificationPreferences[NotificationType.MARKETING][ChannelType.EMAIL]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="marketing-email">
                    <ChannelIcon $iconType="mail" $size={16} $active={notificationPreferences[NotificationType.MARKETING][ChannelType.EMAIL]}>
                      <Mail size={16} />
                    </ChannelIcon>
                    Email
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.MARKETING, ChannelType.SMS)}>
                  <Checkbox
                    type="checkbox"
                    id="marketing-sms"
                    checked={notificationPreferences[NotificationType.MARKETING][ChannelType.SMS]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="marketing-sms">
                    <ChannelIcon $iconType="message-square" $size={16} $active={notificationPreferences[NotificationType.MARKETING][ChannelType.SMS]}>
                      <MessageSquare size={16} />
                    </ChannelIcon>
                    SMS
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.MARKETING, ChannelType.APP)}>
                  <Checkbox
                    type="checkbox"
                    id="marketing-app"
                    checked={notificationPreferences[NotificationType.MARKETING][ChannelType.APP]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="marketing-app">
                    <ChannelIcon $iconType="bell" $size={16} $active={notificationPreferences[NotificationType.MARKETING][ChannelType.APP]}>
                      <Bell size={16} />
                    </ChannelIcon>
                    App Notifications
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.MARKETING, ChannelType.PUSH)}>
                  <Checkbox
                    type="checkbox"
                    id="marketing-push"
                    checked={notificationPreferences[NotificationType.MARKETING][ChannelType.PUSH]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="marketing-push">
                    <ChannelIcon $iconType="phone-call" $size={16} $active={notificationPreferences[NotificationType.MARKETING][ChannelType.PUSH]}>
                      <PhoneCall size={16} />
                    </ChannelIcon>
                    Push Notifications
                  </ChannelLabel>
                </ChannelOption>
              </ChannelOptions>
            </NotificationGroup>
          </CardContent>
        </Card>

        <ActionButtons>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ButtonIcon $iconType="save" $size={16} $active={!loading}>
              <Save size={16} />
            </ButtonIcon>
            {loading ? 'Saving...' : 'Save Notification Settings'}
          </Button>
        </ActionButtons>
      </Container>
    </ComponentGate>
  );
} 