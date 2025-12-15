// Редирект обрабатывается в AdminLayoutWrapper для избежания проблем с Server Component redirect внутри Client Component
// Эта страница никогда не рендерится, так как редирект происходит на уровне layout
export default function AdminPage() {
  return null;
}

