import OfficeClient from './OfficeClient';

export const metadata = {
  title: 'The Office | Mission Control',
  description: 'View your agents working in real-time in a 3D environment',
};

export default function OfficePage() {
  return <OfficeClient />;
}
