// Jest cannot load the native Reanimated/Worklets runtime — there is no
// native module in the test environment, and (as of Reanimated 4 /
// react-native-worklets 0.10) even the package's own `/mock` entry point
// pulls in the real `./index`, which still throws at import time. This file
// is a from-scratch, minimal mock covering only what Wave 1 primitives use
// (press-scale `Animated.View`, `SuccessPanel`'s spring, `useReducedMotion`).
//
// It lives at Jest's documented node_modules manual-mock path
// (`<rootDir>/__mocks__/<package>`), so every test in this workspace picks
// it up automatically with no per-file `jest.mock()` call.
const { View, Text } = require('react-native');

const ID = (t) => t;

function useSharedValue(initial) {
  const box = { value: initial };
  return {
    get value() {
      return box.value;
    },
    set value(next) {
      box.value = next;
    },
    get: () => box.value,
    set: (next) => {
      box.value = typeof next === 'function' ? next(box.value) : next;
    },
  };
}

// Real `useAnimatedStyle` defers to the UI thread; the mock just runs the
// worklet synchronously so `render()` reflects whatever the shared values
// hold at call time.
function useAnimatedStyle(styleFactory) {
  return styleFactory();
}

// Real `withTiming`/`withSpring` animate over time on the UI thread; the
// mock resolves straight to the target value and invokes the completion
// callback synchronously, matching `react-native-reanimated/mock`'s own
// behavior for these two.
function withTiming(toValue, _config, callback) {
  callback?.(true);
  return toValue;
}

function withSpring(toValue, _config, callback) {
  callback?.(true);
  return toValue;
}

const Easing = {
  bezier: () => ID,
  linear: ID,
  ease: ID,
};

// Real implementation reads the OS "reduce motion" accessibility setting.
// Defaults to false (motion on); a test asserting the reduced-motion branch
// overrides the return value: `(useReducedMotion as jest.Mock).mockReturnValue(true)`.
const useReducedMotion = jest.fn(() => false);

const Animated = {
  View,
  Text,
  createAnimatedComponent: ID,
};

module.exports = {
  __esModule: true,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  useReducedMotion,
  createAnimatedComponent: ID,
  default: Animated,
};
