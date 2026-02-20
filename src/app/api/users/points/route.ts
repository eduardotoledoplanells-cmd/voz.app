import { NextResponse } from 'next/server';
import { User } from '@/types';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'src', 'data', 'users.json');

async function getUsers(): Promise<User[]> {
    try {
        const data = await readFile(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function saveUsers(users: User[]) {
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function POST(request: Request) {
    try {
        const { userId, points } = await request.json();

        if (!userId || points === undefined) {
            return NextResponse.json(
                { message: 'Missing userId or points' },
                { status: 400 }
            );
        }

        // Security check: Limit max points per request to prevent massive hacking?
        // Let's cap at 1000 per request for now.
        if (points > 1000 || points < 0) {
            return NextResponse.json(
                { message: 'Invalid points amount' },
                { status: 400 }
            );
        }

        const users = await getUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Initialize points if undefined
        if (!users[userIndex].points) {
            users[userIndex].points = 0;
        }

        // Daily Limit Check
        const now = Date.now();
        const lastEarned = users[userIndex].lastRobCoinEarned || 0;
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;

        if (now - lastEarned < ONE_DAY_MS) {
            return NextResponse.json({
                success: false,
                message: 'Daily limit reached. Come back later!',
                totalPoints: users[userIndex].points,
                nextAvailable: lastEarned + ONE_DAY_MS
            });
        }

        users[userIndex].points = (users[userIndex].points || 0) + points;
        users[userIndex].lastRobCoinEarned = now; // Update timestamp

        await saveUsers(users);

        return NextResponse.json({
            success: true,
            totalPoints: users[userIndex].points,
            message: `Added ${points} points.`
        });

    } catch (error) {
        console.error('Points update error:', error);
        return NextResponse.json(
            { message: 'Error updating points' },
            { status: 500 }
        );
    }
}
