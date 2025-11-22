import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const columns: ColumnDef<any>[] = [
  { accessorKey: 'full_name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'phone', header: 'Phone' },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Link href={`/accountant/edit/${row.original.id}`}>
          <Button size="sm">Edit</Button>
        </Link>
        <Button size="sm" variant="destructive">Delete</Button>
      </div>
    ),
  },
];

export function AccountantList() {
  const data = []; // Replace with API fetch

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">All Accountants</h2>
      <DataTable columns={columns} data={data} />
    </div>
  );
}