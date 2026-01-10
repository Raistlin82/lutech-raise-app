/**
 * Toast Utility Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import { showToast } from './toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn().mockReturnValue('toast-id'),
    dismiss: vi.fn(),
    __esModule: true,
  },
}));

describe('showToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success', () => {
    it('should call toast.success with message', () => {
      showToast.success('Operation successful');

      expect(toast.success).toHaveBeenCalledWith(
        'Operation successful',
        expect.objectContaining({
          duration: 3000,
          position: 'top-right',
        })
      );
    });

    it('should use green background style', () => {
      showToast.success('Test');

      expect(toast.success).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({
          style: expect.objectContaining({
            background: '#10b981',
            color: '#fff',
          }),
        })
      );
    });
  });

  describe('error', () => {
    it('should call toast.error with message', () => {
      showToast.error('Something went wrong');

      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong',
        expect.objectContaining({
          duration: 4000,
          position: 'top-right',
        })
      );
    });

    it('should use red background style', () => {
      showToast.error('Test');

      expect(toast.error).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({
          style: expect.objectContaining({
            background: '#ef4444',
            color: '#fff',
          }),
        })
      );
    });
  });

  describe('info', () => {
    it('should have info function defined', () => {
      // Info toast uses base toast function
      expect(typeof showToast.info).toBe('function');
    });
  });

  describe('loading', () => {
    it('should call toast.loading and return toast ID', () => {
      const toastId = showToast.loading('Loading...');

      expect(toast.loading).toHaveBeenCalledWith(
        'Loading...',
        expect.objectContaining({
          position: 'top-right',
        })
      );
      expect(toastId).toBe('toast-id');
    });
  });

  describe('dismiss', () => {
    it('should call toast.dismiss with toast ID', () => {
      showToast.dismiss('my-toast-id');

      expect(toast.dismiss).toHaveBeenCalledWith('my-toast-id');
    });
  });
});
