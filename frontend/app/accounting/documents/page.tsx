'use client';

import { useState } from 'react';
import styled from 'styled-components';
import {
    FileText, Upload, Brain, CheckCircle, AlertCircle,
    Loader2, Download, Receipt, ShoppingCart, Tag, Calculator
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-bottom: ${props => props.theme.spacing.xxl};
  background-color: ${props => props.theme.colors.background};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${props => props.theme.spacing.sm};
`;

const Header = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${props => props.theme.colors.textDark};
  margin-bottom: ${props => props.theme.spacing.sm};
  background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Description = styled.p`
  color: ${props => props.theme.colors.textSecondary};
`;

const DropZone = styled.div<{ $isDragging: boolean }>`
  border: 2px dashed ${props => props.$isDragging ? '#3b82f6' : props.theme.colors.border};
  border-radius: 20px;
  padding: 60px;
  text-align: center;
  background: ${props => props.$isDragging ? 'rgba(59, 130, 246, 0.05)' : props.theme.colors.background};
  transition: all 0.3s ease;
  cursor: pointer;
  margin-bottom: ${props => props.theme.spacing.xl};

  &:hover {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.02);
  }
`;

const UploadContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  background-color: #eff6ff;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
`;

const UploadPrompt = styled.p`
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  font-size: ${props => props.theme.typography.fontSizes.lg};
`;

const UploadHint = styled.p`
  color: #9ca3af;
  font-size: ${props => props.theme.typography.fontSizes.sm};
`;

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.xl};
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: 16px;
  border: 1px solid ${props => props.theme.colors.border};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const CardTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.textDark};
`;

const SummaryContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${props => props.theme.spacing.md};
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  padding-bottom: ${props => props.theme.spacing.sm};
`;

const SummaryLabel = styled.span`
  color: ${props => props.theme.colors.textSecondary};
`;

const SummaryValue = styled.span`
  font-weight: ${props => props.theme.typography.fontWeights.bold};
`;

const TotalAmountValue = styled.span`
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  font-size: ${props => props.theme.typography.fontSizes.lg};
  color: #2563eb;
`;

const CategoryBadge = styled.span`
  background-color: #dbeafe;
  color: #1d4ed8;
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  text-transform: uppercase;
`;

const ConfidenceSection = styled.div`
  margin-top: ${props => props.theme.spacing.xl};
`;

const ConfidenceBarTrack = styled.div`
  width: 100%;
  background-color: #f3f4f6;
  border-radius: 9999px;
  height: 10px;
  margin-top: ${props => props.theme.spacing.sm};
`;

const ConfidenceBarFill = styled.div<{ $width: number }>`
  background-color: #22c55e;
  height: 100%;
  border-radius: 9999px;
  width: ${props => props.$width}%;
`;

const ConfidenceText = styled.p`
  font-size: ${props => props.theme.typography.fontSizes.xs};
  color: #9ca3af;
  margin-top: ${props => props.theme.spacing.sm};
`;

const LineItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${props => props.theme.spacing.md};
  
  th {
    text-align: left;
    font-size: 0.75rem;
    text-transform: uppercase;
    color: ${props => props.theme.colors.textSecondary};
    padding: 8px;
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }
  
  td {
    padding: 12px 8px;
    font-size: 0.875rem;
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }
`;

const SKU = styled.span`
  background: #f1f5f9;
  color: #475569;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.75rem;
`;

const NoItemsRow = styled.tr`
   td {
       text-align: center;
       padding-top: ${props => props.theme.spacing.xl};
       padding-bottom: ${props => props.theme.spacing.xl};
       color: #9ca3af;
   }
`;

const ButtonGroup = styled.div`
  margin-top: 24px;
  display: flex;
  gap: ${props => props.theme.spacing.md};
`;

const StyledButton = styled(Button)`
  flex: 1;
`;

const StyledExportButton = styled(Button)`
  flex: 1;
