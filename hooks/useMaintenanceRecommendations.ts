import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { Appliance, MaintenanceTask } from '@/types';
import { categoryLabels } from '@/constants/categories';
import { successNotification, lightImpact } from '@/utils/haptics';

export interface MaintenanceRecommendation {
  title: string;
  description: string;
  frequencyDays: number;
  priority: 'low' | 'medium' | 'high';
  estimatedCost?: number;
}

const recommendationSchema = z.object({
  recommendations: z.array(z.object({
    title: z.string().describe('Short maintenance task title'),
    description: z.string().describe('Detailed description of the maintenance task'),
    frequencyDays: z.number().describe('How often this should be done in days'),
    priority: z.enum(['low', 'medium', 'high']).describe('Priority level'),
    estimatedCost: z.number().optional().describe('Estimated cost in USD'),
  })),
});

interface UseMaintenanceRecommendationsResult {
  isGeneratingRecs: boolean;
  recommendations: MaintenanceRecommendation[];
  addedRecIds: Set<number>;
  handleGenerateRecommendations: () => Promise<void>;
  handleAddRecommendationAsTask: (rec: MaintenanceRecommendation, index: number) => void;
  handleAddAllRecommendations: () => void;
}

export function useMaintenanceRecommendations(
  appliance: Appliance | undefined,
  addTask: (task: MaintenanceTask) => void,
): UseMaintenanceRecommendationsResult {
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [recommendations, setRecommendations] = useState<MaintenanceRecommendation[]>([]);
  const [addedRecIds, setAddedRecIds] = useState<Set<number>>(new Set());

  const handleGenerateRecommendations = useCallback(async () => {
    if (!appliance) return;
    if (!appliance.brand && !appliance.model && !appliance.serialNumber) {
      Alert.alert('Missing Info', 'Please add brand, model, or serial number to generate recommendations.');
      return;
    }
    setIsGeneratingRecs(true);
    setRecommendations([]);
    setAddedRecIds(new Set());
    try {
      console.log('[Recommendations] Generating for:', appliance.brand, appliance.model);
      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content: `Generate a practical maintenance schedule for this home appliance:\n\nBrand: ${appliance.brand}\nModel: ${appliance.model}\nSerial Number: ${appliance.serialNumber || 'N/A'}\nProduct Name: ${appliance.name}\nCategory: ${categoryLabels[appliance.category] || appliance.category}\nLocation: ${appliance.location || 'N/A'}\n\nProvide 4-6 specific, actionable maintenance recommendations tailored to this exact appliance type and brand. Include realistic frequency and cost estimates. Focus on tasks that extend the appliance life and prevent breakdowns.`,
          },
        ],
        schema: recommendationSchema,
      });
      console.log('[Recommendations] Generated:', result.recommendations.length);
      setRecommendations(result.recommendations);
      successNotification();
    } catch (err) {
      console.log('[Recommendations] Generation error:', err);
      Alert.alert('Generation Failed', 'Could not generate recommendations. Please try again.');
    } finally {
      setIsGeneratingRecs(false);
    }
  }, [appliance]);

  const handleAddRecommendationAsTask = useCallback((rec: MaintenanceRecommendation, index: number) => {
    if (!appliance) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.min(rec.frequencyDays, 30));
    const newTask = {
      id: Date.now().toString() + '_' + index,
      title: rec.title,
      description: rec.description,
      dueDate: dueDate.toISOString().split('T')[0],
      priority: rec.priority,
      status: 'upcoming' as const,
      applianceId: appliance.id,
      estimatedCost: rec.estimatedCost,
      recurring: true,
      recurringInterval: rec.frequencyDays,
    };
    addTask(newTask);
    setAddedRecIds((prev) => new Set(prev).add(index));
    lightImpact();
    console.log('[Recommendations] Added as task:', rec.title);
  }, [appliance, addTask]);

  const handleAddAllRecommendations = useCallback(() => {
    recommendations.forEach((rec, index) => {
      if (!addedRecIds.has(index)) {
        handleAddRecommendationAsTask(rec, index);
      }
    });
  }, [recommendations, addedRecIds, handleAddRecommendationAsTask]);

  return {
    isGeneratingRecs,
    recommendations,
    addedRecIds,
    handleGenerateRecommendations,
    handleAddRecommendationAsTask,
    handleAddAllRecommendations,
  };
}
