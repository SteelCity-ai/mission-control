import dynamic from 'next/dynamic';

export const metadata = {
  title: 'The Office | Mission Control',
  description: 'View your agents working in real-time in a 3D environment',
};

const Office3D = dynamic(() => import('@/components/Office3D/Office3D'), {
  ssr: false,
});

export default function OfficePage() {
  return <Office3D />;
}
