import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from './theme';

export const CommonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  card: {
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  
  cardElevated: {
    backgroundColor: Colors.surface.raised,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.md,
  },
  
  textPrimary: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
    fontWeight: '400',
  },
  
  textSecondary: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
    fontWeight: '400',
  },
  
  textTertiary: {
    color: Colors.text.tertiary,
    fontSize: Typography.sizes.sm,
    fontWeight: '400',
  },
  
  heading1: {
    color: Colors.text.primary,
    fontSize: Typography.sizes['3xl'],
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  
  heading2: {
    color: Colors.text.primary,
    fontSize: Typography.sizes['2xl'],
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  
  heading3: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
  },
  
  buttonPrimary: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  
  buttonSecondary: {
    backgroundColor: Colors.surface.raised,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  
  buttonText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  },
  
  input: {
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  
  inputFocused: {
    borderColor: Colors.primary.main,
  },
});
