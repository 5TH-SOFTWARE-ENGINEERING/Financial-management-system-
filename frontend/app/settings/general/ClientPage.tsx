'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuth } from '@/lib/rbac/auth-context';
import { Save, Globe, Bell, Moon, Sun, Monitor, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;
const CardShadowHover = `
  0 8px 12px -2px rgba(0, 0, 0, 0.08),
  0 4px 6px -2px rgba(0, 0, 0, 0.04),
  inset 0 0 0 1px rgba(0, 0, 0, 0.03)
`;

const Container = styled.div`
  max-width: 1000px;
  margin: 20px auto;
  padding: ${theme.spacing.md};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 2px solid ${theme.colors.border};
`;

const Title = styled.h1`
  font-size: ${theme.typography.fontSizes.xxl};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
`;

const Card = styled.div`
  background-color: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  margin-bottom: ${theme.spacing.lg};
  transition: box-shadow ${theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const CardHeader = styled.div`
  padding: ${theme.spacing.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${theme.colors.border};
`;

const CardTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  
  svg {
    width: 20px;
    height: 20px;
    color: ${PRIMARY_COLOR};
  }
`;

const CardContent = styled.div`
  padding: ${theme.spacing.lg};
`;

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.lg};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.medium};
  margin-bottom: ${theme.spacing.sm};
  color: ${TEXT_COLOR_DARK};
`;

const HelperText = styled.p`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  margin-top: ${theme.spacing.xs};
  margin-bottom: 0;
