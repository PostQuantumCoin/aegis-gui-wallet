BASHPATH=$(readlink -f "$0")
ROOTPATH=$(dirname "$BASHPATH")
echo "S: $SCRIPTPATH"
echo "[Desktop Entry]\nType=Application\nName=AEGIS\nExec=$ROOTPATH/AEGIS-linux-x64/AEGIS\nIcon=$ROOTPATH/AEGIS-linux-x64/icon.png\nTerminal=false\nCategories=Development;" > aegis.desktop
chmod +x ./aegis.desktop
