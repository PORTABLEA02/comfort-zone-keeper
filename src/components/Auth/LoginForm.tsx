import React, { useState } from 'react';
import { Heart, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="bg-gradient-primary p-4 rounded-2xl w-20 h-20 mx-auto mb-6 shadow-glow animate-pulse-slow">
            <Heart className="h-12 w-12 text-white" />
          </div>
          <p className="text-muted-foreground text-lg">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Email ou mot de passe incorrect');
      }
    } catch {
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4 lg:p-8">
      <div className="max-w-md w-full animate-scale-in">
        <div className="card-elevated rounded-2xl p-8 border border-border">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-down">
            <div className="bg-gradient-primary p-4 rounded-2xl w-20 h-20 mx-auto mb-6 shadow-glow hover-lift">
              <Heart className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gradient-primary mb-2">Finagnon</h1>
            <p className="text-muted-foreground">Système de Gestion Médicale</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-error-light border border-error/20 rounded-xl flex items-start space-x-3 text-error animate-slide-down">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-background border-2 border-border rounded-xl 
                           focus:border-primary focus:ring-4 focus:ring-primary/10 
                           transition-all duration-200 outline-none
                           hover:border-primary/50"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Mot de passe
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-background border-2 border-border rounded-xl 
                           focus:border-primary focus:ring-4 focus:ring-primary/10 
                           transition-all duration-200 outline-none
                           hover:border-primary/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 
                           text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-gradient py-3.5 rounded-xl font-semibold text-base
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transform transition-all duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Besoin d'aide ? Contactez l'administrateur système.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
