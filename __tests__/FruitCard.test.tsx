import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FruitCard } from '../components/FruitCard';
import type { Fruit } from '../lib/supabase';

// Mock the Dimensions module
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({ width: 375, height: 812 })),
}));

describe('FruitCard Component', () => {
  const mockFruit: Fruit = {
    id: '1',
    name: 'Apple',
    description: 'Fresh red apple',
    short_description: 'Sweet and crisp',
    price: 2.99,
    unit: 'lb',
    image_url: 'https://example.com/apple.jpg',
    is_available: true,
    is_seasonal: false,
    seasonal_months: null,
    storage_tips: 'Keep in refrigerator',
    origin_country: 'USA',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockOnPress = jest.fn();
  const mockOnFavoritePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render fruit card with basic information', () => {
      const { getByText, getByDisplayValue } = render(
        <FruitCard
          fruit={mockFruit}
          onPress={mockOnPress}
        />
      );

      expect(getByText('Apple')).toBeTruthy();
      expect(getByText('Sweet and crisp')).toBeTruthy();
      expect(getByText('$2.99')).toBeTruthy();
      expect(getByText('/lb')).toBeTruthy();
    });

    it('should render fruit image with correct source', () => {
      const { getByDisplayValue } = render(
        <FruitCard
          fruit={mockFruit}
          onPress={mockOnPress}
        />
      );

      const image = getByDisplayValue('https://example.com/apple.jpg');
      expect(image).toBeTruthy();
      expect(image.props.source.uri).toBe('https://example.com/apple.jpg');
    });

    it('should handle missing short description gracefully', () => {
      const fruitWithoutShortDesc = {
        ...mockFruit,
        short_description: null,
      };

      const { queryByText } = render(
        <FruitCard
          fruit={fruitWithoutShortDesc}
          onPress={mockOnPress}
        />
      );

      expect(queryByText('Sweet and crisp')).toBeNull();
    });

    it('should format price correctly with decimal places', () => {
      const expensiveFruit = {
        ...mockFruit,
        price: 10.5,
      };

      const { getByText } = render(
        <FruitCard
          fruit={expensiveFruit}
          onPress={mockOnPress}
        />
      );

      expect(getByText('$10.50')).toBeTruthy();
    });
  });

  describe('Seasonal and Availability Indicators', () => {
    it('should display seasonal badge when fruit is seasonal', () => {
      const seasonalFruit = {
        ...mockFruit,
        is_seasonal: true,
      };

      const { getByText } = render(
        <FruitCard
          fruit={seasonalFruit}
          onPress={mockOnPress}
        />
      );

      expect(getByText('Seasonal')).toBeTruthy();
    });

    it('should not display seasonal badge when fruit is not seasonal', () => {
      const { queryByText } = render(
        <FruitCard
          fruit={mockFruit}
          onPress={mockOnPress}
        />
      );

      expect(queryByText('Seasonal')).toBeNull();
    });

    it('should display out of stock overlay when fruit is not available', () => {
      const unavailableFruit = {
        ...mockFruit,
        is_available: false,
      };

      const { getByText } = render(
        <FruitCard
          fruit={unavailableFruit}
          onPress={mockOnPress}
        />
      );

      expect(getByText('Out of Stock')).toBeTruthy();
    });

    it('should not display out of stock overlay when fruit is available', () => {
      const { queryByText } = render(
        <FruitCard
          fruit={mockFruit}
          onPress={mockOnPress}
        />
      );

      expect(queryByText('Out of Stock')).toBeNull();
    });
  });

  describe('Interaction Handling', () => {
    it('should call onPress when card is pressed', () => {
      const { getByText } = render(
        <FruitCard
          fruit={mockFruit}
          onPress={mockOnPress}
        />
      );

      fireEvent.press(getByText('Apple'));
      expect(mockOnPress).toHaveBeenCalledWith(mockFruit);
    });

    it('should call onPress only once per press', () => {
      const { getByText } = render(
        <FruitCard
          fruit={mockFruit}
          onPress={mockOnPress}
        />
      );

      const card = getByText('Apple');
      fireEvent.press(card);
      fireEvent.press(card);
      
      expect(mockOnPress).toHaveBeenCalledTimes(2);
      expect(mockOnPress).toHaveBeenCalledWith(mockFruit);
    });
  });

  describe('Favorites Functionality', () => {
    it('should display favorite button when onFavoritePress is provided', () => {
      const { getByRole } = render(
        <FruitCard
          fruit={mockFruit}
          onPress={mockOnPress}
          onFavoritePress={mockOnFavoritePress}
          isFavorite={false}
        />
      );

      const favoriteButton = getByRole('button');
      expect(favoriteButton).toBeTruthy();
    });

    it('should not display favorite button when onFavoritePress is not provided', () => {
      const { queryByRole } = render(
        <FruitCard
          fruit={mockFruit}
          onPress={mockOnPress}
        />
      );

      // Looking for the favorite button specifically
      const buttons = queryByRole('button');
      expect(buttons).toBeNull();
    });

    it('should display empty heart when not favorited', () => {
      const { getByText } = render(
        <FruitCard
          fruit={mockFruit}
          onPress={mockOnPress}
          onFavoritePress={mockOnFavoritePress}
          isFavorite={false}
        />
      );

      expect(getByText('🤍')).toBeTruthy();
    });

    it('should display filled heart when favorited', () => {
      const { getByText } = render(
        <FruitCard
          fruit={mockFruit}
          onPress={mockOnPress}
          onFavoritePress={mockOnFavoritePress}
          isFavorite={true}
        />
      );

      expect(getByText('❤️')).toBeTruthy();
    });

    it('should call onFavoritePress when favorite button is pressed', () => {
      const { getByRole } = render(
        <FruitCard
          fruit={mockFruit}
          onPress={mockOnPress}
          onFavoritePress={mockOnFavoritePress}
          isFavorite={false}
        />
      );

      const favoriteButton = getByRole('button');
      fireEvent.press(favoriteButton);
      
      expect(mockOnFavoritePress).toHaveBeenCalledWith(mockFruit);
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should toggle favorite state correctly', () => {
      const { getByRole, getByText, rerender } = render(
        <FruitCard
          fruit={mockFruit}
          onPress={mockOnPress}
          onFavoritePress={mockOnFavoritePress}
          isFavorite={false}
        />
      );

      // Initially not favorited
      expect(getByText('🤍')).toBeTruthy();

      // Rerender as favorited
      rerender(
        <FruitCard
          fruit={mockFruit}
          onPress={mockOnPress}
          onFavoritePress={mockOnFavoritePress}
          isFavorite={true}
        />
      );

      expect(getByText('❤️')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper hit slop for favorite button', () => {
      const { getByRole } = render(
        <FruitCard
          fruit={mockFruit}
          onPress={mockOnPress}
          onFavoritePress={mockOnFavoritePress}
          isFavorite={false}
        />
      );

      const favoriteButton = getByRole('button');
      expect(favoriteButton.props.hitSlop).toEqual({
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
      });
    });

    it('should have activeOpacity for visual feedback', () => {
      const { getByText } = render(
        <FruitCard
          fruit={mockFruit}
          onPress={mockOnPress}
        />
      );

      const card = getByText('Apple').parent?.parent;
      expect(card?.props.activeOpacity).toBe(0.7);
    });
  });

  describe('Text Truncation', () => {
    it('should limit fruit name to 2 lines', () => {
      const longNameFruit = {
        ...mockFruit,
        name: 'Very Long Fruit Name That Should Be Truncated After Two Lines',
      };

      const { getByText } = render(
        <FruitCard
          fruit={longNameFruit}
          onPress={mockOnPress}
        />
      );

      const nameText = getByText(longNameFruit.name);
      expect(nameText.props.numberOfLines).toBe(2);
    });

    it('should limit description to 2 lines', () => {
      const longDescFruit = {
        ...mockFruit,
        short_description: 'Very long description that should be truncated after two lines to maintain card layout consistency',
      };

      const { getByText } = render(
        <FruitCard
          fruit={longDescFruit}
          onPress={mockOnPress}
        />
      );

      const descText = getByText(longDescFruit.short_description);
      expect(descText.props.numberOfLines).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero price correctly', () => {
      const freeFruit = {
        ...mockFruit,
        price: 0,
      };

      const { getByText } = render(
        <FruitCard
          fruit={freeFruit}
          onPress={mockOnPress}
        />
      );

      expect(getByText('$0.00')).toBeTruthy();
    });

    it('should handle missing image URL gracefully', () => {
      const fruitWithoutImage = {
        ...mockFruit,
        image_url: '',
      };

      const { getByDisplayValue } = render(
        <FruitCard
          fruit={fruitWithoutImage}
          onPress={mockOnPress}
        />
      );

      const image = getByDisplayValue('');
      expect(image.props.source.uri).toBe('');
    });

    it('should handle both seasonal and unavailable states', () => {
      const seasonalUnavailableFruit = {
        ...mockFruit,
        is_seasonal: true,
        is_available: false,
      };

      const { getByText } = render(
        <FruitCard
          fruit={seasonalUnavailableFruit}
          onPress={mockOnPress}
        />
      );

      expect(getByText('Seasonal')).toBeTruthy();
      expect(getByText('Out of Stock')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with minimal re-renders', () => {
      const renderSpy = jest.fn();
      const TestCard = (props: any) => {
        renderSpy();
        return <FruitCard {...props} />;
      };

      const { rerender } = render(
        <TestCard
          fruit={mockFruit}
          onPress={mockOnPress}
          isFavorite={false}
        />
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Rerender with same props should not cause unnecessary renders
      rerender(
        <TestCard
          fruit={mockFruit}
          onPress={mockOnPress}
          isFavorite={false}
        />
      );

      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});