#!/bin/bash

echo "====================================="
echo "Validation de la Configuration"
echo "====================================="
echo ""

# Vérifier node_modules
if [ -d "node_modules" ]; then
    echo "✓ node_modules installé"
else
    echo "✗ node_modules manquant - exécuter 'npm install'"
    exit 1
fi

# Vérifier la structure auth
if [ -d "app/(auth)" ]; then
    echo "✓ Groupe d'authentification créé"
    if [ -f "app/(auth)/_layout.tsx" ]; then
        echo "  ✓ Layout auth présent"
    fi
    if [ -f "app/(auth)/login.tsx" ]; then
        echo "  ✓ Login screen présent"
    fi
    if [ -f "app/(auth)/signup.tsx" ]; then
        echo "  ✓ Signup screen présent"
    fi
else
    echo "✗ Groupe d'authentification manquant"
fi

# Vérifier les versions
echo ""
echo "Versions des dépendances clés:"
npm list react-native-reanimated react-native --depth=0 2>/dev/null | grep -E "react-native"

echo ""
echo "====================================="
echo "Validation terminée!"
echo "====================================="
