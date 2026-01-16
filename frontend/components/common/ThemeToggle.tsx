'use client';

import React from 'react';
import styled from 'styled-components';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: var(--background-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: ${props => props.$active ? 'var(--primary)' : 'transparent'};
  color: ${props => props.$active ? 'var(--primary-foreground)' : 'var(--text-secondary)'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$active ? 'var(--primary)' : 'color-mix(in srgb, var(--primary), transparent 90%)'};
    color: ${props => props.$active ? 'var(--primary-foreground)' : 'var(--primary)'};
  }
`;

export default function ThemeToggle() {
    const { themePreference, setThemePreference } = useThemeStore();

    return (
        <ToggleContainer>
            <ToggleButton
                $active={themePreference === 'light'}
                onClick={() => setThemePreference('light')}
                title="Light Mode"
            >
                <Sun size={16} />
            </ToggleButton>
            <ToggleButton
                $active={themePreference === 'dark'}
                onClick={() => setThemePreference('dark')}
                title="Dark Mode"
            >
                <Moon size={16} />
            </ToggleButton>
            <ToggleButton
                $active={themePreference === 'system'}
                onClick={() => setThemePreference('system')}
                title="System Preference"
            >
                <Monitor size={16} />
            </ToggleButton>
        </ToggleContainer>
    );
}
