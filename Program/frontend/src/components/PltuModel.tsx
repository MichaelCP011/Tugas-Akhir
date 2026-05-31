import { useGLTF } from '@react-three/drei';

export default function PltuModel() {
  const { scene } = useGLTF('/models/pltu.glb');
  
  return (
    <primitive 
      object={scene} 
      scale={60} 
      position={[0, 5, 6]} 
    />
  );
}