`;

export default function DocumentIntelligencePage() {
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = async (selectedFile: File) => {
        setFile(selectedFile);
        setAnalyzing(true);
        setResult(null);

        try {
            const response = await apiClient.analyzeDocument(selectedFile);
            if (response.data) {
                setResult(response.data);
                toast.success('Document analyzed successfully!');
            }
        } catch (error) {
            console.error('Analysis failed:', error);
            toast.error('Failed to analyze document');
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <Layout>
            <PageContainer>
              <ContentContainer>
                <Header>
                    <Title>Document Intelligence</Title>
                    <Description>AI-powered OCR for receipts, invoices, and financial documents with SKU extraction.</Description>
                </Header>

                <DropZone
                    $isDragging={isDragging}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
                    }}
                    onClick={() => document.getElementById('fileInput')?.click()}
                >
                    <input
                        type="file"
                        id="fileInput"
                        hidden
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                    />
                    <UploadContent>
                        <IconWrapper>
                            {analyzing ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
                        </IconWrapper>
                        <div>
                            <UploadPrompt>{analyzing ? 'Analyzing Document...' : 'Click or drag receipt/invoice here'}</UploadPrompt>
                            <UploadHint>PNG, JPG, or PDF up to 10MB</UploadHint>
                        </div>
                    </UploadContent>
                </DropZone>

                {result && (
                    <ResultGrid>
                        <Card>
                            <CardTitle><Receipt size={20} /> Document Summary</CardTitle>
                            <SummaryContent>
                                <SummaryRow>
                                    <SummaryLabel>Merchant</SummaryLabel>
                                    <SummaryValue>{result.merchant_name || 'Unknown'}</SummaryValue>
                                </SummaryRow>
                                <SummaryRow>
                                    <SummaryLabel>Date</SummaryLabel>
                                    <SummaryValue>{result.date || 'Unknown'}</SummaryValue>
                                </SummaryRow>
                                <SummaryRow>
                                    <SummaryLabel>Total Amount</SummaryLabel>
                                    <TotalAmountValue>
                                        {result.currency} {result.total_amount?.toFixed(2)}
                                    </TotalAmountValue>
                                </SummaryRow>
                                <SummaryRow>
                                    <SummaryLabel>Category (AI Suggested)</SummaryLabel>
                                    <CategoryBadge>
                                        {result.category}
                                    </CategoryBadge>
                                </SummaryRow>
                            </SummaryContent>

                            <ConfidenceSection>
                                <CardTitle><Brain size={20} /> AI Confidence</CardTitle>
                                <ConfidenceBarTrack>
                                    <ConfidenceBarFill
                                        $width={(result.confidence || 0.95) * 100}
                                    />
                                </ConfidenceBarTrack>
                                <ConfidenceText>Confidence level: {Math.round((result.confidence || 0.95) * 100)}%</ConfidenceText>
                            </ConfidenceSection>
                        </Card>

                        <Card>
                            <CardTitle><ShoppingCart size={20} /> Line Items & SKUs</CardTitle>
                            <LineItemsTable>
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th>SKU</th>
                                        <th>Qty</th>
                                        <th>Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.items?.map((item: any, idx: number) => (
                                        <tr key={idx}>
                                            <td>{item.description}</td>
                                            <td>{item.sku ? <SKU>{item.sku}</SKU> : <span className="text-gray-300">-</span>}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.unit_price?.toFixed(2)}</td>
                                            <td className="font-semibold">{item.total_amount?.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {(!result.items || result.items.length === 0) && (
                                        <NoItemsRow>
                                            <td colSpan={5}>No line items detected</td>
                                        </NoItemsRow>
                                    )}
                                </tbody>
                            </LineItemsTable>

                            <ButtonGroup>
                                <StyledButton>
                                    <CheckCircle size={16} className="mr-2" /> Confirm & Post
                                </StyledButton>
                                <StyledExportButton variant="outline">
                                    <Download size={16} className="mr-2" /> Export
                                </StyledExportButton>
                            </ButtonGroup>
                        </Card>
                    </ResultGrid>
                )}
              </ContentContainer>
            </PageContainer>
        </Layout>
    );
}
