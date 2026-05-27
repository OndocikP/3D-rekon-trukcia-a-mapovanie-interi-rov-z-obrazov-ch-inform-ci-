import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';

interface ThreeDViewerProps {
  modelUrl: string;
  token: string;
  width: number;
  height: number;
}

// Configure web worker path for development and production
const getPlyWorkerPath = () => {
  // In development, worker is at /src/workers/plyParser.worker.ts
  // In production, it's built to dist
  return new URL('../workers/plyParser.worker.ts', import.meta.url).href;
};

export const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ modelUrl, token, width, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);

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
      
      // Loading UI with progress
      const loadingDiv = document.createElement('div');
      loadingDiv.style.position = 'absolute';
      loadingDiv.style.top = '50%';
      loadingDiv.style.left = '50%';
      loadingDiv.style.transform = 'translate(-50%, -50%)';
      loadingDiv.style.color = 'white';
      loadingDiv.style.textAlign = 'center';
      loadingDiv.style.zIndex = '10';
      loadingDiv.innerHTML = `
        <div style="width: 60px; height: 60px; border: 4px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <p>Načítavam 3D model...</p>
        <div style="width: 200px; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; margin: 10px auto; overflow: hidden;">
          <div id="progressBar" style="width: 0%; height: 100%; background: #4fc3f7; transition: width 0.3s ease;"></div>
        </div>
        <p id="progressText" style="font-size: 12px; margin-top: 10px;">0%</p>
      `;
      
      const styleSheet = document.createElement('style');
      styleSheet.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(styleSheet);
      
      container.appendChild(loadingDiv);
      container.style.position = 'relative';

      // Initialize web worker for PLY parsing
      const initializeWorker = (): Promise<void> => {
        return new Promise((resolve) => {
          try {
            const workerCode = `
              self.onmessage = async (event) => {
                const { buffer, vertexCount, properties } = event.data;
                try {
                  const decoder = new TextDecoder('utf-8');
                  let headerEndByte = 0;
                  const bufferView = new Uint8Array(buffer);
                  
                  for (let i = 0; i < Math.min(buffer.byteLength, 50000); i++) {
                    if (bufferView[i] === 10) {
                      const chunk = decoder.decode(bufferView.slice(Math.max(0, i-10), i+1));
                      if (chunk.includes('end_header')) {
                        headerEndByte = i + 1;
                        break;
                      }
                    }
                  }
                  
                  const view = new DataView(buffer);
                  const positions = new Float32Array(vertexCount * 3);
                  const colors = new Float32Array(vertexCount * 3);
                  
                  let bytesPerVertex = 0;
                  properties.forEach((prop) => {
                    if (prop.type === 'float' || prop.type === 'int' || prop.type === 'uint') bytesPerVertex += 4;
                    else if (prop.type === 'double') bytesPerVertex += 8;
                    else if (prop.type === 'short' || prop.type === 'ushort') bytesPerVertex += 2;
                    else bytesPerVertex += 1;
                  });
                  
                  let offset = headerEndByte;
                  let vertexIdx = 0;
                  
                  for (let v = 0; v < vertexCount && offset + bytesPerVertex <= buffer.byteLength; v++) {
                    let propOffset = 0;
                    const vertexValues = {};
                    
                    for (let p = 0; p < properties.length; p++) {
                      const prop = properties[p];
                      let val = 0;
                      if (prop.type === 'float') {
                        val = view.getFloat32(offset + propOffset, true);
                        propOffset += 4;
                      } else if (prop.type === 'double') {
                        val = view.getFloat64(offset + propOffset, true);
                        propOffset += 8;
                      } else if (prop.type === 'int' || prop.type === 'uint') {
                        val = view.getInt32(offset + propOffset, true);
                        propOffset += 4;
                      } else if (prop.type === 'uchar' || prop.type === 'uint8') {
                        val = view.getUint8(offset + propOffset);
                        propOffset += 1;
                      }
                      vertexValues[prop.name] = val;
                    }
                    
                    positions[vertexIdx * 3] = vertexValues.x || 0;
                    positions[vertexIdx * 3 + 1] = vertexValues.y || 0;
                    positions[vertexIdx * 3 + 2] = vertexValues.z || 0;
                    
                    if (vertexValues.red !== undefined) {
                      colors[vertexIdx * 3] = vertexValues.red / 255;
                      colors[vertexIdx * 3 + 1] = vertexValues.green / 255;
                      colors[vertexIdx * 3 + 2] = vertexValues.blue / 255;
                    } else {
                      colors[vertexIdx * 3] = 0.31;
                      colors[vertexIdx * 3 + 1] = 0.765;
                      colors[vertexIdx * 3 + 2] = 0.968;
                    }
                    
                    offset += bytesPerVertex;
                    vertexIdx++;
                    
                    if (vertexIdx % 100000 === 0) {
                      self.postMessage({ type: 'progress', progress: vertexIdx / vertexCount });
                    }
                  }
                  
                  self.postMessage({
                    type: 'complete',
                    positions: positions.buffer,
                    colors: colors.buffer,
                    vertexCount: vertexIdx,
                  }, [positions.buffer, colors.buffer]);
                } catch (error) {
                  self.postMessage({ type: 'error', error: String(error) });
                }
              };
            `;
            
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const worker = new Worker(URL.createObjectURL(blob));
            workerRef.current = worker;
            console.log('[3D VIEWER] ✅ Web Worker initialized');
            resolve();
          } catch (err) {
            console.warn('[3D VIEWER] ⚠️  Web Worker initialization failed, will use sync parsing', err);
            resolve();
          }
        });
      };
      
      // @ts-ignore
      const parsePLYWithWorker = async (data: ArrayBuffer): Promise<THREE.BufferGeometry | null> => {
        return new Promise((resolve) => {
          try {
            // Parse header
            const headerSize = Math.min(50000, data.byteLength);
            const headerText = new TextDecoder().decode(new Uint8Array(data.slice(0, headerSize)));
            const lines = headerText.split('\n');
            
            let vertexCount = 0;
            const properties: any[] = [];
            
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('element vertex')) {
                vertexCount = parseInt(trimmed.split(' ')[2]);
              } else if (trimmed.startsWith('property')) {
                const parts = trimmed.split(' ');
                properties.push({ type: parts[1], name: parts[2] });
              } else if (trimmed === 'end_header') {
                break;
              }
            }
            
            console.log('[3D VIEWER] PLY: ' + vertexCount + ' vertices, ' + properties.length + ' properties');
            
            if (!workerRef.current) {
              console.warn('[3D VIEWER] No worker available');
              resolve(null);
              return;
            }
            
      // Setup worker message handler
      const handleMessage = (event: MessageEvent) => {
              const { type, progress, positions, colors, error } = event.data;
              
              if (type === 'progress') {
                const percent = Math.round(progress * 100);
                const bar = document.getElementById('progressBar');
                const text = document.getElementById('progressText');
                if (bar) bar.style.width = percent + '%';
                if (text) text.textContent = percent + '%';
              } else if (type === 'complete') {
                console.log('[3D VIEWER] ✅ Worker parsing complete');
                workerRef.current!.onmessage = null;
                
                // @ts-ignore
                const geometry = new THREE.BufferGeometry();
                const posArray = new Float32Array(positions);
                const colorArray = new Float32Array(colors);
                
                // @ts-ignore
                geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
                if (colorArray.length > 0) {
                  // @ts-ignore
                  geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
                }
                geometry.computeVertexNormals();
                resolve(geometry);
              } else if (type === 'error') {
                console.error('[3D VIEWER] Worker error:', error);
                workerRef.current!.onmessage = null;
                resolve(null);
              }
            };
            
            workerRef.current.onmessage = handleMessage;
            workerRef.current.onerror = (err) => {
              console.error('[3D VIEWER] Worker error event:', err);
              workerRef.current!.onmessage = null;
              resolve(null);
            };
            
            // Send to worker
            workerRef.current.postMessage(
              { buffer: data, vertexCount, properties },
              [data]
            );
            
          } catch (err) {
            console.error('[3D VIEWER] Error setting up worker parsing:', err);
            resolve(null);
          }
        });
      };
      
      const loadPLY = async () => {
        try {
          console.log('[3D VIEWER] 📥 Starting PLY load from:', modelUrl);
          
          // Initialize worker
          await initializeWorker();
          
          // Fetch model
          const response = await fetch(modelUrl, { 
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (!response.ok) throw new Error('HTTP ' + response.status);
          
          const buffer = await response.arrayBuffer();
          const sizeInMB = (buffer.byteLength / 1024 / 1024).toFixed(2);
          console.log('[3D VIEWER] ✅ Downloaded ' + sizeInMB + ' MB');
          
          // Parse with worker
          const geometry = await parsePLYWithWorker(buffer);
          
          if (geometry) {
            const material = new THREE.PointsMaterial({ 
              size: 0.5,
              vertexColors: true,
              sizeAttenuation: true
            });
            const points = new THREE.Points(geometry, material);
            
            // Získaj pozície bodov
            const positionAttribute = geometry.getAttribute('position');
            const positions = positionAttribute.array as Float32Array;
            
            // Vypočítaj priemer pozícií
            let sumX = 0, sumY = 0, sumZ = 0;
            for (let i = 0; i < positions.length; i += 3) {
              sumX += positions[i];
              sumY += positions[i + 1];
              sumZ += positions[i + 2];
            }
            const avgX = sumX / (positions.length / 3);
            const avgY = sumY / (positions.length / 3);
            const avgZ = sumZ / (positions.length / 3);
            
            // Vypočítaj štandardnú odchýlku a odstráň outliers
            let sumDistSq = 0;
            for (let i = 0; i < positions.length; i += 3) {
              const dx = positions[i] - avgX;
              const dy = positions[i + 1] - avgY;
              const dz = positions[i + 2] - avgZ;
              sumDistSq += dx * dx + dy * dy + dz * dz;
            }
            const stdDev = Math.sqrt(sumDistSq / (positions.length / 3));
            const threshold = avgX !== 0 || avgY !== 0 || avgZ !== 0 ? stdDev * 2 : 1e10;
            
            // Vytvor nové pole bez outliers
            const filteredPositions = [];
            const filteredColors = [];
            let colorAttribute = geometry.getAttribute('color');
            const colors = colorAttribute ? (colorAttribute.array as Float32Array) : null;
            
            for (let i = 0; i < positions.length; i += 3) {
              const dx = positions[i] - avgX;
              const dy = positions[i + 1] - avgY;
              const dz = positions[i + 2] - avgZ;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              
              // Zahrň bod len ak nie je príliš ďaleko
              if (dist <= threshold) {
                filteredPositions.push(positions[i], positions[i + 1], positions[i + 2]);
                if (colors) {
                  filteredColors.push(colors[i], colors[i + 1], colors[i + 2]);
                }
              }
            }
            
            // Vytvor novú geometriu s odfiltovanými dátami
            const newGeometry = new THREE.BufferGeometry();
            newGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(filteredPositions), 3));
            if (filteredColors.length > 0) {
              newGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(filteredColors), 3));
            }
            
            // Vypočítaj nový stred bez outliers
            newGeometry.computeBoundingBox();
            const center = new THREE.Vector3();
            newGeometry.boundingBox!.getCenter(center);
            
            // Preloží geometriu tak, aby bol jej stred v počiatku (0,0,0)
            newGeometry.translate(-center.x, -center.y, -center.z);
            // Otáči model o 180 stupňov okolo osi X
            newGeometry.rotateX(Math.PI);
            
            const size = newGeometry.boundingBox!.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 50 / maxDim;
            newGeometry.scale(scale, scale, scale);
            
            points.geometry = newGeometry;
            scene.add(points);
            
            // Nastavuje bod rotácie na stred modelu (0,0,0)
            controls.target.set(0, 0, 0);
            controls.autoRotateSpeed = 1.5;
            controls.dampingFactor = 0.02;
            camera.position.z = maxDim * 1.5;
            controls.update();
            loadingDiv.style.display = 'none';
            animate();
            console.log('[3D VIEWER] ✅ Scene ready!');
          } else {
            loadingDiv.innerHTML = '<p style="color: red;">Chyba pri parsovaní modelu</p>';
          }
        } catch (err) {
          console.error('[3D VIEWER] ❌ Load error:', err);
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
        console.log('[3D VIEWER] Cleaning up...');
        window.removeEventListener('resize', handleResize);
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        container.innerHTML = '';
        renderer.dispose();
      };
    };
    
    loadThreeJS();
  }, [modelUrl, token]);

  return (
    <View style={{ width: width || '100%', height: height || '100%', borderRadius: 8, overflow: 'hidden', backgroundColor: '#1e3c72' }} collapsable={false}>
      {/* @ts-ignore */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </View>
  );
};
