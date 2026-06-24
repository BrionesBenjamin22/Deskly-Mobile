import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  CreditCard,
  LoaderCircle,
  Home,
  LogOut,
  MapPin,
  Pencil,
  Search,
  SlidersHorizontal,
  User,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react-native';

import { colors } from '../../theme/colors';

export type IconName =
  | 'building'
  | 'calendar'
  | 'chevronDown'
  | 'chevronRight'
  | 'circleAlert'
  | 'circleCheck'
  | 'clock'
  | 'creditCard'
  | 'filter'
  | 'home'
  | 'loader'
  | 'logout'
  | 'mapPin'
  | 'pencil'
  | 'search'
  | 'user'
  | 'users'
  | 'wallet'
  | 'x';

type IconProps = {
  name: IconName;
  color?: string;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

const icons: Record<IconName, LucideIcon> = {
  building: Building2,
  calendar: Calendar,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  circleAlert: CircleAlert,
  circleCheck: CircleCheck,
  clock: Clock,
  creditCard: CreditCard,
  filter: SlidersHorizontal,
  home: Home,
  loader: LoaderCircle,
  logout: LogOut,
  mapPin: MapPin,
  pencil: Pencil,
  search: Search,
  user: User,
  users: Users,
  wallet: Wallet,
  x: X,
};

export function Icon({
  name,
  color = colors.primary,
  size = 18,
  strokeWidth = 2,
  style,
}: IconProps) {
  const LucideIconComponent = icons[name];
  const spinValue = useRef(new Animated.Value(0)).current;
  const isLoading = name === 'loader';

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => animation.stop();
  }, [isLoading, spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const content = (
    <LucideIconComponent color={color} size={size} strokeWidth={strokeWidth} />
  );

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[styles.icon, { height: size, width: size }, style]}
    >
      {isLoading ? (
        <Animated.View style={{ transform: [{ rotate }] }}>{content}</Animated.View>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
