import { useState, useEffect } from 'react';
import { supabase } from './supabase';

interface BackendHealth {
  status: string;
  database: string;
}

export default function App() {
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data: BackendHealth) => {
        setBackendHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to connect to backend:', err);
        setBackendHealth({ status: 'offline', database: 'unknown' });
        setLoading(false);
      });
  }, []);

  return (
    <div className="card">
      <h1>The Legendary Lock-In</h1>
      <p>Full-stack template initialized with FastAPI, React + TypeScript, and Supabase.</p>

      <div style={{ marginTop: '2rem', textAlign: 'left' }}>
        <h3>Service Status:</h3>
        <ul>
          <li>
            <strong>Frontend:</strong> <span className="status-badge badge-connected">Running</span>
          </li>
          <li>
            <strong>Backend (FastAPI):</strong>{' '}
            <span
              className={`status-badge ${
                backendHealth?.status === 'ok' ? 'badge-connected' : 'badge-pending'
              }`}
            >
              {loading ? 'Checking...' : backendHealth?.status}
            </span>
          </li>
          <li>
            <strong>Supabase DB Client:</strong>{' '}
            <span
              className={`status-badge ${supabase ? 'badge-connected' : 'badge-pending'}`}
            >
              {supabase ? 'Configured' : 'Awaiting credentials'}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
