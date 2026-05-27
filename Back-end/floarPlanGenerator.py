#!/usr/bin/env python3
"""
Floor Plan Generator - Generuje 6 ortogonálnych pohľadov z centrálnej pozície
Vyrába fotky z každej strany: hore, dole, vľavo, vpravo, dopredu, dozadu
"""

import sys
import json
import numpy as np
from pathlib import Path
import cv2
from PIL import Image, ImageDraw, ImageFont
import os

# Pokus sa importovať open3d pre point cloud
try:
    import open3d as o3d
    HAS_OPEN3D = True
except ImportError:
    HAS_OPEN3D = False
    print("⚠️  open3d not available, will use fallback PLY reader")


def read_ply_fallback(filepath):
    """
    Fallback PLY reader - čita PLY file bez open3d
    """
    points = []
    colors = []
    
    with open(filepath, 'r') as f:
        # Čítaj header
        header_done = False
        num_vertices = 0
        
        while not header_done:
            line = f.readline().strip()
            if line.startswith('element vertex'):
                num_vertices = int(line.split()[-1])
            elif line == 'end_header':
                header_done = True
        
        # Čítaj body
        for _ in range(num_vertices):
            parts = f.readline().split()
            if len(parts) >= 3:
                x, y, z = float(parts[0]), float(parts[1]), float(parts[2])
                points.append([x, y, z])
                
                # Pokus sa čítať aj farby (RGB)
                if len(parts) >= 6:
                    r, g, b = int(parts[3]), int(parts[4]), int(parts[5])
                    colors.append([r, g, b])
                else:
                    colors.append([128, 128, 128])  # Default šedá farba
    
    return np.array(points), np.array(colors)


def load_point_cloud(ply_filepath):
    """
    Načíta point cloud z PLY súboru
    """
    print(f"   📂 Načítavam point cloud z: {ply_filepath}")
    
    if not Path(ply_filepath).exists():
        raise FileNotFoundError(f"PLY file not found: {ply_filepath}")
    
    if HAS_OPEN3D:
        try:
            pcd = o3d.io.read_point_cloud(str(ply_filepath))
            points = np.asarray(pcd.points)
            colors = np.asarray(pcd.colors) if pcd.has_colors() else np.ones((len(points), 3)) * 0.5
            print(f"   ✅ Načítaných bodov: {len(points):,}")
            return points, colors
        except Exception as e:
            print(f"   ⚠️  open3d chyba: {e}, skúšam fallback reader...")
    
    # Fallback reader
    points, colors = read_ply_fallback(ply_filepath)
    print(f"   ✅ Načítaných bodov (fallback): {len(points):,}")
    return points, colors


def filter_points_by_distance(points, colors, center, max_distance):
    """
    Filtruje body a farby vzdialenejšie ako max_distance od centra
    """
    center = np.array([center[0], center[1], center[2]])
    distances = np.linalg.norm(points - center, axis=1)
    mask = distances <= max_distance
    filtered_points = points[mask]
    filtered_colors = colors[mask]
    
    print(f"   🔍 Body v rozsahu {max_distance}m: {len(filtered_points):,} z {len(points):,}")
    return filtered_points, filtered_colors


def project_points_perspective(points, colors, direction, center, camera_distance=50, image_size=1024, fov=60):
    """
    PERSPEKTÍVNA projekcia bodov - kamera je blízko a pozerá sa na centrum
    camera_distance: vzdialenosť kamery od centra (v jednotkách)
    fov: field of view v stupňoch
    """
    
    # Centralizuj body voči danému stredu
    center = np.array([center[0], center[1], center[2]])
    points_centered = points - center
    
    # Definuj view_dir a up_vector podľa smeru
    view_dir_map = {
        'top': np.array([0, 0, -1]),
        'bottom': np.array([0, 0, 1]),
        'left': np.array([-1, 0, 0]),
        'right': np.array([1, 0, 0]),
        'front': np.array([0, -1, 0]),
        'back': np.array([0, 1, 0]),
    }
    
    up_vector_map = {
        'top': np.array([0, -1, 0]),
        'bottom': np.array([0, 1, 0]),
        'left': np.array([0, 0, 1]),
        'right': np.array([0, 0, 1]),
        'front': np.array([0, 0, 1]),
        'back': np.array([0, 0, 1]),
    }
    
    if direction not in view_dir_map:
        raise ValueError(f"Unknown direction: {direction}")
    
    view_dir = view_dir_map[direction]
    up_vector = up_vector_map[direction]
    
    # Vypočítaj "right" vektor
    right_vector = np.cross(up_vector, view_dir)
    right_vector = right_vector / np.linalg.norm(right_vector)
    
    # Pozícia kamery: na opačnej strane (mimo centra) v smere view_dir
    camera_pos = -view_dir * camera_distance
    
    # Vektor od kamery k bodom
    points_from_camera = points_centered - camera_pos
    
    # Vzdialenosť bodov od kamery (depth)
    depth = np.dot(points_from_camera, view_dir)
    
    # Filtruj body ktoré sú vzadu od kamery
    valid_mask = depth > 0.1  # Aby sa nepriecinali s near plane
    
    if np.sum(valid_mask) == 0:
        raise ValueError("Žiadne body pred kamerou!")
    
    points_valid = points_from_camera[valid_mask]
    colors_valid = colors[valid_mask]
    depth_valid = depth[valid_mask]
    
    # Perspektívna projekcia
    # Vypočítaj focal length z FOV
    fov_rad = np.radians(fov)
    focal_length = (image_size / 2) / np.tan(fov_rad / 2)
    
    # Projekcia na 2D
    proj_x = focal_length * np.dot(points_valid, right_vector) / depth_valid
    proj_y = focal_length * np.dot(points_valid, up_vector) / depth_valid
    
    # Normalizuj na image_size
    proj_x_norm = proj_x + image_size / 2
    proj_y_norm = proj_y + image_size / 2
    
    proj_2d_norm = np.stack([proj_x_norm, proj_y_norm], axis=1)
    
    return proj_2d_norm, colors_valid


