import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Toast() {
  const { toast, setToast } = useAuth();

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(id);
  }, [toast, setToast]);

  if (!toast) return null;
  return <div className="toast" role="status">{toast}</div>;
}
