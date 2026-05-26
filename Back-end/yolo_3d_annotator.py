#!/usr/bin/env python3
"""
YOLO 3D Object Annotator
Detekuje objekty pomocou YOLO a projektuje ich do 3D priestoru COLMAP kamier.
Vytvorí annotovaný PLY model s detekovanými objektmi.
"""

import json
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import sys
from collections import defaultdict
import struct

# YOLO colors pre rôzne objekty (BGR format pre OpenCV)
OBJECT_COLORS = {
    'person': (0, 255, 0),        # Zelená
    'bed': (255, 0, 0),           # Modrá
    'chair': (0, 255, 255),       # Žltá
    'table': (255, 0, 255),       # Magenta
    'monitor': (255, 255, 0),     # Svetlomodrá
    'laptop': (128, 0, 128),      # Purpura
    'phone': (255, 128, 0),       # Oranžová
    'keyboard': (0, 128, 255),    # Červená
    'cup': (0, 128, 0),           # Tmavá zelená
    'bottle': (128, 128, 0),      # Tyrkysová
}

# Default farba pre neznáme objekty
DEFAULT_COLOR = (128, 128, 128)  # Sivá


class YOLOCamera:
    """
    Reprezentácia kamery z COLMAP transforms.json s podporou 3D projekcií.
    """
    
    def __init__(self, frame_data: dict):
        """
        Args:
            frame_data: Dict z transforms.json s camera matricou a parametrami
        """
        self.file_path = frame_data.get('file_path', '')
        self.transform_matrix = np.array(frame_data.get('transform_matrix', []))
        self.colmap_im_id = frame_data.get('colmap_im_id', 0)
        
        # Camera intrinsics z parent transforms.json
        self.fx = None
        self.fy = None
        self.cx = None
        self.cy = None
        self.image_width = None
        self.image_height = None
        
    def set_intrinsics(self, fx: float, fy: float, cx: float, cy: float, 
                      width: int, height: int):
        """Nastav camera intrinsics"""
        self.fx = fx
        self.fy = fy
        self.cx = cx
        self.cy = cy
        self.image_width = width
        self.image_height = height
    
    def get_pose_matrix(self) -> np.ndarray:
        """Vráť world-to-camera transformačnú maticu (4x4)"""
        return self.transform_matrix.copy()
    
    def get_camera_matrix(self) -> np.ndarray:
        """Vráť camera intrinsic maticu (3x3)"""
        if self.fx is None:
            raise ValueError("Camera intrinsics not set")
        
        K = np.array([
            [self.fx, 0, self.cx],
            [0, self.fy, self.cy],
            [0, 0, 1]
        ])
        return K
    
    def project_point_to_2d(self, point_3d: np.ndarray) -> Optional[Tuple[int, int]]:
        """
        Projektuj 3D bod do 2D obrazu
        
        Args:
            point_3d: 3D bod v world coordinates [x, y, z]
            
        Returns:
            Tuple (u, v) alebo None ak bod nie je viditeľný
        """
        if self.fx is None:
            raise ValueError("Camera intrinsics not set")
        
        # Transformuj bod do camera coordinates
        pose = self.get_pose_matrix()
        point_3d_h = np.array([point_3d[0], point_3d[1], point_3d[2], 1.0])
        point_cam = pose @ point_3d_h
        
        # Skontroluj či bod je pred kamerou
        if point_cam[2] <= 0:
            return None
        
        # Projektuj pomocou intrinsic matrice
        point_cam_3 = point_cam[:3]
        K = self.get_camera_matrix()
        point_2d = K @ point_cam_3
        
        u = int(point_2d[0] / point_2d[2])
        v = int(point_2d[1] / point_2d[2])
        
        # Skontroluj či je bod v rámci obrazu
        if 0 <= u < self.image_width and 0 <= v < self.image_height:
            return (u, v)
        
        return None


