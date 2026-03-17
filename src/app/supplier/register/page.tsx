import { redirect } from 'next/navigation';

// /supplier/register has been consolidated into /seller/register
export default function SupplierRegisterRedirect() {
    redirect('/seller/register');
}
