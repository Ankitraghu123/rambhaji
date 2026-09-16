const fs = require('fs');
let data = fs.readFileSync('src/screens/HomeScreen.js', 'utf8');
let lines = data.split(/\r?\n/);
lines.splice(635, 20,
  "              <Text style={s.greeting} numberOfLines={1}>Namaste, {user.name || 'Customer'}</Text>",
  "            </View>",
  "          </View>",
  "          <View style={{ flexDirection: 'row', gap: 8 }}>",
  "            <Pressable",
  "              onPress={() => navigation.navigate('Plans')}",
  "              style={({ pressed }) => [s.primaryCta, { opacity: pressed ? 0.82 : 1 }]}",
  "            >",
  "              <Text style={s.primaryCtaText}>Explore Plans</Text>",
  "              <MaterialCommunityIcons name=\"arrow-right\" size={18} color=\"#FFFFFF\" />",
  "            </Pressable>",
  "            <Pressable",
  "              onPress={() => navigation.navigate('Retail')}",
  "              style={({ pressed }) => [s.secondaryCta, { opacity: pressed ? 0.82 : 1 }]}",
  "            >",
  "              <MaterialCommunityIcons name=\"basket-outline\" size={18} color=\"#FFFFFF\" />",
  "            </Pressable>",
  "          </View>",
  "        </View>",
  "      </Reveal>"
);
fs.writeFileSync('src/screens/HomeScreen.js', lines.join('\n'));
