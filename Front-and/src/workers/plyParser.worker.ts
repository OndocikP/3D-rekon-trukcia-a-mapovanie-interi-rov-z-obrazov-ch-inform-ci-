// PLY Parser Web Worker - parses PLY files off main thread
self.onmessage = async (event: MessageEvent) => {
  const { buffer, vertexCount, properties } = event.data;
  
  try {
    console.log('[PLY WORKER] Starting parse, buffer size:', buffer.byteLength, 'vertices:', vertexCount);
    
    // Find header end
    const decoder = new TextDecoder('utf-8');
    let headerEndByte = 0;
    for (let i = 0; i < Math.min(buffer.byteLength, 50000); i++) {
      if (buffer[i] === 10) { // \n
        const chunk = decoder.decode(buffer.slice(Math.max(0, i-10), i+1));
        if (chunk.includes('end_header')) {
          headerEndByte = i + 1;
          break;
        }
      }
    }
    
    console.log('[PLY WORKER] Header ends at:', headerEndByte);
    
    const view = new DataView(buffer);
    
    // Determine format
    const headerStr = decoder.decode(buffer.slice(0, headerEndByte));
    const formatMatch = headerStr.match(/format\s+(\S+)/);
    const format = formatMatch ? formatMatch[1] : 'ascii';
    
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    
    if (format === 'binary_little_endian' || format === 'binary_big_endian') {
      const isLittleEndian = format === 'binary_little_endian';
      
      let bytesPerVertex = 0;
      const propIndices: any = {};
      properties.forEach((prop: any) => {
        propIndices[prop.name] = prop;
        if (prop.type === 'float' || prop.type === 'int' || prop.type === 'uint') bytesPerVertex += 4;
        else if (prop.type === 'double') bytesPerVertex += 8;
        else if (prop.type === 'short' || prop.type === 'ushort') bytesPerVertex += 2;
        else bytesPerVertex += 1;
      });
      
      console.log('[PLY WORKER] Bytes per vertex:', bytesPerVertex);
      
      let offset = headerEndByte;
      let vertexIdx = 0;
      
      for (let v = 0; v < vertexCount && offset + bytesPerVertex <= buffer.byteLength; v++) {
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
          } else if (prop.type === 'int' || prop.type === 'uint') {
            val = view.getInt32(offset + propOffset, isLittleEndian);
            propOffset += 4;
          } else if (prop.type === 'uchar' || prop.type === 'uint8') {
            val = view.getUint8(offset + propOffset);
            propOffset += 1;
          }
          
          vertexValues[prop.name] = val;
        }
        
        // Store position
        positions[vertexIdx * 3] = vertexValues.x || 0;
        positions[vertexIdx * 3 + 1] = vertexValues.y || 0;
        positions[vertexIdx * 3 + 2] = vertexValues.z || 0;
        
        // Store color (default blue if not present)
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
        
        // Progress update every 100K vertices
        if (vertexIdx % 100000 === 0) {
          self.postMessage({ type: 'progress', progress: vertexIdx / vertexCount });
        }
      }
      
      console.log('[PLY WORKER] Parsed vertices:', vertexIdx);
      
      self.postMessage({
        type: 'complete',
        positions: positions.buffer,
        colors: colors.buffer,
        vertexCount: vertexIdx,
      }, [positions.buffer, colors.buffer]);
    }
  } catch (error) {
    console.error('[PLY WORKER] Error:', error);
    self.postMessage({ type: 'error', error: String(error) });
  }
};
