import { onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn((cb) => {
    cb({ isConnected: true });
    return jest.fn();
  }),
}));

describe('queryClient onlineManager setup', () => {
  it('onlineManager receives a listener on import', () => {
    const setEventListenerSpy = jest.spyOn(onlineManager, 'setEventListener');
    require('./queryClient');

    expect(setEventListenerSpy).toHaveBeenCalled();
    expect(NetInfo.addEventListener).toHaveBeenCalled();
  });
});
