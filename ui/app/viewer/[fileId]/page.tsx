'use client';

import PDFViewer from '@/components/PDFViewer';
import { useParams } from 'next/navigation';

export default function ViewerPage() {
  const params = useParams();
  const fileId = params.fileId as string;

  return (
    <div className="w-full h-screen">
      <PDFViewer fileId={fileId} />
    </div>
  );
} 