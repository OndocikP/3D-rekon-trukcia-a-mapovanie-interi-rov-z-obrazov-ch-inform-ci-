import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, ActivityIndicator } from 'react-native';

interface NerfstudioViewerProps {
  projectId: string;
  token: string;
  width: number;
  height: number;
}

/**
 * Nerfstudio Viewer - Zobrazuje NeRF model z Nerfstudio servera
 * Server musí bežať na portu 7007
 */
export const NerfstudioViewer: React.FC<NerfstudioViewerProps> = ({ 
  projectId, 
  token, 
  width, 
  height 
}) => {
  const [iframeRef, setIframeRef] = useState<HTMLIFrameElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const NERFSTUDIO_URL = 'http://localhost:7007';

  useEffect(() => {
    // Na mobile nie je možné priamo pristupovať k localhost
    if (Platform.OS !== 'web') {
      setError('Nerfstudio viewer je dostupný iba na webovej verzii');
      return;
    }

    // Testuj Connection k Nerfstudio serveru
    testNerfstudioConnection();
  }, [projectId]);

  const testNerfstudioConnection = async () => {
    try {
      console.log(`[NERFSTUDIO] Testujem Connection na ${NERFSTUDIO_URL}`);
      const response = await fetch(NERFSTUDIO_URL, { method: 'HEAD' });
      
      if (response.ok || response.status === 405) {
        // Server je dostupný
        console.log(`[NERFSTUDIO] ✅ Server je dostupný`);
        setError(null);
      }
    } catch (err) {
      console.error(`[NERFSTUDIO] ❌ Server nie je dostupný:`, err);
      setError(
        `Nerfstudio server nie je dostupný na portu 7007.\n\n` +
        `Spusti Nerfstudio s príkazom:\n` +
        `ns-train nerfacto --data <path-to-images> --viewer.make-share-url False\n\n` +
        `alebo:\n` +
        `ns-viewer --load-config <path-to-config>`
      );
    }
  };

  // Web viewer s iframom
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { width, height }]}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>⚠️ Nerfstudio Server nie je dostupný</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : !isLoaded ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4fc3f7" />
            <Text style={styles.loadingText}>Načítavam Nerfstudio viewer...</Text>
          </View>
        ) : null}
        
        <iframe
          ref={setIframeRef}
          src={NERFSTUDIO_URL}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '20px',
            display: isLoaded && !error ? 'block' : 'none',
          }}
          onLoad={() => {
            console.log(`[NERFSTUDIO] Iframe načítaný`);
            setIsLoaded(true);
          }}
          onError={(e) => {
            console.error(`[NERFSTUDIO] Iframe error:`, e);
            setError('Chyba pri načítaní Nerfstudio vieweru');
          }}
          title="Nerfstudio Viewer"
          allow="accelerometer; ambient-light-sensor; autoplay; battery; camera; display-capture; document-domain; encrypted-media; execution-while-not-rendered; execution-while-out-of-focus; fullscreen; geolocation; gyroscope; layout-animations; magnetometer; microphone; midi; navigation-override; payment; picture-in-picture; publicKeyCredential-get-assertion; publicKeyCredential-create-assertion; sync-xhr; usb; screen-wake-lock; web-share; xr-spatial-tracking"
        />
      </View>
    );
  }

  // Mobile - WebView (bude potrebovať dodatočnú implementáciu)
  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Nerfstudio viewer nie je dostupný na mobile</Text>
        <Text style={styles.errorText}>
          Nerfstudio viewer je dostupný iba na webovej verzii aplikácie.
          Skúste aplikáciu otvoriť v prehliadači.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e3c72',
    borderRadius: 20,
    width: '100%',
    height: '100%',
    zIndex: 10,
  },

  loadingText: {
    color: '#4fc3f7',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e3c72',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    height: '100%',
  },

  errorTitle: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },

  errorText: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});
