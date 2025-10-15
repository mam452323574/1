import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import { ApiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = recipes.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRecipes(filtered);
    } else {
      setFilteredRecipes(recipes);
    }
  }, [searchQuery, recipes]);

  const fetchRecipes = async () => {
    try {
      const data = await ApiService.getRecipes();
      setRecipes(data);
      setFilteredRecipes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const renderRecipe = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.recipeCard}>
      <Image source={{ uri: item.image_url }} style={styles.recipeImage} />
      <View style={styles.recipeContent}>
        <Text style={styles.recipeName}>{item.name}</Text>
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTime}>{item.preparation_time} min</Text>
          <View
            style={[
              styles.difficultyBadge,
              item.difficulty === 'easy' && styles.difficultyEasy,
              item.difficulty === 'medium' && styles.difficultyMedium,
              item.difficulty === 'hard' && styles.difficultyHard,
            ]}
          >
            <Text style={styles.difficultyText}>
              {item.difficulty === 'easy' ? 'Facile' : item.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nos Recettes</Text>
        <View style={styles.searchContainer}>
          <Search color={COLORS.gray} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une recette..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
        </View>
      </View>

      {filteredRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune recette trouvée</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          renderItem={renderRecipe}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  list: {
    padding: SPACING.lg,
  },
  recipeCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.lightGray,
  },
  recipeContent: {
    padding: SPACING.md,
  },
  recipeName: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  recipeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipeTime: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  difficultyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  difficultyEasy: {
    backgroundColor: '#E8F5E9',
  },
  difficultyMedium: {
    backgroundColor: '#FFF3E0',
  },
  difficultyHard: {
    backgroundColor: '#FFEBEE',
  },
  difficultyText: {
    fontSize: SIZES.xs,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: SIZES.lg,
    color: COLORS.gray,
  },
});
