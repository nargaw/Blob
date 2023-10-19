import { Vector2, ShaderMaterial } from 'three'
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { lerp } from 'three/src/math/MathUtils'

export default function Shader()
{

    const material = new ShaderMaterial({
        vertexShader: `
        varying vec2 vUv;

        void main()
        {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        }
        `,
        fragmentShader: `

        varying vec2 vUv;
        #define PI 3.14159265359
        #define TWO_PI 6.28318530718
        uniform float u_time;
        uniform vec3 u_mouse;

        #define MAX_STEPS 1000
        #define MAX_DIST 1000.
        #define SURF_DIST .000001
        #define S smoothstep
        #define T u_time

        //	Classic Perlin 3D Noise 
        //	by Stefan Gustavson
        //
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

        float cnoise(vec3 P){
            vec3 Pi0 = floor(P); // Integer part for indexing
            vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
            Pi0 = mod(Pi0, 289.0);
            Pi1 = mod(Pi1, 289.0);
            vec3 Pf0 = fract(P); // Fractional part for interpolation
            vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
            vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
            vec4 iy = vec4(Pi0.yy, Pi1.yy);
            vec4 iz0 = Pi0.zzzz;
            vec4 iz1 = Pi1.zzzz;

            vec4 ixy = permute(permute(ix) + iy);
            vec4 ixy0 = permute(ixy + iz0);
            vec4 ixy1 = permute(ixy + iz1);

            vec4 gx0 = ixy0 / 7.0;
            vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
            gx0 = fract(gx0);
            vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
            vec4 sz0 = step(gz0, vec4(0.0));
            gx0 -= sz0 * (step(0.0, gx0) - 0.5);
            gy0 -= sz0 * (step(0.0, gy0) - 0.5);

            vec4 gx1 = ixy1 / 7.0;
            vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
            gx1 = fract(gx1);
            vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
            vec4 sz1 = step(gz1, vec4(0.0));
            gx1 -= sz1 * (step(0.0, gx1) - 0.5);
            gy1 -= sz1 * (step(0.0, gy1) - 0.5);

            vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
            vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
            vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
            vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
            vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
            vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
            vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
            vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

            vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
            g000 *= norm0.x;
            g010 *= norm0.y;
            g100 *= norm0.z;
            g110 *= norm0.w;
            vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
            g001 *= norm1.x;
            g011 *= norm1.y;
            g101 *= norm1.z;
            g111 *= norm1.w;

            float n000 = dot(g000, Pf0);
            float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
            float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
            float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
            float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
            float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
            float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
            float n111 = dot(g111, Pf1);

            vec3 fade_xyz = fade(Pf0);
            vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
            vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
            float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
            return 2.2 * n_xyz;
        }

        float sdSphere( vec3 p, float s )
        {
        return length(p)-s;
        }

        float GetDist(vec3 p){
            vec2 m = vec2(u_mouse);
            // p.x -= -m.x;
            // p.y += -m.y;
            p += (cnoise(p) * 0.1) * (sin(u_time) / 10. + 1.);
            // p.x = m.x * 0.5;
            // p.y = -m.y * 0.5;
            
            float sphere = sdSphere(p, 1.75);

            return sphere;
        }

        float RayMarch(vec3 ro, vec3 rd, float side){
            float dO = 0.;
            for(int i = 0; i < MAX_STEPS; i++){
                vec3 p = ro + rd * dO;
                float dS = GetDist(p) * side;
                dO += dS;
                if(dO > MAX_DIST || abs(dS)<SURF_DIST) break;
            }
            return dO;
        }

        vec3 GetNormal(vec3 p){
            vec2 e = vec2(.01, 0);
            vec3 n = GetDist(p) - vec3(GetDist(p-e.xyy), GetDist(p-e.yxy), GetDist(p-e.yyx));
            return normalize(n);
        }

        vec3 GetRayDir(vec2 uv, vec3 p, vec3 l, float z){
            vec3 
                f = normalize(l - p),
                r = normalize(cross(vec3(0., 1., 0.), f)),
                u = cross(f, r),
                c = f * z,
                i = c + uv.x*r + uv.y*u;
            
            return normalize(i);
        }

        mat2 Rot(float a){
            float s = sin(a), c=cos(a);
            return mat2(c, -s, s, c);
        }

        void main()
        {
            vec2 m = u_mouse.xy;
            vec2 vUv = vec2(vUv.x, vUv.y);
            vUv -= 0.75;
            vUv.x -= m.x * 0.5 - 0.5;
            vUv.y -= m.y * 0.5 - 0.5;
            vUv *= 7.;
            vec3 color = vec3(0.);
            

            vec3 ro = vec3 (0., 3., -4) * .9;
            ro.yx *= Rot(PI * 0.5);
            ro.xz *= Rot(u_time);

            vec3 rd = GetRayDir(vUv, ro, vec3(0.), 1.);
            rd.y *= -1.;

            vec3 col = vec3(0.);
            float d = RayMarch(ro, rd, 1.); 
            float IOR = 1.45;

            if(d < MAX_DIST){
                vec3 p = ro + rd * d; //3d hit position
                vec3 n = GetNormal(p); //normal of surface orientation
                vec3 r = reflect(rd, n);
    
                // vec3 refOutside = texture(u_cubemap, r ).rgb;
                vec3 refOutside = vec3(1.);
    
                vec3 rdIn = refract(rd, n, 1. /IOR);//ray dir entering
    
                vec3 pEnter = p - n * SURF_DIST * 3.;
                float dIn = RayMarch(pEnter, rdIn, -1.); //inside of obj
                vec3 pExit = pEnter + rdIn * dIn; //3d position of exit
                vec3 nExit = -GetNormal(pExit); //normal of exit
                vec3 reflTex = vec3(0.);
                vec3 rdOut = vec3(0.);
    
                float abb = .01;
    
                rdOut = refract(rdIn, nExit, IOR-abb);
                if(dot(rdOut, rdOut)==0.) rdOut = reflect(rdIn, nExit);
                
    
                rdOut = refract(rdIn, nExit, IOR);
                if(dot(rdOut, rdOut)==0.) rdOut = reflect(rdIn, nExit);
                
    
                rdOut = refract(rdIn, nExit, IOR+abb);
                if(dot(rdOut, rdOut)==0.) rdOut = reflect(rdIn, nExit);
                
                float dens = 0.1;
                float optDist = exp(-dIn * dens);
    
                col = reflTex * optDist;
                float fresnel = pow(1. + dot(rd, n), 5.);
    
                col = mix(reflTex, refOutside, fresnel);
                // col = n * 0.5 + 0.5;
                color += col;
    
                
            }

            gl_FragColor = vec4(col, 0.5);
        }
        `,
        uniforms: {
            u_time: { value: 1.0},
            u_mouse: { value: new Vector2()}
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        opacity: 0.15
    })

    const shaderRef = useRef()
    let mouseX = 0
    let mouseY = 0
    let newMouseX = 0
    let newMouseY = 0

    useFrame(({clock}) => {
        // console.log('mouse x:' + mouseX)
        // console.log('newMouseX:' + newMouseX)
        // lerp(newMouseX, mouseX, 0.01)
        // lerp(newMouseY,  mouseY, 0.01)
        shaderRef.current.material.uniforms.u_time.value = clock.elapsedTime
        shaderRef.current.material.uniforms.u_mouse.value = new Vector2(mouseX, mouseY)
    })

    addEventListener('mousemove', (e) => {
        mouseX = lerp( mouseX, (e.clientX / window.innerWidth), 0.05);
        mouseY = lerp(mouseY, (-(e.clientY / window.innerHeight) + 1), 0.05);
    })

    

    addEventListener('contextmenu', e => e.preventDefault())

    addEventListener('touchmove', (e) => {
        mouseX = (e.changedTouches[0].clientX / window.innerWidth);
        mouseY = -(e.changedTouches[0].clientY / window.innerHeight) + 1;
    }, {passive: false})

    addEventListener('touchend', (e) => {

    }, {passive: false}, false)

    return <>
        <mesh dispose={null} ref={shaderRef} material={material} position={[0, 0, 1]}>
            <planeGeometry args={[25, 25]} />
        </mesh>
    </>
}