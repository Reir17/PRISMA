import { redirect } from 'next/navigation';

export default function Home() {
  // Begitu user buka link utama, otomatis dilempar ke /login
  redirect('/login');
}