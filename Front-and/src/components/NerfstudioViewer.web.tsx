import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';

interface NerfstudioViewerProps {
  projectId: string;
  token: string;
  width: number;
  height: number;
}

/**
 * Nerfstudio Viewer (Web Version)
 * Zobrazuje NeRF model z Nerfstudio servera cez iframe
 * Server musí bežať na portu 7007
 */
export const NerfstudioViewer: React.FC<NerfstudioViewerProps> = ({ 
  projectId, 
  token, 
  width, 
  height 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  const NERFSTUDIO_URL = 'http://localhost:7007';
  const NERFSTUDIO_WS_URL = 'ws://localhost:7008';

  const testConnection = async () => {
    try {
      console.log(`[NERFSTUDIO V2] Testujem Connection na ${NERFSTUDIO_URL}`);
      
      // Skúsime sa pripojiť cez fetch GET request (HEAD may fail na Nerfstudio)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      try {
        const response = await fetch(NERFSTUDIO_URL, { 
          method: 'GET',
          signal: controller.signal,
          mode: 'no-cors' // Bypass CORS for connectivity test
        });
        clearTimeout(timeout);
        
        console.log(`[NERFSTUDIO V2] ✅ Server je dostupný (status: ${response.status})`);
        setConnectionStatus('connected');
        setError(null);
      } catch (fetchErr: any) {
        clearTimeout(timeout);
        
        // Ak je CORS error, server stále bežal - pokúšame sa aj tak načítať iframe
        if (fetchErr.name === 'TypeError' && fetchErr.message.includes('CORS')) {
          console.warn(`[NERFSTUDIO V2] ⚠️ CORS warning ale pokúšam sa napriek tomu:`, fetchErr);
          setConnectionStatus('connected');
          setError(null);
          return;
        }
        
        if (fetchErr.name === 'AbortError') {
          throw new Error('Server neodpovedá v časovom limite');
        }
        throw fetchErr;
      }
    } catch (err: any) {
      console.error(`[NERFSTUDIO V2] ❌ Server nie je dostupný:`, err);
      setConnectionStatus('disconnected');
      setError(
        `Nerfstudio server nie je dostupný.\n\n` +
        `Spusťte Nerfstudio príkazom:\n` +
        `cd <path-to-nerfstudio>\n` +
        `ns-train nerfacto --data <path-to-images> --viewer.websocket-port 7008`
      );
    }
  };

  const renderIframe = () => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const iframeContainer = document.createElement('div');
    iframeContainer.style.width = '100%';
    iframeContainer.style.height = '100%';
    iframeContainer.style.position = 'relative';
    iframeContainer.style.backgroundColor = '#1e3c72';
    iframeContainer.style.borderRadius = '20px';
    iframeContainer.style.overflow = 'hidden';

    // Hlavný iframe
    const iframe = document.createElement('iframe');
    iframe.src = NERFSTUDIO_URL;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '20px';
    
    iframe.allow = [
      'accelerometer',
      'ambient-light-sensor',
      'autoplay',
      'battery',
      'camera',
      'display-capture',
      'document-domain',
      'encrypted-media',
      'execution-while-not-rendered',
      'execution-while-out-of-focus',
      'fullscreen',
      'geolocation',
      'gyroscope',
      'layout-animations',
      'magnetometer',
      'microphone',
      'midi',
      'navigation-override',
      'payment',
      'picture-in-picture',
      'publicKeyCredential-get-assertion',
      'publicKeyCredential-create-assertion',
      'sync-xhr',
      'usb',
      'screen-wake-lock',
      'web-share',
      'xr-spatial-tracking'
    ].join('; ');

    iframe.title = 'Nerfstudio Viewer V2';
    iframe.sandbox.add('allow-same-origin');
    iframe.sandbox.add('allow-scripts');
    iframe.sandbox.add('allow-forms');
    iframe.sandbox.add('allow-popups');

    iframe.onload = () => {
      console.log(`[NERFSTUDIO V2] Iframe načítaný úspešne`);
      setIsLoaded(true);
      setError(null);
    };

    iframe.onerror = () => {
      console.error(`[NERFSTUDIO V2] Iframe sa nepodarilo načítať`);
      setError('Chyba pri načítaní Nerfstudio vieweru');
    };

    iframeContainer.appendChild(iframe);
    containerRef.current.appendChild(iframeContainer);
  };

  // Ak je server dostupný a iframe ešte nie je načítaný
  useEffect(() => {
    if (connectionStatus === 'connected' && !isLoaded) {
      renderIframe();
    }
  }, [connectionStatus, isLoaded]);

  return (
    <View style={[styles.container, { width, height }]}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          backgroundColor: '#1e3c72',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {connectionStatus === 'checking' && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#4fc3f7" />
            <Text style={styles.statusText}>Kontrolujem Server...</Text>
          </View>
        )}

        {connectionStatus === 'disconnected' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Server nie je dostupný</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setConnectionStatus('checking');
                setIsLoaded(false);
                testConnection();
              }}
            >
              <Text style={styles.retryButtonText}>🔄 Skúsiť znova</Text>
            </TouchableOpacity>
          </View>
        )}

        {connectionStatus === 'connected' && !isLoaded && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#4fc3f7" />
            <Text style={styles.statusText}>Načítavam Nerfstudio Viewer...</Text>
          </View>
        )}
      </div>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },

  statusContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },

  statusText: {
    color: '#4fc3f7',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },

  errorContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },

  errorIcon: {
    fontSize: 48,
    marginBottom: 8,
  },

  errorTitle: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  errorText: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginVertical: 8,
    maxWidth: '90%',
  },

  retryButton: {
    backgroundColor: '#4fc3f7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },

  retryButtonText: {
    color: '#1e3c72',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
