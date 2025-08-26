import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AuthenticatedImage } from '../AuthenticatedImage';

describe('AuthenticatedImage', () => {
  it('renders replicate.delivery URLs without modification', () => {
    const url = 'https://replicate.delivery/pbxt/test-image.png';
    const { container } = render(<AuthenticatedImage src={url} alt="test" />);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.src).toBe(url);
  });
});