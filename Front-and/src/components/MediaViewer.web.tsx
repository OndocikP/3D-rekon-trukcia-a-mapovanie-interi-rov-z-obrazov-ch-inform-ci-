import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as apiClient from '../api/client';

interface MediaViewerProps {
  projectId: string;
  token: string;
  width: number;
  height: number;
}

type DisplayMode = 'video' | 'model' | 'none';

// Cache na uloženie videí a modelov na fronte
const mediaCache: Map<string, {
  videos: Map<string, Blob>;
  models: Map<string, ArrayBuffer>;
  loaded: boolean;
}> = new Map();

export const MediaViewer: React.FC<MediaViewerProps> = ({ projectId, token, width, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  
  const [media, setMedia] = useState<apiClient.ProjectMedia | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('none');
  const [loading, setLoading] = useState(true);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const [mediaCache_local, setMediaCache_local] = useState<{
    videos: Map<string, Blob>;
    models: Map<string, ArrayBuffer>;
  } | null>(null);

  // Načítaj všetky médiá (videá a modely) pri počiatočnom otvorení
  useEffect(() => {
    loadAllMedia();
  }, [projectId]);

  const loadAllMedia = async () => {
    try {
      setLoading(true);
      
      // Skontroluj cache
      if (mediaCache.has(projectId)) {
        const cached = mediaCache.get(projectId)!;
        if (cached.loaded) {
          console.log('[MEDIA VIEWER] Using cached media for project:', projectId);
          setMediaCache_local({
            videos: cached.videos,
            models: cached.models,
          });
          // Fetch metadata len
          const response = await apiClient.getProjectMedia(projectId);
          if (response.data) {
            setMedia(response.data);
            if (response.data.priority === 'video' && response.data.videos.length > 0) {
              setDisplayMode('video');
            } else if (response.data.models.length > 0) {
              setDisplayMode('model');
            } else {
              setDisplayMode('none');
            }
          }
          return;
        }
      }
      
      // Načítaj metadata
      const response = await apiClient.getProjectMedia(projectId);
      console.log('[MEDIA VIEWER] Media loaded:', response.data);
      
      if (response.data) {
        setMedia(response.data);
        
        // Iniciálny cache
        const cacheEntry = {
          videos: new Map<string, Blob>(),
          models: new Map<string, ArrayBuffer>(),
          loaded: true,
        };
        
        // Pred-cache všetky videá
        const videoPromises = response.data.videos.map(async (video) => {
          try {
            const url = apiClient.getVideoUrl(projectId, video.filename, token);
            console.log('[MEDIA VIEWER] Fetching video:', url);
            const res = await fetch(url);
            
            if (!res.ok) {
              console.error('[MEDIA VIEWER] Video fetch failed:', res.status, res.statusText);
              return;
            }
            
            const blob = await res.blob();
            console.log('[MEDIA VIEWER] Video blob created, size:', blob.size, 'type:', blob.type);
            
            if (blob.size === 0) {
              console.error('[MEDIA VIEWER] Video blob is empty!');
              return;
            }
            
            cacheEntry.videos.set(video.filename, blob);
            console.log('[MEDIA VIEWER] ✅ Cached video:', video.filename);
          } catch (err) {
            console.error('[MEDIA VIEWER] ❌ Error caching video:', video.filename, err);
          }
        });
        
        // Pred-cache všetky modely
        const modelPromises = response.data.models.map(async (model) => {
          try {
            const url = apiClient.getModelUrl(projectId, model.filename, token);
            const res = await fetch(url);
            const buffer = await res.arrayBuffer();
            cacheEntry.models.set(model.filename, buffer);
            console.log('[MEDIA VIEWER] Cached model:', model.filename);
          } catch (err) {
            console.error('[MEDIA VIEWER] Error caching model:', model.filename, err);
          }
        });
        
        // Čakaj na všetky
        await Promise.all([...videoPromises, ...modelPromises]);
        
        // Ulož do globálneho cacheu
        mediaCache.set(projectId, cacheEntry);
        setMediaCache_local({
          videos: cacheEntry.videos,
          models: cacheEntry.models,
        });
        
        // Set initial display mode based on priority
        if (response.data.priority === 'video' && response.data.videos.length > 0) {
          setDisplayMode('video');
        } else if (response.data.models.length > 0) {
          setDisplayMode('model');
        } else {
          setDisplayMode('none');
        }
      }
    } catch (error) {
      console.error('[MEDIA VIEWER] Error loading media:', error);
      setMedia({ videos: [], models: [], has_media: false, priority: null });
      setDisplayMode('none');
    } finally {
      setLoading(false);
    }
  };

  // Displej medií
  useEffect(() => {
    if (!containerRef.current || displayMode === 'none' || !media) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    if (displayMode === 'video' && media.videos.length > 0) {
      const video = media.videos[selectedVideoIndex];
      
      console.log('[MEDIA VIEWER] Displaying video:', video.filename);
      
      try {
        // Skúsime najprv z cacheu (ak je dostupný)
        let videoUrl: string;
        
        if (mediaCache_local && mediaCache_local.videos.has(video.filename)) {
          const blob = mediaCache_local.videos.get(video.filename)!;
          console.log('[MEDIA VIEWER] Using cached video blob, size:', blob.size);
          videoUrl = URL.createObjectURL(blob);
        } else {
          // Ak nie je v cache, použi priamy URL
          videoUrl = apiClient.getVideoUrl(projectId, video.filename, token);
          console.log('[MEDIA VIEWER] Using direct video URL:', videoUrl);
        }
        
        const videoElement = document.createElement('video');
        videoElement.src = videoUrl;
        videoElement.loop = true;
        videoElement.autoplay = false;  // Začnem bez autoplay pre testovanie
        videoElement.muted = true;
        videoElement.controls = true;
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'contain';
        videoElement.style.backgroundColor = '#000';
        
        videoElement.onerror = (e) => {
          console.error('[MEDIA VIEWER] Video error:', e, videoElement.error?.message);
        };
        
        videoElement.onloadedmetadata = () => {
          console.log('[MEDIA VIEWER] ✅ Video metadata loaded, duration:', videoElement.duration);
          videoElement.play().catch((err) => {
            console.warn('[MEDIA VIEWER] Autoplay failed:', err);
          });
        };
        
        containerRef.current.appendChild(videoElement);
        console.log('[MEDIA VIEWER] Video element added to DOM');
      } catch (err) {
        console.error('[MEDIA VIEWER] Error creating video element:', err);
        if (containerRef.current) {
          containerRef.current.innerHTML = '<p style="color: red; padding: 20px;">Chyba pri načítaní videa</p>';
        }
      }
      } else if (displayMode === 'model' && media.models.length > 0) {
      displayModel();
    }
  }, [displayMode, selectedVideoIndex, selectedModelIndex, media, mediaCache_local]);

  const displayModel = async () => {
    if (!media || media.models.length === 0 || !mediaCache_local) return;
    
    const model = media.models[selectedModelIndex];
    const buffer = mediaCache_local.models.get(model.filename);
    
    if (!buffer) {
      console.error('[MEDIA VIEWER] Model not in cache:', model.filename);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // @ts-ignore
    const THREE = window.THREE;
    
    if (!THREE) {
      console.error('[MEDIA VIEWER] THREE.js not loaded');
      return;
    }

    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e3c72);
    
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      10000
    );
    camera.position.set(50, 0, 0);  // Kamera v rovine XY pre rotáciu okolo Z osi
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0x4fc3f7, 0.5);
    pointLight.position.set(-100, 100, 100);
    scene.add(pointLight);
    
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    
    sceneRef.current = scene;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    cameraRef.current = camera;

    const loadingDiv = document.createElement('div');
    loadingDiv.style.position = 'absolute';
    loadingDiv.style.top = '50%';
    loadingDiv.style.left = '50%';
    loadingDiv.style.transform = 'translate(-50%, -50%)';
    loadingDiv.style.color = 'white';
    loadingDiv.style.textAlign = 'center';
    loadingDiv.style.zIndex = '10';
    loadingDiv.innerHTML = '<div style="width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div><p>Načítavam 3D model...</p>';
    
    // Info text o klávesoch
    const infoDiv = document.createElement('div');
    infoDiv.style.position = 'absolute';
    infoDiv.style.bottom = '10px';
    infoDiv.style.left = '10px';
    infoDiv.style.color = 'rgba(255, 255, 255, 0.7)';
    infoDiv.style.fontSize = '12px';
    infoDiv.style.fontFamily = 'monospace';
    infoDiv.style.zIndex = '10';
    infoDiv.style.textAlign = 'left';
    infoDiv.innerHTML = `
      <div style="background: rgba(0, 0, 0, 0.5); padding: 8px 12px; border-radius: 4px; line-height: 1.6;">
        <strong>Ovládanie:</strong><br/>
        <strong>Q</strong> / <strong>E</strong> - Kamera vľavo/vpravo<br/>
        <strong>↑↓</strong> - Kamera hore/dole<br/>
        <strong>X</strong> / <strong>Z</strong> / <strong>Y</strong> - Rotovať osi<br/>
        <strong>SPACE</strong> - Pause/Resume orbit<br/>
        <strong>Myš</strong> - Drag = Otáčanie, Scroll = Zoom
      </div>
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(styleSheet);
    
    container.appendChild(loadingDiv);
    container.appendChild(infoDiv);
    container.style.position = 'relative';

    // PLY Parser (z pôvodného ThreeDViewer.web.tsx)
    const parsePLY = (data: ArrayBuffer) => {
      try {
        console.log('[3D VIEWER] Parsing PLY, size:', data.byteLength);
        const view = new DataView(data);
        const headerSize = Math.min(50000, data.byteLength);
        const headerText = new TextDecoder().decode(new Uint8Array(data.slice(0, headerSize)));
        
        const lines = headerText.split('\n');
        let headerEndLine = 0;
        let vertexCount = 0;
        let format = 'ascii';
        const properties: any[] = [];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('format')) {
            format = line.split(' ')[1];
            console.log('[3D VIEWER] Format:', format);
          } else if (line.startsWith('element vertex')) {
            vertexCount = parseInt(line.split(' ')[2]);
            console.log('[3D VIEWER] Vertex count:', vertexCount);
          } else if (line.startsWith('property')) {
            const parts = line.split(' ');
            properties.push({ type: parts[1], name: parts[2] });
          } else if (line === 'end_header') {
            headerEndLine = i;
            break;
          }
        }
        
        console.log('[3D VIEWER] Properties:', properties);
        
        let headerEndByte = 0;
        for (let i = 0; i <= headerEndLine; i++) {
          headerEndByte += lines[i].length + 1;
        }
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        if (format === 'ascii') {
          const dataLines = lines.slice(headerEndLine + 1);
          console.log('[3D VIEWER] Data lines count:', dataLines.length);
          let vertexCount_actual = 0;
          for (const line of dataLines) {
            if (!line.trim()) continue;
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 3) {
              vertexCount_actual++;
              positions.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
              
              let partIdx = 3;
              if (partIdx < parts.length && properties.length > 3 && properties[3].name === 'nx') {
                partIdx += 3;
              }
              
              let hasColor = false;
              for (let i = 0; i < properties.length; i++) {
                if (properties[i].name === 'red' && partIdx < parts.length) {
                  const r = parseInt(parts[partIdx]) / 255;
                  const g = parseInt(parts[partIdx+1]) / 255;
                  const b = parseInt(parts[partIdx+2]) / 255;
                  colors.push(r, g, b);
                  hasColor = true;
                  break;
                }
              }
              if (!hasColor) {
                colors.push(0.31, 0.765, 0.966);
              }
            }
          }
          console.log('[3D VIEWER] Parsed vertices:', vertexCount_actual);
        } else if (format === 'binary_little_endian' || format === 'binary_big_endian') {
          const isLittleEndian = format === 'binary_little_endian';
          let bytesPerVertex = 0;
          const propIndices: any = {};
          properties.forEach((prop) => {
            propIndices[prop.name] = prop;
            if (prop.type === 'float' || prop.type === 'int' || prop.type === 'uint') bytesPerVertex += 4;
            else if (prop.type === 'double') bytesPerVertex += 8;
            else if (prop.type === 'short' || prop.type === 'ushort') bytesPerVertex += 2;
            else bytesPerVertex += 1;
          });
          
          let offset = headerEndByte;
          for (let v = 0; v < vertexCount && offset + bytesPerVertex <= data.byteLength; v++) {
            let propOffset = 0;
            const vertexValues: any = {};
            
            for (let p = 0; p < properties.length; p++) {
              const prop = properties[p];
              let val = 0;
              if (prop.type === 'float') {
                val = view.getFloat32(offset + propOffset, isLittleEndian);
                propOffset += 4;
              } else if (prop.type === 'double') {
                val = view.getFloat64(offset + propOffset, isLittleEndian);
                propOffset += 8;
              } else if (prop.type === 'int') {
                val = view.getInt32(offset + propOffset, isLittleEndian);
                propOffset += 4;
              } else if (prop.type === 'uchar' || prop.type === 'uint8') {
                val = view.getUint8(offset + propOffset);
                propOffset += 1;
              }
              vertexValues[prop.name] = val;
            }
            
            if (propIndices['x']) {
              positions.push(vertexValues['x'], vertexValues['y'], vertexValues['z']);
            }
            
            if (propIndices['red']) {
              const r = (vertexValues['red'] / 255) || 0.5;
              const g = (vertexValues['green'] / 255) || 0.5;
              const b = (vertexValues['blue'] / 255) || 0.5;
              colors.push(r, g, b);
            } else {
              colors.push(0.31, 0.765, 0.966);
            }
            offset += bytesPerVertex;
          }
        }
        
        console.log('[3D VIEWER] Positions:', positions.length / 3, 'vertices');
        console.log('[3D VIEWER] Colors:', colors.length / 3, 'vertices');
        
        if (positions.length === 0) return null;
        
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        
        if (colors.length > 0) {
          geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
        }
        
        geometry.computeVertexNormals();
        
        return geometry;
      } catch (err) {
        console.error('[3D VIEWER] Parse error:', err);
        return null;
      }
    };

    // Parse a render
    const geometry = parsePLY(buffer);
    
    if (geometry) {
      const material = new THREE.PointsMaterial({ 
        size: 0.5,
        vertexColors: true,
        sizeAttenuation: true
      });
      const points = new THREE.Points(geometry, material);
      
      const positionAttribute = geometry.getAttribute('position');
      const positions = positionAttribute.array as Float32Array;
      
      let sumX = 0, sumY = 0, sumZ = 0;
      for (let i = 0; i < positions.length; i += 3) {
        sumX += positions[i];
        sumY += positions[i + 1];
        sumZ += positions[i + 2];
      }
      const avgX = sumX / (positions.length / 3);
      const avgY = sumY / (positions.length / 3);
      const avgZ = sumZ / (positions.length / 3);
      
      let sumDistSq = 0;
      for (let i = 0; i < positions.length; i += 3) {
        const dx = positions[i] - avgX;
        const dy = positions[i + 1] - avgY;
        const dz = positions[i + 2] - avgZ;
        sumDistSq += dx * dx + dy * dy + dz * dz;
      }
      const stdDev = Math.sqrt(sumDistSq / (positions.length / 3));
      const threshold = avgX !== 0 || avgY !== 0 || avgZ !== 0 ? stdDev * 2 : 1e10;
      
      const filteredPositions = [];
      const filteredColors = [];
      let colorAttribute = geometry.getAttribute('color');
      const colors = colorAttribute ? (colorAttribute.array as Float32Array) : null;
      
      for (let i = 0; i < positions.length; i += 3) {
        const dx = positions[i] - avgX;
        const dy = positions[i + 1] - avgY;
        const dz = positions[i + 2] - avgZ;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist <= threshold) {
          filteredPositions.push(positions[i], positions[i + 1], positions[i + 2]);
          if (colors) {
            filteredColors.push(colors[i], colors[i + 1], colors[i + 2]);
          }
        }
      }
      
      const newGeometry = new THREE.BufferGeometry();
      newGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(filteredPositions), 3));
      if (filteredColors.length > 0) {
        newGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(filteredColors), 3));
      }
      
      newGeometry.computeBoundingBox();
      const center = new THREE.Vector3();
      newGeometry.boundingBox!.getCenter(center);
      
      newGeometry.translate(-center.x, -center.y, -center.z);
      
      const size = newGeometry.boundingBox!.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 50 / maxDim;
      newGeometry.scale(scale, scale, scale);
      
      points.geometry = newGeometry;
      
      // Vytvoriť skupinu pre model aby Q/E mohli otáčať
      const modelGroup = new THREE.Group();
      modelGroup.add(points);
      scene.add(modelGroup);
      
      // Uložiť referenciu na modelGroup pre keyboard handler
      (window as any).modelGroup = modelGroup;
      
      controls.target.set(0, 0, 0);
      controls.autoRotateSpeed = 1.5;
      controls.dampingFactor = 0.02;
      // Kamera na isometrickom uhle - dopredu a hore
      const camDist = maxDim * 1.2;
      camera.position.set(camDist * 0.7, camDist * 0.7, camDist * 0.7);
      controls.update();
      loadingDiv.style.display = 'none';
      
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    } else {
      loadingDiv.innerHTML = '<p style="color: red;">Chyba pri parsovaní modelu</p>';
    }
    
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    
    // Keyboard controls: Q/E pre rotáciu vľavo/vpravo, X/Z/Y pre otáčanie osí, Space para pause/resume
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === 'x' || key === 'z' || key === 'y') {
        // Otáčať OS (okolo ktorej sa pohybuje kamera)
        const target = controls.target;
        const delta = camera.position.clone().sub(target);
        const rotAmount = 0.1;  // 0.1 radiáns
        
        if (key === 'x') {
          // Rotovať okolo X osi
          const axis = new THREE.Vector3(1, 0, 0);
          delta.applyAxisAngle(axis, rotAmount);
        } else if (key === 'z') {
          // Rotovať okolo Z osi
          const axis = new THREE.Vector3(0, 0, 1);
          delta.applyAxisAngle(axis, rotAmount);
        } else if (key === 'y') {
          // Rotovať okolo Y osi
          const axis = new THREE.Vector3(0, 1, 0);
          delta.applyAxisAngle(axis, rotAmount);
        }
        
        camera.position.copy(target.clone().add(delta));
        controls.update();
      } else if (key === 'q' || key === 'e') {
        // Rotovať KAMERU doľava/doprava okolo modelu
        const target = controls.target;
        const delta = camera.position.clone().sub(target);
        let phi = Math.atan2(delta.z, delta.x);  // Horizontálny uhol
        const theta = Math.acos(delta.y / delta.length());  // Vertikálny uhol
        const radius = delta.length();
        
        const rotSpeed = 0.05;
        if (key === 'q') phi += rotSpeed;      // Q = kamera vľavo
        if (key === 'e') phi -= rotSpeed;      // E = kamera vpravo
        
        // Vypočítaj novú pozíciu kamery
        camera.position.x = target.x + radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = target.y + radius * Math.cos(theta);
        camera.position.z = target.z + radius * Math.sin(theta) * Math.sin(phi);
        
        controls.update();
      } else if (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright') {
        // Rotovať KAMERU hore/dole s šípkami
        const target = controls.target;
        const delta = camera.position.clone().sub(target);
        let phi = Math.atan2(delta.z, delta.x);  // Horizontálny uhol
        let theta = Math.acos(delta.y / delta.length());  // Vertikálny uhol
        const radius = delta.length();
        
        const rotSpeed = 0.05;
        if (key === 'arrowup') theta -= rotSpeed;      // Kamera hore
        if (key === 'arrowdown') theta += rotSpeed;    // Kamera dole
        
        // Ogranič vertikálny uhol aby kamera nebola pod zemou
        theta = Math.max(0.1, Math.min(Math.PI - 0.1, theta));
        
        // Vypočítaj novú pozíciu kamery
        camera.position.x = target.x + radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = target.y + radius * Math.cos(theta);
        camera.position.z = target.z + radius * Math.sin(theta) * Math.sin(phi);
        
        controls.update();
      } else if (e.code === 'Space') {
        // Pause/Resume orbit
        e.preventDefault();
        controls.autoRotate = !controls.autoRotate;
        console.log('[3D VIEWER] AutoRotate:', controls.autoRotate ? 'ON' : 'OFF');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  };

  // Načítaj Three.js ak sa používa model
  useEffect(() => {
    if (displayMode !== 'model') return;
    
    // @ts-ignore
    if (window.THREE && window.THREE.OrbitControls) return;

    const threeScript = document.createElement('script');
    threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    threeScript.onload = () => {
      const orbitScript = document.createElement('script');
      orbitScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
      orbitScript.onload = () => {
        console.log('[MEDIA VIEWER] Three.js loaded');
      };
      document.head.appendChild(orbitScript);
    };
    document.head.appendChild(threeScript);
  }, [displayMode]);

  if (loading) {
    return (
      <View style={[styles.container, { width, height }]}>
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          Načítavam médiá...
        </div>
      </View>
    );
  }

  if (!media || !media.has_media) {
    return (
      <View style={[styles.container, { width, height }]}>
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          Žiadne médiá dostupné
        </div>
      </View>
    );
  }

  const hasVideos = media.videos.length > 0;
  const hasModels = media.models.length > 0;

  return (
    <View style={[styles.container, { width, height }]}>
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Media Display */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            width: '100%',
            backgroundColor: '#1e3c72',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}
        />
        
        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: '10px',
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderTop: '1px solid #ddd',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          {/* Video Buttons */}
          {hasVideos && (
            <>
              <button
                onClick={() => setDisplayMode('video')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: displayMode === 'video' ? '#2196F3' : '#ddd',
                  color: displayMode === 'video' ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                🎬 Video ({media.videos.length})
              </button>
              
              {media.videos.length > 1 && displayMode === 'video' && (
                <select
                  value={selectedVideoIndex}
                  onChange={(e) => setSelectedVideoIndex(parseInt(e.target.value))}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                  }}
                >
                  {media.videos.map((video, idx) => (
                    <option key={idx} value={idx}>
                      {video.filename}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
          
          {/* Model Buttons */}
          {hasModels && (
            <>
              <button
                onClick={() => setDisplayMode('model')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: displayMode === 'model' ? '#4CAF50' : '#ddd',
                  color: displayMode === 'model' ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                🧊 Model PLY ({media.models.length})
              </button>
              
              {media.models.length > 1 && displayMode === 'model' && (
                <select
                  value={selectedModelIndex}
                  onChange={(e) => setSelectedModelIndex(parseInt(e.target.value))}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                  }}
                >
                  {media.models.map((model, idx) => (
                    <option key={idx} value={idx}>
                      {model.filename}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>
      </div>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
