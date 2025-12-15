'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState, useMemo, useRef } from 'react';

interface AdminLayoutWrapperProps {
  children: ReactNode;
  isAuthenticated: boolean;
  adminLayout: ReactNode;
}

export function AdminLayoutWrapper({
  children,
  isAuthenticated,
  adminLayout,
}: AdminLayoutWrapperProps) {
  // ВСЕ хуки вызываются ВСЕГДА в одном порядке - ДО любых условных возвратов
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  // Защита от повторных редиректов (для React Strict Mode)
  const hasRedirectedRef = useRef<string | null>(null);
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'AdminLayoutWrapper.tsx:19',
      message: 'Hooks called',
      data: { pathname, isAuthenticated, isChecking },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'C'
    })
  }).catch(() => {});
  // #endregion
  
  // Мемоизируем проверку страницы логина и главной страницы админки
  const isLoginPage = useMemo(() => {
    const result = pathname === '/admin/login';
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'AdminLayoutWrapper.tsx:28',
        message: 'useMemo isLoginPage',
        data: { pathname, result },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C'
      })
    }).catch(() => {});
    // #endregion
    return result;
  }, [pathname]);
  
  // Проверяем, нужно ли редиректить с /admin на /admin/dashboard
  const isAdminRoot = useMemo(() => {
    const result = pathname === '/admin';
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'AdminLayoutWrapper.tsx:60',
        message: 'useMemo isAdminRoot',
        data: { pathname, result },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C'
      })
    }).catch(() => {});
    // #endregion
    return result;
  }, [pathname]);

  // useEffect вызывается ВСЕГДА, независимо от условий
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'AdminLayoutWrapper.tsx:44',
        message: 'useEffect entry',
        data: { isLoginPage, isAdminRoot, isAuthenticated, isChecking, pathname },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C'
      })
    }).catch(() => {});
    // #endregion
    
    // Если на странице логина - просто показываем её без layout
    if (isLoginPage) {
      setIsChecking(false);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'AdminLayoutWrapper.tsx:52',
          message: 'Login page branch',
          data: { isLoginPage },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C'
        })
      }).catch(() => {});
      // #endregion
      return;
    }

    // Если на главной странице админки (/admin) - редирект на /admin/dashboard или /admin/login
    if (isAdminRoot) {
      // Защита от повторных редиректов (для React Strict Mode)
      const redirectKey = `/admin->${isAuthenticated ? 'dashboard' : 'login'}`;
      if (hasRedirectedRef.current === redirectKey) {
        // Уже выполнен редирект для этого состояния - пропускаем
        setIsChecking(false);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'AdminLayoutWrapper.tsx:65',
            message: 'Admin root, redirect already performed (skipping)',
            data: { isAdminRoot, isAuthenticated, redirectKey },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'C'
          })
        }).catch(() => {});
        // #endregion
        return;
      }
      
      // Если не авторизован - сразу редирект на логин (избегаем двойного редиректа)
      if (!isAuthenticated) {
        hasRedirectedRef.current = redirectKey;
        router.replace('/admin/login');
        setIsChecking(false);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'AdminLayoutWrapper.tsx:78',
            message: 'Admin root, redirecting to login (not authenticated)',
            data: { isAdminRoot, isAuthenticated },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'C'
          })
        }).catch(() => {});
        // #endregion
        return;
      }
      // Если авторизован - редирект на dashboard
      hasRedirectedRef.current = redirectKey;
      router.replace('/admin/dashboard');
      setIsChecking(false);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'AdminLayoutWrapper.tsx:95',
          message: 'Admin root, redirecting to dashboard (authenticated)',
          data: { isAdminRoot, isAuthenticated },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C'
        })
      }).catch(() => {});
      // #endregion
      return;
    }
    
    // Сбрасываем флаг редиректа, если мы не на /admin
    if (hasRedirectedRef.current && !isAdminRoot) {
      hasRedirectedRef.current = null;
    }

    // Если не авторизован и не на странице логина - редирект на логин
    if (!isAuthenticated) {
      // Защита от повторных редиректов
      const redirectKey = `not-auth->login:${pathname}`;
      if (hasRedirectedRef.current === redirectKey) {
        setIsChecking(false);
        return;
      }
      hasRedirectedRef.current = redirectKey;
      router.push('/admin/login');
      setIsChecking(false);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'AdminLayoutWrapper.tsx:108',
          message: 'Not authenticated, redirecting to login',
          data: { isAuthenticated, pathname },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C'
        })
      }).catch(() => {});
      // #endregion
      return;
    }

    // Если авторизован - показываем страницу с layout
    setIsChecking(false);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'AdminLayoutWrapper.tsx:104',
        message: 'Authenticated, showing layout',
        data: { isAuthenticated, pathname },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C'
      })
    }).catch(() => {});
    // #endregion
  }, [isAuthenticated, isLoginPage, isAdminRoot, pathname]); // Добавляем pathname для отслеживания изменений пути

  // Если идёт проверка - показываем загрузку
  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  // Если страница логина - показываем children без layout
  if (isLoginPage) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'AdminLayoutWrapper.tsx:95',
        message: 'Render: login page, children only',
        data: { isLoginPage, isAuthenticated },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C'
      })
    }).catch(() => {});
    // #endregion
    return <>{children}</>;
  }

  // Если не авторизован - показываем children (редирект произойдет через useEffect)
  if (!isAuthenticated) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'AdminLayoutWrapper.tsx:108',
        message: 'Render: not authenticated, children only',
        data: { isAuthenticated },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C'
      })
    }).catch(() => {});
    // #endregion
    return <>{children}</>;
  }

  // Если авторизован и не на странице логина - показываем layout
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'AdminLayoutWrapper.tsx:121',
      message: 'Render: authenticated, adminLayout',
      data: { isAuthenticated, isLoginPage },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'C'
    })
  }).catch(() => {});
  // #endregion
  return <>{adminLayout}</>;
}

