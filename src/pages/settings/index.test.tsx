import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsPage } from './index';
import type { ControlConfig } from '../../types';

// Mock the Settings component
vi.mock('../../components/settings', () => ({
  Settings: () => <div data-testid="settings-component">Settings Component</div>,
}));

// Mock dependencies
const mockAddControl = vi.fn();
const mockUpdateControl = vi.fn();
const mockDeleteControl = vi.fn();
const mockResetDefaults = vi.fn();

vi.mock('../../stores/SettingsStore', () => ({
  useSettings: vi.fn(),
}));

// Import after mocking
import { useSettings } from '../../stores/SettingsStore';

const mockControls: ControlConfig[] = [
  {
    id: 'test-1',
    label: 'Test Control',
    description: 'Test Description',
    phase: 'Planning',
    isMandatory: true,
    actionType: 'task'
  }
];

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
      controls: mockControls,
      addControl: mockAddControl,
      updateControl: mockUpdateControl,
      deleteControl: mockDeleteControl,
      resetDefaults: mockResetDefaults,
    });
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<SettingsPage />);
      expect(screen.getByTestId('settings-component')).toBeInTheDocument();
    });

    it('should render Settings component', () => {
      render(<SettingsPage />);
      expect(screen.getByText('Settings Component')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should pass through to Settings component correctly', () => {
      const { container } = render(<SettingsPage />);
      expect(container.querySelector('[data-testid="settings-component"]')).toBeInTheDocument();
    });
  });
});
