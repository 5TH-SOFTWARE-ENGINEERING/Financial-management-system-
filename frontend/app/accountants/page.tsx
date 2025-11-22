import { CreateAccountantForm } from '@/components/accountant/CreateAccountantForm';
import { AccountantList } from '@/components/accountant/AccountantList';
import { ComponentGate, ComponentId } from '@/lib/rbac';

export default function AccountantsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Accountants Management</h1>

      <ComponentGate componentId={ComponentId.ACCOUNTANT_CREATE}>
        <div className="mb-10 bg-white p-6 rounded-lg shadow">
          <CreateAccountantForm />
        </div>
      </ComponentGate>

      <ComponentGate componentId={ComponentId.ACCOUNTANT_LIST}>
        <AccountantList />
      </ComponentGate>
    </div>
  );
}