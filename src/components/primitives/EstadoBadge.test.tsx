import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EstadoBadge from './EstadoBadge';

describe('EstadoBadge', () => {
  it('muestra el label del estado conocido', () => {
    render(<EstadoBadge estado="Publicado" />);
    expect(screen.getByText('Publicado')).toBeInTheDocument();
  });

  it('muestra un guion cuando no hay estado', () => {
    render(<EstadoBadge estado={undefined} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