class YOLO3DAnnotator:
    """
    Hlavná trieda na detekciu YOLO objektov a ich projekciu do 3D priestoru.
    """
    
    def __init__(self, transforms_json_path: Path, images_dir: Path):
        """
        Args:
            transforms_json_path: Cesta k transforms.json z COLMAP/NeRFStudio
            images_dir: Priečinok s obrázkami
        """
        self.transforms_json_path = transforms_json_path
        self.images_dir = images_dir
        self.transforms_data = None
        self.cameras: List[YOLOCamera] = []
        self.detections: Dict[int, List[Dict]] = defaultdict(list)
        self.object_points_3d: List[np.ndarray] = []
        self.object_colors: List[Tuple[int, int, int]] = []
        self.object_classes: List[str] = []
        self.object_confidence: List[float] = []
        self.image_paths_by_idx: Dict[int, Path] = {}  # Mapovanie indexu na skutočnú cestu obrázku
        
        self._load_transforms()
    
    def _load_transforms(self):
        """Načítaj transforms.json a namapuj obrázky"""
        print(f"\n📄 Načítavam transforms.json: {self.transforms_json_path}")
        
        with open(self.transforms_json_path, 'r') as f:
            self.transforms_data = json.load(f)
        
        # Načítaj camera intrinsics
        fx = self.transforms_data.get('fl_x', self.transforms_data.get('fl_x'))
        fy = self.transforms_data.get('fl_y', self.transforms_data.get('fl_y'))
        cx = self.transforms_data.get('cx')
        cy = self.transforms_data.get('cy')
        width = self.transforms_data.get('w')
        height = self.transforms_data.get('h')
        
        print(f"   Camera intrinsics: fx={fx}, fy={fy}, cx={cx}, cy={cy}")
        print(f"   Resolution: {width}x{height}")
        
        # Nájdi všetky obrázky v priečinku (ako fallback)
        all_images = sorted(self.images_dir.glob("*.jpg")) + sorted(self.images_dir.glob("*.png")) + sorted(self.images_dir.glob("*.JPG")) + sorted(self.images_dir.glob("*.PNG"))
        all_images = list(dict.fromkeys(all_images))  # Odstraň duplikáty
        
        # Vytvor camera objekty
        for idx, frame in enumerate(self.transforms_data.get('frames', [])):
            camera = YOLOCamera(frame)
            camera.set_intrinsics(fx, fy, cx, cy, width, height)
            self.cameras.append(camera)
            
            # Pokúsená nájsť skutočný obrázok
            image_path = self._find_image_path(idx, frame.get('file_path', ''), all_images)
            if image_path:
                self.image_paths_by_idx[idx] = image_path
        
        print(f"   ✅ Načítaných {len(self.cameras)} kamier")
        print(f"   ✅ Mapovaných obrázkov: {len(self.image_paths_by_idx)}")
    
    def _find_image_path(self, idx: int, file_path_from_json: str, all_images: List[Path]) -> Optional[Path]:
        """
        Nájdi skutočný obrázok pre danú kameru.
        Pokúša sa viaceré metódy na mapovanie.
        
        Args:
            idx: Index kamery (0, 1, 2, ...)
            file_path_from_json: Pôvodná cesta z transforms.json
            all_images: Všetky dostupné obrázky v priečinku
            
        Returns:
            Cesta k obrázku alebo None
        """
        # Metóda 1: Priama cesta z transforms.json
        if file_path_from_json:
            file_path = file_path_from_json.lstrip('/')
            if file_path.startswith('images/'):
                file_path = file_path[7:]
            image_path = self.images_dir / file_path
            if image_path.exists():
                return image_path
        
        # Metóda 2: Mapovanie podľa indexu (image-1.jpg, image-2.jpg, ...) 
        if idx < len(all_images):
            return all_images[idx]
        
        return None
    
    def run_yolo_detection(self, yolo_model_path: str = "yolov8l.pt", 
                          confidence_threshold: float = 0.5) -> Dict:
        """
        Spusti YOLO detekciu na všetky obrázky
        
        Args:
            yolo_model_path: Cesta k YOLO modelu
            confidence_threshold: Minimálna confidence pre detekcie
            
        Returns:
            Dict s počtom detekovaných objektov
        """
        print(f"\n🤖 Spúšťam YOLO detekciu...")
        print(f"   Model: {yolo_model_path}")
        print(f"   Threshold: {confidence_threshold}\n")
        
        try:
            from ultralytics import YOLO
        except ImportError:
            print("❌ Ultralytics nie je nainštalovaný")
            print("   Inštaluj: pip install ultralytics")
            return {}
        
        # Načítaj model
        model = YOLO(yolo_model_path)
        
        object_counts = defaultdict(int)
        
        for idx, camera in enumerate(self.cameras):
            # Použi mapovaný obrázok
            if idx not in self.image_paths_by_idx:
                print(f"   ⚠️  Obrázok #{idx+1} nenájdený (skúsené: {camera.file_path})")
                continue
            
            image_path = self.image_paths_by_idx[idx]
            
            if not image_path.exists():
                print(f"   ⚠️  Obrázok neexistuje: {image_path}")
                continue
            
            # Spusti detekciu
            results = model(str(image_path), conf=confidence_threshold, verbose=False)
            
            # Spracuj výsledky
            for result in results:
                for box in result.boxes:
                    # Extrahuj detekcie
                    confidence = float(box.conf[0])
                    class_id = int(box.cls[0])
                    class_name = model.names[class_id]
                    
                    # Bounding box
                    x1, y1, x2, y2 = map(float, box.xyxy[0])
                    
                    # Střed bbox
                    u_center = (x1 + x2) / 2
                    v_center = (y1 + y2) / 2
                    
                    self.detections[idx].append({
                        'class_name': class_name,
                        'class_id': class_id,
                        'confidence': confidence,
                        'bbox': (x1, y1, x2, y2),
                        'center_2d': (u_center, v_center),
                        'camera_idx': idx
                    })
                    
                    object_counts[class_name] += 1
            
            if idx % 10 == 0:
                print(f"   ⏳ Spracovaných {idx+1}/{len(self.cameras)} obrázkov")
        
        print(f"\n   ✅ YOLO detekcia ukončená!")
        print(f"   Počet detekovaných objektov:")
        for obj_class, count in sorted(object_counts.items(), key=lambda x: -x[1]):
            print(f"      • {obj_class}: {count}")
        
        return dict(object_counts)
    
    def project_detections_to_3d(self, sparse_pc_path: Optional[Path] = None,
                                 distance_estimate: float = 2.0) -> int:
        """
        Projektuj YOLO detekcie z 2D do 3D priestoru.
        Použije sparse point cloud na odhad hĺbky.
        
        Args:
            sparse_pc_path: Cesta k sparse point cloud (PLY)
            distance_estimate: Odhad vzdialenosti od kamery ak nie je PC (v metroch)
            
        Returns:
            Počet projektovaných 3D bodov
        """
        print(f"\n🎯 Projektujem detekcie do 3D priestoru...")
        
        # Načítaj sparse point cloud ak existuje
        sparse_points = None
        if sparse_pc_path and sparse_pc_path.exists():
            print(f"   📦 Načítavam sparse point cloud: {sparse_pc_path}")
            sparse_points = self._load_ply_points(sparse_pc_path)
            print(f"      Počet bodov: {len(sparse_points)}")
        
        projected_count = 0
        
        for camera_idx, detections in self.detections.items():
            camera = self.cameras[camera_idx]
            
            for detection in detections:
                # Odhad hĺbky pomocou sparse point cloud
                depth = self._estimate_depth_for_detection(
                    detection, camera, sparse_points, distance_estimate
                )
                
                if depth is None:
                    continue
                
                # Projektuj 2D bod do 3D s odhadnutou hĺbkou
                point_3d = self._unproject_2d_to_3d(
                    detection['center_2d'], depth, camera
                )
                
                if point_3d is not None:
                    color = OBJECT_COLORS.get(
                        detection['class_name'].lower(), 
                        DEFAULT_COLOR
                    )
                    
                    self.object_points_3d.append(point_3d)
                    self.object_colors.append(color)
                    self.object_classes.append(detection['class_name'])
                    self.object_confidence.append(detection['confidence'])
                    
                    projected_count += 1
        
        print(f"   ✅ Projektovaných bodov: {projected_count}")
        return projected_count
    
    def _estimate_depth_for_detection(self, detection: Dict, camera: YOLOCamera,
                                      sparse_points: Optional[np.ndarray],
                                      default_distance: float) -> Optional[float]:
        """
        Odhadni hĺbku detekcie pomocou sparse point cloudu.
        """
        if sparse_points is None:
            return default_distance
        
        # Projektuj sparse body do obrazu
        visible_depths = []
        
        for point in sparse_points:
            pixel = camera.project_point_to_2d(point)
            if pixel is None:
                continue
            
            u, v = pixel
            x1, y1, x2, y2 = detection['bbox']
            
            # Skontroluj či bod je v bounding boxe
            if x1 <= u <= x2 and y1 <= v <= y2:
                # Vypočítaj hĺbku bodu
                pose = camera.get_pose_matrix()
                point_h = np.array([point[0], point[1], point[2], 1.0])
                point_cam = pose @ point_h
                if point_cam[2] > 0:
                    visible_depths.append(point_cam[2])
        
        if visible_depths:
            return np.median(visible_depths)
        
        return default_distance
    
    def _unproject_2d_to_3d(self, pixel_2d: Tuple[float, float], 
                            depth: float, camera: YOLOCamera) -> Optional[np.ndarray]:
        """
        Projektuj 2D pixel s hĺbkou do 3D world coordinates.
        """
        u, v = pixel_2d
        
        # Normalizované camera coordinates
        x_norm = (u - camera.cx) / camera.fx
        y_norm = (v - camera.cy) / camera.fy
        
        # 3D bod v camera coordinates
        point_cam = np.array([x_norm * depth, y_norm * depth, depth, 1.0])
        
        # Transformuj do world coordinates
        # Camera matrix je world-to-camera, takže jej inverzia je camera-to-world
        pose = camera.get_pose_matrix()
        pose_inv = np.linalg.inv(pose)
        
        point_world = pose_inv @ point_cam
        
        return point_world[:3]
    
    def _load_ply_points(self, ply_path: Path) -> np.ndarray:
        """Načítaj body z PLY súboru"""
        import struct
        
        points = []
        with open(ply_path, 'rb') as f:
            # Preskočí PLY header
            while True:
                line = f.readline().decode('utf-8').strip()
                if line == 'end_header':
                    break
            
            # Načítaj vertices
            while True:
                try:
                    vertex = struct.unpack('fff', f.read(12))
                    points.append(vertex)
                except:
                    break
        
        return np.array(points) if points else np.array([])
    
    def save_annotated_ply(self, output_path: Path):
        """
        Ulož detekované objekty ako annotovaný PLY súbor.
        """
        print(f"\n💾 Ukladám annotovaný PLY: {output_path}")
        
        if not self.object_points_3d:
            print(f"   ❌ Žiadne body na uloženie!")
            return
        
        with open(output_path, 'w') as f:
            # PLY header
            f.write("ply\n")
            f.write("format ascii 1.0\n")
            f.write(f"element vertex {len(self.object_points_3d)}\n")
            f.write("property float x\n")
            f.write("property float y\n")
            f.write("property float z\n")
            f.write("property uchar red\n")
            f.write("property uchar green\n")
            f.write("property uchar blue\n")
            f.write("property float confidence\n")
            f.write("end_header\n")
            
            # Vertices
            for i, point in enumerate(self.object_points_3d):
                color = self.object_colors[i]
                confidence = self.object_confidence[i]
                
                # BGR to RGB
                r, g, b = color[2], color[1], color[0]
                
                f.write(f"{point[0]} {point[1]} {point[2]} ")
                f.write(f"{r} {g} {b} {confidence}\n")
        
        print(f"   ✅ Uložených bodov: {len(self.object_points_3d)}")
        print(f"      📍 {output_path}")


