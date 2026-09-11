import React, { forwardRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProps,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { colors, radius, spacing } from '../../theme/tokens';

export interface AppBottomSheetProps extends Omit<BottomSheetModalProps, 'ref'> {
  children: React.ReactNode;
}

export const AppBottomSheet = forwardRef<BottomSheetModal, AppBottomSheetProps>(
  ({ children, ...rest }, ref) => {
    // Render a 45% opacity scrim
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handle}
        {...rest}
      >
        <BottomSheetView style={styles.contentContainer}>{children}</BottomSheetView>
      </BottomSheetModal>
    );
  },
);

AppBottomSheet.displayName = 'AppBottomSheet';

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
  },
  handle: {
    backgroundColor: colors.hairline,
    width: 40,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl, // extra padding for safe area
  },
});
