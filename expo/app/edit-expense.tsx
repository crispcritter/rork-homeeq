import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useHome } from '@/contexts/HomeContext';
import { useTheme } from '@/contexts/ThemeContext';
import createExpenseStyles from '@/styles/expense';
import ExpenseForm from '@/components/ExpenseForm';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors: c } = useTheme();
  const styles = useMemo(() => createExpenseStyles(c), [c]);
  const { budgetItems } = useHome();

  const expense = useMemo(() => budgetItems.find((i) => i.id === id), [budgetItems, id]);

  if (!expense) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Edit Expense' }} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Expense not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Expense' }} />
      <ExpenseForm mode="edit" existingExpense={expense} />
    </>
  );
}
