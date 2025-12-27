/**
 * SkipLink Component
 * Provides a skip navigation link for keyboard users to bypass repetitive navigation
 * WCAG 2.4.1 - Bypass Blocks (Level A)
 */

interface SkipLinkProps {
  targetId: string;
  label?: string;
}

export const SkipLink = ({ targetId, label = 'Skip to main content' }: SkipLinkProps) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-cyan-600 focus:text-white focus:rounded-xl focus:shadow-xl focus:font-semibold focus:outline-none focus:ring-4 focus:ring-cyan-300"
    >
      {label}
    </a>
  );
};
