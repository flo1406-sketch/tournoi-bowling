import { useState, useEffect } from 'react';

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem('app_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 👇 C'EST ICI QUE TU METS TON MOT DE PASSE 👇
    const correctPassword = 'Bergamote2026!'; 

    if (password === correctPassword) {
      sessionStorage.setItem('app_auth', 'true');
      setIsAuthenticated(true);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-bowling-dark flex items-center justify-center p-4">
      <div className="panel w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-white mb-2">Accès Restreint</h1>
          <p className="text-slate-400 text-sm">Veuillez entrer le mot de passe organisateur.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="Mot de passe"
              className={`input-field w-full text-center text-lg tracking-widest ${error ? 'border-red-500 animate-shake' : ''}`}
              autoFocus
            />
            {error && <p className="text-red-400 text-xs text-center mt-2">Mot de passe incorrect.</p>}
          </div>
          <button type="submit" className="btn btn-primary w-full py-3">
            Entrer
          </button>
        </form>
      </div>
    </div>
  );
};