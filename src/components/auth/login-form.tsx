'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Mail, Lock, User, ArrowRight, Eye, EyeOff, Shield, Users, Copy, Check } from 'lucide-react';

interface AuthFormProps {
  onSuccess: (role: string) => void;
  initialRegister?: boolean;
}

// Identifiants de deploiement
const DEPLOY_CREDENTIALS = [
  {
    role: 'superadmin',
    label: 'Super Admin',
    email: 'admin@qrdomotik.com',
    password: 'QrDomotik2024!',
    color: 'red',
    icon: Shield,
  },
  {
    role: 'user',
    label: 'Client Demo',
    email: 'demo@qrdomotik.com',
    password: 'demo123',
    color: 'blue',
    icon: Users,
  },
];

export function AuthForm({ onSuccess, initialRegister }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(!initialRegister);
  const [email, setEmail] = useState('admin@qrdomotik.com');
  const [password, setPassword] = useState('QrDomotik2024!');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fillCredentials = (cred: typeof DEPLOY_CREDENTIALS[0]) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setIsLogin(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Erreur lors de l\'inscription');
          setLoading(false);
          return;
        }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email ou mot de passe incorrect');
      } else if (result?.ok) {
        const role = email === 'admin@qrdomotik.com' ? 'superadmin' : 'user';
        onSuccess(role);
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (cred: typeof DEPLOY_CREDENTIALS[0]) => {
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email: cred.email,
      password: cred.password,
      redirect: false,
    });

    if (result?.ok) {
      onSuccess(cred.role);
    } else {
      setError('Connexion echouee. Verifiez que le serveur est bien initialise.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1e]">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto max-w-md flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]">
            <QrCode className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white">QR Domotik</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          {/* En-tete */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">
              {isLogin ? 'Connexion' : 'Creer un compte'}
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {isLogin ? 'Accedez a votre espace QR Domotik' : 'Rejoignez les 2 500+ foyers connectes'}
            </p>
          </div>

          {/* Cartes identifiants de deploiement */}
          <div className="grid grid-cols-2 gap-3">
            {DEPLOY_CREDENTIALS.map((cred) => {
              const Icon = cred.icon;
              const isRed = cred.color === 'red';
              return (
                <motion.button
                  key={cred.email}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fillCredentials(cred)}
                  className={`relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
                    isRed
                      ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
                      : 'border-[#2563EB]/30 bg-[#2563EB]/5 hover:bg-[#2563EB]/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${isRed ? 'text-red-400' : 'text-blue-400'}`} />
                    <span className={`text-xs font-semibold ${isRed ? 'text-red-400' : 'text-blue-400'}`}>
                      {cred.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 font-mono truncate">{cred.email}</p>
                  <p className="text-[11px] text-gray-500 font-mono truncate mt-0.5">{cred.password}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(cred.email, cred.email);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-md hover:bg-white/10 transition-colors"
                    title="Copier l\'email"
                  >
                    {copiedField === cred.email ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-500" />
                    )}
                  </button>
                </motion.button>
              );
            })}
          </div>

          {/* Formulaire */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="text-sm font-medium text-gray-300">Nom complet</label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2563EB] transition-colors"
                        placeholder="Jean Dupont"
                        required={!isLogin}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="text-sm font-medium text-gray-300">Email</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2563EB] transition-colors"
                    placeholder="vous@exemple.com"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(email, 'form-email')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    title="Copier"
                  >
                    {copiedField === 'form-email' ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">Mot de passe</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2563EB] transition-colors"
                    placeholder={isLogin ? 'Mot de passe' : '6 caracteres minimum'}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#2563EB]/90 text-white font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Se connecter' : "S'inscrire"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-400">
              {isLogin ? 'Pas encore de compte ?' : 'Deja un compte ?'}{' '}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-[#2563EB] hover:underline font-medium"
              >
                {isLogin ? "S'inscrire" : 'Se connecter'}
              </button>
            </p>
          </div>

          {/* Boutons connexion rapide */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center"><span className="bg-[#0a0f1e] px-3 text-xs text-gray-500">Connexion rapide</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleQuickLogin(DEPLOY_CREDENTIALS[0])}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-sm font-medium disabled:opacity-50"
              >
                <Shield className="h-4 w-4" />
                Super Admin
              </button>
              <button
                onClick={() => handleQuickLogin(DEPLOY_CREDENTIALS[1])}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-[#2563EB]/30 text-blue-400 hover:bg-[#2563EB]/10 hover:text-blue-300 transition-all text-sm font-medium disabled:opacity-50"
              >
                <Users className="h-4 w-4" />
                Client Demo
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-white/10 px-4 py-3 mt-auto">
        <p className="text-center text-xs text-gray-500">QR Domotik v1.0.0</p>
      </footer>
    </div>
  );
}
