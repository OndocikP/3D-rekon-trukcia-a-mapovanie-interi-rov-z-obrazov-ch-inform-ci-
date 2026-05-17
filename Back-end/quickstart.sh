#!/bin/bash
# Quick Start - Nerfstudio 3D Model Generation
# Spustenie automatického generovania 3D modelov

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║           🚀 3D MODEL GENERATION - QUICK START                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

# 1. Skontroluj či je Nerfstudio aktivovaný
echo ""
echo "1️⃣  Kontrola Nerfstudio..."
if command -v ns-train &> /dev/null; then
    echo "   ✅ Nerfstudio je dostupný"
else
    echo "   ❌ Nerfstudio nieje dostupný"
    echo "   Prosím aktivuj: conda activate nerfstudio"
    exit 1
fi

# 2. Skontroluj Python dependencies
echo ""
echo "2️⃣  Kontrola Python dependencies..."
python -c "import fastapi, dotenv, pydantic" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Všetky dependencies sú nainštalované"
else
    echo "   ❌ Chýbajúce dependencies"
    echo "   Inštalácia: pip install -r requirements.txt"
    exit 1
fi

# 3. Spustenie setup wizardu
echo ""
echo "3️⃣  Setup Wizard..."
python setup_nerfstudio.py

# 4. Výber režimu
echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "Vyber režim spustenia:"
echo ""
echo "  1) Všetky projekty bez modelov (automaticky)"
echo "  2) Konkrétny projekt (zadaj user_id a project_id)"
echo "  3) Batch s async worker (rýchlo sa vráti)"
echo "  4) Testy"
echo ""
read -p "Vyber [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "🚀 Spúšťam generovanie všetkých projektov..."
        python generate_3d_models.py
        ;;
    2)
        echo ""
        read -p "User ID: " user_id
        read -p "Project ID: " project_id
        echo "🚀 Spúšťam generovanie projektu..."
        python generate_3d_models.py "$user_id" "$project_id"
        ;;
    3)
        echo ""
        echo "🚀 Spúšťam batch async generovanie..."
        echo "Server musí bežať na http://localhost:8000"
        read -p "Authorization token: " token
        curl -X POST http://localhost:8000/api/projects/batch/generate-all-models \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json"
        echo ""
        echo "✅ Generovanie spustené v pozadí"
        ;;
    4)
        echo ""
        echo "🧪 Spúšťam testy..."
        pytest test_3d_models.py -v
        ;;
    *)
        echo "Neznáta voľba"
        exit 1
        ;;
esac

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "✅ Hotovo! Pozri README_NERFSTUDIO.md pre detaily."
echo "📖 Logy: nerfstudio_training.log"
echo "════════════════════════════════════════════════════════════════════════════"
