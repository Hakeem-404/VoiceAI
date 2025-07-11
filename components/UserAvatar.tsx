import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { User } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useSupabaseAuth } from '@/src/hooks/useSupabase';
import { spacing, typography } from '@/src/constants/colors';
import supabase from '@/src/lib/supabase';

interface UserAvatarProps {
  size?: number;
  onPress?: () => void;
  showBadge?: boolean;
}

export function UserAvatar({ size = 40, onPress, showBadge = false }: UserAvatarProps) {
  const { colors } = useTheme();
  const { user } = useSupabaseAuth();
  const [avatarVersion, setAvatarVersion] = useState(0);
  
  // Update avatar version when user metadata changes
  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      setAvatarVersion(prev => prev + 1);
    }
  }, [user?.user_metadata?.avatar_url]);
  
  // Get avatar URL from Supabase storage if available
  const getAvatarUrl = () => {
    if (!user) return null;
    
    // Check if user has an avatar_url in metadata
    if (user.user_metadata?.avatar_url) {
      const baseUrl = user.user_metadata.avatar_url;
      return baseUrl + (baseUrl.includes('?') ? '&' : '?') + `v=${avatarVersion}`;
    }
    
    // Otherwise, check if there's an avatar in storage
    if (user.id) {
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${user.id}/avatar.jpg`);
      
      if (data?.publicUrl) {
        return data.publicUrl + (data.publicUrl.includes('?') ? '&' : '?') + `v=${avatarVersion}`;
      }
    }
    
    return null;
  };
  
  const getInitials = () => {
    if (!user?.user_metadata?.name) return '?';
    
    const nameParts = user.user_metadata.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };
  
  const avatarUrl = getAvatarUrl();
  const subscription = user?.user_metadata?.subscription_tier || 'free';
  
  const getBadgeColor = () => {
    switch (subscription) {
      case 'premium': return colors.warning;
      case 'pro': return colors.success;
      default: return colors.primary;
    }
  };

  const Avatar = () => (
    <View style={[
      styles.container, 
      { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        backgroundColor: avatarUrl ? 'transparent' : colors.primary
      }
    ]}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          onLoad={() => console.log('UserAvatar image loaded successfully:', avatarUrl)}
          onError={(error) => console.error('UserAvatar image failed to load:', error.nativeEvent)}
        />
      ) : user ? (
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
          {getInitials()}
        </Text>
      ) : (
        <User size={size * 0.6} color="white" />
      )}
      
      {showBadge && (
        <View style={[
          styles.badge, 
          { 
            backgroundColor: getBadgeColor(),
            width: size * 0.35,
            height: size * 0.35,
            borderRadius: size * 0.175,
            borderWidth: size * 0.03,
          }
        ]} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Avatar />
      </TouchableOpacity>
    );
  }

  return <Avatar />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: 'white',
    fontWeight: typography.weights.bold,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderColor: 'white',
  },
});