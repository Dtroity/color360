export function resolveImageUrl(url: string | undefined | null): string {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // #region agent log
  const originalUrl = url;
  // #endregion
  
  if (!url) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'resolveImageUrl.ts:6',
        message: 'Empty URL, returning placeholder',
        data: { originalUrl, result: '/placeholder-product.svg' },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B'
      })
    }).catch(() => {});
    // #endregion
    return '/placeholder-product.svg';
  }

  // Если уже полный URL - возвращаем как есть
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'resolveImageUrl.ts:16',
        message: 'Full URL detected',
        data: { originalUrl, result: url },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B'
      })
    }).catch(() => {});
    // #endregion
    return url;
  }

  // Если путь начинается с /uploads/ или /image/catalog/ - добавляем API_BASE_URL
  if (url.startsWith('/uploads/') || url.startsWith('/image/catalog/')) {
    const result = `${API_BASE_URL}${url}`;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'resolveImageUrl.ts:25',
        message: 'Resolved with API_BASE_URL',
        data: { originalUrl, result, apiBaseUrl: API_BASE_URL },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B'
      })
    }).catch(() => {});
    // #endregion
    return result;
  }

  // Если путь содержит image/catalog - нормализуем
  if (url.includes('image/catalog')) {
    let cleanPath = url.replace(/^(\.\.\/)+/, '');
    const catalogIndex = cleanPath.indexOf('image/catalog/');
    if (catalogIndex !== -1) {
      const pathAfterCatalog = cleanPath.substring(catalogIndex + 'image/catalog/'.length);
      const result = `${API_BASE_URL}/image/catalog/${pathAfterCatalog}`;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'resolveImageUrl.ts:35',
          message: 'Resolved image/catalog path',
          data: { originalUrl, result },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B'
        })
      }).catch(() => {});
      // #endregion
      return result;
    } else if (cleanPath.startsWith('image/catalog/')) {
      const pathAfterCatalog = cleanPath.substring('image/catalog/'.length);
      const result = `${API_BASE_URL}/image/catalog/${pathAfterCatalog}`;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'resolveImageUrl.ts:45',
          message: 'Resolved image/catalog path (starts with)',
          data: { originalUrl, result },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B'
        })
      }).catch(() => {});
      // #endregion
      return result;
    }
  }

  // Если путь относительный без префикса - пробуем как /uploads/
  if (!url.startsWith('/')) {
    const result = `${API_BASE_URL}/uploads/${url}`;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'resolveImageUrl.ts:60',
        message: 'Resolved relative path',
        data: { originalUrl, result },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B'
      })
    }).catch(() => {});
    // #endregion
    return result;
  }

  // Fallback: добавляем API_BASE_URL
  const result = `${API_BASE_URL}${url}`;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'resolveImageUrl.ts:75',
      message: 'Fallback resolution',
      data: { originalUrl, result },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'B'
    })
  }).catch(() => {});
  // #endregion
  return result;
}