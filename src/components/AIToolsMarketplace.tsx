import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AppContext';
import { AITool } from '../types';

interface AIToolsMarketplaceProps {
  onToolPress?: (tool: AITool) => void;
  onToolExecute?: (tool: AITool) => void;
  showCreateButton?: boolean;
  onCreatePress?: () => void;
  onClose?: () => void;
}

// â”€â”€ palette â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BG       = '#0D0D14';
const SIDEBAR  = '#111118';
const CARD_BG  = '#18181F';
const BORDER   = '#1F1F2E';
const GREEN    = '#1BCC8F';
const TEXT_PRI = '#E2E8F0';
const TEXT_SEC = '#6B7280';
const TEXT_MUT = '#374151';

const { width } = Dimensions.get('window');
const IS_MOBILE = width < 640;

// â”€â”€ component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AIToolsMarketplace({
  onToolPress,
  onToolExecute,
  showCreateButton = false,
  onCreatePress,
  onClose,
}: AIToolsMarketplaceProps) {
  const { user, isGuestUser } = useAuth();

  return (
    <View style={styles.root}>
      {/* â”€â”€ Blurred Background â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <BlurView intensity={100} style={StyleSheet.absoluteFill} />
      
      {/* â”€â”€ Coming Soon Overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={styles.comingSoonOverlay}>
        <View style={styles.comingSoonContent}>
          <Ionicons name="hourglass-outline" size={60} color={GREEN} style={{ marginBottom: 20 }} />
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonSubtitle}>
            This feature is currently in development.{'\n'}Stay tuned for updates!
          </Text>
        </View>
      </View>

      {/* â”€â”€ Close button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {onClose && (
        <TouchableOpacity
          style={styles.closeButtonAbsolute}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={TEXT_PRI} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// â”€â”€ styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  comingSoonOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  
  comingSoonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  comingSoonTitle: {
    color: TEXT_PRI,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  
  comingSoonSubtitle: {
    color: TEXT_SEC,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  closeButtonAbsolute: {
    position: 'absolute',
    top: IS_MOBILE ? 12 : 16,
    right: IS_MOBILE ? 12 : 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    zIndex: 1000,
  },
});

