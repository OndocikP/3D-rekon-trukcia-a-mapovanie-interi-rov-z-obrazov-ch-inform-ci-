import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Platform, Modal, TouchableOpacity, Clipboard, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';

import { layout } from '../../src/theme/layout';
import AppButton from '../../src/components/AppButton';
import { useColors } from '../../src/theme/ColorsProvider';

export default function ProjectDetailScreen() {
  const { colors } = useColors();
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const shareLink = "http://MaperoInteriero.com/share=XHR329";

  const PROJECTS: Record<string, string> = {
    '1': 'Project 1',
    '2': 'Project 2',
    '3': 'Kuchyňa',
    '4': 'Kúpeľňa',
    '5': 'Project 32',
    '6': 'Project 32',
    '7': 'Project 32',
    '8': 'Project 32',
    '9': 'Project 32',
  };

  const { id } = useLocalSearchParams<{ id?: string }>();
  const projectName = PROJECTS[id ?? ''] ?? 'Project';

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isLandscape = screenWidth > screenHeight;

  const outerPadding = isLandscape ? 40 : 0;
  const topPaddingPortrait = isLandscape ? 0 : 40;
  const sidePadding = 20;
  const bottomContentHeight = 180;
  const headerHeight = 60;

  const imageHeight = isLandscape
    ? screenHeight - outerPadding * 2
    : screenHeight - bottomContentHeight - layout.padding * 2 - headerHeight - topPaddingPortrait;

  const imageWidth = isLandscape
    ? (screenWidth - outerPadding * 2 - sidePadding) / 2
    : screenWidth - sidePadding * 2;

  const copyToClipboard = () => {
    Clipboard.setString(shareLink);
    Alert.alert("Copied", "Link has been copied to clipboard");
  };


  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={[styles.container, { padding: outerPadding, paddingTop: topPaddingPortrait }]}
    >
      {isLandscape ? (
        <View style={styles.landscapeContainer}>
          <View style={[styles.imageWrapper, { width: imageWidth, height: imageHeight, backgroundColor: colors.card }]}>
            <Image
              source={require('../../src/assets/sample-room.png')}
              style={styles.roomImage}
              resizeMode="cover"
            />
          </View>

          <View style={[styles.landscapeInfo, { height: imageHeight }]}>
            <Text style={[styles.title, { color: colors.textPrimary, marginBottom: 20, textAlign: 'left' }]}>
              {projectName}
            </Text>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
                Object in room:
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                1x TV, 2x Sofa, 4x Table, 1x Plant, ...
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <AppButton
                icon="edit"
                title="Edit"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: `/project/${id}/edit`,
                    params: { name: projectName },
                  })
                }
              />
              <AppButton
                icon="home"
                title="Main"
                onPress={() => router.replace('/main')}
              />
              <AppButton
                icon="share"
                title="Share"
                variant="secondary"
                onPress={() => setShareModalVisible(true)}
              />
            </View>
          </View>
        </View>
      ) : (
        <>
          <View style={[styles.headerRow]}>
            <Text style={[styles.logoIcon, { color: colors.textPrimary }]}></Text>
            <Text style={[styles.title, { color: colors.textPrimary, textAlign: 'center', flex: 1 }]}>
              {projectName}
            </Text>
          </View>

          <View
            style={[
              styles.imageWrapper,
              { width: imageWidth, height: imageHeight, backgroundColor: colors.card, alignSelf: 'center' },
            ]}
          >
            <Image
              source={require('../../src/assets/sample-room.png')}
              style={styles.roomImage}
              resizeMode="cover"
            />
          </View>

          <View style={[styles.bottomContent, { width: screenWidth }]}>
            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
                Object in room:
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                1x TV, 2x Sofa, 4x Table, 1x Plant, ...
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <AppButton
                icon="edit"
                title="Edit"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: `/project/${id}/edit`,
                    params: { name: projectName },
                  })
                }
              />
              <AppButton
                icon="home"
                title="Main"
                onPress={() => router.replace('/main')}
              />
              <AppButton
                icon="share"
                title="Share"
                variant="secondary"
                onPress={() => setShareModalVisible(true)}
              />
            </View>
          </View>
        </>
      )}

      {/* Share Modal */}
      <Modal
        visible={shareModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Share</Text>

            <View style={[styles.modalLinkContainer, { backgroundColor: colors.inputBackground }]}>
              <Text style={[styles.modalLink, { color: '#000' }]} selectable>{shareLink}</Text>
            </View>


            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.gradientTop }]}
                onPress={copyToClipboard}
              >
                <Text style={styles.modalButtonText}>📋 Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.gradientBottom }]}
                onPress={() => setShareModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  landscapeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flex: 1,
    gap: 40,
  },

  landscapeInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },

  logoIcon: {
    fontSize: 28,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
  },

  imageWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    alignSelf: 'center',
  },

  roomImage: {
    width: '100%',
    height: '100%',
  },

  bottomContent: {
    position: 'absolute',
    bottom: layout.padding,
    paddingHorizontal: layout.padding,
    alignItems: 'center',
  },

  infoCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    width: '100%',
    maxWidth: 600,
  },

  infoTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },

  infoText: {
    lineHeight: 18,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    width: '100%',
    maxWidth: 600,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },

  modalLinkContainer: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    width: '100%',
  },

  modalLink: {
    fontSize: 16,
    textAlign: 'center',
  },

  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },

  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
