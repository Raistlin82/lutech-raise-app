import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MigrationWarning } from './MigrationWarning';

describe('MigrationWarning', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should not render when no old data exists', () => {
    const { container } = render(<MigrationWarning />);
    expect(container.firstChild).toBeNull();
  });

  it('should render warning when raise_opportunities exists', () => {
    localStorage.setItem('raise_opportunities', '[]');
    render(<MigrationWarning />);

    expect(screen.getByText('Migration Notice')).toBeInTheDocument();
    expect(screen.getByText(/Your data has been migrated to the cloud/)).toBeInTheDocument();
  });

  it('should render warning when raise_customers exists', () => {
    localStorage.setItem('raise_customers', '[]');
    render(<MigrationWarning />);

    expect(screen.getByText('Migration Notice')).toBeInTheDocument();
  });

  it('should render warning when both old data keys exist', () => {
    localStorage.setItem('raise_opportunities', '[]');
    localStorage.setItem('raise_customers', '[]');
    render(<MigrationWarning />);

    expect(screen.getByText('Migration Notice')).toBeInTheDocument();
  });

  it('should clear localStorage and hide warning when button clicked', () => {
    localStorage.setItem('raise_opportunities', '[]');
    localStorage.setItem('raise_customers', '[]');
    localStorage.setItem('some_other_key', 'value');

    const { container } = render(<MigrationWarning />);

    const button = screen.getByText('Clear Old Data Now');
    fireEvent.click(button);

    // Warning should disappear
    expect(container.firstChild).toBeNull();

    // localStorage should be cleared
    expect(localStorage.getItem('raise_opportunities')).toBeNull();
    expect(localStorage.getItem('raise_customers')).toBeNull();
    expect(localStorage.getItem('some_other_key')).toBeNull();
  });

  it('should have accessible button', () => {
    localStorage.setItem('raise_opportunities', '[]');
    render(<MigrationWarning />);

    const button = screen.getByRole('button', { name: /Clear Old Data Now/i });
    expect(button).toBeInTheDocument();
  });
});
