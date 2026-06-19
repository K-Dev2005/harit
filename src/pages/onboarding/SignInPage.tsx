import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBrandGoogleFilled, IconPhone, IconMail } from '@tabler/icons-react';

export default function SignInPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleAuthSuccess = async () => {
    setLoading(true);
    try {
      // Mock auth delay
      await new Promise(r => setTimeout(r, 1500));
      
      const mockUid = 'user_001';
      
      const answersStr = localStorage.getItem('harit_quiz_answers');
      if (answersStr) {
        const answers = JSON.parse(answersStr);
        // Fire and forget POST to backend
        fetch('http://localhost:3001/api/users/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: mockUid, quizAnswers: answers })
        }).catch(err => console.error('Failed to post onboarding data', err));
        
        localStorage.removeItem('harit_quiz_answers');
      }

      navigate('/connect-app');
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    handleAuthSuccess();
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      setOtpSent(true);
    } else {
      handleAuthSuccess();
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAuthSuccess();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background p-lg max-w-[400px] mx-auto justify-center">
      <div className="text-center mb-xxl">
        <h1 className="text-display-lg-mobile font-semibold text-primary mb-xs">Welcome to Harit</h1>
        <p className="text-body-md text-on-surface-variant">Save your progress and track your footprint.</p>
      </div>

      <div className="flex flex-col gap-md">
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-sm bg-primary text-white font-semibold py-md px-lg rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
             <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <>
              <IconBrandGoogleFilled size={20} />
              Continue with Google
            </>
          )}
        </button>

        {!showPhone && !showEmail && (
          <button
            onClick={() => setShowPhone(true)}
            disabled={loading}
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
                <button 
                  type="submit"
                  className="w-full bg-primary text-white font-semibold py-md px-lg rounded-md hover:bg-primary/90 mt-xs"
                >
                  Send OTP
                </button>
              </>
            ) : (
              <>
                <label className="text-label-sm text-on-surface-variant">Enter OTP</label>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-surface border border-outline-variant rounded-md py-sm px-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-center tracking-widest"
                  required
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center bg-primary text-white font-semibold py-md px-lg rounded-md hover:bg-primary/90 mt-xs disabled:opacity-50"
                >
                  {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Verify and Continue'}
                </button>
              </>
            )}
          </form>
        )}

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
            <button 
              type="submit"
              disabled={loading}
              className="w-full flex justify-center bg-primary text-white font-semibold py-md px-lg rounded-md hover:bg-primary/90 mt-xs disabled:opacity-50"
            >
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
