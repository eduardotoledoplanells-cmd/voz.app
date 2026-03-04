import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    // ONLY FOR DEBUGGING - WILL BE DELETED IMMEDIATELY
    const envVars = Object.keys(process.env)
        .filter(key => key.includes('SUPABASE') || key.includes('URL') || key.includes('KEY'))
        .reduce((obj: any, key) => {
            obj[key] = process.env[key];
            return obj;
        }, {});

    return NextResponse.json(envVars);
}
