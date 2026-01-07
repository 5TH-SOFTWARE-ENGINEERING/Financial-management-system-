'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  Bell, CheckCircle, XCircle, AlertCircle, Info, Calendar, Trash2, CheckSquare,
  Settings, RefreshCw, FileText, Loader2, Eye, EyeOff, Lock
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/lib/rbac/auth-context';
import { formatDate } from '@/lib/utils';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import Layout from '@/components/layout';
import { theme } from '@/components/common/theme';
import useNotificationStore, { Notification } from '@/store/notificationStore';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = '#111827';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

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

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-bottom: ${theme.spacing.xxl};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.xl} ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  box-shadow: 0 10px 30px rgba(0, 170, 0, 0.15);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    pointer-events: none;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${theme.spacing.lg};
  position: relative;
  z-index: 1;
  
  .title-area {
    h1 {
      font-size: clamp(32px, 5vw, 48px);
      font-weight: 800;
      margin: 0 0 ${theme.spacing.xs};
      color: #ffffff;
      letter-spacing: -1.5px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    p {
      font-size: ${theme.typography.fontSizes.md || '16px'};
      font-weight: 500;
      opacity: 0.9;
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.5;
    }
  }
`;

const LiveIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-left: 12px;
  height: fit-content;

  .dot {
    width: 8px;
    height: 8px;
    background: #4ade80;
    border-radius: 50%;
    box-shadow: 0 0 10px #4ade80;
    animation: pulse 2s infinite;
  }

  span {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: white;
  }

  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
    70% { transform: scale(1.2); opacity: 0.8; box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); }
    100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  font-size: ${theme.typography.fontSizes.sm || '14px'};
  font-weight: ${theme.typography.fontWeights.medium};
  border-radius: ${theme.borderRadius.md};
  border: none;
  cursor: pointer;
  transition: all ${theme.transitions.default};
  white-space: nowrap;
  
  ${props => props.$variant === 'primary' ? `
    background: rgba(255, 255, 255, 0.2);
    color: white;
    backdrop-filter: blur(10px);
    
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  ` : `
    background: rgba(255, 255, 255, 0.15);
    color: white;
    backdrop-filter: blur(10px);
    
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

const ErrorBanner = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: #991b1b;
  font-size: ${theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const StatCard = styled.div<{ $delay: string }>`
  background: ${theme.colors.background};
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 24px;
  padding: ${theme.spacing.xl};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  animation: slideIn 0.5s ease-out forwards;
  animation-delay: ${props => props.$delay};
  opacity: 0;

  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 170, 0, 0.08);
    border-color: ${PRIMARY_COLOR}40;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, transparent, ${PRIMARY_COLOR}40, transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover::after {
    opacity: 1;
  }
`;

const StatContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatLabel = styled.p`
  font-size: 11px;
  font-weight: 700;
  color: ${TEXT_COLOR_MUTED};
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  opacity: 0.8;
`;

const StatValue = styled.p<{ $color?: string }>`
  font-size: 36px;
  font-weight: 800;
  color: ${props => props.$color || TEXT_COLOR_DARK};
  line-height: 1;
  letter-spacing: -1px;
`;

const StatIcon = styled.div<{ $bgColor: string; $iconColor: string }>`
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: ${props => props.$bgColor};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.02);
  
  svg {
    color: ${props => props.$iconColor};
    width: 28px;
    height: 28px;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.lg};
  flex-wrap: wrap;
  margin-bottom: ${theme.spacing.xl};
  padding: ${theme.spacing.md} ${theme.spacing.sm};
  background: rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.03);
`;

const FilterSelect = styled.select`
  padding: 12px 20px;
  padding-right: 40px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  background: white;
  font-size: 14px;
  font-weight: 600;
  color: ${TEXT_COLOR_DARK};
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 200px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  
  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 4px rgba(0, 170, 0, 0.1);
    transform: translateY(-1px);
  }
  
  &:hover {
    border-color: ${PRIMARY_COLOR}80;
    background-color: #fafafa;
  }
`;

const FilterCount = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${PRIMARY_COLOR};
  padding: 6px 14px;
  background: ${PRIMARY_COLOR}10;
  border-radius: 12px;
  border: 1px solid ${PRIMARY_COLOR}20;
`;

const NotificationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

const NotificationCard = styled.div<{ $isRead: boolean; $displayType: string; $priority: string }>`
  background: ${props => props.$isRead
    ? 'rgba(255, 255, 255, 0.4)'
    : 'rgba(255, 255, 255, 0.85)'};
  backdrop-filter: blur(12px);
  border: 1px solid ${props => props.$isRead ? 'rgba(0, 0, 0, 0.03)' : 'rgba(0, 0, 0, 0.08)'};
  border-left: 6px solid ${props => {
    const colors: Record<string, string> = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    return props.$isRead ? colors[props.$displayType] + '40' : colors[props.$displayType];
  }};
  border-radius: 20px;
  padding: 24px;
  box-shadow: ${props => props.$isRead
    ? '0 4px 12px rgba(0,0,0,0.01)'
    : '0 8px 30px rgba(0,0,0,0.04)'};
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  ${props => props.$priority === 'urgent' && !props.$isRead && `
    animation: pulseBorder 2s infinite;
    @keyframes pulseBorder {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2); }
      70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
  `}
  
  &:hover {
    transform: translateX(8px);
    background: ${props => props.$isRead
    ? 'rgba(255, 255, 255, 0.6)'
    : 'rgba(255, 255, 255, 0.95)'};
    box-shadow: 0 15px 45px rgba(0, 0, 0, 0.06);
    border-color: ${props => {
    const colors: Record<string, string> = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    return colors[props.$displayType] + '60';
  }};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transform: translateX(-100%);
    transition: transform 0.8s;
  }

  &:hover::before {
    transform: translateX(100%);
  }

  ${props => !props.$isRead && `
    &::after {
      content: '';
      position: absolute;
      top: 12px;
      right: 12px;
      width: 8px;
      height: 8px;
      background: ${PRIMARY_COLOR};
      border-radius: 50%;
    }
  `}
`;

const NotificationContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
`;

const NotificationIcon = styled.div<{ $displayType: string }>`
  flex-shrink: 0;
  margin-top: 4px;
  
  ${props => {
    const colors: Record<string, string> = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    return `
      svg {
        color: ${colors[props.$displayType] || '#3b82f6'};
        width: 22px;
        height: 22px;
      }
    `;
  }}
`;

const PriorityBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px ${theme.spacing.md};
  font-size: ${theme.typography.fontSizes.xs || '11px'};
  font-weight: ${theme.typography.fontWeights.bold || '700'};
  text-transform: uppercase;
  letter-spacing: 0.8px;
  border-radius: 12px;
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  border: 1px solid ${props => props.$color}40;
  flex-shrink: 0;
`;

const NotificationDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
  flex-wrap: wrap;
`;

const NotificationTitle = styled.h3<{ $isRead: boolean }>`
  font-size: ${theme.typography.fontSizes.lg || '18px'};
  font-weight: ${props => props.$isRead
    ? theme.typography.fontWeights.medium
    : theme.typography.fontWeights.bold || '700'};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
`;

const NewBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px ${theme.spacing.md};
  font-size: ${theme.typography.fontSizes.xs || '11px'};
  font-weight: ${theme.typography.fontWeights.bold || '700'};
  text-transform: uppercase;
  letter-spacing: 0.8px;
  border-radius: 12px;
  background: ${PRIMARY_COLOR};
  color: white;
  flex-shrink: 0;
`;

const NotificationMessage = styled.p`
  font-size: ${theme.typography.fontSizes.md || '15px'};
  color: ${TEXT_COLOR_MUTED};
  margin-bottom: ${theme.spacing.md};
  line-height: 1.6;
`;

const NotificationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.lg};
  flex-wrap: wrap;
`;

const NotificationTime = styled.span`
  font-size: ${theme.typography.fontSizes.sm || '13px'};
  color: ${TEXT_COLOR_MUTED};
  font-weight: ${theme.typography.fontWeights.medium};
`;

const ViewDetailsLink = styled.button`
  font-size: ${theme.typography.fontSizes.sm || '14px'};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${PRIMARY_COLOR};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all ${theme.transitions.default};
  
  &:hover {
    color: #008800;
    text-decoration: underline;
    transform: translateX(2px);
  }
`;

const NotificationActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  flex-shrink: 0;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  color: ${TEXT_COLOR_MUTED};
  transition: all ${theme.transitions.default};
  
  &:hover:not(:disabled) {
    background: ${theme.colors.backgroundSecondary};
    color: ${TEXT_COLOR_DARK};
    transform: scale(1.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const EmptyState = styled.div`
  background: white;
  border-radius: 32px;
  padding: 80px 40px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.03);
  max-width: 600px;
  margin: 40px auto;
  
  .icon-container {
    width: 100px;
    height: 100px;
    background: ${PRIMARY_COLOR}08;
    border-radius: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 32px;
    
    svg {
      color: ${PRIMARY_COLOR};
      width: 48px;
      height: 48px;
      opacity: 0.6;
    }
  }
  
  h3 {
    font-size: 24px;
    font-weight: 800;
    color: ${TEXT_COLOR_DARK};
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  }
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: 16px;
    line-height: 1.6;
    max-width: 300px;
    margin: 0 auto;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  width: 100%;
  
  p {
    margin-top: ${theme.spacing.md};
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
  }
`;

const Spinner = styled(Loader2)`
  width: 40px;
  height: 40px;
  color: ${PRIMARY_COLOR};
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.lg || '16px'};
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
  width: 90%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: ${theme.spacing.xl} ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h2 {
    font-size: ${theme.typography.fontSizes.lg || '20px'};
    font-weight: ${theme.typography.fontWeights.bold || '700'};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
    letter-spacing: -0.3px;
  }
  
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: ${TEXT_COLOR_MUTED};
    padding: ${theme.spacing.xs};
    border-radius: ${theme.borderRadius.sm};
    transition: all ${theme.transitions.default};
    
    &:hover {
      background: ${theme.colors.backgroundSecondary};
      color: ${TEXT_COLOR_DARK};
      transform: scale(1.1);
    }
    
    svg {
      width: 22px;
      height: 22px;
    }
  }
`;

const ModalBody = styled.div`
  padding: ${theme.spacing.xl} ${theme.spacing.lg};
  flex: 1;
`;

const NotificationDetailSection = styled.div`
  margin-bottom: ${theme.spacing.xl};
  
  h3 {
    font-size: ${theme.typography.fontSizes.lg || '18px'};
    font-weight: ${theme.typography.fontWeights.bold || '700'};
    color: ${TEXT_COLOR_DARK};
    margin: 0 0 ${theme.spacing.lg};
    letter-spacing: -0.2px;
  }
  
  p {
    font-size: ${theme.typography.fontSizes.sm || '14px'};
    color: ${TEXT_COLOR_MUTED};
    margin: 0;
    line-height: 1.6;
  }
`;

const DetailRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  
  strong {
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    min-width: 120px;
    font-size: ${theme.typography.fontSizes.sm || '14px'};
  }
  
  span {
    color: ${TEXT_COLOR_MUTED};
    flex: 1;
    font-size: ${theme.typography.fontSizes.sm || '14px'};
    line-height: 1.5;
  }
`;

const PasswordInputContainer = styled.div`
  margin-top: ${theme.spacing.lg};
  
  label {
    display: block;
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    margin-bottom: ${theme.spacing.sm};
  }
  
  .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    
    input {
      width: 100%;
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      padding-right: 48px;
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.borderRadius.md};
      background: ${theme.colors.background};
      font-size: ${theme.typography.fontSizes.md};
      color: ${TEXT_COLOR_DARK};
      transition: all ${theme.transitions.default};
      
      &:focus {
        outline: none;
        border-color: ${PRIMARY_COLOR};
        box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
      }
      
      &::placeholder {
        color: ${TEXT_COLOR_MUTED};
        opacity: 0.5;
      }
    }
    
    button {
      position: absolute;
      right: ${theme.spacing.sm};
      background: none;
      border: none;
      cursor: pointer;
      color: ${TEXT_COLOR_MUTED};
      padding: ${theme.spacing.xs};
      border-radius: ${theme.borderRadius.sm};
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all ${theme.transitions.default};
      
      &:hover {
        color: ${TEXT_COLOR_DARK};
        background: ${theme.colors.backgroundSecondary};
      }
      
      svg {
        width: 18px;
        height: 18px;
      }
    }
  }
  
  .error-message {
    margin-top: ${theme.spacing.xs};
    font-size: ${theme.typography.fontSizes.xs};
    color: #ef4444;
  }
`;

const ModalFooter = styled.div`
  padding: ${theme.spacing.xl} ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${theme.spacing.md};
  
  button {
    padding: ${theme.spacing.md} ${theme.spacing.lg};
    font-size: ${theme.typography.fontSizes.md || '15px'};
    font-weight: ${theme.typography.fontWeights.medium};
    border-radius: ${theme.borderRadius.md};
    border: none;
    cursor: pointer;
    transition: all ${theme.transitions.default};
    min-width: 120px;
    
    &.cancel {
      background: ${theme.colors.backgroundSecondary};
      color: ${TEXT_COLOR_DARK};
      
      &:hover:not(:disabled) {
        background: ${theme.colors.border};
        transform: translateY(-1px);
      }
    }
    
    &.delete {
      background: #ef4444;
      color: white;
      
      &:hover:not(:disabled) {
        background: #dc2626;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      }
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;



export default function NotificationsPage() {
  const router = useRouter();
  const { user: storeUser, isAuthenticated, isLoading } = useUserStore();
  const { user: authUser } = useAuth();
  const user = storeUser || authUser;

  // Use the new notification store
  const {
    notifications,
    unreadCount,
    isLoading: storeLoading,
    error: storeError,
    lastSynced,
    accessibleUserIds,
    isInitialized,
    fetchNotifications: fetchNotificationsFromStore,
    markAsRead: markAsReadInStore,
    markAllAsRead: markAllAsReadInStore,
    deleteNotification: deleteNotificationFromStore,
    setAccessibleUserIds,
    setNotifications
  } = useNotificationStore();

  const [filterType, setFilterType] = useState<string>('all');
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [userCache, setUserCache] = useState<Map<number, { name: string; email: string }>>(new Map());

  // Initialize accessible user IDs based on role
  useEffect(() => {
    const initializeAccessibleUsers = async () => {
      if (!user) {
        setAccessibleUserIds(null);
        return;
      }

      const userRole = user?.role?.toLowerCase() || '';
      const isFinanceAdmin = userRole === 'finance_manager' || userRole === 'finance_admin' || userRole === 'manager';
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';
      const isAccountant = userRole === 'accountant';
      const isEmployee = userRole === 'employee';

      if (isAdmin) {
        // Admin sees all
        setAccessibleUserIds(null);
        return;
      }

      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
      const managerId = (user as any).managerId || (user as any).manager_id;
      const normalizedManagerId = managerId ? (typeof managerId === 'string' ? parseInt(managerId, 10) : Number(managerId)) : null;

      if (isFinanceAdmin && userId) {
        // Finance Admin/Manager: Own + Subordinates (Accountants/Employees only)
        try {
          const subordinatesRes = await apiClient.getSubordinates(userId);
          const subordinates = Array.isArray(subordinatesRes?.data) ? subordinatesRes.data : [];
          const validSubordinateIds = subordinates
            .map((sub: { id?: number | string; role?: string }) => {
              const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : Number(sub.id);
              const subRole = (sub.role || '').toLowerCase();
              if (!Number.isNaN(subId) && (subRole === 'accountant' || subRole === 'employee')) return subId;
              return null;
            })
            .filter((id): id is number => id !== null);

          setAccessibleUserIds([userId, ...validSubordinateIds]);
        } catch (err) {
          console.error('Failed to fetch subordinates for Finance Admin:', err);
          setAccessibleUserIds([userId]);
        }
      } else if (isAccountant && userId && normalizedManagerId) {
        // Accountant: Own + Employees of their Finance Admin manager (for sales)
        try {
          const subordinatesRes = await apiClient.getSubordinates(normalizedManagerId);
          const subordinates = Array.isArray(subordinatesRes?.data) ? subordinatesRes.data : [];
          const employeeIds = subordinates
            .map((sub: { id?: number | string; role?: string }) => {
              const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : Number(sub.id);
              const subRole = (sub.role || '').toLowerCase();
              if (!Number.isNaN(subId) && subRole === 'employee') return subId;
              return null;
            })
            .filter((id): id is number => id !== null);

          setAccessibleUserIds([userId, ...employeeIds]);
        } catch (err) {
          setAccessibleUserIds([userId]);
        }
      } else if (isEmployee && userId && normalizedManagerId) {
        // Employee: Own + manager (for items created by finance admin)
        setAccessibleUserIds([userId, normalizedManagerId]);
      } else {
        // Others: only see own
        setAccessibleUserIds(userId ? [userId] : null);
      }
    };

    initializeAccessibleUsers();
  }, [user]);

  // Role-based access control - all authenticated users can access notifications
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push('/auth/login');
        return;
      }

      // Check if user has a valid role
      const userRole = user.role?.toLowerCase();
      const allowedRoles = [
        'admin',
        'super_admin',
        'finance_admin',
        'finance_manager',
        'manager',
        'accountant',
        'employee'
      ];

      if (!userRole || !allowedRoles.includes(userRole)) {
        toast.error('Access denied: Insufficient permissions');
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Helper to fetch user information for notifications
  const fetchUserInfoForNotifications = useCallback(async (notifications: Notification[]) => {
    if (!user) return;

    const userRole = user.role?.toLowerCase() || '';
    const isAdminOrFinanceAdmin = ['admin', 'super_admin', 'finance_admin', 'manager'].includes(userRole);

    // Only fetch user info if admin/finance admin and viewing notifications from other users
    if (!isAdminOrFinanceAdmin) return;

    try {
      // Get unique user IDs from notifications that are not the current user
      const currentUserId = Number(user.id);
      const uniqueUserIds = [...new Set(notifications
        .map(n => n.user_id)
        .filter(id => id && id !== currentUserId && !userCache.has(id))
      )];

      if (uniqueUserIds.length === 0) return;

      // Fetch user information for unique user IDs
      const userPromises = uniqueUserIds.map(async (userId) => {
        try {
          const userResponse = await apiClient.getUser(userId);
          const userData = userResponse.data as { full_name?: string; email?: string; username?: string };
          return {
            id: userId,
            name: userData.full_name || userData.username || 'Unknown User',
            email: userData.email || ''
          };
        } catch (err) {
          // If user fetch fails, return basic info
          return {
            id: userId,
            name: `User #${userId}`,
            email: ''
          };
        }
      });

      const userInfos = await Promise.all(userPromises);
      const newCache = new Map(userCache);
      userInfos.forEach(userInfo => {
        newCache.set(userInfo.id, { name: userInfo.name, email: userInfo.email });
      });
      setUserCache(newCache);

      // Update notifications with user info
      setNotifications((prevNotifications: Notification[]) =>
        prevNotifications.map(notif => {
          const userInfo = newCache.get(notif.user_id);
          return userInfo ? {
            ...notif,
            user_name: userInfo.name,
            user_email: userInfo.email
          } : notif;
        })
      );
    } catch (err) {
      console.error('Failed to fetch user information for notifications:', err);
    }
  }, [user, userCache]);

  const fetchNotifications = useCallback(async (showLoading: boolean = true) => {
    // Wait for accessibleUserIds to be ready (unless admin)
    if (!isInitialized) {
      return;
    }

    await fetchNotificationsFromStore(showLoading);
  }, [fetchNotificationsFromStore, isInitialized]);



  useEffect(() => {
    if (isAuthenticated && user && isInitialized) {
      fetchNotifications(true);
      // Set up real-time updates every 15 seconds for a more responsive feel
      const interval = setInterval(() => {
        fetchNotifications(false); // Don't show loading on background refresh
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, fetchNotifications, isInitialized]);

  // Update user cache when user changes
  useEffect(() => {
    if (user) {
      // Add current user to cache
      setUserCache(prev => {
        const newCache = new Map(prev);
        const userId = Number(user.id);
        // Handle both StoreUser (has 'name') and User (has 'full_name')
        const userName = ('name' in user ? user.name : undefined) ||
          (('full_name' in user) ? (user as { full_name?: string }).full_name : undefined) ||
          ('email' in user ? user.email : '') ||
          'You';
        const userEmail = ('email' in user ? user.email : '') || '';
        newCache.set(userId, {
          name: userName,
          email: userEmail
        });
        return newCache;
      });
    }
  }, [user]);

  // Auto-refresh when window regains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && user) {
        fetchNotifications(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, user, fetchNotifications]);

  const markAsRead = async (notificationId: number) => {
    if (processingIds.has(notificationId)) return;

    setProcessingIds(prev => new Set(prev).add(notificationId));

    try {
      await markAsReadInStore(notificationId);
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || (error as { message?: string }).message || 'Failed to mark notification as read';
      toast.error(errorMessage);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const markAllAsRead = async () => {
    if (processingIds.has(-1)) return;

    setProcessingIds(prev => new Set(prev).add(-1));

    try {
      await markAllAsReadInStore();
      toast.success('All notifications marked as read');
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || (error as { message?: string }).message || 'Failed to mark all notifications as read';
      toast.error(errorMessage);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(-1);
        return newSet;
      });
    }
  };

  const openDeleteModal = (notification: Notification) => {
    setNotificationToDelete(notification);
    setDeleteModalOpen(true);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeletePassword(false);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setNotificationToDelete(null);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeletePassword(false);
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Use login endpoint to verify password
      // We'll catch the error if password is wrong, but won't actually log in
      // Get identifier from user - email is always available
      const identifier = user.email || '';
      await apiClient.request({
        method: 'POST',
        url: '/auth/login-json',
        data: {
          username: identifier,
          password: password
        }
      });
      return true;
    } catch (err: unknown) {
      // If login fails, password is incorrect
      return false;
    }
  };

  const handleDeleteWithPassword = async () => {
    if (!notificationToDelete || !deletePassword.trim()) {
      setDeletePasswordError('Please enter your password');
      return;
    }

    setVerifyingPassword(true);
    setDeletePasswordError(null);

    try {
      // Verify password
      const isValid = await verifyPassword(deletePassword);

      if (!isValid) {
        setDeletePasswordError('Incorrect password. Please try again.');
        setVerifyingPassword(false);
        return;
      }

      // Password is correct, proceed with deletion
      const notificationId = notificationToDelete.id;
      setProcessingIds(prev => new Set(prev).add(notificationId));

      try {
        await deleteNotificationFromStore(notificationId);

        toast.success('Notification deleted successfully');
        closeDeleteModal();
      } catch (err: unknown) {
        const error = err as ErrorWithDetails;
        const errorMessage = error.response?.data?.detail || (error as { message?: string }).message || 'Failed to delete notification';
        toast.error(errorMessage);
        await fetchNotifications();
      } finally {
        setProcessingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(notificationId);
          return newSet;
        });
      }
    } catch (err: unknown) {
      setDeletePasswordError('Failed to verify password. Please try again.');
      console.error('Password verification error:', err);
    } finally {
      setVerifyingPassword(false);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    if (processingIds.has(notificationId)) return;

    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      openDeleteModal(notification);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !notification.is_read;
    return notification.display_type === filterType;
  });

  const unreadCountVal = unreadCount;

  // Calculate stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = notifications.filter(n => {
    const notifDate = new Date(n.created_at);
    notifDate.setHours(0, 0, 0, 0);
    return notifDate.getTime() === today.getTime();
  }).length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCount = notifications.filter(n => {
    const notifDate = new Date(n.created_at);
    return notifDate >= weekAgo;
  }).length;

  if (isLoading || !isAuthenticated || !user) {
    return (
      <LoadingContainer>
        <Spinner />
        <p>Loading...</p>
      </LoadingContainer>
    );
  }

  const error = storeError;
  const loading = storeLoading;

  const getNotificationIcon = (displayType?: string, notificationType?: string, title?: string, message?: string) => {
    // Use notification type for more specific icons
    const type = notificationType?.toLowerCase() || '';
    const titleLower = (title || '').toLowerCase();
    const messageLower = (message || '').toLowerCase();

    // Specific icons for certain notification types
    if (type.includes('user') || type.includes('welcome') || titleLower.includes('welcome') || messageLower.includes('welcome')) {
      return <CheckCircle />;
    }
    if (type === 'approval_request' || (type.includes('approval') && titleLower.includes('approval required'))) {
      return <AlertCircle />;
    }
    if (type === 'approval_decision') {
      // Check if it's approved or rejected
      if (titleLower.includes('rejected') || messageLower.includes('rejected')) {
        return <XCircle />;
      }
      return <CheckCircle />;
    }
    if (type.includes('expense') || type.includes('revenue')) {
      return <FileText />;
    }
    if (type.includes('inventory')) {
      if (type === 'inventory_low') {
        return <AlertCircle />;
      }
      if (type === 'inventory_created') {
        return <CheckCircle />;
      }
      return <Info />;
    }
    if (type === 'sale_created' || type === 'sale_posted') {
      return <CheckCircle />;
    }
    if (type === 'budget_exceeded') {
      return <XCircle />;
    }
    if (type === 'deadline_reminder') {
      return <AlertCircle />;
    }
    if (type === 'report_ready' || type === 'forecast_created' || type === 'ml_training_complete') {
      return <CheckCircle />;
    }

    // Fallback to display type
    switch (displayType) {
      case 'success':
        return <CheckCircle />;
      case 'error':
        return <XCircle />;
      case 'warning':
        return <AlertCircle />;
      case 'info':
        return <Info />;
      default:
        return <Bell />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const normalized = priority?.toLowerCase() || 'medium';
    switch (normalized) {
      case 'urgent':
        return { text: 'Urgent', color: '#ef4444' };
      case 'high':
        return { text: 'High', color: '#f59e0b' };
      case 'medium':
        return { text: 'Medium', color: '#3b82f6' };
      case 'low':
        return { text: 'Low', color: '#6b7280' };
      default:
        return null;
    }
  };

  // Determine notification scope based on user role
  const userRole = user?.role?.toLowerCase() || '';
  const isAdmin = ['admin', 'super_admin'].includes(userRole);
  const isFinanceAdminOrManager = ['finance_admin', 'manager'].includes(userRole);
  const notificationScope = isAdmin
    ? 'all users'
    : isFinanceAdminOrManager
      ? 'your team'
      : 'your own';

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <HeaderContainer>
            <HeaderContent>
              <div className="title-area">
                <h1>
                  Notifications
                  <LiveIndicator>
                    <div className="dot" />
                    <span>Live</span>
                  </LiveIndicator>
                </h1>
                <p>
                  {isAdmin
                    ? 'Global system monitoring'
                    : isFinanceAdminOrManager
                      ? 'Team activity and approval requests'
                      : 'Personal alerts and updates'
                  }
                  <span style={{ opacity: 0.6, fontSize: '12px', marginLeft: '12px' }}>
                    Synced {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </p>
              </div>
              <HeaderActions>
                <ActionButton
                  $variant="secondary"
                  onClick={async () => {
                    await fetchNotifications(true);
                    toast.success('Notifications refreshed');
                  }}
                  disabled={loading}
                >
                  <RefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                  Refresh
                </ActionButton>
                {unreadCountVal > 0 && (
                  <ActionButton
                    $variant="primary"
                    onClick={markAllAsRead}
                    disabled={processingIds.has(-1)}
                  >
                    <CheckSquare />
                    Mark All as Read
                  </ActionButton>
                )}
                {user && (
                  user.role?.toLowerCase() !== 'accountant' &&
                  user.role?.toLowerCase() !== 'employee'
                ) && (
                    <ActionButton
                      $variant="secondary"
                      onClick={() => router.push('/settings/notifications')}
                    >
                      <Settings />
                      Settings
                    </ActionButton>
                  )}
              </HeaderActions>
            </HeaderContent>
          </HeaderContainer>

          {error && (
            <ErrorBanner>
              <AlertCircle />
              <span>{error}</span>
            </ErrorBanner>
          )}

          {loading ? (
            <LoadingContainer>
              <Spinner />
              <p>Loading notifications...</p>
            </LoadingContainer>
          ) : (
            <>
              <StatsGrid>
                <StatCard $delay="0s">
                  <StatContent>
                    <StatInfo>
                      <StatLabel>Total</StatLabel>
                      <StatValue>{notifications.length}</StatValue>
                    </StatInfo>
                    <StatIcon $bgColor="#dbeafe" $iconColor="#3b82f6">
                      <Bell />
                    </StatIcon>
                  </StatContent>
                </StatCard>

                <StatCard $delay="0.1s">
                  <StatContent>
                    <StatInfo>
                      <StatLabel>Unread</StatLabel>
                      <StatValue $color="#f59e0b">{unreadCountVal}</StatValue>
                    </StatInfo>
                    <StatIcon $bgColor="#fef3c7" $iconColor="#f59e0b">
                      <AlertCircle />
                    </StatIcon>
                  </StatContent>
                </StatCard>

                <StatCard $delay="0.2s">
                  <StatContent>
                    <StatInfo>
                      <StatLabel>Today</StatLabel>
                      <StatValue $color="#10b981">{todayCount}</StatValue>
                    </StatInfo>
                    <StatIcon $bgColor="#d1fae5" $iconColor="#10b981">
                      <Calendar />
                    </StatIcon>
                  </StatContent>
                </StatCard>

                <StatCard $delay="0.3s">
                  <StatContent>
                    <StatInfo>
                      <StatLabel>This Week</StatLabel>
                      <StatValue $color="#8b5cf6">{weekCount}</StatValue>
                    </StatInfo>
                    <StatIcon $bgColor="#ede9fe" $iconColor="#8b5cf6">
                      <FileText />
                    </StatIcon>
                  </StatContent>
                </StatCard>
              </StatsGrid>

              <FiltersContainer>
                <FilterSelect
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread</option>
                  <option value="success">Success</option>
                  <option value="error">Errors</option>
                  <option value="warning">Warnings</option>
                  <option value="info">Info</option>
                </FilterSelect>

                <FilterCount>
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                </FilterCount>
              </FiltersContainer>

              <NotificationsList>
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      $isRead={notification.is_read}
                      $displayType={notification.display_type || 'info'}
                      $priority={notification.priority}
                      onClick={() => {
                        // Mark as read when clicked
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }

                        // Navigate to action URL if available
                        if (notification.action_url) {
                          // Handle both relative and absolute URLs
                          const url = notification.action_url.startsWith('/')
                            ? notification.action_url
                            : `/${notification.action_url}`;
                          router.push(url);
                        }
                      }}
                    >
                      <NotificationContent>
                        <NotificationIcon $displayType={notification.display_type || 'info'}>
                          {getNotificationIcon(notification.display_type, notification.type, notification.title, notification.message)}
                        </NotificationIcon>
                        <NotificationDetails>
                          <NotificationHeader>
                            <NotificationTitle $isRead={notification.is_read}>
                              {notification.title}
                            </NotificationTitle>
                            {!notification.is_read && <NewBadge>New</NewBadge>}
                            {getPriorityBadge(notification.priority) && (
                              <PriorityBadge $color={getPriorityBadge(notification.priority)!.color}>
                                {getPriorityBadge(notification.priority)!.text}
                              </PriorityBadge>
                            )}
                          </NotificationHeader>
                          <NotificationMessage>{notification.message}</NotificationMessage>
                          <NotificationMeta>
                            <NotificationTime>{formatDate(notification.created_at)}</NotificationTime>
                            {/* Show user info for admins/finance admins viewing other users' notifications */}
                            {user && notification.user_id !== Number(user.id) && (notification.user_name || notification.user_id) && (
                              <span style={{
                                fontSize: theme.typography.fontSizes.sm,
                                color: TEXT_COLOR_MUTED,
                                fontStyle: 'italic'
                              }}>
                                {notification.user_name || `User #${notification.user_id}`}
                              </span>
                            )}
                            {notification.action_url && (
                              <ViewDetailsLink
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Mark as read when viewing details
                                  if (!notification.is_read) {
                                    markAsRead(notification.id);
                                  }
                                  // Handle both relative and absolute URLs
                                  const url = notification.action_url!.startsWith('/')
                                    ? notification.action_url!
                                    : `/${notification.action_url!}`;
                                  router.push(url);
                                }}
                              >
                                View Details
                              </ViewDetailsLink>
                            )}
                          </NotificationMeta>
                        </NotificationDetails>
                        <NotificationActions>
                          {!notification.is_read && (
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              disabled={processingIds.has(notification.id)}
                              title="Mark as read"
                            >
                              <CheckSquare />
                            </IconButton>
                          )}
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            disabled={processingIds.has(notification.id)}
                            title="Delete notification"
                          >
                            <Trash2 />
                          </IconButton>
                        </NotificationActions>
                      </NotificationContent>
                    </NotificationCard>
                  ))
                ) : (
                  <EmptyState>
                    <div className="icon-container">
                      <Bell />
                    </div>
                    <h3>All caught up!</h3>
                    <p>
                      {filterType === 'unread'
                        ? 'You have no unread notifications at the moment.'
                        : 'No notifications found matching your search criteria.'
                      }
                    </p>
                  </EmptyState>
                )}
              </NotificationsList>
            </>
          )}
        </ContentContainer>
      </PageContainer>

      {/* Delete Confirmation Modal */}
      <ModalOverlay $isOpen={deleteModalOpen} onClick={closeDeleteModal}>
        <ModalContainer onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <h2>Delete Notification</h2>
            <button onClick={closeDeleteModal} title="Close" type="button">
              <XCircle />
            </button>
          </ModalHeader>
          <ModalBody>
            {notificationToDelete && (
              <>
                <NotificationDetailSection>
                  <h3>Notification Details</h3>
                  <DetailRow>
                    <strong>Title:</strong>
                    <span>{notificationToDelete.title}</span>
                  </DetailRow>
                  <DetailRow>
                    <strong>Message:</strong>
                    <span>{notificationToDelete.message}</span>
                  </DetailRow>
                  <DetailRow>
                    <strong>Type:</strong>
                    <span>{notificationToDelete.type}</span>
                  </DetailRow>
                  <DetailRow>
                    <strong>Priority:</strong>
                    <span style={{ textTransform: 'capitalize' }}>{notificationToDelete.priority}</span>
                  </DetailRow>
                  <DetailRow>
                    <strong>Created:</strong>
                    <span>{formatDate(notificationToDelete.created_at)}</span>
                  </DetailRow>
                  {notificationToDelete.action_url && (
                    <DetailRow>
                      <strong>Action URL:</strong>
                      <span>{notificationToDelete.action_url}</span>
                    </DetailRow>
                  )}
                </NotificationDetailSection>

                <PasswordInputContainer>
                  <label htmlFor="delete-password">
                    <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                    Enter your password to confirm deletion
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="delete-password"
                      type={showDeletePassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={deletePassword}
                      onChange={(e) => {
                        setDeletePassword(e.target.value);
                        setDeletePasswordError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && deletePassword.trim() && !verifyingPassword) {
                          handleDeleteWithPassword();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      title={showDeletePassword ? 'Hide password' : 'Show password'}
                    >
                      {showDeletePassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  {deletePasswordError && (
                    <div className="error-message">{deletePasswordError}</div>
                  )}
                </PasswordInputContainer>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <button
              className="cancel"
              onClick={closeDeleteModal}
              disabled={verifyingPassword}
            >
              Cancel
            </button>
            <button
              className="delete"
              onClick={handleDeleteWithPassword}
              disabled={!deletePassword.trim() || verifyingPassword || processingIds.has(notificationToDelete?.id || -1)}
            >
              {verifyingPassword ? 'Verifying...' : 'Delete Notification'}
            </button>
          </ModalFooter>
        </ModalContainer>
      </ModalOverlay>
    </Layout>
  );
}
