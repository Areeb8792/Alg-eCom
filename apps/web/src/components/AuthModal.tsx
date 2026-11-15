import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { forgotCustomerPassword, resetCustomerPassword, verifyCustomerEmail } from '../services/api.js';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login, register, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER' | 'FORGOT' | 'RESET' | 'VERIFY'>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dispatchedTokenHint, setDispatchedTokenHint] = useState<string | null>(null);

  // Sync mode from context when modal opens
  React.useEffect(() => {
    setActiveTab(authModalMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setDispatchedTokenHint(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      await login(email, password);
      closeAuthModal();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await register({
        email,
        password,
        full_name: fullName,
        phone: phone || undefined
      });
      if (res.verificationToken) {
        setDispatchedTokenHint(res.verificationToken);
      }
      closeAuthModal();
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Check format or email duplicate.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await forgotCustomerPassword(email);
      setSuccessMessage(res.message);
      if (res.resetToken) {
        setDispatchedTokenHint(res.resetToken);
        setTokenInput(res.resetToken);
        setActiveTab('RESET');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await resetCustomerPassword(tokenInput, newPassword);
      setSuccessMessage(res.message);
      setActiveTab('LOGIN');
      setPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Password reset failed. Invalid or expired token.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await verifyCustomerEmail(tokenInput);
      setSuccessMessage(res.message);
      await refreshProfile();
      setTimeout(() => closeAuthModal(), 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Email verification failed. Invalid or used token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#E3E2DE] border-2 border-[#1B0E0D] shadow-[10px_10px_0px_#1B0E0D] p-6 lg:p-8 text-[#1B0E0D]">
        {/* Editorial Top Bar */}
        <div className="flex justify-between items-start border-b-2 border-[#1B0E0D] pb-4 mb-6">
          <div>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C72A09] font-bold block">
              SEASON 04 // PROTOCOL AUTH
            </span>
            <h2 className="font-clash text-2xl lg:text-3xl font-black uppercase tracking-tight">
              {activeTab === 'LOGIN' && 'CUSTOMER ACCESS'}
              {activeTab === 'REGISTER' && 'CREATE DOSSIER'}
              {activeTab === 'FORGOT' && 'RECOVER KEY'}
              {activeTab === 'RESET' && 'RESET CIPHER'}
              {activeTab === 'VERIFY' && 'VERIFY IDENTITY'}
            </h2>
          </div>
          <button
            onClick={closeAuthModal}
            className="w-8 h-8 flex items-center justify-center border border-[#1B0E0D] font-mono font-bold hover:bg-[#C72A09] hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 mb-6 font-mono text-xs font-bold uppercase">
          <button
            type="button"
            onClick={() => {
              setActiveTab('LOGIN');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-3 border border-[#1B0E0D] transition-all text-center ${
              activeTab === 'LOGIN' ? 'bg-[#1B0E0D] text-[#E3E2DE]' : 'hover:bg-[#1B0E0D]/10'
            }`}
          >
            [01] SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('REGISTER');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-3 border border-[#1B0E0D] transition-all text-center ${
              activeTab === 'REGISTER' ? 'bg-[#1B0E0D] text-[#E3E2DE]' : 'hover:bg-[#1B0E0D]/10'
            }`}
          >
            [02] REGISTER
          </button>
        </div>

        {/* Error / Feedback Banners */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-[#C72A09] text-[#C72A09] font-mono text-xs">
            <span className="font-bold">SECURITY ALERT:</span> {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border-l-4 border-[#31EF07] text-[#1B0E0D] font-mono text-xs">
            <span className="font-bold text-green-700">STATUS:</span> {successMessage}
          </div>
        )}
        {dispatchedTokenHint && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 font-mono text-[11px] text-amber-900 break-all">
            <span className="font-bold uppercase block text-amber-800 mb-1">
              [DEV SIMULATION] Email Dispatched Token:
            </span>
            <code className="bg-amber-100 px-1 py-0.5">{dispatchedTokenHint}</code>
          </div>
        )}

        {/* 1. Login Form */}
        {activeTab === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] tracking-wider uppercase font-bold text-[#1B0E0D] mb-1">
                COMMUNICATION ID (EMAIL) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="architect@domain.com"
                className="w-full bg-white border border-[#1B0E0D] p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C72A09]"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-mono text-[11px] tracking-wider uppercase font-bold text-[#1B0E0D]">
                  CIPHER (PASSWORD) *
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('FORGOT')}
                  className="font-mono text-[10px] uppercase text-[#C72A09] hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white border border-[#1B0E0D] p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C72A09]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B0E0D] text-[#E3E2DE] p-3 font-clash font-bold uppercase tracking-wider text-sm hover:bg-[#C72A09] transition-colors shadow-[4px_4px_0px_#C72A09] disabled:opacity-60 mt-2"
            >
              {loading ? 'AUTHENTICATING...' : 'ACCESS DOSSIER →'}
            </button>
          </form>
        )}

        {/* 2. Registration Form */}
        {activeTab === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block font-mono text-[11px] tracking-wider uppercase font-bold text-[#1B0E0D] mb-1">
                FULL NAME *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Helmut Lang"
                className="w-full bg-white border border-[#1B0E0D] p-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C72A09]"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] tracking-wider uppercase font-bold text-[#1B0E0D] mb-1">
                EMAIL ADDRESS *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="helmut@brutalist.com"
                className="w-full bg-white border border-[#1B0E0D] p-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C72A09]"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] tracking-wider uppercase font-bold text-[#1B0E0D] mb-1">
                CONTACT PHONE (OPTIONAL)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full bg-white border border-[#1B0E0D] p-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C72A09]"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] tracking-wider uppercase font-bold text-[#1B0E0D] mb-1">
                PASSWORD (MIN 8 CHARS, 1 NUMBER, 1 LETTER) *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white border border-[#1B0E0D] p-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C72A09]"
              />
            </div>

            <p className="font-mono text-[10px] text-gray-600">
              * By registering, you consent to encrypted telemetry and editorial dispatch notifications.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B0E0D] text-[#E3E2DE] p-3 font-clash font-bold uppercase tracking-wider text-sm hover:bg-[#31EF07] hover:text-[#1B0E0D] transition-colors shadow-[4px_4px_0px_#1B0E0D] disabled:opacity-60 mt-1"
            >
              {loading ? 'INITIALIZING...' : 'ESTABLISH DOSSIER & PERSONALIZE →'}
            </button>
          </form>
        )}

        {/* 3. Forgot Password Form */}
        {activeTab === 'FORGOT' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="font-general text-xs text-gray-700 leading-relaxed">
              Enter your registered communication identifier. A cryptographic recovery token will be dispatched.
            </p>
            <div>
              <label className="block font-mono text-[11px] tracking-wider uppercase font-bold text-[#1B0E0D] mb-1">
                EMAIL IDENTIFIER *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@algions.com"
                className="w-full bg-white border border-[#1B0E0D] p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C72A09]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B0E0D] text-[#E3E2DE] p-3 font-clash font-bold uppercase tracking-wider text-sm hover:bg-[#C72A09] transition-colors shadow-[4px_4px_0px_#C72A09] disabled:opacity-60"
            >
              {loading ? 'DISPATCHING...' : 'DISPATCH RECOVERY CIPHER →'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('LOGIN')}
              className="w-full text-center font-mono text-xs uppercase text-gray-700 hover:text-[#1B0E0D] pt-2"
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* 4. Reset Password Form */}
        {activeTab === 'RESET' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] tracking-wider uppercase font-bold text-[#1B0E0D] mb-1">
                RECOVERY TOKEN *
              </label>
              <input
                type="text"
                required
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste token here"
                className="w-full bg-white border border-[#1B0E0D] p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#C72A09]"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] tracking-wider uppercase font-bold text-[#1B0E0D] mb-1">
                NEW CIPHER (PASSWORD) *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white border border-[#1B0E0D] p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C72A09]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B0E0D] text-[#E3E2DE] p-3 font-clash font-bold uppercase tracking-wider text-sm hover:bg-[#31EF07] hover:text-[#1B0E0D] transition-colors shadow-[4px_4px_0px_#1B0E0D] disabled:opacity-60"
            >
              {loading ? 'RESETTING...' : 'COMMIT NEW CIPHER →'}
            </button>
          </form>
        )}

        {/* 5. Email Verification Form */}
        {activeTab === 'VERIFY' && (
          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <p className="font-general text-xs text-gray-700 leading-relaxed">
              Verify your communication address to unlock full privileges, verified purchase badges, and expedited logistics.
            </p>
            <div>
              <label className="block font-mono text-[11px] tracking-wider uppercase font-bold text-[#1B0E0D] mb-1">
                VERIFICATION TOKEN *
              </label>
              <input
                type="text"
                required
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter 64-char token"
                className="w-full bg-white border border-[#1B0E0D] p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#31EF07]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B0E0D] text-[#E3E2DE] p-3 font-clash font-bold uppercase tracking-wider text-sm hover:bg-[#31EF07] hover:text-[#1B0E0D] transition-colors shadow-[4px_4px_0px_#31EF07] disabled:opacity-60"
            >
              {loading ? 'VERIFYING...' : 'CONFIRM EMAIL IDENTITY →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
