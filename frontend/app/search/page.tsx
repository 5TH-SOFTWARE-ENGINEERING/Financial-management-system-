'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, FileText, DollarSign, Users, Building, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useUserStore } from '@/store/userStore';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useUserStore();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query && isAuthenticated) {
      performSearch(query);
    }
  }, [query, isAuthenticated]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      // Search across multiple resources
      const [users, revenues, expenses, projects, departments] = await Promise.all([
        apiClient.getUsers().catch(() => ({ data: [] })),
        apiClient.getRevenues().catch(() => ({ data: [] })),
        apiClient.getExpenses().catch(() => ({ data: [] })),
        apiClient.getProjects().catch(() => ({ data: [] })),
        apiClient.getDepartments().catch(() => ({ data: [] })),
      ]);

      const allResults: any[] = [];
      const lowerQuery = searchQuery.toLowerCase();

      // Filter and add results
      (users.data || []).forEach((user: any) => {
        const name = user.full_name || user.name || user.email || '';
        if (name.toLowerCase().includes(lowerQuery) || user.email?.toLowerCase().includes(lowerQuery)) {
          allResults.push({ type: 'user', data: user, title: name, subtitle: user.email });
        }
      });

      (revenues.data || []).forEach((revenue: any) => {
        if (revenue.title?.toLowerCase().includes(lowerQuery) || revenue.description?.toLowerCase().includes(lowerQuery)) {
          allResults.push({ type: 'revenue', data: revenue, title: revenue.title, subtitle: `$${revenue.amount}` });
        }
      });

      (expenses.data || []).forEach((expense: any) => {
        if (expense.title?.toLowerCase().includes(lowerQuery) || expense.description?.toLowerCase().includes(lowerQuery)) {
          allResults.push({ type: 'expense', data: expense, title: expense.title, subtitle: `$${expense.amount}` });
        }
      });

      (projects.data || []).forEach((project: any) => {
        if (project.name?.toLowerCase().includes(lowerQuery) || project.description?.toLowerCase().includes(lowerQuery)) {
          allResults.push({ type: 'project', data: project, title: project.name, subtitle: project.department_name });
        }
      });

      (departments.data || []).forEach((dept: any) => {
        if (dept.name?.toLowerCase().includes(lowerQuery) || dept.description?.toLowerCase().includes(lowerQuery)) {
          allResults.push({ type: 'department', data: dept, title: dept.name, subtitle: dept.description });
        }
      });

      setResults(allResults);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="h-5 w-5" />;
      case 'revenue':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'expense':
        return <DollarSign className="h-5 w-5 text-red-600" />;
      case 'project':
        return <FolderKanban className="h-5 w-5" />;
      case 'department':
        return <Building className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getResultLink = (type: string, id: number) => {
    switch (type) {
      case 'user':
        return `/users/${id}`;
      case 'revenue':
        return `/revenue/edit/${id}`;
      case 'expense':
        return `/expenses/edit/${id}`;
      case 'project':
        return `/project/edit/${id}`;
      case 'department':
        return `/department/edit/${id}`;
      default:
        return '#';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to search</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Search Results</h1>
        <p className="text-muted-foreground">
          {query ? `Results for "${query}"` : 'Enter a search query'}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Searching...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
          <p className="text-muted-foreground">
            {query ? `No results found for "${query}"` : 'Enter a search query to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result, index) => (
            <Link
              key={`${result.type}-${result.data.id}-${index}`}
              href={getResultLink(result.type, result.data.id)}
            >
              <div className="bg-card rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {getResultIcon(result.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{result.title}</h3>
                    {result.subtitle && (
                      <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                    )}
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                    {result.type}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

