import React, { useEffect } from 'react';

export type CatalogView = 'grid' | 'list';

interface ViewToggleProps {
  view: CatalogView;
  onChange: (view: CatalogView) => void;
}

const STORAGE_KEY = 'catalog_view_mode';

const ViewToggle: React.FC<ViewToggleProps> = ({ view, onChange }) => {
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, view);
    } catch {}
  }, [view]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as CatalogView | null;
      if (saved && (saved === 'grid' || saved === 'list') && saved !== view) {
        onChange(saved);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setGrid = () => onChange('grid');
  const setList = () => onChange('list');

  const baseBtn: React.CSSProperties = {
    width: 36,
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    border: '1px solid #d9d9d9',
    background: '#fff',
    cursor: 'pointer',
  };

  const activeBtn: React.CSSProperties = {
    ...baseBtn,
    borderColor: '#1677ff',
    color: '#1677ff',
    background: '#e6f4ff',
  };

  return (
    <div className="view-toggle" style={{ display: 'flex', gap: 8 }}>
      <button
        type="button"
        aria-label="Сетка"
        title="Сетка"
        onClick={setGrid}
        style={view === 'grid' ? activeBtn : baseBtn}
      >
        {/* Grid icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <rect x="2" y="2" width="5" height="5" rx="1" />
          <rect x="9" y="2" width="5" height="5" rx="1" />
          <rect x="2" y="9" width="5" height="5" rx="1" />
          <rect x="9" y="9" width="5" height="5" rx="1" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Список"
        title="Список"
        onClick={setList}
        style={view === 'list' ? activeBtn : baseBtn}
      >
        {/* List icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <rect x="2" y="3" width="12" height="2" rx="1" />
          <rect x="2" y="7" width="12" height="2" rx="1" />
          <rect x="2" y="11" width="12" height="2" rx="1" />
        </svg>
      </button>
    </div>
  );
};

export default ViewToggle;
