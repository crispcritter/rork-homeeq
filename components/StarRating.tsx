import React from 'react';
import { View } from 'react-native';
import { Star } from 'lucide-react-native';

interface StarRatingProps {
  rating: number;
  size?: number;
}

export default function StarRating({ rating, size = 14 }: StarRatingProps) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = rating >= i;
    const half = !filled && rating >= i - 0.5;
    stars.push(
      <View key={i} style={{ marginRight: 1 }}>
        <Star
          size={size}
          color={filled || half ? '#F5A623' : '#E0DCD7'}
          fill={filled ? '#F5A623' : 'transparent'}
        />
      </View>
    );
  }
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>{stars}</View>;
}
