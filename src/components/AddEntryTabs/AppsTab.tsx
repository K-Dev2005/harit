import { useState } from 'react';

const APPS = [
  { id: 'uber', name: 'Uber', icon: 'bg-black' },
  { id: 'rapido', name: 'Rapido', icon: 'bg-yellow-400' },
  { id: 'swiggy', name: 'Swiggy', icon: 'bg-orange-500' },
  { id: 'zomato', name: 'Zomato', icon: 'bg-red-600' }
];

export const AppsTab = ({ onSaveSuccess }: { onSaveSuccess: (msg: string) => void }) => {
  const [connectedApps, setConnectedApps] = useState<Record<string, boolean>>({});
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [syncPreview, setSyncPreview] = useState<string | null>(null);

  const handleConnect = (appId: string) => {
    setIsConnecting(appId);
    setTimeout(() => {
      setIsConnecting(null);
      setConnectedApps(prev => ({ ...prev, [appId]: true }));
    }, 1500);
  };

  const handleSync = (appId: string) => {
    // Show mock preview of new entries
    setSyncPreview(appId);
  };

  const confirmSync = () => {
    onSaveSuccess("Imported 3 entries successfully.");
    setSyncPreview(null);
  };

  if (syncPreview) {
    return (
      <div className="flex flex-col gap-md pb-xxl">
        <div className="text-headline-md text-on-surface mb-xs">Found 3 new trips</div>
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

        <div className="flex gap-sm mt-md">
          <button
            onClick={() => setSyncPreview(null)}
            className="flex-1 border border-outline text-on-surface py-sm rounded font-medium"
          >
            Cancel
          </button>
          <button
            onClick={confirmSync}
            className="flex-1 bg-primary text-on-primary py-sm rounded font-medium hover:bg-primary-container"
          >
            Import 3 entries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg pb-xxl">
      <div className="flex flex-col gap-sm">
        {APPS.map(app => {
          const connected = connectedApps[app.id];
          const connecting = isConnecting === app.id;
          return (
            <div key={app.id} className="flex items-center justify-between p-sm border border-outline-variant rounded-lg bg-surface">
              <div className="flex items-center gap-md">
                <div className={`w-10 h-10 rounded ${app.icon} flex items-center justify-center text-white font-bold`}>
                  {app.name.charAt(0)}
                </div>
                <div>
                  <div className="text-body-md font-medium text-on-surface flex items-center gap-2">
                    {app.name}
                    {connected ? (
                      <span className="bg-secondary-container text-on-secondary-container text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                        Connected
                      </span>
                    ) : (
                      <span className="bg-surface-container-high text-on-surface-variant text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                        Not connected
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
                  className="text-primary font-medium text-body-md hover:bg-surface-container px-sm py-xs rounded"
                >
                  Sync now
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(app.id)}
                  disabled={connecting}
                  className="bg-surface-container-high text-on-surface px-md py-xs rounded font-medium text-body-md hover:bg-outline-variant disabled:opacity-50"
                >
                  {connecting ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-on-surface-variant text-center px-lg mt-md">
        Read-only access only. We never see your passwords or payment information.
      </div>
    </div>
  );
};
