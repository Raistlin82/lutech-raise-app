/**
 * ErrorSummary Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorSummary } from './ErrorSummary';

describe('ErrorSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should return null when no errors', () => {
      const { container } = render(<ErrorSummary errors={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render with single error', () => {
      render(
        <ErrorSummary
          errors={[{ field: 'email', message: 'Email is required' }]}
        />
      );

      expect(screen.getByText('Si è verificato un errore')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('should render with multiple errors', () => {
      render(
        <ErrorSummary
          errors={[
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password is required' },
            { field: 'name', message: 'Name is required' },
          ]}
        />
      );

      expect(screen.getByText('Si sono verificati 3 errori')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('should have alert role for accessibility', () => {
      render(
        <ErrorSummary
          errors={[{ field: 'test', message: 'Test error' }]}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have aria-live polite for screen readers', () => {
      render(
        <ErrorSummary
          errors={[{ field: 'test', message: 'Test error' }]}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Dismiss Button', () => {
    it('should not show dismiss button when onDismiss not provided', () => {
      render(
        <ErrorSummary
          errors={[{ field: 'test', message: 'Test error' }]}
        />
      );

      expect(screen.queryByLabelText('Chiudi riepilogo errori')).not.toBeInTheDocument();
    });

    it('should show dismiss button when onDismiss provided', () => {
      const onDismiss = vi.fn();
      render(
        <ErrorSummary
          errors={[{ field: 'test', message: 'Test error' }]}
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByLabelText('Chiudi riepilogo errori')).toBeInTheDocument();
    });

    it('should call onDismiss when dismiss button clicked', () => {
      const onDismiss = vi.fn();
      render(
        <ErrorSummary
          errors={[{ field: 'test', message: 'Test error' }]}
          onDismiss={onDismiss}
        />
      );

      fireEvent.click(screen.getByLabelText('Chiudi riepilogo errori'));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Field Click', () => {
    it('should call onFieldClick when error message clicked', () => {
      const onFieldClick = vi.fn();
      render(
        <ErrorSummary
          errors={[{ field: 'email', message: 'Email is required' }]}
          onFieldClick={onFieldClick}
        />
      );

      fireEvent.click(screen.getByText('Email is required'));
      expect(onFieldClick).toHaveBeenCalledWith('email');
    });

    it('should focus field element when error clicked', () => {
      // Create a mock input element
      const mockInput = document.createElement('input');
      mockInput.id = 'email';
      mockInput.focus = vi.fn();
      mockInput.scrollIntoView = vi.fn();
      document.body.appendChild(mockInput);

      render(
        <ErrorSummary
          errors={[{ field: 'email', message: 'Email is required' }]}
        />
      );

      fireEvent.click(screen.getByText('Email is required'));

      expect(mockInput.focus).toHaveBeenCalled();
      expect(mockInput.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });

      document.body.removeChild(mockInput);
    });

    it('should handle missing field element gracefully', () => {
      // No mock element created, should not throw
      render(
        <ErrorSummary
          errors={[{ field: 'nonexistent', message: 'Field error' }]}
        />
      );

      // Should not throw when clicked
      expect(() => {
        fireEvent.click(screen.getByText('Field error'));
      }).not.toThrow();
    });

    it('should work without onFieldClick callback', () => {
      const mockInput = document.createElement('input');
      mockInput.id = 'test-field';
      mockInput.focus = vi.fn();
      mockInput.scrollIntoView = vi.fn();
      document.body.appendChild(mockInput);

      render(
        <ErrorSummary
          errors={[{ field: 'test-field', message: 'Test error' }]}
        />
      );

      // Should not throw when clicked without callback
      expect(() => {
        fireEvent.click(screen.getByText('Test error'));
      }).not.toThrow();

      // Should still focus the element
      expect(mockInput.focus).toHaveBeenCalled();

      document.body.removeChild(mockInput);
    });
  });

  describe('Error List', () => {
    it('should render errors as list items', () => {
      render(
        <ErrorSummary
          errors={[
            { field: 'a', message: 'Error A' },
            { field: 'b', message: 'Error B' },
          ]}
        />
      );

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
    });

    it('should render error messages as buttons', () => {
      render(
        <ErrorSummary
          errors={[{ field: 'test', message: 'Click me' }]}
        />
      );

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
