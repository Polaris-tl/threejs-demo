// https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_additive_blending.html
import * as THREE from 'three'
import Stats from 'stats.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import TWEEN from '@tweenjs/tween.js';
import { BoxGeometry } from 'three';


import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader  } from 'three/examples/jsm/shaders/FXAAShader'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';

let composer: any = null
let effectFXAA: any = null

const { Scene, PerspectiveCamera, PlaneGeometry, MeshPhongMaterial, WebGLRenderer, AxesHelper, Color, Mesh } = THREE

const scene: THREE.Scene = new Scene(); 
const renderer = new WebGLRenderer( { antialias: true } );
const camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
const controls = new OrbitControls( camera, renderer.domElement ); // 鼠标控制器
const loader = new GLTFLoader(); // gltf-loader
let dashLineMaterial: THREE.ShaderMaterial | null = null // 虚线材质
const stats = new Stats(); // 性能分析
document.body.appendChild( stats.dom );
const group = new THREE.Group()

init();
const box1 = new Mesh(new BoxGeometry(), new MeshPhongMaterial())
const box2 = new Mesh(new BoxGeometry(), new MeshPhongMaterial())
const group2 = new THREE.Group()
group2.position.set(.5,.5,.5)
box2.position.set(.5,.5,.5)

group2.add(box2)
box1.add(group2)
scene.add(box1)
animate(0)

