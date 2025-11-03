"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ParticleBackgroundProps {
  className?: string;
  clickPosition?: { x: number; y: number; timestamp: number } | null;
}

export default function ParticleBackground({ className = "", clickPosition }: ParticleBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);
  const cameraRef = useRef<THREE.PerspectiveCamera | undefined>(undefined);
  const particlesRef = useRef<THREE.Points | undefined>(undefined);
  const mouseRef = useRef(new THREE.Vector2());
  const targetPositionsRef = useRef<Float32Array | undefined>(undefined);
  const animationRef = useRef<number>(0);
  const lastClickRef = useRef<{ x: number; y: number; timestamp: number } | null>(null);

  useEffect(() => {
    if (clickPosition) {
      lastClickRef.current = clickPosition;
    }
  }, [clickPosition]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    camera.position.z = 450;

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    const createParticles = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.src = "/images/still-good-logo.png";
      img.onload = () => {
        // Set canvas size to image dimensions (or scale to desired size)
        canvas.width = img.width;
        canvas.height = img.height;

        // Scale canvas to maintain "slightly larger" size (proportional to 1440x480)
        const maxWidth = 2000;
        const maxHeight = 900;
        if (img.width > maxWidth || img.height > maxHeight) {
          const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const positions: number[] = [];
        const colors: number[] = [];
        const maxParticles = 50000;

        for (let y = 0; y < canvas.height && positions.length / 3 < maxParticles; y += 2) {
          for (let x = 0; x < canvas.width && positions.length / 3 < maxParticles; x += 2) {
            const index = (y * canvas.width + x) * 4;
            const alpha = data[index + 3];

            if (alpha > 100) {
              const worldX = (x - canvas.width / 2) * 1.4;
              const worldY = -(y - canvas.height / 2) * 1.4;
              const worldZ = (Math.random() - 0.5) * 30;

              positions.push(worldX, worldY, worldZ);
              colors.push(data[index] / 255, data[index + 1] / 255, data[index + 2] / 255); // Image RGB colors
            }
          }
        }

        const geometry = new THREE.BufferGeometry();
        const positionArray = new Float32Array(positions);
        const colorArray = new Float32Array(colors);

        geometry.setAttribute("position", new THREE.BufferAttribute(positionArray, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));

        targetPositionsRef.current = positionArray.slice();

        const material = new THREE.PointsMaterial({
          size: 1,
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          sizeAttenuation: true,
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);
        particlesRef.current = particles;

        // Start animation after particles are created
        animate();
      };
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    const animate = () => {
      if (!particlesRef.current || !targetPositionsRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const targetPositions = targetPositionsRef.current;
      const currentTime = Date.now();

      const mouseWorldX = mouseRef.current.x * 500;
      const mouseWorldY = mouseRef.current.y * 350;

      for (let i = 0; i < positions.length; i += 3) {
        const targetX = targetPositions[i];
        const targetY = targetPositions[i + 1];
        const targetZ = targetPositions[i + 2];

        // Mouse repulsion
        const dxMouse = mouseWorldX - positions[i];
        const dyMouse = mouseWorldY - positions[i + 1];
        const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distanceMouse < 140) {
          const force = (140 - distanceMouse) / 140;
          positions[i] -= (dxMouse / distanceMouse) * force * 22;
          positions[i + 1] -= (dyMouse / distanceMouse) * force * 22;
        }

        // Click repulsion
        if (lastClickRef.current && currentTime - lastClickRef.current.timestamp < 60000) {
          const clickWorldX = lastClickRef.current.x * 500;
          const clickWorldY = lastClickRef.current.y * 350;
          const dxClick = clickWorldX - positions[i];
          const dyClick = clickWorldY - positions[i + 1];
          const distanceClick = Math.sqrt(dxClick * dxClick + dyClick * dyClick);

          if (distanceClick < 300) {
            const force = (300 - distanceClick) / 300;
            positions[i] -= (dxClick / distanceClick) * force * 100;
            positions[i + 1] -= (dyClick / distanceClick) * force * 100;
            positions[i + 2] += (Math.random() - 0.5) * force * 50;
          }
        }

        // Return to target position
        positions[i] += (targetX - positions[i]) * 0.05;
        positions[i + 1] += (targetY - positions[i + 1]) * 0.05;
        positions[i + 2] += (targetZ - positions[i + 2]) * 0.05;
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    createParticles();
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (container && rendererRef.current?.domElement) {
        container.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  return <div ref={containerRef} className={`fixed inset-0 pointer-events-none ${className}`} style={{ zIndex: 10 }} />;
}
