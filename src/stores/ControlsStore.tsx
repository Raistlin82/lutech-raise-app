/**
 * Controls Store
 *
 * Re-exports from SettingsStore with more accurate naming.
 * This store manages controls/checkpoints configuration, not general settings.
 *
 * New code should import from this file:
 * import { ControlsProvider, useControls } from './stores/ControlsStore';
 *
 * Legacy imports from SettingsStore still work for backward compatibility.
 */
/* eslint-disable react-refresh/only-export-components */
export {
  ControlsProvider,
  useControls,
  type ControlsContextType,
  // Legacy names for backward compatibility
  SettingsProvider,
  useSettings,
  type SettingsContextType,
} from './SettingsStore';
