import {
  Building2,
  Calendar,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  LoaderCircle,
  Home,
  LogOut,
  MapPin,
  Search,
  SlidersHorizontal,
  User,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '../../theme/colors';

export type IconName =
  | 'building'
  | 'calendar'
  | 'chevronRight'
  | 'circleAlert'
  | 'circleCheck'
  | 'clock'
  | 'filter'
  | 'home'
  | 'loader'
  | 'logout'
  | 'mapPin'
  | 'search'
  | 'user'
  | 'users'
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
  chevronRight: ChevronRight,
  circleAlert: CircleAlert,
  circleCheck: CircleCheck,
  clock: Clock,
  filter: SlidersHorizontal,
  home: Home,
  loader: LoaderCircle,
  logout: LogOut,
  mapPin: MapPin,
  search: Search,
  user: User,
  users: Users,
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

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[styles.icon, { height: size, width: size }, style]}
    >
      <LucideIconComponent color={color} size={size} strokeWidth={strokeWidth} />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
