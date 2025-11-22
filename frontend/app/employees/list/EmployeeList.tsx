import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const columns: ColumnDef<any>[] = [
  { accessorKey: 'full_name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'department', header: 'Department' },
  {
    id: 'actions',
    cell: () => (
      <div className="flex gap-2">
        <Button size="sm">Edit</Button>
        <Button size="sm" variant="destructive">Delete</Button>
      </div>
    ),
  },
];

export function EmployeeList() {
  const data = [];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">All Employees</h2>
      <DataTable columns={columns} data={data} />
    </div>
  );
}