`;

const Select = styled.select`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.md};
  background-color: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  transition: all ${theme.transitions.default};
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
  }
  
  &:hover {
    border-color: ${PRIMARY_COLOR};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.xl};
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
    background-color: ${PRIMARY_COLOR};
  }
  
  &:checked + span:before {
    transform: translateX(24px);
  }
  
  &:focus + span {
    box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${theme.colors.border};
  transition: ${theme.transitions.default};
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: ${theme.transitions.default};
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ThemeOptions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  flex-wrap: wrap;
`;

const ThemeOption = styled.div<{ $isSelected: boolean }>`
  padding: ${theme.spacing.md};
  border: 2px solid ${props => props.$isSelected ? PRIMARY_COLOR : theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  background-color: ${props => props.$isSelected ? 'rgba(0, 170, 0, 0.1)' : theme.colors.background};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing.sm};
  min-width: 100px;
  transition: all ${theme.transitions.default};
  user-select: none;
  position: relative;
  
  &:hover {
    border-color: ${PRIMARY_COLOR};
    transform: translateY(-2px);
    box-shadow: ${CardShadow};
    background-color: ${props => props.$isSelected ? 'rgba(0, 170, 0, 0.15)' : 'rgba(0, 170, 0, 0.05)'};
  }
  
  &:active {
    transform: translateY(0);
  }
  
  ${props => props.$isSelected && `
    &::after {
      content: '✓';
      position: absolute;
      top: 4px;
      right: 4px;
      width: 20px;
      height: 20px;
      background: ${PRIMARY_COLOR};
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }
  `}
`;

const ThemeIcon = styled.div`
  background-color: ${theme.colors.backgroundSecondary};
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color ${theme.transitions.default};
  
  ${ThemeOption}:hover & {
    background-color: rgba(0, 170, 0, 0.1);
  }
  
  svg {
    width: 24px;
    height: 24px;
    color: ${TEXT_COLOR_DARK};
  }
`;

const ThemeLabel = styled.span`
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
`;

const SuccessBanner = styled.div`
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: #065f46;
  font-size: ${theme.typography.fontSizes.md};
  
  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

interface GeneralSettings {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  dateFormat: string;
  autoSave: boolean;
  compactView: boolean;
}

const defaultSettings: GeneralSettings = {
  language: 'en',
  timezone: 'UTC',
  theme: 'light',
  dateFormat: 'MM/DD/YYYY',
  autoSave: true,
  compactView: false
};

const getSettingsStorageKey = (userId?: number | string): string => {
  return userId ? `user_${userId}_general_settings` : 'user_general_settings';
};

const loadSettings = (userId?: number | string): GeneralSettings => {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const key = getSettingsStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return defaultSettings;
};

const saveSettings = (settings: GeneralSettings, userId?: number | string): void => {
  if (typeof window === 'undefined') return;
  try {
    const key = getSettingsStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
};

const applyTheme = (theme: 'light' | 'dark' | 'system'): void => {
  if (typeof window === 'undefined') return;

  const html = document.documentElement;
  const body = document.body;

  // Determine the actual theme to apply
  let actualTheme: 'light' | 'dark' = 'light';

  if (theme === 'dark') {
    actualTheme = 'dark';
  } else if (theme === 'light') {
    actualTheme = 'light';
  } else {
    // System theme - check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    actualTheme = prefersDark ? 'dark' : 'light';
  }

  // Remove existing theme classes
  html.classList.remove('dark', 'light');
  html.removeAttribute('data-theme');

  // Apply theme classes and attributes - only add 'dark' class, not 'light'
  if (actualTheme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  html.setAttribute('data-theme', actualTheme);
  html.style.colorScheme = actualTheme;

  // Apply CSS custom properties for dark mode support
  if (actualTheme === 'dark') {
    // Dark mode colors
    html.style.setProperty('--background', '#0f172a');
    html.style.setProperty('--foreground', '#f1f5f9');
    html.style.setProperty('--muted', '#1e293b');
    html.style.setProperty('--muted-foreground', '#94a3b8');
    html.style.setProperty('--border', '#334155');
    html.style.setProperty('--card', '#1e293b');

    // Apply dark mode to body and html
    if (body) {
      body.style.backgroundColor = '#0f172a';
      body.style.color = '#f1f5f9';
      body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    }
    html.style.backgroundColor = '#0f172a';
    html.style.color = '#f1f5f9';
  } else {
    // Light mode colors (default)
    html.style.setProperty('--background', '#ffffff');
    html.style.setProperty('--foreground', '#111827');
    html.style.setProperty('--muted', '#f3f4f6');
    html.style.setProperty('--muted-foreground', '#6b7280');
    html.style.setProperty('--border', '#e5e7eb');
    html.style.setProperty('--card', '#ffffff');

    // Apply light mode to body and html
    if (body) {
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#111827';
      body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    }
    html.style.backgroundColor = '#ffffff';
    html.style.color = '#111827';
  }

  // Inject or update global dark mode styles
  let styleElement = document.getElementById('theme-dark-mode-styles');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'theme-dark-mode-styles';
    document.head.appendChild(styleElement);
  }

  if (actualTheme === 'dark') {
    styleElement.textContent = `
      html.dark,
      html.dark body,
      html.dark * {
        color-scheme: dark;
      }
      
      html.dark,
      html.dark body {
        background-color: #0f172a !important;
        color: #f1f5f9 !important;
      }
      
      html.dark {
        --background: #0f172a !important;
        --foreground: #f1f5f9 !important;
        --muted: #1e293b !important;
        --muted-foreground: #94a3b8 !important;
        --border: #334155 !important;
        --card: #1e293b !important;
      }
    `;
  } else {
    styleElement.textContent = `
      html:not(.dark),
      html:not(.dark) body,
      html:not(.dark) * {
        color-scheme: light;
      }
      
      html:not(.dark),
      html:not(.dark) body {
        background-color: #ffffff !important;
        color: #111827 !important;
      }
      
      html:not(.dark) {
        --background: #ffffff !important;
        --foreground: #111827 !important;
        --muted: #f3f4f6 !important;
        --muted-foreground: #6b7280 !important;
        --border: #e5e7eb !important;
        --card: #ffffff !important;
      }
    `;
  }

  // Store in localStorage for persistence across page reloads
  try {
    localStorage.setItem('app-theme', theme);
    localStorage.setItem('app-theme-applied', actualTheme);
  } catch (error) {
    console.error('Failed to save theme to localStorage:', error);
  }

  // Force re-render by dispatching a resize event (helps with styled-components)
  window.dispatchEvent(new Event('themechange'));
};

const applyCompactView = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  if (enabled) {
    document.documentElement.classList.add('compact-view');
  } else {
    document.documentElement.classList.remove('compact-view');
  }
};

export default function GeneralSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<GeneralSettings>(() => loadSettings(user?.id));

  // Load settings when user changes
  useEffect(() => {
    if (user?.id) {
      const loadedSettings = loadSettings(user.id);
      setSettings(loadedSettings);

      // Apply theme immediately on load
      setTimeout(() => {
        applyTheme(loadedSettings.theme);
        applyCompactView(loadedSettings.compactView);
      }, 0);
    }
  }, [user?.id]);

  // Apply theme on initial mount - prioritize stored theme
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if theme is stored globally first (for immediate application)
    const globalTheme = localStorage.getItem('app-theme');
    const themeToApply = (globalTheme as 'light' | 'dark' | 'system') || settings.theme;

    // Apply theme immediately on mount - use requestAnimationFrame for smooth transition
    requestAnimationFrame(() => {
      applyTheme(themeToApply);
      // Also update state if different
      if (themeToApply !== settings.theme && globalTheme) {
        setSettings(prev => ({ ...prev, theme: themeToApply }));
      }
    });
  }, [settings.theme]); // Run once on mount

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Apply compact view when it changes
  useEffect(() => {
    applyCompactView(settings.compactView);
  }, [settings.compactView]);

  // Listen for system theme changes if using system theme
  useEffect(() => {
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    // Apply theme immediately - this must happen synchronously for instant feedback
    applyTheme(theme);

    // Update state immediately
    const newSettings = { ...settings, theme };
    setSettings(newSettings);

    // Auto-save theme change immediately (don't wait for Save button)
    try {
      saveSettings(newSettings, user?.id);

      // Dispatch event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: newSettings }));
      }

      // Show feedback
      const themeNames = {
        light: 'Light',
        dark: 'Dark',
        system: 'System'
      };
      toast.success(`Theme changed to ${themeNames[theme]}`);
    } catch (error) {
      console.error('Failed to auto-save theme:', error);
      toast.error('Failed to save theme preference');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(null);

    try {
      // Save to localStorage
      saveSettings(settings, user?.id);

      // Apply all settings immediately
      applyTheme(settings.theme);
      applyCompactView(settings.compactView);

      // Store settings in a global location for access by other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));
      }

      setSuccess('Settings saved successfully!');
      toast.success('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings. Please try again.');
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
          <Title>General Settings</Title>
        </Header>

        {success && (
          <SuccessBanner>
            <CheckCircle />
            <span>{success}</span>
          </SuccessBanner>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              <Globe />
              Regional Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormGroup>
              <Label htmlFor="language">Language</Label>
              <Select
                id="language"
                name="language"
                value={settings.language}
                onChange={handleInputChange}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
              </Select>
              <HelperText>The language used throughout the application.</HelperText>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                id="timezone"
                name="timezone"
                value={settings.timezone}
                onChange={handleInputChange}
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">EST (Eastern Standard Time)</option>
                <option value="America/Chicago">CST (Central Standard Time)</option>
                <option value="America/Los_Angeles">PST (Pacific Standard Time)</option>
                <option value="Europe/London">GMT (Greenwich Mean Time)</option>
                <option value="Europe/Paris">CET (Central European Time)</option>
                <option value="Asia/Dubai">GST (Gulf Standard Time)</option>
                <option value="Asia/Tokyo">JST (Japan Standard Time)</option>
                <option value="Asia/Shanghai">CST (China Standard Time)</option>
              </Select>
              <HelperText>Affects how dates and times are displayed throughout the application.</HelperText>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                id="dateFormat"
                name="dateFormat"
                value={settings.dateFormat}
                onChange={handleInputChange}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (European Format)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
                <option value="DD MMM YYYY">DD MMM YYYY (e.g., 01 Jan 2024)</option>
              </Select>
              <HelperText>The format in which dates will be displayed throughout the application.</HelperText>
            </FormGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Bell />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormGroup>
              <Label>Theme</Label>
              <ThemeOptions>
                <ThemeOption
                  $isSelected={settings.theme === 'light'}
                  onClick={() => handleThemeChange('light')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleThemeChange('light');
                    }
                  }}
                >
                  <ThemeIcon>
                    <Sun />
                  </ThemeIcon>
                  <ThemeLabel>Light</ThemeLabel>
                </ThemeOption>
                <ThemeOption
                  $isSelected={settings.theme === 'dark'}
                  onClick={() => handleThemeChange('dark')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleThemeChange('dark');
                    }
                  }}
                >
                  <ThemeIcon>
                    <Moon />
                  </ThemeIcon>
                  <ThemeLabel>Dark</ThemeLabel>
                </ThemeOption>
                <ThemeOption
                  $isSelected={settings.theme === 'system'}
                  onClick={() => handleThemeChange('system')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleThemeChange('system');
                    }
                  }}
                >
                  <ThemeIcon>
                    <Monitor />
                  </ThemeIcon>
                  <ThemeLabel>System</ThemeLabel>
                </ThemeOption>
              </ThemeOptions>
              <HelperText>
                Choose your preferred color theme. Changes apply immediately.
                System will match your operating system preference.
              </HelperText>
            </FormGroup>

            <FormGroup>
              <SwitchContainer>
                <div>
                  <Label htmlFor="compactView">Compact View</Label>
                  <HelperText>Display more content with less spacing for better productivity</HelperText>
                </div>
                <Switch>
                  <SwitchInput
                    type="checkbox"
                    id="compactView"
                    name="compactView"
                    checked={settings.compactView}
                    onChange={handleSwitchChange}
                  />
                  <SwitchSlider />
                </Switch>
              </SwitchContainer>
            </FormGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormGroup>
              <SwitchContainer>
                <div>
                  <Label htmlFor="autoSave">Auto-save</Label>
                  <HelperText>Automatically save changes when editing forms and documents</HelperText>
                </div>
                <Switch>
                  <SwitchInput
                    type="checkbox"
                    id="autoSave"
                    name="autoSave"
                    checked={settings.autoSave}
                    onChange={handleSwitchChange}
                  />
                  <SwitchSlider />
                </Switch>
              </SwitchContainer>
            </FormGroup>
          </CardContent>
        </Card>

        <ActionButtons>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={loading}
            style={{ minWidth: '150px' }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </ActionButtons>
      </Container>
    </ComponentGate>
  );
}
