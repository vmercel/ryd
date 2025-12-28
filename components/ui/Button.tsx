import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.text.primary : Colors.text.secondary}
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  
  // Variants
  primary: {
    backgroundColor: Colors.primary.main,
    ...Shadows.sm,
  },
  secondary: {
    backgroundColor: Colors.surface.raised,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.error,
    ...Shadows.sm,
  },
  
  // Sizes
  sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  md: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  lg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
  },
  
  // Text styles
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
  },
  secondaryText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
  },
  ghostText: {
    color: Colors.primary.main,
    fontSize: Typography.sizes.base,
  },
  dangerText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
  },
  smText: {
    fontSize: Typography.sizes.sm,
  },
  mdText: {
    fontSize: Typography.sizes.base,
  },
  lgText: {
    fontSize: Typography.sizes.lg,
  },
  
  disabled: {
    opacity: 0.5,
  },
});
