import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CityInput } from './CityInput';
import React from 'react';

// Mock getFuse logic or just test the initial render
describe('CityInput Component', () => {
  it('renders the label and input', () => {
    const handleSelect = vi.fn();
    
    render(
      <CityInput 
        label="Origin City" 
        placeholder="Enter city..." 
        onSelect={handleSelect} 
      />
    );

    expect(screen.getByText('Origin City')).toBeInTheDocument();
    
    const input = screen.getByPlaceholderText('Enter city...');
    expect(input).toBeInTheDocument();
    expect(input).toBeEnabled();
  });

  it('disables input when disabled prop is true', () => {
    render(
      <CityInput 
        label="Destination" 
        onSelect={vi.fn()} 
        disabled={true} 
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });
});
