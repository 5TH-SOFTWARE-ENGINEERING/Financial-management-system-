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
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.lg};
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
                <Header>
                    <Title>Document Intelligence</Title>
                    <p className="text-gray-500">AI-powered OCR for receipts, invoices, and financial documents with SKU extraction.</p>
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
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            {analyzing ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
                        </div>
                        <div>
                            <p className="font-bold text-lg">{analyzing ? 'Analyzing Document...' : 'Click or drag receipt/invoice here'}</p>
                            <p className="text-gray-400 text-sm">PNG, JPG, or PDF up to 10MB</p>
                        </div>
                    </div>
                </DropZone>

                {result && (
                    <ResultGrid>
                        <Card>
                            <CardTitle><Receipt size={20} /> Document Summary</CardTitle>
                            <div className="space-y-4">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Merchant</span>
                                    <span className="font-semibold">{result.merchant_name || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Date</span>
                                    <span className="font-semibold">{result.date || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Total Amount</span>
                                    <span className="font-bold text-lg text-blue-600">
                                        {result.currency} {result.total_amount?.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Category (AI Suggested)</span>
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">
                                        {result.category}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <CardTitle><Brain size={20} /> AI Confidence</CardTitle>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2">
                                    <div
                                        className="bg-green-500 h-2.5 rounded-full"
                                        style={{ width: `${(result.confidence || 0.95) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Confidence level: {Math.round((result.confidence || 0.95) * 100)}%</p>
                            </div>
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
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-gray-400">No line items detected</td>
                                        </tr>
                                    )}
                                </tbody>
                            </LineItemsTable>

                            <div className="mt-6 flex gap-4">
                                <Button className="flex-1">
                                    <CheckCircle size={16} className="mr-2" /> Confirm & Post
                                </Button>
                                <Button variant="outline" className="flex-1">
                                    <Download size={16} className="mr-2" /> Export
                                </Button>
                            </div>
                        </Card>
                    </ResultGrid>
                )}
            </PageContainer>
        </Layout>
    );
}
