import React from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../theme/ColorsProvider';

type Props = {
  name: string;
  onPress?: () => void;
};

export default function ProjectCard({ name, onPress }: Props) {
  const { colors } = useColors();

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        }
      ]}
      onPress={onPress}
    >
      {/* IKONA */}
      <View style={[
        styles.iconBox,
        { 
          backgroundColor: colors.primaryLight + '15',
          borderColor: colors.primaryLight + '30'
        }
      ]}>
        <MaterialIcons
          name="folder"
          size={48}
          color={colors.primary}
        />
      </View>

      {/* NÁZOV */}
      <Text 
        style={[styles.name, { color: colors.textPrimary }]}
        numberOfLines={2}
      >
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    height: 140,
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
    marginHorizontal: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  iconBox: {
    width: '85%',
    height: '65%',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  name: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