def process_project_with_yolo_3d(project_dir: Path, sparse_pc_path: Optional[Path] = None,
                                 yolo_model: str = "yolov8l.pt",
                                 yolo_confidence: float = 0.5,
                                 distance_estimate: float = 2.0) -> bool:
    """
    Úplný pipeline na detekciu YOLO objektov a ich 3D projekciu.
    
    Args:
        project_dir: Priečinok projektu s transforms.json
        sparse_pc_path: Cesta k sparse point cloud
        yolo_model: Cesta k YOLO modelu
        yolo_confidence: Confidence threshold pre YOLO
        distance_estimate: Odhad vzdialenosti od kamery
        
    Returns:
        True ak bolo úspešné, False inak
    """
    print("\n" + "="*60)
    print("🎯 YOLO 3D Object Annotator")
    print("="*60)
    
    # Nájdi súbory
    transforms_path = project_dir / "processed" / "step1" / "transforms.json"
    images_dir = project_dir / "images"
    
    if not transforms_path.exists():
        print(f"❌ transforms.json neexistuje: {transforms_path}")
        return False
    
    if not images_dir.exists():
        print(f"❌ Priečinok s obrázkami neexistuje: {images_dir}")
        return False
    
    # Vytvor annotator
    annotator = YOLO3DAnnotator(transforms_path, images_dir)
    
    # Spusti YOLO detekciu
    object_counts = annotator.run_yolo_detection(yolo_model, yolo_confidence)
    
    if not object_counts:
        print(f"⚠️  Žiadne objekty detekované")
        return False
    
    # Projektuj do 3D
    projected = annotator.project_detections_to_3d(sparse_pc_path, distance_estimate)
    
    if projected == 0:
        print(f"⚠️  Žiadne body projektované")
        return False
    
    # Ulož
    output_path = project_dir / "processed" / "step1" / "objects_3d.ply"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    annotator.save_annotated_ply(output_path)
    
    print("\n" + "="*60)
    print("✅ Hotovo!")
    print("="*60 + "\n")
    
    return True


if __name__ == "__main__":
    # Test
    if len(sys.argv) > 1:
        project_path = Path(sys.argv[1])
        process_project_with_yolo_3d(project_path)
