import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const columns: ColumnDef<any>[] = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `$${row.original.amount}` },
  { accessorKey: 'type', header: 'Type' },
  {
    id: 'actions',
    cell: () => (
      <div className="flex gap-2">
        <Button size="sm" variant="outline">Edit</Button>
        <Button size="sm" variant="destructive">Delete</Button>
      </div>
    ),
  },
];

export function FinanceList() {
  const data = []; // Replace with API fetch

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">All Financial Records</h2>
      <DataTable columns={columns} data={data} />
    </div>
  );
}