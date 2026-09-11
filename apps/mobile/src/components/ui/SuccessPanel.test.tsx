import { render } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from 'react-native-reanimated';
import { SuccessPanel } from './SuccessPanel';

const mockedUseReducedMotion = useReducedMotion as jest.Mock;

/**
 * TASK-P1-026 / EDGE-P1-006: reduced motion drops the spring to an opacity
 * change but the success haptic still fires — haptics are feedback, not
 * motion. The `useRef` guard must survive a re-render without a double fire.
 */
describe('SuccessPanel reduced-motion branch', () => {
  beforeEach(() => {
    mockedUseReducedMotion.mockReturnValue(true);
    jest.spyOn(Haptics, 'notificationAsync').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockedUseReducedMotion.mockReturnValue(false);
  });

  it('renders without crashing under reduced motion', async () => {
    const { findByText } = await render(
      <SuccessPanel title="Funded" message="Escrow is funded." />,
    );
    expect(await findByText('Funded')).toBeTruthy();
  });

  it('fires the success haptic exactly once, even across a re-render', async () => {
    const { rerender, findByText } = await render(<SuccessPanel title="Funded" />);
    await findByText('Funded');

    await rerender(<SuccessPanel title="Funded" />);

    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success,
    );
  });
});
