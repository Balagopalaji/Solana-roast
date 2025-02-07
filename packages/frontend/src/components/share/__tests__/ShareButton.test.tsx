import { renderWithTimers } from '../../../test/testUtils';
import { ShareButton } from '../ShareButton';
import { vi } from 'vitest';

describe('ShareButton', () => {
  const mockShareData = {
    text: "Test text",
    roastData: {
      roast: "Test roast",
      wallet: {
        address: "test-address"
      }
    }
  };

  it('handles share flow', async () => {
    // Create a controlled promise for share
    let resolveShare: (value: unknown) => void;
    const sharePromise = new Promise(resolve => {
      resolveShare = resolve;
    });

    const mockShare = vi.fn().mockImplementation(() => sharePromise);
    Object.assign(navigator, { share: mockShare });

    const { getByRole, findByText, advanceTimers, userEvent } = renderWithTimers(
      <ShareButton {...mockShareData} />
    );

    const shareButton = getByRole('button', { name: /share/i });
    await userEvent.click(shareButton);

    // Verify loading state
    expect(shareButton).toHaveTextContent(/sharing/i);

    // Complete share operation
    resolveShare!(undefined);
    await advanceTimers(100);

    // Verify success message
    const successMessage = await findByText(/shared/i);
    expect(successMessage).toBeInTheDocument();
  });
}); 