import { I18nManager } from 'react-native';
import { render } from '@testing-library/react-native';
import { Icon } from './Icon';

const FLIP_STYLE = { transform: [{ scaleX: -1 }] };

/** TASK-P1-010 / R4: directional icons flip only under RTL, and only when `directional` is set. */
describe('Icon', () => {
  it('flips a directional icon under RTL', async () => {
    Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });

    const { toJSON } = await render(<Icon name="chevron-left" directional />);

    expect(toJSON()?.props.style).toContainEqual(FLIP_STYLE);
  });

  it('does not flip a directional icon under LTR', async () => {
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });

    const { toJSON } = await render(<Icon name="chevron-left" directional />);

    expect(toJSON()?.props.style).not.toContainEqual(FLIP_STYLE);
  });

  it('never flips a non-directional icon, even under RTL', async () => {
    Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });

    const { toJSON } = await render(<Icon name="search" />);

    expect(toJSON()?.props.style).not.toContainEqual(FLIP_STYLE);
  });
});
