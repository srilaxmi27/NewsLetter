import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />,
  error:   <XCircle    size={16} className="text-red-500    flex-shrink-0" />,
  warning: <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />,
  info:    <Info       size={16} className="text-blue-500   flex-shrink-0" />,
};

const BG = {
  success: 'border-emerald-200 bg-emerald-50',
  error:   'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info:    'border-blue-200 bg-blue-50',
};

const TEXT = {
  success: 'text-emerald-800',
  error:   'text-red-800',
  warning: 'text-amber-800',
  info:    'text-blue-800',
};

let _addToast = null;

// Imperative helper — usable outside React components (e.g. in api.js)
export const toast = {
  success: (msg) => _addToast?.('success', msg),
  error:   (msg) => _addToast?.('error',   msg),
  warning: (msg) => _addToast?.('warning', msg),
  info:    (msg) => _addToast?.('info',    msg),
};

const ToastItem = ({ id, type, message, onRemove }) => {
  useEffect(() => {
    const t = setTimeout(() => onRemove(id), 4000);
    return () => clearTimeout(t);
  }, [id, onRemove]);

  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-card-md
                     text-sm max-w-sm w-full animate-[slideIn_0.2s_ease-out]
                     ${BG[type]} ${TEXT[type]}`}>
      {ICONS[type]}
      <p className="flex-1 leading-snug font-medium">{message}</p>
      <button onClick={() => onRemove(id)} className="opacity-50 hover:opacity-100 transition-opacity flex-shrink-0 -mt-0.5">
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p.slice(-4), { id, type, message }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  // Register global imperative helper
  useEffect(() => { _addToast = addToast; return () => { _addToast = null; }; }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
