import React, { useEffect, useRef } from 'react';

interface ThreeDViewerProps {
  modelUrl: string;
  token: string;
  width: number;
  height: number;
}

export const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ modelUrl, token, width, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    const container = containerRef.current;
    
    // Load Three.js from CDN
    const loadThreeJS = () => {
      // @ts-ignore
      if (window.THREE && window.THREE.OrbitControls) {
        initScene();
      } else {
        // Load THREE from CDN
        const threeScript = document.createElement('script');
        threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        threeScript.onload = () => {
          // Load OrbitControls from correct CDN path
          const orbitScript = document.createElement('script');
          orbitScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
          orbitScript.onload = () => {
            initScene();
          };
          orbitScript.onerror = () => {
            console.error('[3D VIEWER] Failed to load OrbitControls');
            if (containerRef.current) {
              containerRef.current.innerHTML = '<p style="color: red; padding: 20px;">Chyba pri načítaní knižnice OrbitControls</p>';
            }
          };
          document.head.appendChild(orbitScript);
        };
        threeScript.onerror = () => {
          console.error('[3D VIEWER] Failed to load THREE.js');
          if (containerRef.current) {
            containerRef.current.innerHTML = '<p style="color: red; padding: 20px;">Chyba pri načítaní knižnice Three.js</p>';
          }
        };
        document.head.appendChild(threeScript);
      }
    };
    
    const initScene = () => {
      // @ts-ignore
      const THREE = window.THREE;
      
      if (!THREE || !THREE.Scene) {
        console.error('[3D VIEWER] THREE.js not loaded');
        return;
      }
      
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1e3c72);
      scene.fog = new THREE.Fog(0x1e3c72, 100, 1000);
      
      const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        10000
      );
      camera.position.set(0, 0, 50);
      
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
      controls.autoRotateSpeed = 3;
      controls.enableZoom = true;
      
      const loadingDiv = document.createElement('div');
      loadingDiv.style.position = 'absolute';
      loadingDiv.style.top = '50%';
      loadingDiv.style.left = '50%';
      loadingDiv.style.transform = 'translate(-50%, -50%)';
      loadingDiv.style.color = 'white';
      loadingDiv.style.textAlign = 'center';
      loadingDiv.style.zIndex = '10';
      loadingDiv.innerHTML = '<div style="width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div><p>Načítavam 3D model...</p>';
      
      const styleSheet = document.createElement('style');
      styleSheet.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(styleSheet);
      
      container.appendChild(loadingDiv);
      container.style.position = 'relative';
      
      const parsePLY = (data: ArrayBuffer) => {
        try {
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
            } else if (line.startsWith('element vertex')) {
              vertexCount = parseInt(line.split(' ')[2]);
            } else if (line.startsWith('property')) {
              const parts = line.split(' ');
              properties.push({ type: parts[1], name: parts[2] });
            } else if (line === 'end_header') {
              headerEndLine = i;
              break;
            }
          }
          
          let headerEndByte = 0;
          for (let i = 0; i <= headerEndLine; i++) {
            headerEndByte += lines[i].length + 1;
          }
          
          const geometry = new THREE.BufferGeometry();
          const positions = [];
          const normals = [];
          
          if (format === 'ascii') {
            const dataLines = lines.slice(headerEndLine + 1);
            for (const line of dataLines) {
              if (!line.trim()) continue;
              const parts = line.trim().split(/\s+/);
              if (parts.length >= 3) {
                positions.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
                if (parts.length >= 6) {
                  normals.push(parseFloat(parts[3]), parseFloat(parts[4]), parseFloat(parts[5]));
                }
              }
            }
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
                }
                vertexValues[prop.name] = val;
              }
              
              if (propIndices['x']) {
                positions.push(vertexValues['x'], vertexValues['y'], vertexValues['z']);
              }
              if (propIndices['nx'] && vertexValues['nx'] !== undefined) {
                normals.push(vertexValues['nx'], vertexValues['ny'], vertexValues['nz']);
              }
              offset += bytesPerVertex;
            }
          }
          
          if (positions.length === 0) return null;
          
          geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
          if (normals.length > 0) {
            geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
          } else {
            geometry.computeVertexNormals();
          }
          return geometry;
        } catch (err) {
          console.error('[3D VIEWER] Parse error:', err);
          return null;
        }
      };
      
      const loadPLY = async () => {
        try {
          console.log('[3D VIEWER] Loading from:', modelUrl);
          const response = await fetch(modelUrl, { headers: { 'Authorization': 'Bearer ' + token } });
          if (!response.ok) throw new Error('HTTP ' + response.status);
          const buffer = await response.arrayBuffer();
          const geometry = parsePLY(buffer);
          
          if (geometry) {
            const material = new THREE.MeshPhongMaterial({ color: 0x4fc3f7, specular: 0x111111, shininess: 200, wireframe: false, flatShading: false });
            const mesh = new THREE.Mesh(geometry, material);
            geometry.computeBoundingBox();
            const center = new THREE.Vector3();
            geometry.boundingBox!.getCenter(center);
            geometry.translate(-center.x, -center.y, -center.z);
            const size = geometry.boundingBox!.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 50 / maxDim;
            geometry.scale(scale, scale, scale);
            scene.add(mesh);
            controls.target.copy(center);
            camera.position.z = maxDim * 1.5;
            controls.update();
            loadingDiv.style.display = 'none';
            animate();
          } else {
            loadingDiv.innerHTML = '<p style="color: red;">Chyba pri parsovaní modelu</p>';
          }
        } catch (err) {
          loadingDiv.innerHTML = '<p style="color: red;">Chyba: ' + (err instanceof Error ? err.message : 'unknown') + '</p>';
        }
      };
      
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      
      const handleResize = () => {
        if (!containerRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      
      window.addEventListener('resize', handleResize);
      loadPLY();
      
      return () => {
        window.removeEventListener('resize', handleResize);
        container.innerHTML = '';
        renderer.dispose();
      };
    };
    
    loadThreeJS();
  }, [modelUrl, token]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#1e3c72' }} />;
};
