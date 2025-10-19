import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const LiquidEther = ({ 
colors = ['#16DBBE', '#9B8CFF', '#00DEE8'],
  autoSpeed = 0.3, // ← уменьшить еще
  autoIntensity = 1.2, // ← уменьшить еще
  resolution = 64, // ← уменьшить в 2 раза!
  viscous = 30,
  dt = 0.014
}) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const timeRef = useRef(0);
  const { size, gl } = useThree();

  // Создаем текстуру палитры
  const paletteTex = useMemo(() => {
    const arr = colors.length === 1 ? [colors[0], colors[0]] : colors;
    const w = arr.length;
    const data = new Uint8Array(w * 4);
    for (let i = 0; i < w; i++) {
      const c = new THREE.Color(arr[i]);
      data[i * 4 + 0] = Math.round(c.r * 255);
      data[i * 4 + 1] = Math.round(c.g * 255);
      data[i * 4 + 2] = Math.round(c.b * 255);
      data[i * 4 + 3] = 255;
    }
    const tex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }, [colors]);

  // Fluid simulation текстуры
  const simulationTextures = useMemo(() => {
    const type = /(iPad|iPhone|iPod)/i.test(navigator.userAgent) ? THREE.HalfFloatType : THREE.FloatType;
    const options = {
      type,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      format: THREE.RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false
    };

    const velocityTexture1 = new THREE.WebGLRenderTarget(resolution, resolution, options);
    const velocityTexture2 = new THREE.WebGLRenderTarget(resolution, resolution, options);
    const pressureTexture1 = new THREE.WebGLRenderTarget(resolution, resolution, options);
    const pressureTexture2 = new THREE.WebGLRenderTarget(resolution, resolution, options);
    const divergenceTexture = new THREE.WebGLRenderTarget(resolution, resolution, options);

    return {
      velocity: [velocityTexture1, velocityTexture2],
      pressure: [pressureTexture1, pressureTexture2],
      divergence: divergenceTexture,
      currentVelocity: 0,
      currentPressure: 0
    };
  }, [resolution]);

  // Автоматическая анимация
  const autoCoords = useRef(new THREE.Vector2(0, 0));
  const autoTarget = useRef(new THREE.Vector2());
  const lastTimeRef = useRef(0);

  // Шейдеры для fluid simulation
  const simulationShaders = useMemo(() => {
    const advectionFrag = `
      precision highp float;
      uniform sampler2D velocity;
      uniform float dt;
      uniform vec2 fboSize;
      uniform vec2 px;
      varying vec2 vUv;
      
      void main() {
        vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
        vec2 vel = texture2D(velocity, vUv).xy;
        vec2 uv2 = vUv - vel * dt * ratio;
        vec2 newVel = texture2D(velocity, uv2).xy;
        gl_FragColor = vec4(newVel, 0.0, 1.0);
      }
    `;

    const divergenceFrag = `
      precision highp float;
      uniform sampler2D velocity;
      uniform vec2 px;
      varying vec2 vUv;
      
      void main() {
        float x0 = texture2D(velocity, vUv - vec2(px.x, 0.0)).x;
        float x1 = texture2D(velocity, vUv + vec2(px.x, 0.0)).x;
        float y0 = texture2D(velocity, vUv - vec2(0.0, px.y)).y;
        float y1 = texture2D(velocity, vUv + vec2(0.0, px.y)).y;
        float divergence = (x1 - x0 + y1 - y0) * 0.5;
        gl_FragColor = vec4(divergence, 0.0, 0.0, 1.0);
      }
    `;

    const pressureFrag = `
      precision highp float;
      uniform sampler2D pressure;
      uniform sampler2D divergence;
      uniform vec2 px;
      varying vec2 vUv;
      
      void main() {
        float p0 = texture2D(pressure, vUv + vec2(px.x, 0.0)).r;
        float p1 = texture2D(pressure, vUv - vec2(px.x, 0.0)).r;
        float p2 = texture2D(pressure, vUv + vec2(0.0, px.y)).r;
        float p3 = texture2D(pressure, vUv - vec2(0.0, px.y)).r;
        float div = texture2D(divergence, vUv).r;
        float newP = (p0 + p1 + p2 + p3 - div) * 0.25;
        gl_FragColor = vec4(newP, 0.0, 0.0, 1.0);
      }
    `;

    const gradientFrag = `
      precision highp float;
      uniform sampler2D pressure;
      uniform sampler2D velocity;
      uniform vec2 px;
      varying vec2 vUv;
      
      void main() {
        float p0 = texture2D(pressure, vUv + vec2(px.x, 0.0)).r;
        float p1 = texture2D(pressure, vUv - vec2(px.x, 0.0)).r;
        float p2 = texture2D(pressure, vUv + vec2(0.0, px.y)).r;
        float p3 = texture2D(pressure, vUv - vec2(0.0, px.y)).r;
        vec2 v = texture2D(velocity, vUv).xy;
        vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
        v = v - gradP;
        gl_FragColor = vec4(v, 0.0, 1.0);
      }
    `;

    const forceFrag = `
      precision highp float;
      uniform vec2 force;
      uniform vec2 center;
      uniform float radius;
      varying vec2 vUv;
      
      void main() {
        vec2 coord = (vUv - 0.5) * 2.0;
        vec2 dir = coord - center;
        float dist = length(dir);
        float influence = 1.0 - smoothstep(0.0, radius, dist);
        vec2 f = force * influence;
        gl_FragColor = vec4(f, 0.0, 1.0);
      }
    `;

    return {
      advectionFrag,
      divergenceFrag,
      pressureFrag,
      gradientFrag,
      forceFrag
    };
  }, []);

  useFrame((state, delta) => {
    timeRef.current += delta;
    
    // Автоматическое движение
    const now = performance.now();
    if (now - lastTimeRef.current > 16) {
      lastTimeRef.current = now;
      
      const dir = new THREE.Vector2().subVectors(autoTarget.current, autoCoords.current);
      const dist = dir.length();
      
      if (dist < 0.01) {
        autoTarget.current.set(
          (Math.random() * 2 - 1) * 0.8,
          (Math.random() * 2 - 1) * 0.8
        );
      } else {
        dir.normalize();
        const move = autoSpeed * delta * autoIntensity;
        autoCoords.current.addScaledVector(dir, Math.min(move, dist));
      }
    }

    if (materialRef.current) {
      materialRef.current.uniforms.time.value = timeRef.current;
      materialRef.current.uniforms.autoCoords.value.copy(autoCoords.current);
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float time;
    uniform vec2 resolution;
    uniform sampler2D palette;
    uniform vec2 autoCoords;
    
    varying vec2 vUv;
    
    // Улучшенный fluid simulation эффект
    void main() {
      vec2 uv = vUv;
      
      // Создаем сложные волновые паттерны
      vec2 fluidCoord = uv;
      
      // Многослойные волны с разными частотами и скоростями
      float wave1 = sin(fluidCoord.x * 12.0 + time * 1.5) * 0.02;
      float wave2 = cos(fluidCoord.y * 10.0 + time * 1.8) * 0.015;
      float wave3 = sin((fluidCoord.x + fluidCoord.y) * 8.0 + time * 2.1) * 0.01;
      float wave4 = cos((fluidCoord.x - fluidCoord.y) * 6.0 + time * 1.2) * 0.008;
      
      // Влияние автоматического движения
      vec2 autoEffect = autoCoords * 0.4;
      float autoWave1 = sin(fluidCoord.y * 15.0 + time * 2.0 + autoEffect.x) * 0.012;
      float autoWave2 = cos(fluidCoord.x * 13.0 + time * 1.6 + autoEffect.y) * 0.01;
      
      // Комбинируем все волны
      fluidCoord.x += wave1 + wave3 + autoWave1;
      fluidCoord.y += wave2 + wave4 + autoWave2;
      
      // Создаем турбулентные паттерны
      float turbulence = sin(fluidCoord.x * 25.0 + time * 2.5) * 
                        cos(fluidCoord.y * 22.0 + time * 2.3) * 0.008;
      fluidCoord += turbulence;
      
      // Генерируем основной паттерн
      float pattern1 = sin(fluidCoord.x * 18.0 + time * 1.4) * 0.5 + 0.5;
      float pattern2 = cos(fluidCoord.y * 16.0 + time * 1.9) * 0.5 + 0.5;
      float pattern3 = sin((fluidCoord.x + fluidCoord.y) * 12.0 + time * 2.4) * 0.5 + 0.5;
      float pattern4 = cos((fluidCoord.x - fluidCoord.y) * 9.0 + time * 1.7) * 0.5 + 0.5;
      
      // Сложное комбинирование паттернов
      float combined = (pattern1 * 0.3 + pattern2 * 0.25 + pattern3 * 0.25 + pattern4 * 0.2);
      
      // Добавляем шум для органичности
      float noise = sin(fluidCoord.x * 50.0) * cos(fluidCoord.y * 45.0) * 0.1;
      combined = clamp(combined + noise, 0.0, 1.0);
      
      // Берем цвет из палитры
      vec3 color = texture2D(palette, vec2(combined, 0.5)).rgb;
      
      // Добавляем объем и глубину
      float edgeGlow = sin(uv.x * 25.0 + time * 1.2) * 0.15 + 0.85;
      float centerGlow = 1.0 - length(uv - 0.5) * 0.5;
      color *= edgeGlow * centerGlow;
      
      // Плавное затухание к краям
      float fade = 1.0 - smoothstep(0.0, 0.5, length(uv - 0.5));
      color *= fade;
      
      gl_FragColor = vec4(color, 0.12); // Полупрозрачный фон
    }
  `;

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        uniforms={{
          time: { value: 0 },
          resolution: { value: new THREE.Vector2(size.width, size.height) },
          palette: { value: paletteTex },
          autoCoords: { value: new THREE.Vector2(0, 0) }
        }}
      />
    </mesh>
  );
};

const LiquidEtherBackground = ({ style, ...props }) => {
  return (
    <Canvas
      style={[StyleSheet.absoluteFill, style]}
      gl={{
        alpha: true,
        antialias: false, // ← ВЫКЛЮЧИТЬ СГЛАЖИВАНИЕ (самое важное!)
        powerPreference: "high-performance"
      }}
      camera={{ position: [0, 0, 1] }}
      dpr={1} // ← ТОЛЬКО 1 вместо [1, 2]
    >
      <LiquidEther {...props} />
    </Canvas>
  );
};

export default LiquidEtherBackground;