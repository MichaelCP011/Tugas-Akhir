import { useGLTF } from '@react-three/drei';

export default function PltuModel() {
  const { scene } = useGLTF('/models/pltu.glb');
  
  return (
    <primitive 
      object={scene} 
      scale={60} // Diperbesar 20x lipat dari aslinya
      position={[0, 7, 3]} // Posisinya digeser ke bawah agar pas di tengah kamera
    />
  );
}