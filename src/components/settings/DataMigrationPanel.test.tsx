/**
 * DataMigrationPanel Component Tests
 * Tests the data migration functionality between localStorage and Supabase
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataMigrationPanel } from './DataMigrationPanel';

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'migration.title': 'Migrazione Dati',
        'migration.subtitle': 'Gestisci sincronizzazione tra localStorage e Supabase',
        'migration.notConfigured': 'Supabase Non Configurato',
        'migration.notConfiguredDesc': 'Configura le variabili di ambiente per abilitare la migrazione',
        'migration.localStorage': 'Local Storage',
        'migration.customers': 'Clienti',
        'migration.opportunities': 'Opportunità',
        'migration.controls': 'Controlli',
        'migration.hasData': 'Dati presenti',
        'migration.success': 'Migrazione completata',
        'migration.error': 'Errore durante la migrazione',
        'migration.migrateToSupabase': 'Migra a Supabase',
        'migration.exportToLocal': 'Esporta in Locale',
        'migration.hint': 'I dati locali vengono preservati durante la migrazione',
        'migration.confirmTitle': 'Conferma Operazione',
        'migration.confirmOverwrite': 'Vuoi sovrascrivere i dati esistenti in Supabase?',
        'migration.confirmExport': 'Vuoi esportare i dati in localStorage?',
        'migration.cancel': 'Annulla',
        'migration.confirm': 'Conferma',
        'migration.migratedCounts': `Migrati ${params?.customers || 0} clienti, ${params?.opportunities || 0} opportunità, ${params?.controls || 0} controlli`,
      };
      return translations[key] || key;
    },
  }),
}));

// Mock migration service
const mockCanMigrate = vi.fn();
const mockGetMigrationStatus = vi.fn();
const mockMigrateToSupabase = vi.fn();
const mockExportToLocalStorage = vi.fn();

vi.mock('../../services/migrationService', () => ({
  canMigrate: () => mockCanMigrate(),
  getMigrationStatus: () => mockGetMigrationStatus(),
  migrateToSupabase: (opts: unknown) => mockMigrateToSupabase(opts),
  exportToLocalStorage: () => mockExportToLocalStorage(),
}));

const createMockStatus = (overrides = {}) => ({
  hasLocalData: false,
  hasSupabaseData: false,
  localCounts: {
    customers: 0,
    opportunities: 0,
    controls: 0,
  },
  supabaseCounts: {
    customers: 0,
    opportunities: 0,
    controls: 0,
  },
  ...overrides,
});

describe('DataMigrationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanMigrate.mockReturnValue(true);
    mockGetMigrationStatus.mockResolvedValue(createMockStatus());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('When Supabase is not configured', () => {
    it('should show not configured message', async () => {
      mockCanMigrate.mockReturnValue(false);

      render(<DataMigrationPanel />);

      expect(screen.getByText('Supabase Non Configurato')).toBeInTheDocument();
      expect(screen.getByText(/Configura le variabili di ambiente/)).toBeInTheDocument();
    });

    it('should show environment variable names', async () => {
      mockCanMigrate.mockReturnValue(false);

      render(<DataMigrationPanel />);

      expect(screen.getByText('VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')).toBeInTheDocument();
    });
  });

  describe('When Supabase is configured', () => {
    it('should render the migration panel title', async () => {
      render(<DataMigrationPanel />);

      await waitFor(() => {
        expect(screen.getByText('Migrazione Dati')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      mockGetMigrationStatus.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<DataMigrationPanel />);

      // Loading spinner should be visible
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should display status after loading', async () => {
      mockGetMigrationStatus.mockResolvedValue(createMockStatus({
        localCounts: { customers: 5, opportunities: 10, controls: 20 },
        hasLocalData: true,
      }));

      render(<DataMigrationPanel />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('20')).toBeInTheDocument();
      });
    });

    it('should show "has data" indicator when local data exists', async () => {
      mockGetMigrationStatus.mockResolvedValue(createMockStatus({
        hasLocalData: true,
        localCounts: { customers: 1, opportunities: 1, controls: 1 },
      }));

      render(<DataMigrationPanel />);

      await waitFor(() => {
        expect(screen.getByText('Dati presenti')).toBeInTheDocument();
      });
    });
  });

  describe('Migration Actions', () => {
    it('should enable migrate button when local data exists', async () => {
      mockGetMigrationStatus.mockResolvedValue(createMockStatus({
        hasLocalData: true,
        localCounts: { customers: 1, opportunities: 0, controls: 0 },
      }));

      render(<DataMigrationPanel />);

      await waitFor(() => {
        const migrateButton = screen.getByText('Migra a Supabase').closest('button');
        expect(migrateButton).not.toBeDisabled();
      });
    });

    it('should disable migrate button when no local data', async () => {
      mockGetMigrationStatus.mockResolvedValue(createMockStatus({
        hasLocalData: false,
      }));

      render(<DataMigrationPanel />);

      await waitFor(() => {
        const migrateButton = screen.getByText('Migra a Supabase').closest('button');
        expect(migrateButton).toBeDisabled();
      });
    });

    it('should enable export button when Supabase data exists', async () => {
      mockGetMigrationStatus.mockResolvedValue(createMockStatus({
        hasSupabaseData: true,
        supabaseCounts: { customers: 1, opportunities: 0, controls: 0 },
      }));

      render(<DataMigrationPanel />);

      await waitFor(() => {
        const exportButton = screen.getByText('Esporta in Locale').closest('button');
        expect(exportButton).not.toBeDisabled();
      });
    });

    it('should disable export button when no Supabase data', async () => {
      mockGetMigrationStatus.mockResolvedValue(createMockStatus({
        hasSupabaseData: false,
      }));

      render(<DataMigrationPanel />);

      await waitFor(() => {
        const exportButton = screen.getByText('Esporta in Locale').closest('button');
        expect(exportButton).toBeDisabled();
      });
    });
  });

  describe('Migration to Supabase', () => {
    it('should call migrateToSupabase when button clicked (no existing data)', async () => {
      mockGetMigrationStatus.mockResolvedValue(createMockStatus({
        hasLocalData: true,
        hasSupabaseData: false,
      }));
      mockMigrateToSupabase.mockResolvedValue({
        success: true,
        customersCount: 1,
        opportunitiesCount: 2,
        controlsCount: 3,
        errors: [],
        warnings: [],
      });

      render(<DataMigrationPanel />);

      // Wait for loading to complete
      await waitFor(() => {
        const button = screen.getByText('Migra a Supabase').closest('button');
        expect(button).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Migra a Supabase'));

      await waitFor(() => {
        expect(mockMigrateToSupabase).toHaveBeenCalledWith({
          clearLocalAfter: false,
          overwriteExisting: false,
        });
      });
    });

    it('should show confirmation modal when Supabase has existing data', async () => {
      mockGetMigrationStatus.mockResolvedValue(createMockStatus({
        hasLocalData: true,
        hasSupabaseData: true,
      }));

      render(<DataMigrationPanel />);

      // Wait for loading to complete
      await waitFor(() => {
        const button = screen.getByText('Migra a Supabase').closest('button');
        expect(button).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Migra a Supabase'));

      await waitFor(() => {
        expect(screen.getByText('Conferma Operazione')).toBeInTheDocument();
      });
    });
  });

  describe('Export to Local', () => {
    it('should call exportToLocalStorage when button clicked (no local data)', async () => {
      mockGetMigrationStatus.mockResolvedValue(createMockStatus({
        hasLocalData: false,
        hasSupabaseData: true,
      }));
      mockExportToLocalStorage.mockResolvedValue({ success: true });

      render(<DataMigrationPanel />);

      // Wait for loading to complete
      await waitFor(() => {
        const button = screen.getByText('Esporta in Locale').closest('button');
        expect(button).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Esporta in Locale'));

      await waitFor(() => {
        expect(mockExportToLocalStorage).toHaveBeenCalled();
      });
    });

    it('should show confirmation when local data exists', async () => {
      mockGetMigrationStatus.mockResolvedValue(createMockStatus({
        hasLocalData: true,
        hasSupabaseData: true,
      }));

      render(<DataMigrationPanel />);

      // Wait for loading to complete
      await waitFor(() => {
        const button = screen.getByText('Esporta in Locale').closest('button');
        expect(button).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Esporta in Locale'));

      await waitFor(() => {
        expect(screen.getByText('Conferma Operazione')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Status', () => {
    it('should refresh status when refresh button clicked', async () => {
      mockGetMigrationStatus.mockResolvedValue(createMockStatus());

      render(<DataMigrationPanel />);

      await waitFor(() => {
        expect(mockGetMigrationStatus).toHaveBeenCalledTimes(1);
      });

      // Find and click refresh button
      const refreshButtons = screen.getAllByRole('button');
      const refreshButton = refreshButtons.find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-refresh-cw')
      );

      if (refreshButton) {
        fireEvent.click(refreshButton);

        await waitFor(() => {
          expect(mockGetMigrationStatus).toHaveBeenCalledTimes(2);
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle getMigrationStatus error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetMigrationStatus.mockRejectedValue(new Error('Network error'));

      render(<DataMigrationPanel />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error loading migration status:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
