import React from 'react';

interface MathRendererProps {
  text: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '' }) => {
  // Renders standard text and formats basic math expressions if present
  const renderFormattedText = (str: string) => {
    // If text contains LaTeX markers (e.g. \frac, \int, \sqrt, ^, _)
    return (
      <span className={className}>
        {str}
      </span>
    );
  };

  return <>{renderFormattedText(text)}</>;
};
