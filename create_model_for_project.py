from pathlib import Path

# Search for the project
projects_path = Path(r'd:\GitHub\3D-rekon-trukcia-a-mapovanie-interi-rov-z-obrazov-ch-inform-ci-\Back-end\routers\projects')
target_project = 'ad7bfb3a-15e2-4e01-8677-1dd49a72c506'

for user_dir in projects_path.iterdir():
    if user_dir.is_dir():
        project_dir = user_dir / target_project
        if project_dir.exists():
            print(f'✅ Found project at: {project_dir}')
            print(f'   User ID: {user_dir.name}')
            
            # Create 3Dmodel directory
            model_dir = project_dir / '3Dmodel'
            model_dir.mkdir(parents=True, exist_ok=True)
            print(f'✅ Created model directory: {model_dir}')
            
            # Create model.py
            model_content = '''# 3D Model - Default Template
import numpy as np

class Model3D:
    def __init__(self, project_id):
        self.project_id = project_id
        self.name = 'Default Model'
        self.vertices = np.array([
            [0, 0, 0],
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ])
        self.faces = np.array([
            [0, 1, 2],
            [0, 1, 3],
            [0, 2, 3],
            [1, 2, 3]
        ])
    
    def to_dict(self):
        return {
            'project_id': self.project_id,
            'name': self.name,
            'vertices': self.vertices.tolist(),
            'faces': self.faces.tolist()
        }
'''
            model_file = model_dir / 'model.py'
            model_file.write_text(model_content)
            print(f'✅ Created model file: {model_file}')
            break
else:
    print('❌ Project not found')
