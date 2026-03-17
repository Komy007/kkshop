import { redirect } from 'next/navigation';

// /supplier/dashboard has been consolidated into /seller
export default function SupplierDashboardRedirect() {
    redirect('/seller');
}
