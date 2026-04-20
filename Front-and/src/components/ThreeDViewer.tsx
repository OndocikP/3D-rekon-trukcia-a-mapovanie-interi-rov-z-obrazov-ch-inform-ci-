import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import WebView from 'react-native-webview';

interface ThreeDViewerProps {
  modelUrl: string;
  token: string;
  width: number;
  height: number;
}

export const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ modelUrl, token, width, height }) => {
  // Validate component is only used on native platforms
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={styles.errorContainer}>
          <View style={styles.placeholder} />
        </View>
      </View>
    );
  }
  // HTML s three.js pre načítanie PLY modelu
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body {
          margin: 0;
          overflow: hidden;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
        }
        #canvas {
          display: block;
          width: 100%;
          height: 100vh;
        }
        .info {
          position: absolute;
          top: 10px;
          left: 10px;
          color: white;
          font-size: 12px;
          background: rgba(0,0,0,0.5);
          padding: 10px;
          border-radius: 5px;
          z-index: 10;
        }
        .loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          text-align: center;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div id="canvas"></div>
      <div class="info">
        🖱️ Otáčaj: Ľavé tlačidlo + Myš<br/>
        🔍 Zväčšuj: Koliesko<br/>
        ↔️ Posúvaj: Pravé tlačidlo + Myš
      </div>
      <div class="loading" id="loading">
        <div class="spinner"></div>
        <p>Načítavam 3D model...</p>
      </div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/three@r128/examples/js/controls/OrbitControls.js"></script>
      <script>
        console.log('[3D VIEWER] Initializing...');
        const canvas = document.getElementById('canvas');
        const loading = document.getElementById('loading');
        const token = "${token}";
        const modelUrl = "${modelUrl}";
        
        console.log('[3D VIEWER] Model URL:', modelUrl);
        console.log('[3D VIEWER] Token:', token ? 'Present' : 'Missing');
        
        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1e3c72);
        scene.fog = new THREE.Fog(0x1e3c72, 100, 1000);
        
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          10000
        );
        camera.position.set(0, 0, 50);
        
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        canvas.appendChild(renderer.domElement);
        
        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 100);
        scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0x4fc3f7, 0.5);
        pointLight.position.set(-100, 100, 100);
        scene.add(pointLight);
        
        // Controls
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 3;
        controls.enableZoom = true;
        
        // Load PLY
        function loadPLY(url) {
          console.log('[3D VIEWER] Starting PLY load...');
          const urlWithToken = url + (url.includes('?') ? '&token=' : '?token=') + token;
          console.log('[3D VIEWER] Full URL:', urlWithToken);
          
          fetch(urlWithToken, {
            headers: {
              'Authorization': 'Bearer ' + token,
              'Accept': 'application/octet-stream'
            }
          })
            .then(res => {
              console.log('[3D VIEWER] Fetch response status:', res.status);
              if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + res.statusText);
              return res.arrayBuffer();
            })
            .then(buffer => {
              console.log('[3D VIEWER] Received buffer size:', buffer.byteLength, 'bytes');
              const geometry = parsePLY(buffer);
              if (geometry) {
                console.log('[3D VIEWER] Geometry parsed successfully');
                const material = new THREE.MeshPhongMaterial({
                  color: 0x4fc3f7,
                  specular: 0x111111,
                  shininess: 200,
                });
                const mesh = new THREE.Mesh(geometry, material);
                
                // Center and scale
                geometry.computeBoundingBox();
                const center = new THREE.Vector3();
                geometry.boundingBox.getCenter(center);
                geometry.translate(-center.x, -center.y, -center.z);
                
                const size = geometry.boundingBox.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 50 / maxDim;
                geometry.scale(scale, scale, scale);
                
                scene.add(mesh);
                controls.target.copy(center);
                camera.position.z = maxDim * 1.5;
                controls.update();
                
                console.log('[3D VIEWER] ✅ Model loaded and displayed successfully');
                loading.style.display = 'none';
                animate();
              } else {
                console.error('[3D VIEWER] ❌ Failed to parse PLY geometry');
                loading.innerHTML = '<p>❌ Chyba pri parsovaní PLY modelu</p>';
              }
            })
            .catch(err => {
              console.error('[3D VIEWER] ❌ Error loading PLY:', err);
              loading.innerHTML = '<p>❌ Chyba pri načítaní modelu:<br/>' + err.message + '</p>';
            });
        }
        
        // PLY Parser
        function parsePLY(data) {
          const view = new DataView(data);
          let offset = 0;
          
          // Parse header
          const lines = new TextDecoder().decode(data).split('\\n');
          let headerEnd = 0;
          let vertices = 0;
          let hasNormals = false;
          const properties = [];
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('element vertex')) {
              vertices = parseInt(line.split(' ')[2]);
            } else if (line.startsWith('property')) {
              const parts = line.split(' ');
              properties.push({ type: parts[1], name: parts[2] });
              if (parts[2].includes('nx')) hasNormals = true;
            } else if (line === 'end_header') {
              headerEnd = i + 1;
              break;
            }
          }
          
          const geometry = new THREE.BufferGeometry();
          const positions = [];
          const normals = [];
          
          for (let line of lines.slice(headerEnd)) {
            if (!line.trim()) continue;
            const parts = line.trim().split(/\\s+/);
            positions.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
            if (hasNormals && parts.length > 5) {
              normals.push(parseFloat(parts[3]), parseFloat(parts[4]), parseFloat(parts[5]));
            }
          }
          
          geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
          if (normals.length > 0) {
            geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
          } else {
            geometry.computeVertexNormals();
          }
          
          return geometry;
        }
        
        function animate() {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        loadPLY("${modelUrl}");
      </script>
    </body>
    </html>
  `;

  // HTML s three.js pre načítanie PLY modelu
  const htmlContent = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body {
          margin: 0;
          overflow: hidden;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
        }
        #canvas {
          display: block;
          width: 100%;
          height: 100vh;
        }
        .info {
          position: absolute;
          top: 10px;
          left: 10px;
          color: white;
          font-size: 12px;
          background: rgba(0,0,0,0.5);
          padding: 10px;
          border-radius: 5px;
          z-index: 10;
        }
        .loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          text-align: center;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div id="canvas"></div>
      <div class="info">
        🖱️ Otáčaj: Ľavé tlačidlo + Myš<br/>
        🔍 Zväčšuj: Koliesko<br/>
        ↔️ Posúvaj: Pravé tlačidlo + Myš
      </div>
      <div class="loading" id="loading">
        <div class="spinner"></div>
        <p>Načítavam 3D model...</p>
      </div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
      <script src="https://cdn.jsdelivr.net/npm/three@r128/examples/js/controls/OrbitControls.js"><\/script>
      <script>
        console.log('[3D VIEWER] Initializing...');
        const canvas = document.getElementById('canvas');
        const loading = document.getElementById('loading');
        const token = "${token}";
        const modelUrl = "${modelUrl}";
        
        console.log('[3D VIEWER] Model URL:', modelUrl);
        console.log('[3D VIEWER] Token:', token ? 'Present' : 'Missing');
        
        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1e3c72);
        scene.fog = new THREE.Fog(0x1e3c72, 100, 1000);
        
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          10000
        );
        camera.position.set(0, 0, 50);
        
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        canvas.appendChild(renderer.domElement);
        
        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 100);
        scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0x4fc3f7, 0.5);
        pointLight.position.set(-100, 100, 100);
        scene.add(pointLight);
        
        // Controls
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 3;
        controls.enableZoom = true;
        
        // Load PLY
        function loadPLY(url) {
          console.log('[3D VIEWER] Starting PLY load...');
          const urlWithToken = url + (url.includes('?') ? '&token=' : '?token=') + token;
          console.log('[3D VIEWER] Full URL:', urlWithToken);
          
          fetch(urlWithToken, {
            headers: {
              'Authorization': 'Bearer ' + token,
              'Accept': 'application/octet-stream'
            }
          })
            .then(res => {
              console.log('[3D VIEWER] Fetch response status:', res.status);
              if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + res.statusText);
              return res.arrayBuffer();
            })
            .then(buffer => {
              console.log('[3D VIEWER] Received buffer size:', buffer.byteLength, 'bytes');
              const geometry = parsePLY(buffer);
              if (geometry) {
                console.log('[3D VIEWER] Geometry parsed successfully');
                const material = new THREE.MeshPhongMaterial({
                  color: 0x4fc3f7,
                  specular: 0x111111,
                  shininess: 200,
                });
                const mesh = new THREE.Mesh(geometry, material);
                
                // Center and scale
                geometry.computeBoundingBox();
                const center = new THREE.Vector3();
                geometry.boundingBox.getCenter(center);
                geometry.translate(-center.x, -center.y, -center.z);
                
                const size = geometry.boundingBox.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 50 / maxDim;
                geometry.scale(scale, scale, scale);
                
                scene.add(mesh);
                controls.target.copy(center);
                camera.position.z = maxDim * 1.5;
                controls.update();
                
                console.log('[3D VIEWER] ✅ Model loaded and displayed successfully');
                loading.style.display = 'none';
                animate();
              } else {
                console.error('[3D VIEWER] ❌ Failed to parse PLY geometry');
                loading.innerHTML = '<p>❌ Chyba pri parsovaní PLY modelu</p>';
              }
            })
            .catch(err => {
              console.error('[3D VIEWER] ❌ Error loading PLY:', err);
              loading.innerHTML = '<p>❌ Chyba pri načítaní modelu:<br/>' + err.message + '</p>';
            });
        }
        
        // PLY Parser
        function parsePLY(data) {
          const view = new DataView(data);
          let offset = 0;
          
          // Parse header
          const lines = new TextDecoder().decode(data).split('\\n');
          let headerEnd = 0;
          let vertices = 0;
          let hasNormals = false;
          const properties = [];
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('element vertex')) {
              vertices = parseInt(line.split(' ')[2]);
            } else if (line.startsWith('property')) {
              const parts = line.split(' ');
              properties.push({ type: parts[1], name: parts[2] });
              if (parts[2].includes('nx')) hasNormals = true;
            } else if (line === 'end_header') {
              headerEnd = i + 1;
              break;
            }
          }
          
          const geometry = new THREE.BufferGeometry();
          const positions = [];
          const normals = [];
          
          for (let line of lines.slice(headerEnd)) {
            if (!line.trim()) continue;
            const parts = line.trim().split(/\\s+/);
            positions.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
            if (hasNormals && parts.length > 5) {
              normals.push(parseFloat(parts[3]), parseFloat(parts[4]), parseFloat(parts[5]));
            }
          }
          
          geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
          if (normals.length > 0) {
            geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
          } else {
            geometry.computeVertexNormals();
          }
          
          return geometry;
        }
        
        function animate() {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        loadPLY("${modelUrl}");
      <\/script>
    </body>
    </html>
  `, [modelUrl, token]);

  return (
    <View style={[styles.container, { width, height }]}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1e3c72',
  },
  webview: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e3c72',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(31, 60, 114, 0.5)',
  },
});
