import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
}

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: variant === 'primary'
          ? colors.primary
          : colors.secondary },
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: layout.buttonHeight,
    borderRadius: layout.radius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  text: {
    color: colors.buttonText,
    fontWeight: '600',
    fontSize: 16,
  },
});
