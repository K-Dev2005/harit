import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBrandUber } from '@tabler/icons-react';

export default function ConnectAppPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    // Mock connection delay
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSuccess(true);
    // Auto navigate after success indicator
    setTimeout(() => {
      navigate('/dashboard');
    }, 800);
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background p-lg max-w-[500px] mx-auto justify-center">
      <div className="text-center mb-xl">
        <h1 className="text-display-lg-mobile font-semibold text-primary mb-xs">Auto-track your travel.</h1>
        <p className="text-body-lg text-on-surface-variant">Connect Uber to log rides without typing anything.</p>
      </div>

      <div className="bg-surface border border-outline-variant rounded-lg p-lg mb-lg">
        <div className="flex items-center gap-md mb-md">
          <div className="w-12 h-12 bg-on-surface text-surface flex items-center justify-center rounded-md">
            <IconBrandUber size={32} />
          </div>
          <div>
            <h2 className="text-headline-md text-on-surface">Uber</h2>
            <p className="text-label-sm text-primary uppercase tracking-wider">Ride History</p>
          </div>
        </div>
        
        <p className="text-body-md text-on-surface-variant mb-xl">
          Read-only access to your ride history. We never see payment details or your account password.
        </p>

        <button
          onClick={handleConnect}
          disabled={loading || success}
          className={`
            w-full flex justify-center items-center font-semibold py-md px-lg rounded-md transition-all
            ${success 
              ? 'bg-secondary text-white' 
              : 'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'}
          `}
        >
          {loading ? (
             <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : success ? (
            'Connected!'
          ) : (
            'Connect Uber'
          )}
        </button>
      </div>

      <div className="text-center">
        <button 
          onClick={handleSkip}
          className="text-label-sm font-medium text-on-surface-variant hover:text-primary transition-colors underline"
        >
          Skip for now — I'll add entries manually
        </button>
      </div>
    </div>
  );
}
