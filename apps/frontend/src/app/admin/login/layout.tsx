// Отдельный layout для страницы логина - не применяет защиту из родительского layout
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  
  // Если пользователь уже авторизован - редирект на dashboard
  if (token) {
    redirect('/admin/dashboard');
  }
  
  // Если не авторизован - показываем форму логина
  return <>{children}</>;
}

