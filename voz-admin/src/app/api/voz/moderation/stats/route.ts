import { NextResponse } from 'next/server';
import { getModerationQueue, getModerationHistoryByEmployee, ModerationItem } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeName = searchParams.get('employeeName');

        if (employeeName) {
            const history = getModerationHistoryByEmployee(employeeName);
            return NextResponse.json(history);
        }

        // Si no hay nombre, devolver estadísticas generales de moderadores
        const allItems = getModerationQueue();
        const statsMap: Record<string, { employeeName: string, total: number }> = {};

        allItems.forEach((item: ModerationItem) => {
            if (item.status !== 'pending' && item.moderatedBy) {
                const mod = item.moderatedBy;
                if (!statsMap[mod]) {
                    statsMap[mod] = { employeeName: mod, total: 0 };
                }
                statsMap[mod].total += 1;
            }
        });

        return NextResponse.json(Object.values(statsMap));
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch moderation stats' }, { status: 500 });
    }
}
