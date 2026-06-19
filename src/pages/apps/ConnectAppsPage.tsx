import React, { useState } from 'react';
import { Plug, CheckCircle, RefreshCw } from 'lucide-react';

const APPS = [
  { id: 'uber', name: 'Uber', icon: 'bg-black text-white font-extrabold flex items-center justify-center rounded text-[18px]', iconChar: 'U' },
  { id: 'rapido', name: 'Rapido', icon: 'bg-[#ffd300] text-black font-extrabold flex items-center justify-center rounded text-[18px]', iconChar: 'R' },
  { id: 'swiggy', name: 'Swiggy', icon: 'bg-[#fc8019] text-white font-extrabold flex items-center justify-center rounded text-[18px]', iconChar: 'S' },
  { id: 'zomato', name: 'Zomato', icon: 'bg-[#cb202d] text-white font-extrabold flex items-center justify-center rounded text-[18px]', iconChar: 'Z' }
];

export const ConnectAppsPage: React.FC = () => {
  const [connectedApps, setConnectedApps] = useState<Record<string, boolean>>({});
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [syncPreview, setSyncPreview] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleConnect = (appId: string) => {
    setIsConnecting(appId);
    setTimeout(() => {
      setIsConnecting(null);
      setConnectedApps(prev => ({ ...prev, [appId]: true }));
      showToast(`Connected to ${appId.charAt(0).toUpperCase() + appId.slice(1)} successfully!`);
    }, 1500);
  };

  const handleSync = (appId: string) => {
    setSyncPreview(appId);
  };

  const confirmSync = () => {
    showToast("Imported 3 entries successfully to your carbon ledger.");
    setSyncPreview(null);
    // Dispatch event to update dashboard if open in another tab
    window.dispatchEvent(new Event('entry-saved'));
  };

  return (
    <div className="flex-grow flex flex-col min-w-0 bg-background pb-[80px] md:pb-0 md:pl-64 animate-in fade-in">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-lg py-md border-b bg-surface-container-lowest border-surface-variant max-w-container-max mx-auto">
        <div>
          <h1 className="text-headline-md font-semibold text-primary font-sans">Connect Apps</h1>
          <p className="text-[11px] text-on-surface-variant uppercase tracking-wider">Auto-Sync Activity History</p>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow p-md md:p-xl max-w-[800px] w-full mx-auto space-y-lg relative">
        {toastMsg && (
          <div className="absolute top-md left-1/2 -translate-x-1/2 bg-primary text-on-primary px-lg py-sm rounded-lg shadow-lg text-body-md font-medium z-50 animate-in fade-in slide-in-from-top-4 flex items-center gap-xs">
            <CheckCircle size={16} />
            {toastMsg}
          </div>
        )}

        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col gap-md">
          <div>
            <h2 className="text-body-lg font-semibold text-primary mb-xs">Linked Integrations</h2>
            <p className="text-body-md text-on-surface-variant">
              Connect your daily apps to automatically log carbon footprints. We sync ride distances and food delivery orders securely in the background.
            </p>
          </div>

          <div className="h-px bg-outline-variant"></div>

          {syncPreview ? (
            <div className="flex flex-col gap-md py-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-body-lg font-semibold text-primary">Found 3 new trips from {syncPreview.charAt(0).toUpperCase() + syncPreview.slice(1)}</h3>
                <span className="text-xs text-on-surface-variant bg-surface-container px-sm py-xs rounded-full font-mono">Sync Preview</span>
              </div>
              
              <div className="space-y-sm">
                <div className="bg-surface border border-outline-variant rounded p-sm flex items-center justify-between">
                  <div>
                    <div className="text-body-md font-medium text-on-surface">Yesterday, 9:30 AM</div>
                    <div className="text-label-sm text-on-surface-variant">12.4 km • 2.6 kg CO₂e</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
                </div>
                <div className="bg-surface border border-outline-variant rounded p-sm flex items-center justify-between">
                  <div>
                    <div className="text-body-md font-medium text-on-surface">Tuesday, 6:15 PM</div>
                    <div className="text-label-sm text-on-surface-variant">8.1 km • 1.7 kg CO₂e</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
                </div>
                <div className="bg-surface border border-outline-variant rounded p-sm flex items-center justify-between">
                  <div>
                    <div className="text-body-md font-medium text-on-surface">Monday, 10:00 AM</div>
                    <div className="text-label-sm text-on-surface-variant">4.2 km • 0.9 kg CO₂e</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
                </div>
              </div>

              <div className="flex gap-sm mt-md">
                <button
                  onClick={() => setSyncPreview(null)}
                  className="flex-1 border border-outline text-on-surface py-sm rounded font-medium text-xs hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSync}
                  className="flex-1 bg-primary text-on-primary py-sm rounded font-medium text-xs hover:bg-primary-container transition-colors flex items-center justify-center gap-xs"
                >
                  <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
                  Import 3 entries
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-sm">
              {APPS.map(app => {
                const connected = connectedApps[app.id];
                const connecting = isConnecting === app.id;
                return (
                  <div key={app.id} className="flex items-center justify-between p-sm border border-outline-variant rounded-lg bg-surface hover:bg-surface-container-lowest transition-colors">
                    <div className="flex items-center gap-md">
                      <div className={`w-10 h-10 ${app.icon}`}>
                        {app.iconChar}
                      </div>
                      <div>
                        <div className="text-body-md font-semibold text-primary flex items-center gap-2">
                          {app.name}
                          {connected ? (
                            <span className="bg-secondary-container text-on-secondary-container text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                              Connected
                            </span>
                          ) : (
                            <span className="bg-surface-container-high text-on-surface-variant text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                              Disconnected
                            </span>
                          )}
                        </div>
                        <div className="text-label-sm text-on-surface-variant mt-0.5">
                          {app.id === 'uber' || app.id === 'rapido' ? 'Auto-sync ride distances' : 'Auto-sync order deliveries'}
                        </div>
                      </div>
                    </div>

                    {connected ? (
                      <button
                        onClick={() => handleSync(app.id)}
                        className="text-secondary font-bold text-xs hover:underline flex items-center gap-xs px-sm py-xs rounded hover:bg-surface-container"
                      >
                        <RefreshCw size={12} />
                        Sync now
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(app.id)}
                        disabled={connecting}
                        className="bg-surface-container-high text-on-surface px-md py-xs rounded font-semibold text-xs hover:bg-outline-variant disabled:opacity-50 transition-colors"
                      >
                        {connecting ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-xs text-on-surface-variant text-center px-lg mt-md flex items-center justify-center gap-xs">
            <Plug size={12} />
            Read-only access only. We never store credentials or payment information.
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConnectAppsPage;
