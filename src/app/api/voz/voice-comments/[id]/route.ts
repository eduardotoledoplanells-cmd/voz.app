import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ error: "Missing comment id" }, { status: 400 });
        }

        // 1. Get the comment to check ownership and existence
        const { data: comment, error: fetchError } = await supabase
            .from('voice_comments')
            .select('user_handle')
            .eq('id', id)
            .single();

        if (fetchError || !comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        // We aren't strictly enforcing JWT auth right now, but usually you'd verify the requesting user owns the comment
        // For this demo, we assume the frontend sends a valid delete request.

        const { error: deleteError } = await supabase
            .from('voice_comments')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error("Error deleting comment:", deleteError);
            return NextResponse.json({ error: "Could not delete comment" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Comment deleted" });

    } catch (error) {
        console.error("Error in delete route:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
