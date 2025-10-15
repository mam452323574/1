import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import { ApiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = exercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredExercises(filtered);
    } else {
      setFilteredExercises(exercises);
    }
  }, [searchQuery, exercises]);

  const fetchExercises = async () => {
    try {
      const data = await ApiService.getExercises();
      setExercises(data);
      setFilteredExercises(data);
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

  const renderExercise = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.exerciseCard}>
      <Image source={{ uri: item.image_url }} style={styles.exerciseImage} />
      <View style={styles.exerciseContent}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseDuration}>{item.duration} min</Text>
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
        <Text style={styles.headerTitle}>Nos Exercices</Text>
        <View style={styles.searchContainer}>
          <Search color={COLORS.gray} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un exercice..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
        </View>
      </View>

      {filteredExercises.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun exercice trouvé</Text>
        </View>
      ) : (
        <FlatList
          data={filteredExercises}
          renderItem={renderExercise}
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
  exerciseCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  exerciseImage: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.lightGray,
  },
  exerciseContent: {
    padding: SPACING.md,
  },
  exerciseName: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  exerciseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseDuration: {
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
