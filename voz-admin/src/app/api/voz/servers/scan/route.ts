import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

// Store scan status in the shared scratch directory
const statusFilePath = process.env.VERCEL 
    ? '/tmp/hawk_scan_status.json' 
    : path.join(process.cwd(), '../scratch/hawk_scan_status.json');

interface ScanStatus {
    running: boolean;
    lastScanTime: string | null;
    logs: string;
    exitCode: number | null;
    error: string | null;
}

function getScanStatus(): ScanStatus {
    try {
        const scratchDir = path.dirname(statusFilePath);
        if (!fs.existsSync(scratchDir)) {
            fs.mkdirSync(scratchDir, { recursive: true });
        }
        if (fs.existsSync(statusFilePath)) {
            return JSON.parse(fs.readFileSync(statusFilePath, 'utf8'));
        }
    } catch (e) {
        console.error('Error reading scan status:', e);
    }
    return {
        running: false,
        lastScanTime: null,
        logs: 'No se ha iniciado ningún escaneo aún.',
        exitCode: null,
        error: null
    };
}

function saveScanStatus(status: ScanStatus) {
    try {
        const scratchDir = path.dirname(statusFilePath);
        if (!fs.existsSync(scratchDir)) {
            fs.mkdirSync(scratchDir, { recursive: true });
        }
        fs.writeFileSync(statusFilePath, JSON.stringify(status, null, 2));
    } catch (e) {
        console.error('Error writing scan status:', e);
    }
}

export async function POST() {
    try {
        if (process.env.VERCEL) {
            return NextResponse.json({ 
                success: false, 
                error: 'El escaneo de StackHawk (DAST) requiere Docker y no puede ejecutarse en el entorno Serverless de Vercel. Por favor, ejecuta "npm run hawk:scan" localmente o configúralo en tu pipeline de CI/CD (GitHub Actions).' 
            }, { status: 400 });
        }

        const status = getScanStatus();
        if (status.running) {
            return NextResponse.json({ success: false, error: 'Ya hay un escaneo en curso.' }, { status: 400 });
        }

        // Start scan in background
        const newStatus: ScanStatus = {
            running: true,
            lastScanTime: new Date().toISOString(),
            logs: 'Iniciando StackHawk HawkScan...\n',
            exitCode: null,
            error: null
        };
        saveScanStatus(newStatus);

        const projectRoot = path.resolve(process.cwd(), '..');
        
        // Execute the npm script defined in server/package.json
        console.log(`[StackHawk Scan] Spawning npm run hawk:scan in ${projectRoot}...`);
        const child = exec('npm run hawk:scan', { cwd: projectRoot });

        let stdoutData = '';
        let stderrData = '';

        child.stdout?.on('data', (data) => {
            stdoutData += data;
            const current = getScanStatus();
            current.logs = stdoutData + stderrData;
            saveScanStatus(current);
        });

        child.stderr?.on('data', (data) => {
            stderrData += data;
            const current = getScanStatus();
            current.logs = stdoutData + stderrData;
            saveScanStatus(current);
        });

        child.on('close', (code) => {
            const current = getScanStatus();
            current.running = false;
            current.exitCode = code;
            current.logs = stdoutData + stderrData + `\n\n[Proceso finalizado con código de salida: ${code}]\n`;
            if (code !== 0) {
                current.error = `El proceso de escaneo falló con código ${code}`;
            }
            saveScanStatus(current);
        });

        return NextResponse.json({ success: true, message: 'Escaneo de StackHawk iniciado en segundo plano.' });
    } catch (err: any) {
        console.error('Exception starting scan:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        if (process.env.VERCEL) {
            return NextResponse.json({
                running: false,
                lastScanTime: null,
                logs: 'StackHawk no disponible en Vercel.\nEjecuta "npm run hawk:scan" localmente o en un pipeline de integración continua (CI/CD) para iniciar auditorías DAST.',
                exitCode: null,
                error: 'Entorno Serverless detectado (Vercel).'
            });
        }
        const status = getScanStatus();
        return NextResponse.json(status);
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
