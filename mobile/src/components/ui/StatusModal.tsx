import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors, statusColors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, IconName } from './Icon';

export type StatusModalType = 'success' | 'loading' | 'error';

type StatusModalProps = {
  visible: boolean;
  type: StatusModalType;
  title: string;
  description?: string;
  onClose?: () => void;
  actionLabel?: string;
  onAction?: () => void;
};

const statusConfig: Record<
  StatusModalType,
  { icon: IconName; iconColor: string; circleColor: string }
> = {
  success: {
    icon: 'circleCheck',
    iconColor: statusColors.success,
    circleColor: statusColors.successSoft,
  },
  loading: {
    icon: 'loader',
    iconColor: colors.primaryLight,
    circleColor: colors.gray,
  },
  error: {
    icon: 'circleAlert',
    iconColor: statusColors.error,
    circleColor: statusColors.errorSoft,
  },
};

export function StatusModal({
  visible,
  type,
  title,
  description,
  onClose,
  actionLabel,
  onAction,
}: StatusModalProps) {
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const loaderRotation = useRef(new Animated.Value(0)).current;
  const [isMounted, setIsMounted] = useState(visible);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const config = statusConfig[type];

  const requestClose = useCallback(() => {
    if (!onClose || type === 'loading') {
      return;
    }

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  }, [onClose, progress, type]);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
      return undefined;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsMounted(false);
      }
    });

    return undefined;
  }, [progress, visible]);

  useEffect(() => {
    if (!visible || type === 'loading' || !onClose) {
      return undefined;
    }

    closeTimeoutRef.current = setTimeout(() => {
      requestClose();
    }, 3000);

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [onClose, requestClose, type, visible]);

  useEffect(() => {
    if (!visible || type !== 'loading') {
      loaderRotation.stopAnimation();
      return undefined;
    }

    loaderRotation.setValue(0);
    const animation = Animated.loop(
      Animated.timing(loaderRotation, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    );
    animation.start();

    return () => {
      animation.stop();
      loaderRotation.stopAnimation();
    };
  }, [loaderRotation, type, visible]);

  const panelTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });
  const loaderRotate = loaderRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={isMounted}
      animationType="none"
      onRequestClose={requestClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          disabled={!onClose || type === 'loading'}
          onPress={requestClose}
          style={StyleSheet.absoluteFill}
        >
          <Animated.View style={[styles.backdrop, { opacity: progress }]} />
        </Pressable>

        <Animated.View
          style={[
            styles.panel,
            {
              opacity: progress,
              transform: [{ translateY: panelTranslateY }],
            },
          ]}
        >
          <View
            style={[styles.iconCircle, { backgroundColor: config.circleColor }]}
          >
            <Animated.View
              style={
                type === 'loading'
                  ? { transform: [{ rotate: loaderRotate }] }
                  : undefined
              }
            >
              <Icon name={config.icon} size={34} color={config.iconColor} />
            </Animated.View>
          </View>

          <AppText
            variant="subtitle"
            color={colors.primary}
            style={styles.title}
          >
            {title}
          </AppText>

          {description ? (
            <AppText
              variant="body"
              color={colors.primaryLight}
              style={styles.description}
            >
              {description}
            </AppText>
          ) : null}

          {actionLabel && onAction ? (
            <View style={styles.action}>
              <Button title={actionLabel} variant="ghost" onPress={onAction} />
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.blackOverlay,
  },
  panel: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  title: {
    fontWeight: '800',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
    marginTop: spacing.xs,
  },
});
