import React from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  name: string;
  onPress?: () => void;
};

export default function ProjectCard({ name, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* IKONA */}
      <View style={styles.iconBox}>
        <Image
          source={require('../assets/folder.png')}
          style={styles.icon}
        />
      </View>

      {/* NÁZOV */}
      <Text style={styles.name}>{name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 130,
    height: 130,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 10,
    marginBottom: 18,
    marginHorizontal: 8,
    justifyContent: 'space-between',
    alignItems: 'center',

    // ✅ jemný rámček
    borderWidth: 1,
    borderColor: colors.card,
  },

  iconBox: {
    width: '80%',
    height: '60%',
    borderRadius: 8,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },

  name: {
    color: colors.textPrimary,
    fontSize: 13,
    textAlign: 'center',
  },
});
