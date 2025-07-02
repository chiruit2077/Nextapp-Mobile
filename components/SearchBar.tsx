import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { isTablet } from '@/hooks/useResponsiveStyles';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  value?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search...',
  value = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const isTabletDevice = isTablet();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.searchContainer, 
        isTabletDevice && styles.tabletSearchContainer,
        Platform.OS === 'ios' && styles.iosSearchContainer
      ]}>
        <Search 
          size={isTabletDevice ? 24 : 20} 
          color="#64748B" 
          style={styles.searchIcon} 
        />
        <TextInput
          style={[
            styles.input, 
            isTabletDevice && styles.tabletInput,
            Platform.OS === 'ios' && styles.iosInput
          ]}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
        />
        {searchQuery.length > 0 && Platform.OS !== 'ios' && (
          <TouchableOpacity 
            onPress={clearSearch} 
            style={styles.clearButton}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <X size={isTabletDevice ? 24 : 20} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: Platform.OS === 'ios' ? 1 : 0,
    borderColor: '#E2E8F0',
  },
  tabletSearchContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  iosSearchContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter-Regular',
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  tabletInput: {
    fontSize: 18,
  },
  iosInput: {
    paddingVertical: 14,
  },
  clearButton: {
    padding: 4,
  },
});