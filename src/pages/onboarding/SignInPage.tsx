import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBrandGoogleFilled, IconPhone, IconMail } from '@tabler/icons-react';
import { saveAuthToken } from '../../lib/auth';

export default function SignInPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Handle OAuth callback — Google redirects back here with ?userId=...
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    const name = params.get('name') || 'User';
    const oauthError = params.get('error');

    if (oauthError) {
      setError(oauthError === 'no_credentials'
        ? 'Google OAuth not configured on server yet.'
        : 'Google sign-in failed. Please try again.');
      window.history.replaceState({}, '', '/signin');
      return;
    }

    if (userId) {
      saveAuthToken(userId, decodeURIComponent(name));
      // Clean the URL immediately
      window.history.replaceState({}, '', '/dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // ---------------------------------------------------------------------------
  // Google OAuth — redirects to backend which redirects to Google
  // ---------------------------------------------------------------------------
  const handleGoogleSignIn = () => {
    setOauthLoading(true);
    setError(null);
    // Hard navigate so the browser follows the OAuth redirect chain
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    window.location.href = `${apiBase}/auth/google`;
  };

  // ---------------------------------------------------------------------------
  // Mock auth for phone/email (until real auth is wired)
  // ---------------------------------------------------------------------------
  const handleMockAuthSuccess = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock onboarding logic: register diet/commute defaults for dev
      const res = await fetch('/api/users/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: 'user_001',
          commuteType: 'metro',
          dietType: 'omnivore'
        })
      });
      if (res.ok) {
        saveAuthToken('user_001', 'Dev User');
        navigate('/dashboard');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) { setOtpSent(true); }
    else { handleMockAuthSuccess(); }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleMockAuthSuccess();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background p-lg max-w-[400px] mx-auto justify-center">
      <div className="text-center mb-xxl">
        <h1 className="text-display-lg-mobile font-semibold text-primary mb-xs">Welcome to CtrlC</h1>
        <p className="text-body-md text-on-surface-variant">Save your progress and track your footprint.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-sm rounded border border-red-200 mb-md flex items-center gap-xs">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-md">
        {/* Google Sign-In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={oauthLoading || loading}
          className="w-full flex items-center justify-center gap-sm bg-primary text-white font-semibold py-md px-lg rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {oauthLoading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <IconBrandGoogleFilled size={20} />
              Continue with Google
            </>
          )}
        </button>

        {/* Phone */}
        {!showPhone && !showEmail && (
          <button
            onClick={() => setShowPhone(true)}
            disabled={oauthLoading || loading}
            className="w-full flex items-center justify-center gap-sm bg-transparent border border-outline-variant text-on-surface font-semibold py-md px-lg rounded-md hover:bg-surface-container-lowest transition-colors disabled:opacity-50"
          >
            <IconPhone size={20} className="text-on-surface-variant" />
            Continue with phone number
          </button>
        )}

        {showPhone && (
          <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-sm mt-sm">
            {!otpSent ? (
              <>
                <label className="text-label-sm text-on-surface-variant">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 99999 99999"
                  className="w-full bg-surface border border-outline-variant rounded-md py-sm px-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
                <button type="submit" className="w-full bg-primary text-white font-semibold py-md px-lg rounded-md hover:bg-primary/90 mt-xs">
                  Send OTP
                </button>
              </>
            ) : (
              <>
                <label className="text-label-sm text-on-surface-variant">Enter OTP sent to {phone}</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-surface border border-outline-variant rounded-md py-sm px-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-center tracking-widest"
                  required
                  autoFocus
                />
                <button type="submit" disabled={loading} className="w-full flex justify-center bg-primary text-white font-semibold py-md px-lg rounded-md hover:bg-primary/90 mt-xs disabled:opacity-50">
                  {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify and continue'}
                </button>
              </>
            )}
          </form>
        )}

        {/* Email */}
        {!showEmail && (
          <div className="text-center mt-md">
            <button
              onClick={() => { setShowEmail(true); setShowPhone(false); }}
              className="text-label-sm font-medium text-on-surface-variant hover:text-primary transition-colors underline"
            >
              Other sign-in options
            </button>
          </div>
        )}

        {showEmail && (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-sm mt-sm">
            <label className="text-label-sm text-on-surface-variant">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-surface border border-outline-variant rounded-md py-sm px-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              required
            />
            <label className="text-label-sm text-on-surface-variant mt-xs">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface border border-outline-variant rounded-md py-sm px-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              required
            />
            <button type="submit" disabled={loading} className="w-full flex justify-center bg-primary text-white font-semibold py-md px-lg rounded-md hover:bg-primary/90 mt-xs disabled:opacity-50">
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign in'}
            </button>
          </form>
        )}

        <p className="text-[11px] text-center text-on-surface-variant mt-sm px-lg leading-relaxed">
          By continuing you agree to CtrlC's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
