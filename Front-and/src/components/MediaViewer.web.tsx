import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as apiClient from '../api/client';
import { API_BASE_URL } from '../api/client';

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
  const pointsMaterialRef = useRef<any>(null);
  
  const [media, setMedia] = useState<apiClient.ProjectMedia | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('none');
  const [loading, setLoading] = useState(true);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const [mediaCache_local, setMediaCache_local] = useState<{
    videos: Map<string, Blob>;
    models: Map<string, ArrayBuffer>;
  } | null>(null);
  const [pixelSize, setPixelSize] = useState(0.5);
  const [rotationAngle, setRotationAngle] = useState(261);
  const modelGroupRef = useRef<any>(null);
  const [showControlsInfo, setShowControlsInfo] = useState(false);
  const infoDivRef = useRef<HTMLDivElement | null>(null);
  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);
  const [centerZ, setCenterZ] = useState(0);
  const [maxDistance, setMaxDistance] = useState(100);
  const [maxDistanceLimit, setMaxDistanceLimit] = useState(100);
  const [showCenter, setShowCenter] = useState(true);
  const [filterDistanceActive, setFilterDistanceActive] = useState(true);
  const centerSphereRef = useRef<any>(null);
  const pointsRef = useRef<any>(null);
  const pointsDataRef = useRef<{
    scaledCentroid: THREE.Vector3;
    posArray: Float32Array;
    colorArray: Float32Array | null;
    material: THREE.Material;
  } | null>(null);

  // Načítaj nastavenia z localStorage pri inicializácii
  useEffect(() => {
    const settingsKey = `mediaViewer_settings_${projectId}`;
    const savedSettings = localStorage.getItem(settingsKey);
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        console.log('[MEDIA VIEWER] Loaded settings from localStorage:', settings);
        if (settings.pixelSize !== undefined) setPixelSize(settings.pixelSize);
        if (settings.rotationAngle !== undefined) setRotationAngle(settings.rotationAngle);
        if (settings.centerX !== undefined) setCenterX(settings.centerX);
        if (settings.centerY !== undefined) setCenterY(settings.centerY);
        if (settings.centerZ !== undefined) setCenterZ(settings.centerZ);
        if (settings.maxDistance !== undefined) setMaxDistance(settings.maxDistance);
        if (settings.showCenter !== undefined) setShowCenter(settings.showCenter);
        if (settings.filterDistanceActive !== undefined) setFilterDistanceActive(settings.filterDistanceActive);
      } catch (err) {
        console.error('[MEDIA VIEWER] Error loading settings:', err);
      }
    }
  }, [projectId]);

  // Ulož nastavenia do localStorage keď sa zmenia
  useEffect(() => {
    const settingsKey = `mediaViewer_settings_${projectId}`;
    const settings = {
      pixelSize,
      rotationAngle,
      centerX,
      centerY,
      centerZ,
      maxDistance,
      showCenter,
      filterDistanceActive,
    };
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    console.log('[MEDIA VIEWER] Saved settings to localStorage');
  }, [projectId, pixelSize, rotationAngle, centerX, centerY, centerZ, maxDistance, showCenter, filterDistanceActive]);

  // Načítaj všetky médiá (videá a modely) pri počiatočnom otvorení
  useEffect(() => {
    loadAllMedia();
  }, [projectId]);

  // Update material size when pixelSize changes
  useEffect(() => {
    if (pointsMaterialRef.current) {
      pointsMaterialRef.current.size = pixelSize;
    }
  }, [pixelSize]);

  // Update model rotation when rotationAngle changes
  useEffect(() => {
    if (modelGroupRef.current) {
      const radians = (rotationAngle * Math.PI) / 180;
      modelGroupRef.current.rotation.x = radians;
    }
  }, [rotationAngle]);

  // Update controls info visibility
  useEffect(() => {
    if (infoDivRef.current) {
      infoDivRef.current.style.display = showControlsInfo ? 'block' : 'none';
    }
  }, [showControlsInfo]);

  // Update center sphere visibility
  useEffect(() => {
    if (centerSphereRef.current) {
      centerSphereRef.current.visible = showCenter;
    }
  }, [showCenter]);

  // Update points based on maxDistance and filterDistanceActive
  useEffect(() => {
    if (!pointsRef.current || !pointsDataRef.current) return;
    
    const { scaledCentroid, posArray, colorArray, material } = pointsDataRef.current;
    
    const finalPositions = [];
    const finalColors = [];
    
    for (let i = 0; i < posArray.length; i += 3) {
      if (!filterDistanceActive) {
        // Show all points
        finalPositions.push(posArray[i], posArray[i + 1], posArray[i + 2]);
        if (colorArray) {
          finalColors.push(colorArray[i], colorArray[i + 1], colorArray[i + 2]);
        }
      } else {
        // Filter by distance
        const dx = posArray[i] - centerX;
        const dy = posArray[i + 1] - centerY;
        const dz = posArray[i + 2] - centerZ;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist <= maxDistance) {
          finalPositions.push(posArray[i], posArray[i + 1], posArray[i + 2]);
          if (colorArray) {
            finalColors.push(colorArray[i], colorArray[i + 1], colorArray[i + 2]);
          }
        }
      }
    }
    
    const finalGeometry = new THREE.BufferGeometry();
    finalGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(finalPositions), 3));
    if (finalColors.length > 0) {
      finalGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(finalColors), 3));
    }
    
    pointsRef.current.geometry.dispose();
    pointsRef.current.geometry = finalGeometry;
    
    // Update center sphere position
    if (centerSphereRef.current) {
      centerSphereRef.current.position.set(centerX, centerY, centerZ);
    }
  }, [maxDistance, centerX, centerY, centerZ, filterDistanceActive]);

  // Reset maxDistance when model changes
  useEffect(() => {
    setMaxDistance(maxDistanceLimit);
  }, [selectedModelIndex]);

  // Center position keyboard controls (I/K for X, J/L for Z, U/O for Y)
  useEffect(() => {
    if (displayMode !== 'model') return;

    const handleCenterKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const step = 0.5; // Step size for movement

      if (key === 'i') {
        setCenterX(prev => prev + step);
        e.preventDefault();
      } else if (key === 'k') {
        setCenterX(prev => prev - step);
        e.preventDefault();
      } else if (key === 'j') {
        setCenterZ(prev => prev + step);
        e.preventDefault();
      } else if (key === 'l') {
        setCenterZ(prev => prev - step);
        e.preventDefault();
      } else if (key === 'u') {
        setCenterY(prev => prev + step);
        e.preventDefault();
      } else if (key === 'o') {
        setCenterY(prev => prev - step);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleCenterKeyDown);
    return () => {
      window.removeEventListener('keydown', handleCenterKeyDown);
    };
  }, [displayMode]);

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
      setMedia({ videos: [], models: [], images: [], has_media: false, priority: null });
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
    infoDiv.style.display = 'none';
    infoDiv.innerHTML = `
      <div style="background: rgba(0, 0, 0, 0.5); padding: 8px 12px; border-radius: 4px; line-height: 1.6;">
        <strong>Ovládanie:</strong><br/>
        <strong>Q</strong> / <strong>E</strong> - Kamera vľavo/vpravo<br/>
        <strong>X</strong> / <strong>Z</strong> / <strong>Y</strong> - Rotovať osi<br/>
        <strong>SPACE</strong> - Pause/Resume orbit<br/>
        <strong>I</strong> / <strong>K</strong> - Stred X+/-<br/>
        <strong>J</strong> / <strong>L</strong> - Stred Z+/-<br/>
        <strong>U</strong> / <strong>O</strong> - Stred Y+/-<br/>
        <strong>Myš</strong> - Drag = Otáčanie, Scroll = Zoom
      </div>
    `;
    infoDivRef.current = infoDiv;
    
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
        size: pixelSize,
        vertexColors: true,
        sizeAttenuation: true
      });
      pointsMaterialRef.current = material;
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
      
      // Vypočítaj centroid (stred) z filtrovaných pozícií
      let sumCenterX = 0, sumCenterY = 0, sumCenterZ = 0;
      for (let i = 0; i < filteredPositions.length; i += 3) {
        sumCenterX += filteredPositions[i];
        sumCenterY += filteredPositions[i + 1];
        sumCenterZ += filteredPositions[i + 2];
      }
      const centerPointX = sumCenterX / (filteredPositions.length / 3);
      const centerPointY = sumCenterY / (filteredPositions.length / 3);
      const centerPointZ = sumCenterZ / (filteredPositions.length / 3);
      
      // Ulož centroid do state
      setCenterX(centerPointX);
      setCenterY(centerPointY);
      setCenterZ(centerPointZ);
      
      // Vypočítaj maximálnu vzdialenosť od stredu
      let maxDist = 0;
      for (let i = 0; i < filteredPositions.length; i += 3) {
        const dx = filteredPositions[i] - centerPointX;
        const dy = filteredPositions[i + 1] - centerPointY;
        const dz = filteredPositions[i + 2] - centerPointZ;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > maxDist) maxDist = dist;
      }
      setMaxDistanceLimit(maxDist);
      setMaxDistance(maxDist);
      
      const newGeometry = new THREE.BufferGeometry();
      newGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(filteredPositions), 3));
      if (filteredColors.length > 0) {
        newGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(filteredColors), 3));
      }
      
      newGeometry.computeBoundingBox();
      const center = new THREE.Vector3();
      newGeometry.boundingBox!.getCenter(center);
      
      // Uložiť centroid pred transláciou pre neskôr filter
      const centroidBeforeTranslate = { x: centerPointX, y: centerPointY, z: centerPointZ };
      
      newGeometry.translate(-center.x, -center.y, -center.z);
      
      const size = newGeometry.boundingBox!.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 50 / maxDim;
      newGeometry.scale(scale, scale, scale);
      
      // Aplikuj filter na základe maxDistance
      const scaledCentroid = new THREE.Vector3(
        (centroidBeforeTranslate.x - center.x) * scale,
        (centroidBeforeTranslate.y - center.y) * scale,
        (centroidBeforeTranslate.z - center.z) * scale
      );
      
      const positionAttr = newGeometry.getAttribute('position') as THREE.BufferAttribute;
      const posArray = Array.from(positionAttr.array as Float32Array);
      const colorAttr = newGeometry.getAttribute('color') as THREE.BufferAttribute | null;
      const colorArray = colorAttr ? Array.from(colorAttr.array as Float32Array) : null;
      
      const finalPositions = [];
      const finalColors = [];
      
      for (let i = 0; i < posArray.length; i += 3) {
        const dx = posArray[i] - scaledCentroid.x;
        const dy = posArray[i + 1] - scaledCentroid.y;
        const dz = posArray[i + 2] - scaledCentroid.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist <= maxDistance) {
          finalPositions.push(posArray[i], posArray[i + 1], posArray[i + 2]);
          if (colorArray) {
            finalColors.push(colorArray[i], colorArray[i + 1], colorArray[i + 2]);
          }
        }
      }
      
      const finalGeometry = new THREE.BufferGeometry();
      finalGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(finalPositions), 3));
      if (finalColors.length > 0) {
        finalGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(finalColors), 3));
      }
      
      points.geometry = finalGeometry;
      
      // Ulož pointsRef a data pre filter update
      pointsRef.current = points;
      pointsDataRef.current = {
        scaledCentroid,
        posArray: new Float32Array(posArray),
        colorArray: colorArray ? new Float32Array(colorArray) : null,
        material: material,
      };
      
      // Vytvoriť skupinu pre model aby Q/E mohli otáčať
      const modelGroup = new THREE.Group();
      modelGroup.add(points);
      
      // Vytvor sféru pre centroid
      const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
      const sphereMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFF0000, 
        emissive: 0xFF6666,
        emissiveIntensity: 0.5
      });
      const centerSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      centerSphere.position.copy(scaledCentroid);
      centerSphere.visible = showCenter;
      centerSphereRef.current = centerSphere;
      modelGroup.add(centerSphere);
      
      scene.add(modelGroup);
      
      // Uložiť referenciu na modelGroup pre rotation a keyboard handler
      modelGroupRef.current = modelGroup;
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
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: 'transparent' }}>
        {/* TOP SECTION - Three Columns */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', gap: '12px', minHeight: 0 }}>
          {/* LEFT PANEL - Controls Window */}
          <div style={{
            flex: 1,
            backgroundColor: 'transparent',
            borderRadius: '12px',
            border: 'none',
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'none',
          }}>
          {/* Video Buttons */}
          {hasVideos && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setDisplayMode('video')}
                style={{
                  padding: '8px 12px',
                  backgroundColor: displayMode === 'video' ? '#2196F3' : '#ddd',
                  color: displayMode === 'video' ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  width: '100%',
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
                    width: '100%',
                  }}
                >
                  {media.videos.map((video, idx) => (
                    <option key={idx} value={idx}>
                      {video.filename}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Pixel Size Control */}
          {displayMode === 'model' && hasModels && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingBottom: '12px',
              borderBottom: '1px solid #ddd',
            }}>
              <label style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#333',
              }}>
                📍 Pixely:
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={pixelSize}
                onChange={(e) => setPixelSize(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  cursor: 'pointer',
                }}
              />
              <input
                type="number"
                min="0.1"
                max="5"
                step="0.1"
                value={pixelSize.toFixed(1)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0.1 && val <= 5) {
                    setPixelSize(val);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                }}
              />
            </div>
          )}

          {/* Rotation Control */}
          {displayMode === 'model' && hasModels && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingBottom: '12px',
              borderBottom: '1px solid #ddd',
            }}>
              <label style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#333',
              }}>
                🔄 Rotácia X:
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={rotationAngle}
                onChange={(e) => setRotationAngle(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  cursor: 'pointer',
                }}
              />
              <input
                type="number"
                min="0"
                max="360"
                step="1"
                value={rotationAngle.toFixed(0)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= 360) {
                    setRotationAngle(val);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                }}
              />
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setRotationAngle(90)}
                  style={{
                    flex: 1,
                    minWidth: '50px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: rotationAngle === 90 ? '#FF9800' : '#ddd',
                    color: rotationAngle === 90 ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  90°
                </button>
                <button
                  onClick={() => setRotationAngle(180)}
                  style={{
                    flex: 1,
                    minWidth: '50px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: rotationAngle === 180 ? '#FF9800' : '#ddd',
                    color: rotationAngle === 180 ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  180°
                </button>
                <button
                  onClick={() => setRotationAngle(270)}
                  style={{
                    flex: 1,
                    minWidth: '50px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: rotationAngle === 270 ? '#FF9800' : '#ddd',
                    color: rotationAngle === 270 ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  270°
                </button>
                <button
                  onClick={() => setRotationAngle(0)}
                  style={{
                    flex: 1,
                    minWidth: '50px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: rotationAngle === 0 ? '#FF9800' : '#ddd',
                    color: rotationAngle === 0 ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  0°
                </button>
              </div>
            </div>
          )}

          {/* Model Buttons */}
          {hasModels && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid #ddd' }}>
              <button
                onClick={() => setDisplayMode('model')}
                style={{
                  padding: '8px 12px',
                  backgroundColor: displayMode === 'model' ? '#4CAF50' : '#ddd',
                  color: displayMode === 'model' ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  width: '100%',
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
                    width: '100%',
                  }}
                >
                  {media.models.map((model, idx) => (
                    <option key={idx} value={idx}>
                      {model.filename}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Center Position Display & Adjustment - Horizontal */}
          {displayMode === 'model' && hasModels && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingBottom: '12px',
              borderBottom: '1px solid #ddd',
            }}>
              <label style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#333',
              }}>
                ⊙ Stred (X, Y, Z):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  value={centerX.toFixed(2)}
                  onChange={(e) => setCenterX(parseFloat(e.target.value))}
                  step="0.1"
                  style={{
                    width: '70px',
                    padding: '4px 6px',
                    fontSize: '11px',
                    borderRadius: '3px',
                    border: '1px solid #ddd',
                  }}
                  placeholder="X"
                />
                <input
                  type="number"
                  value={centerY.toFixed(2)}
                  onChange={(e) => setCenterY(parseFloat(e.target.value))}
                  step="0.1"
                  style={{
                    width: '70px',
                    padding: '4px 6px',
                    fontSize: '11px',
                    borderRadius: '3px',
                    border: '1px solid #ddd',
                  }}
                  placeholder="Y"
                />
                <input
                  type="number"
                  value={centerZ.toFixed(2)}
                  onChange={(e) => setCenterZ(parseFloat(e.target.value))}
                  step="0.1"
                  style={{
                    width: '70px',
                    padding: '4px 6px',
                    fontSize: '11px',
                    borderRadius: '3px',
                    border: '1px solid #ddd',
                  }}
                  placeholder="Z"
                />
              </div>
            </div>
          )}

          {/* Distance Filter - Horizontal with Toggle */}
          {displayMode === 'model' && hasModels && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingBottom: '12px',
              borderBottom: '1px solid #ddd',
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#333',
                  whiteSpace: 'nowrap',
                }}>
                  📏 Vzdialenosť:
                </label>
                <input
                  type="number"
                  min="0"
                  max={maxDistanceLimit}
                  step="0.1"
                  value={maxDistance.toFixed(2)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= maxDistanceLimit) {
                      setMaxDistance(val);
                    }
                  }}
                  disabled={!filterDistanceActive}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    opacity: filterDistanceActive ? 1 : 0.5,
                    cursor: filterDistanceActive ? 'text' : 'not-allowed',
                  }}
                />
                <button
                  onClick={() => setFilterDistanceActive(!filterDistanceActive)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: filterDistanceActive ? '#4CAF50' : '#ccc',
                    color: filterDistanceActive ? 'white' : '#666',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {filterDistanceActive ? '✓ AKT' : '✗ OFF'}
                </button>
              </div>
            </div>
          )}

          {/* Center Visibility & Info Toggle */}
          {displayMode === 'model' && hasModels && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowCenter(!showCenter)}
                style={{
                  flex: 1,
                  minWidth: '80px',
                  padding: '6px 8px',
                  fontSize: '12px',
                  backgroundColor: showCenter ? '#FF6666' : '#ddd',
                  color: showCenter ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                ⊙ Stred
              </button>
              <button
                onClick={() => setShowControlsInfo(!showControlsInfo)}
                style={{
                  flex: 1,
                  minWidth: '80px',
                  padding: '6px 8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: showControlsInfo ? '#2196F3' : '#ddd',
                  color: showControlsInfo ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                ⓘ Help
              </button>
            </div>
          )}
        </div>
        {/* END LEFT PANEL */}

        {/* MIDDLE PANEL - Media Display Window */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            backgroundColor: '#1e3c72',
            borderRadius: '12px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        ></div>

        {/* RIGHT PANEL - Floor Plan */}
        <div style={{
          flex: 1,
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: 'none',
          display: media?.images && media.images.length > 0 ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          pointerEvents: media?.images && media.images.length > 0 ? 'auto' : 'none',
        }}>
          {media?.images && media.images.length > 0 ? (
            <img
              src={`${API_BASE_URL}/api/projects/${projectId}/media/image/${media.images[0].filename}`}
              alt="Floor Plan"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '8px',
              }}
              onError={(e) => {
                console.error('[MEDIA VIEWER] Image load error:', e);
                (e.target as HTMLImageElement).src = '/project/assets/images/floarPlanDefault.jpg';
              }}
            />
          ) : null}
        </div>
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