def project_points_orthogonal(points, colors, direction, center, image_size=1024, padding=1.2):
    """
    Ortogonálna projekcia bodov v danom smere s správnou orientáciou podľa up-vektora
    CENTROVANÁ NA DANÝ BOD - tak aby sa kamera pozerala zo stredu von
    
    Smery:
    - 'top': pohľad na -Z (zhora), up je -Y
    - 'bottom': pohľad na +Z (zdola), up je +Y
    - 'left': pohľad na -X (z ľava), up je +Z
    - 'right': pohľad na +X (z prava), up je +Z
    - 'front': pohľad na -Y (spredu), up je +Z
    - 'back': pohľad na +Y (z zadu), up je +Z
    
    Vracia 2D body a ich farby (RGB)
    """
    
    # DÔLEŽITÉ: Centralizuj body voči danému stredu
    center = np.array([center[0], center[1], center[2]])
    points_centered = points - center
    
    # Definuj view_dir a up_vector podľa smeru (TOTOŽNÉ s create_camera_frustum!)
    view_dir_map = {
        'top': np.array([0, 0, -1]),
        'bottom': np.array([0, 0, 1]),
        'left': np.array([-1, 0, 0]),
        'right': np.array([1, 0, 0]),
        'front': np.array([0, -1, 0]),
        'back': np.array([0, 1, 0]),
    }
    
    up_vector_map = {
        'top': np.array([0, -1, 0]),
        'bottom': np.array([0, 1, 0]),
        'left': np.array([0, 0, 1]),
        'right': np.array([0, 0, 1]),
        'front': np.array([0, 0, 1]),
        'back': np.array([0, 0, 1]),
    }
    
    if direction not in view_dir_map:
        raise ValueError(f"Unknown direction: {direction}")
    
    view_dir = view_dir_map[direction]
    up_vector = up_vector_map[direction]
    
    # Vypočítaj "right" vektor ako cross product (up_vector x view_dir) pre správny right-handed systém
    right_vector = np.cross(up_vector, view_dir)
    right_vector = right_vector / np.linalg.norm(right_vector)
    
    # Projekcia: x = bodov·right, y = bodov·up (používaj CENTRALIZOVANÉ body!)
    proj_x = np.dot(points_centered, right_vector)
    proj_y = np.dot(points_centered, up_vector)
    
    proj_2d = np.stack([proj_x, proj_y], axis=1)
    
    # Vypočítaj bounding box s paddingom
    x_min, x_max = proj_2d[:, 0].min(), proj_2d[:, 0].max()
    y_min, y_max = proj_2d[:, 1].min(), proj_2d[:, 1].max()
    
    x_range = x_max - x_min if x_max > x_min else 1.0
    y_range = y_max - y_min if y_max > y_min else 1.0
    
    # Pridaj padding
    center_x = (x_min + x_max) / 2
    center_y = (y_min + y_max) / 2
    half_range = max(x_range, y_range) / 2 * padding
    
    x_min_padded = center_x - half_range
    x_max_padded = center_x + half_range
    y_min_padded = center_y - half_range
    y_max_padded = center_y + half_range
    
    # Normalizuj do [0, image_size]
    x_norm = (proj_2d[:, 0] - x_min_padded) / (x_max_padded - x_min_padded) * (image_size - 1)
    y_norm = (proj_2d[:, 1] - y_min_padded) / (y_max_padded - y_min_padded) * (image_size - 1)
    
    proj_2d_norm = np.stack([x_norm, y_norm], axis=1)
    
    return proj_2d_norm, colors


