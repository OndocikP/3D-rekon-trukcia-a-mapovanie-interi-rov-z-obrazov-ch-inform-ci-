import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { layout } from '../theme/layout';

// ✅ COLORS Z PROVIDERU
import { useColors } from '../theme/ColorsProvider';

interface Props {
  title?: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconSize?: number;
}

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  iconSize = 22,
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
        icon && !title && styles.iconOnly,
      ]}
    >
      {icon && (
        <MaterialIcons
          name={icon}
          size={iconSize}
          color={colors.buttonText}
        />
      )}

      {title && (
        <Text
          style={[
            styles.text,
            textStyle,
            disabled && { color: colors.textSecondary },
          ]}
        >
          {title}
        </Text>
      )}
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
    flexDirection: 'row',
    gap: 6,
  },

  iconOnly: {
    paddingHorizontal: 0,
    width: layout.buttonHeight,
  },

  text: {
    fontWeight: '600',
    fontSize: 16,
  },

  disabled: {
    opacity: 0.5,
  },
});
