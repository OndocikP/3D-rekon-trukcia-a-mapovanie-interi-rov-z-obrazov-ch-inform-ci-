import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { layout } from '../theme/layout';

// ✅ COLORS Z PROVIDERU
import { useColors } from '../theme/ColorsProvider';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
}

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}: Props) {
  const { colors } = useColors();

  const variantStyle = getVariantStyle(variant, colors);
  const textStyle = getTextStyle(variant, colors);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        variantStyle,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.text,
          textStyle,
          disabled && { color: colors.textSecondary },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

/* =========================
   DYNAMIC STYLES
   ========================= */

function getVariantStyle(variant: Props['variant'], colors: any) {
  switch (variant) {
    case 'secondary':
      return { backgroundColor: colors.secondary };
    case 'danger':
      return { backgroundColor: colors.danger };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
      };
    case 'primary':
    default:
      return { backgroundColor: colors.primary };
  }
}

function getTextStyle(variant: Props['variant'], colors: any) {
  if (variant === 'outline') {
    return { color: colors.buttonText };
  }
  return { color: colors.buttonText };
}

/* =========================
   STATIC LAYOUT STYLES
   ========================= */

const styles = StyleSheet.create({
  button: {
    height: layout.buttonHeight,
    borderRadius: layout.radius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  text: {
    fontWeight: '600',
    fontSize: 16,
  },

  disabled: {
    opacity: 0.5,
  },
});
