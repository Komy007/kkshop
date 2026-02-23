'use server';

import { prisma } from '@/lib/api';
import { revalidatePath } from 'next/cache';

// Reusable function to get settings by key
export async function getSiteSetting(key: string, defaultValue: any = null) {
    try {
        const setting = await prisma.siteSetting.findUnique({
            where: { key }
        });

        if (setting && setting.value) {
            return setting.value;
        }

        return defaultValue;
    } catch (error) {
        console.error(`Failed to get site setting for key ${key}:`, error);
        return defaultValue;
    }
}

// Function to update or create a setting
export async function updateSiteSetting(key: string, value: any) {
    try {
        await prisma.siteSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });

        // Invalidate the homepage cache so the new settings appear immediately
        revalidatePath('/');

        return { success: true };
    } catch (error) {
        console.error(`Failed to update site setting for key ${key}:`, error);
        return { success: false, error: 'Failed to update settings.' };
    }
}