def create_projection_image(proj_2d, colors, image_size=1024, title=""):
    """
    Vytvorí obrázok z 2D projekcie bodov
    """
    # Vytvor obrázok
    img = Image.new('RGB', (image_size, image_size), color='white')
    pixels = img.load()
    
    # Normalizuj farby ak sú v rozsahu 0-1
    if colors.max() <= 1.0:
        colors = (colors * 255).astype(np.uint8)
    else:
        colors = colors.astype(np.uint8)
    
    # Vykresli body
    for i, (x, y) in enumerate(proj_2d):
        x_int = int(np.clip(x, 0, image_size - 1))
        y_int = int(np.clip(y, 0, image_size - 1))
        
        # Použij farbu ako grayscale (depth) alebo RGB
        if len(colors.shape) == 1:
            color = int(np.clip(colors[i], 0, 255))
            pixels[x_int, y_int] = (color, color, color)
        else:
            r, g, b = colors[i]
            pixels[x_int, y_int] = (int(r), int(g), int(b))
    
    # Pridaj titulok
    if title:
        draw = ImageDraw.Draw(img)
        try:
            # Skúsi použiť systémový font
            font = ImageFont.truetype("arial.ttf", 20)
        except:
            # Fallback na default font
            font = ImageFont.load_default()
        
        draw.text((10, 10), title, fill='black', font=font)
    
    return img


def create_opencv_projection_image(proj_2d, colors, image_size=1024, title=""):
    """
    Vytvorí obrázok pomocou OpenCV (rýchlejšie) - FAREBNÝ s RGB farbami
    Vykreslí body ako malé krúžky pre viditeľnosť
    """
    img = np.ones((image_size, image_size, 3), dtype=np.uint8) * 255
    
    # Normalizuj farby na 0-255 rozsah
    if colors.max() <= 1.0:
        colors_cv = (colors * 255).astype(np.uint8)
    else:
        colors_cv = np.clip(colors, 0, 255).astype(np.uint8)
    
    # Filtruj body ktoré sú v hraniciach obrázku
    valid_mask = (proj_2d[:, 0] >= 0) & (proj_2d[:, 0] < image_size) & \
                 (proj_2d[:, 1] >= 0) & (proj_2d[:, 1] < image_size)
    
    proj_2d_valid = proj_2d[valid_mask]
    colors_valid = colors_cv[valid_mask]
    
    print(f"      📊 Viditeľných bodov: {len(proj_2d_valid):,} z {len(proj_2d):,}")
    
    # Vykresli body ako krúžky s RGB farbami
    for i, (x, y) in enumerate(proj_2d_valid):
        x_int = int(np.round(x))
        y_int = int(np.round(y))
        
        # Bezpečnostná kontrola
        if not (0 <= x_int < image_size and 0 <= y_int < image_size):
            continue
        
        # Použij RGB farbu z point cloudu
        if len(colors_valid.shape) == 1:
            # Ak je len 1D pole (grayscale), zkonvertuj
            color_val = int(np.clip(colors_valid[i], 0, 255))
            color = (color_val, color_val, color_val)
        elif colors_valid.shape[1] >= 3:
            # RGB farba - konvertuj z RGB na BGR pre OpenCV
            r = int(colors_valid[i, 0])
            g = int(colors_valid[i, 1])
            b = int(colors_valid[i, 2])
            color = (b, g, r)  # BGR pre OpenCV
        else:
            color = (128, 128, 128)
        
        # Nakresli krúžok veľkosti 1 pixlu
        cv2.circle(img, (x_int, y_int), 1, color, -1)
    
    # Pridaj titulok ak je
    if title:
        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(img, title, (20, 40), font, 1.2, (0, 0, 0), 2)
    
    return img


