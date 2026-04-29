'use client';

import { useOffline } from '../lib/useOffline';

export default function OfflineStatus() {
  const { isOnline, pendingSales } = useOffline();

  if (isOnline && pendingSales === 0) return null;

  return (
    <div className={`offline-status-indicator ${isOnline ? 'online-pending' : 'offline'}`}>
      <span className="status-icon">{isOnline ? '🔄' : '📡'}</span>
      <span className="status-text">
        {!isOnline ? 'Offline' : `${pendingSales} sales pending sync`}
      </span>
      <style jsx>{`
        .offline-status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          animation: fadeIn 0.3s ease;
        }
        .online-pending {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .offline {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        .status-icon {
          font-size: 1rem;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
