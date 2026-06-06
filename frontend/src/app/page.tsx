import { redirect } from 'next/navigation';

// Root page — always redirect to dashboard
// Middleware handles unauthenticated users and sends them to /login
export default function RootPage() {
  redirect('/dashboard');
}
