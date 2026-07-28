'use client';

import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import ReportModal from '@/app/components/ReportModal';

interface VideoReportButtonProps {
    video: {
        id: string;
        user_handle?: string;
        video_url?: string;
        description?: string;
    };
}

export default function VideoReportButton({ video }: VideoReportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(255, 59, 48, 0.1)',
                    border: '1px solid rgba(255, 59, 48, 0.3)',
                    color: '#FF3B30',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <ShieldAlert size={14} color="#FF3B30" />
                <span>Denunciar</span>
            </button>

            <ReportModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                video={{
                    id: video.id,
                    userHandle: video.user_handle,
                    videoUrl: video.video_url,
                    description: video.description
                }}
            />
        </>
    );
}
