const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/(tabs)/available-orders.js');
let code = fs.readFileSync(filePath, 'utf8');

const targets = [
  {
    find: "function LivePulseBadge() {",
    replace: "function LivePulseBadge() {\n  const { themeColors } = useDynamicBranding();\n  const styles = getStyles(themeColors);"
  },
  {
    find: "function RadarSearchingIllustration() {",
    replace: "function RadarSearchingIllustration() {\n  const { themeColors } = useDynamicBranding();\n  const styles = getStyles(themeColors);"
  },
  {
    find: "function RefreshGradientButton({ onPress, loading }) {",
    replace: "function RefreshGradientButton({ onPress, loading }) {\n  const { themeColors } = useDynamicBranding();\n  const styles = getStyles(themeColors);"
  },
  {
    find: "function NewOrderBottomSheet({ order, onClaim, onClose }) {",
    replace: "function NewOrderBottomSheet({ order, onClaim, onClose }) {\n  const { themeColors } = useDynamicBranding();\n  const styles = getStyles(themeColors);"
  },
  {
    find: "function AvailableOrderCard({ order, index, onClaim, claiming }) {",
    replace: "function AvailableOrderCard({ order, index, onClaim, claiming }) {\n  const { themeColors } = useDynamicBranding();\n  const styles = getStyles(themeColors);"
  },
  {
    find: "export default function AvailableOrdersScreen() {",
    replace: "export default function AvailableOrdersScreen() {\n  const { themeColors } = useDynamicBranding();\n  const styles = getStyles(themeColors);"
  }
];

targets.forEach(({ find, replace }) => {
  if (code.includes(find)) {
    code = code.replace(find, replace);
    console.log(`Successfully injected into: ${find}`);
  } else {
    console.warn(`WARNING: Could not find target: ${find}`);
  }
});

fs.writeFileSync(filePath, code, 'utf8');
console.log('Injections completed!');
