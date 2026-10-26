import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';

// Shared app data: catalog (models/styles), the signed-in user, and a
// "feed version" counter that tells grids to refresh after a mutation.
const AppData = createContext(null);

export function AppDataProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [me, setMe] = useState(null);
  const [feedVersion, setFeedVersion] = useState(0);
  const [error, setError] = useState(null);

  const refreshMe = useCallback(() => api.me().then(setMe).catch(() => {}), []);
  const bumpFeed = useCallback(() => setFeedVersion((v) => v + 1), []);

  useEffect(() => {
    Promise.all([api.config(), api.me()])
      .then(([c, m]) => { setConfig(c); setMe(m); })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <AppData.Provider value={{ config, me, setMe, refreshMe, feedVersion, bumpFeed, error }}>
      {children}
    </AppData.Provider>
  );
}

export const useAppData = () => useContext(AppData);