function init() {
  // scene↓↓↓
  scene.background = new Color(0xa0a0a0)
  var axes = new AxesHelper(70); // 坐标轴辅助器
  scene.add(axes);
  // scene↑↑↑

  // loader 扩展
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("utils/draco/");
  loader.setDRACOLoader(dracoLoader);
  // loader 扩展

  // camera↓↓↓
  camera.position.set( -30, 12, 15 );
  // camera↑↑↑

  // renderer↓↓↓
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.shadowMap.enabled = true;
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
  // renderer↑↑↑
  // 鼠标控制器
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.target.set( 0, 0, 0 );
  controls.update();

  // 环境光↓↓↓
  const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
  hemiLight.position.set( 0, 20, 0 );
  scene.add( hemiLight );
  // 环境光↑↑↑

  // 方向光↓↓↓
  const dirLight = new THREE.DirectionalLight( 0xffffff );
  dirLight.position.set( 3, 10, 10 );
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 2;
  dirLight.shadow.camera.bottom = - 2;
  dirLight.shadow.camera.left = - 2;
  dirLight.shadow.camera.right = 2;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 40;
  scene.add( dirLight );
  // 方向光↑↑↑

  // 地面↓↓↓
  const mesh = new THREE.Mesh( new PlaneGeometry( 100, 100 ), new MeshPhongMaterial( { color: 0x999999, depthWrite: false, transparent: true, opacity: 0.7 } ) );
  mesh.rotation.x = - Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add( mesh );
  // 地面↑↑↑

  loadCubeTexture()
  window.addEventListener( 'resize', onWindowResize );

  composer = new EffectComposer( renderer );
  const renderPass = new RenderPass( scene, camera );
  composer.addPass( renderPass );
  // const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.1, 0.4, 0.99 );
  // composer.addPass( bloomPass );

  // 自定义后期处理器
  const customPostprocessingShader = {
    shader1: { // 实现径向模糊效果
      uniforms: {
          "tDiffuse": {type: "t", value: null},
          "rPower": {type: "f", value: 0.2126},
          "gPower": {type: "f", value: 0.7152},
          "bPower": {type: "f", value: 0.0722}
      },
      vertexShader: /*glsl*/`
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /*glsl*/`
        uniform float rPower;
        uniform float gPower;
        uniform float bPower;
        uniform sampler2D tDiffuse;
        varying vec2 vUv;

        const float sampleDist = 1.0;
        const float sampleStrength = 1.2; 

        void main(){
          // 灰度图
          // vec4 texel = texture2D(tDiffuse, vUv);
          // float final = texel.r * rPower + texel.g * gPower + texel.b * bPower;
          // gl_FragColor = vec4(vec3(final), 1.0);

          // 径向模糊01
          // vec4 texel;
          // vec2 dir = vec2(0.5) - vUv.xy;
          // for (int j = 0; j < 10; ++j)
          // {
          //   //计算采样uv值：正常uv值+从中间向边缘逐渐增加的采样距离
          //   vec2 uv = vUv.xy +  dir * float(j) * 0.005;
          //   texel += texture2D(tDiffuse, uv);
          // }
          // texel *= 0.1;
          // gl_FragColor = vec4(vec3(texel), 1.0);

          // 径向模糊02
          float samples[10];
          samples[0] = -0.08;
          samples[1] = -0.05;
          samples[2] = -0.03;
          samples[3] = -0.02;
          samples[4] = -0.01;
          samples[5] =  0.01;
          samples[6] =  0.02;
          samples[7] =  0.03;
          samples[8] =  0.05;
          samples[9] =  0.08;
          vec2 dir = vec2(0.5) - vUv.xy;
          float dist = sqrt(dir.x*dir.x + dir.y*dir.y); 
          dir = dir/dist;
          vec4 color = texture2D(tDiffuse,vUv); 
          vec4 sum = color;
          for (int i = 0; i < 10; i++){
            sum += texture2D( tDiffuse, vUv + dir * samples[i] * sampleDist );
          }
          sum *= 1.0/11.0;
          float t = dist * sampleStrength;
          t = clamp( t ,0.0,1.0);

          gl_FragColor = mix( color, sum, t );
        }
      `,
    },
    shader2: {
      uniforms: {
        tDiffuse: {type: "t", value:0, texture:null},
        fX: {type: "f", value: 0.5},
        fY: {type: "f", value: 0.5},
        fExposure: {type: "f", value: 0.6},
        fDecay: {type: "f", value: 0.93},
        fDensity: {type: "f", value: 0.96},
        fWeight: {type: "f", value: 0.4},
        fClamp: {type: "f", value: 1.0}
      },
  
      vertexShader: [
        "varying vec2 vUv;",
  
        "void main() {",
  
          "vUv = vec2( uv.x, 1.0 - uv.y );",
          "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
  
        "}"
      ].join("\n"),
  
      fragmentShader: [
        "varying vec2 vUv;",
        "uniform sampler2D tDiffuse;",
  
        "uniform float fX;",
        "uniform float fY;",
        "uniform float fExposure;",
        "uniform float fDecay;",
        "uniform float fDensity;",
        "uniform float fWeight;",
        "uniform float fClamp;",
  
        "const int iSamples = 20;",
  
        "void main()",
        "{",
          "vec2 deltaTextCoord = vec2(vUv - vec2(fX,fY));",
          "deltaTextCoord *= 1.0 /  float(iSamples) * fDensity;",
          "vec2 coord = vUv;",
          "float illuminationDecay = 1.0;",
          "vec4 FragColor = vec4(0.0);",
  
          "for(int i=0; i < iSamples ; i++)",
          "{",
            "coord -= deltaTextCoord;",
            "vec4 texel = texture2D(tDiffuse, coord);",
            "texel *= illuminationDecay * fWeight;",
  
            "FragColor += texel;",
  
            "illuminationDecay *= fDecay;",
          "}",
          "FragColor *= fExposure;",
          "FragColor = clamp(FragColor, 0.0, fClamp);",
          "gl_FragColor = FragColor;",
        "}"
      ].join("\n")
    },
  }
  const shaderPass= new ShaderPass(customPostprocessingShader.shader1);
  composer.addPass(shaderPass);

  effectFXAA = new ShaderPass( FXAAShader );
  effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
  composer.addPass( effectFXAA );
}

// 加载天空环境贴图
function loadCubeTexture(){
  //六张图片分别是朝前的（posz）、朝后的（negz）、朝上的（posy）、朝下的（negy）、朝右的（posx）和朝左的（negx）。
  new THREE.CubeTextureLoader().setPath( 'images/g1/' ).load(['px.jpg', 'nx.jpg','py.jpg', 'ny.jpg','pz.jpg', 'nz.jpg'],
  (texture) => {
    scene.background = texture;
  });
}

function animate(t: number) {
    stats.begin();
    // renderer.render( scene, camera );
    composer.render();
    requestAnimationFrame( animate );
    group2.rotation.y += 0.01
    group.rotateX(0.02)
    // group.rotation.x = rotateObj.value
    TWEEN.update();
    dashLineMaterial && (dashLineMaterial.uniforms.time.value = t);
    stats.end();
};


function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

  
