import type { UserSettings } from '../../types';

interface LocationSelectorProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}

const AUSTRALIAN_STATES = [
  { value: 'nsw', label: 'New South Wales' },
  { value: 'vic', label: 'Victoria' },
  { value: 'qld', label: 'Queensland' },
  { value: 'wa', label: 'Western Australia' },
  { value: 'sa', label: 'South Australia' },
  { value: 'tas', label: 'Tasmania' },
  { value: 'nt', label: 'Northern Territory' },
  { value: 'act', label: 'Australian Capital Territory' },
] as const;

export default function LocationSelector({ settings, onSettingsChange }: LocationSelectorProps) {

  const handleLocationChange = (location: 'australia' | 'bangalore') => {
    const newSettings: UserSettings = {
      ...settings,
      location,
      // Reset state if switching to Bangalore
      state: location === 'australia' ? (settings.state || 'nsw') : undefined,
    };
    onSettingsChange(newSettings);
  };

  const handleStateChange = (state: string) => {
    const newSettings: UserSettings = {
      ...settings,
      state,
    };
    onSettingsChange(newSettings);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📍</span>
        <h3 className="text-xl font-bold text-anz-blue dark:text-anz-light-blue">Location Settings</h3>
      </div>
      
      <div className="space-y-6">
        {/* Location Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Location
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleLocationChange('australia')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                settings.location === 'australia'
                  ? 'border-anz-blue bg-anz-blue/10 dark:bg-anz-blue/20 text-anz-blue dark:text-anz-light-blue font-semibold'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">🇦🇺</span>
                <span>Australia</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleLocationChange('bangalore')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                settings.location === 'bangalore'
                  ? 'border-anz-blue bg-anz-blue/10 dark:bg-anz-blue/20 text-anz-blue dark:text-anz-light-blue font-semibold'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">🇮🇳</span>
                <span>Bangalore</span>
              </div>
            </button>
          </div>
        </div>

        {/* State Selection (only for Australia) */}
        {settings.location === 'australia' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              State/Territory
            </label>
            <select
              value={settings.state || 'nsw'}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-anz-blue focus:border-anz-blue outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium transition-colors hover:border-gray-400 dark:hover:border-gray-500"
            >
              {AUSTRALIAN_STATES.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">ℹ️</span>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Public holidays will be automatically marked based on your location and state selection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