def generate_floor_plan_views(project_id, user_id, center, max_distance):
    """
    Generuje 6 ortogonálnych pohľadov z centrálnej pozície
    """
    print(f"\n" + "="*70)
    print(f"🎨 GENEROVANIE 6 ORTOGONÁLNYCH POHĽADOV")
    print(f"="*70)
    print(f"   📍 Centrum: ({center[0]:.2f}, {center[1]:.2f}, {center[2]:.2f})")
    print(f"   📏 Max vzdialenosť: {max_distance}m\n")
    
    # Nájdi cestu k point cloud súboru
    project_dir = Path(__file__).parent / "projects" / user_id / project_id / "3Dmodel"
    ply_file = project_dir / "point_cloud.ply"
    
    if not ply_file.exists():
        # Skúš iné možné umiestnenia
        project_dir_alt = Path(__file__).parent / "projects" / project_id
        ply_file_alt = project_dir_alt / "3Dmodel" / "point_cloud.ply"
        
        if ply_file_alt.exists():
            ply_file = ply_file_alt
        else:
            raise FileNotFoundError(f"Point cloud not found at {ply_file} or {ply_file_alt}")
    
    # Načítaj point cloud
    points, colors = load_point_cloud(str(ply_file))
    
    # Filtruj body podľa vzdialenosti
    points_filtered, colors_filtered = filter_points_by_distance(points, colors, center, max_distance)
    
    if len(points_filtered) == 0:
        raise ValueError("Žiadne body po filtrácii!")
    
    # Vytvor output priečinok
    output_dir = project_dir / "floor_plan_views"
    output_dir.mkdir(exist_ok=True, parents=True)
    
    # Generuj 6 pohľadov
    directions = [
        ('top', 'Top (Pohľad zhora)'),
        ('bottom', 'Bottom (Pohľad zdola)'),
        ('left', 'Left (Pohľad zľava)'),
        ('right', 'Right (Pohľad sprava)'),
        ('front', 'Front (Pohľad spredu)'),
        ('back', 'Back (Pohľad zozadu)')
    ]
    
    # Ak máme veľa bodov (>100k), vzorkuj len podmnožinu pre zobrazenie
    num_points = len(points_filtered)
    if num_points > 100000:
        # Vzorkuj každý N-tý bod aby boli krúžky väčšie a jasnejšie
        sample_rate = max(1, num_points // 50000)  # Cieľ: ~50k bodov
        sample_indices = np.arange(0, num_points, sample_rate)
        points_sample = points_filtered[sample_indices]
        colors_sample = colors_filtered[sample_indices]
        print(f"   📊 Vzorkovanie: {len(points_sample):,} z {num_points:,} bodov (każý {sample_rate}. bod)")
    else:
        points_sample = points_filtered
        colors_sample = colors_filtered
    
    results = {}
    
    for direction, title in directions:
        print(f"   🖼️  Generujem {title}...")
        
        try:
            # Projekcia bodov (vzorkovaných) - PERSPEKTÍVNA s kamerou blízko centra
            proj_2d, colors_proj = project_points_perspective(
                points_sample,
                colors_sample,
                direction,
                center,
                camera_distance=2,  # Kamera 10 jednotiek od centra - ešte bližšie
                image_size=1024, 
                fov=90
            )
            
            # Vytvor obrázok (FAREBNÝ)
            img = create_opencv_projection_image(proj_2d, colors_proj, image_size=1024, title=title)
            
            # Ulož obrázok
            output_file = output_dir / f"floor_plan_{direction}.png"
            cv2.imwrite(str(output_file), img)
            
            results[direction] = {
                "file": str(output_file),
                "title": title,
                "status": "success"
            }
            
            print(f"      ✅ Uložený: {output_file.name}")
            
        except Exception as e:
            print(f"      ❌ Chyba: {e}")
            results[direction] = {
                "status": "error",
                "error": str(e)
            }
    
    print(f"\n" + "="*70)
    print(f"✅ GENEROVANIE HOTOVÉ!")
    print(f"="*70)
    print(f"   📁 Výstup: {output_dir}\n")
    
    return results, output_dir


def main():
    """
    Hlavná funkcia - prijíma JSON argument s parametrami
    """
    try:
        # Parsuj JSON argument
        if len(sys.argv) < 2:
            print("❌ Chyba: JSON parameter required!")
            sys.exit(1)
        
        json_arg = sys.argv[1]
        params = json.loads(json_arg)
        
        project_id = params.get('project_id')
        user_id = params.get('user_id')
        center_x = float(params.get('center_x', 0))
        center_y = float(params.get('center_y', 0))
        center_z = float(params.get('center_z', 0))
        max_distance = float(params.get('max_distance', 100))
        
        center = [center_x, center_y, center_z]
        
        print(f"\n📥 Prijaté parametre:")
        print(f"   Project ID: {project_id}")
        print(f"   User ID: {user_id}")
        print(f"   Center: {center}")
        print(f"   Max distance: {max_distance}\n")
        
        # Generuj views
        results, output_dir = generate_floor_plan_views(
            project_id, user_id, center, max_distance
        )
        
        # Vytlač výsledky
        print(f"📊 VÝSLEDKY:")
        for direction, result in results.items():
            status = result.get('status', 'unknown')
            print(f"   {direction.upper()}: {status}")
        
        print(f"\n✨ Floor plan generation completed!")
        
    except Exception as e:
        print(f"\n❌ CHYBA: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
