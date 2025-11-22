// app/finance/page.tsx
import { FinanceList } from '@/components/finance/FinanceList';
import { CreateFinanceForm } from '@/components/finance/CreateFinanceForm';
import { ComponentGate, ComponentId } from '@/lib/rbac';

export default function FinancePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Finance Management</h1>

      <ComponentGate componentId={ComponentId.FINANCE_MANAGER_CREATE}>
        <div className="mb-10 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Create Financial Record</h2>
          <CreateFinanceForm />
        </div>
      </ComponentGate>

      <ComponentGate componentId={ComponentId.FINANCE_MANAGER_LIST}>
        <FinanceList />
      </ComponentGate>
    </div>
  );
}