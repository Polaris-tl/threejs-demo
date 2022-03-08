// https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_additive_blending.html
import * as THREE from 'three'
import Stats from 'stats.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'
import { FXAAShader  } from 'three/examples/jsm/shaders/FXAAShader'
import TWEEN from '@tweenjs/tween.js';

const { Scene, PerspectiveCamera, PlaneGeometry, MeshPhongMaterial, WebGLRenderer, AxesHelper, Color, TextureLoader, } = THREE

// 创建一个EffectComposer（效果组合器）对象，然后在该对象上添加后期处理通道。
let composer: any, outlinePass: any, effectFXAA, selectedObjects: any[], selectedObjects2: any[] = []
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let carModel: THREE.Group
let envtexture: any
const camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
const loader = new GLTFLoader(); // gltf-loader
// loader 扩展
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("utils/draco/");
loader.setDRACOLoader(dracoLoader);
// loader 扩展
const materialDiv = document.querySelector('#material')
const modelDiv = document.querySelector('#model')
const boomDiv = document.querySelector('#boom')
const currentHovered = document.querySelector('#currentHovered')
const currentSelected = document.querySelector('#currentSelected')

type TansformType<T, Origin, Target> = {
  [P in keyof T]: T[P] extends Origin ? Target : T[P];
}
// 材质库
const materialArray: TansformType<THREE.MeshStandardMaterialParameters, THREE.Texture | undefined | null, string>[] = [
  {
    color: 0xff7c04,
    metalness:1,
    roughness: 0.3,
    envMapIntensity: 1,
  },
  {
    color: 0x01aff8,
    metalness:1,
    roughness: 0.3,
    envMapIntensity: 1,
  },
  {
    color: 0xff376a,
    metalness: 0,
    roughness: 0,
    envMapIntensity: 0,
    map: 'textures/t1/111.png',
    normalMap: 'textures/t1/444.png',
    bumpMap: 'textures/t1/222.png',
  }
]
function aaa(){
  const scene: THREE.Scene = new Scene(); 
  const renderer = new WebGLRenderer( { antialias: true } );
  const controls = new OrbitControls( camera, renderer.domElement ); // 鼠标控制器
  const loader = new GLTFLoader(); // gltf-loader
  let dashLineMaterial: THREE.ShaderMaterial | null = null // 虚线材质
  const stats = new Stats(); // 性能分析
  document.body.appendChild( stats.dom );
  const aaaaa = {x: 0, y: 0, z: 0}

  init();
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

    composer = new EffectComposer( renderer );
    const renderPass = new RenderPass( scene, camera );
    composer.addPass( renderPass );

    outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
    // outlinePass.selectedObjects = selectedObjects
    outlinePass.edgeStrength = 10.0 // 边框的亮度
    outlinePass.edgeGlow = 0.4// 光晕[0,1]
    outlinePass.usePatternTexture = false // 是否使用父级的材质
    outlinePass.edgeThickness = 0.3 // 边框宽度
    outlinePass.downSampleRatio = 1 // 边框弯曲度
    outlinePass.pulsePeriod = 5 // 呼吸闪烁的速度
    outlinePass.visibleEdgeColor.set(new THREE.Color(0x00ff00)) // 呼吸显示的颜色
    outlinePass.hiddenEdgeColor = new THREE.Color(0, 0, 0) // 呼吸消失的颜色
    composer.addPass( outlinePass );

    effectFXAA = new ShaderPass( FXAAShader );
    effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
    composer.addPass( effectFXAA );

    loadCar()
    // loadTire()
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.addEventListener( 'pointermove', onPointerMove );
    renderer.domElement.addEventListener( 'click', onClick );
    if(materialDiv){
      materialDiv.addEventListener('click',(e: any) => {
        const idx: number = e.target.dataset.idx
        if(!selectedObjects2[0]) return;
        const loader = new TextureLoader()
        let temp: any = null
        const item = materialArray[idx]
        if(!item) return;
        if(item.map || item.normalMap || item.bumpMap){
          temp = new THREE.MeshStandardMaterial({
            map: item.map ? loader.load(item.map) : null,
            normalMap: item.normalMap ? loader.load(item.normalMap) : null,
            bumpMap:  item.bumpMap ? loader.load(item.bumpMap) : null,
          });
        } else {
          temp = new THREE.MeshStandardMaterial({
            color: item.color,
            metalness: item.metalness,
            roughness: item.roughness,
            envMapIntensity: 0.7,
            envMap: envtexture
          });
        }
        selectedObjects2[0].traverse(function ( object: any ) {
          if (object.isMesh) {
            object.material = temp; // 覆盖默认材质
          }
        })
      })
    }
    if(modelDiv){
      modelDiv.addEventListener('click',(e: any) => {
        const idx: number = e.target.dataset.idx
        let myModel: THREE.Object3D | null = null
        if(!selectedObjects2[0]) return;
        selectedObjects2[0].visible = false;
        loadTire(selectedObjects2[0])
      })
    }
    if(boomDiv){
      boomDiv.addEventListener('click', () => {
        console.log(selectedObjects2[0])
        if(!selectedObjects2[0]) return
        var tween = new TWEEN.Tween(aaaaa);
        const position = new THREE.Vector3()
        selectedObjects2[0].getWorldPosition(position)
        tween.to({ 
          x: position.x + 3,
          y: position.y + 3,
          z: position.z + 3,
         }, 3000).start()
      })
    }
    window.addEventListener( 'resize', onWindowResize );
  }


  function onClick (e: MouseEvent) {
    if(selectedObjects2[0] && selectedObjects2[0] == selectedObjects[0]){
      selectedObjects2 = []
      outlinePass.selectedObjects = selectedObjects
      if(currentSelected){
        currentSelected.innerHTML = ''
      }
    } else {
      selectedObjects2 = [...selectedObjects]
      outlinePass.selectedObjects = selectedObjects2
      if(currentSelected){
        currentSelected.innerHTML = selectedObjects[0].name
      }
    }
  }
  
  function onPointerMove( event: any ) {
    if ( event.isPrimary === false ) return;
    mouse.x = ( event.offsetX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.offsetY / window.innerHeight ) * 2 + 1;
    checkIntersection();
  }

  function checkIntersection() {
    raycaster.setFromCamera( mouse, camera );
    const intersects = raycaster.intersectObject( carModel, true );
    if ( intersects.length > 0 ) {
      selectedObjects = [intersects[ 0 ].object];
      if(selectedObjects[0] && selectedObjects[0] == selectedObjects2[0]){
        outlinePass.selectedObjects = selectedObjects
      } else {
        outlinePass.selectedObjects = [...selectedObjects,...selectedObjects2];
      }
      if(currentHovered){
        currentHovered.innerHTML = intersects[ 0 ].object.name
      }
    } else {
      outlinePass.selectedObjects = [...selectedObjects2];
      if(currentHovered){
        currentHovered.innerHTML = ''
      }
    }
  }

  // 加载天空环境贴图
  function loadCubeTexture(){
    //六张图片分别是朝前的（posz）、朝后的（negz）、朝上的（posy）、朝下的（negy）、朝右的（posx）和朝左的（negx）。
    new THREE.CubeTextureLoader().setPath( 'images/g1/' ).load(['px.jpg', 'nx.jpg','py.jpg', 'ny.jpg','pz.jpg', 'nz.jpg'],
    (texture) => {
      scene.background = texture;
      envtexture = texture
    });
  }



  // 加载汽车模型
function loadCar(){
  loader.load( 'models/摩托车文件22.gltf', function ( gltf ) {
    carModel = gltf.scene;
    console.log(carModel)
    scene.add( carModel );
    carModel.scale.set(0.1,0.1,0.1)
  });
}

  // 加载轮胎
function loadTire(obj3D: any){
  loader.load( 'models/轮胎.gltf', function ( gltf ) {
    scene.add( gltf.scene );
    gltf.scene.scale.set(0.1,0.1,0.1)
  });
}

  function animate(t: number) {
      stats.begin();
      requestAnimationFrame( animate );
      TWEEN.update();
      dashLineMaterial && (dashLineMaterial.uniforms.time.value = t);
      if(selectedObjects2[0]){
        selectedObjects2[0].translateX(aaaaa.x)
        selectedObjects2[0].translateX(aaaaa.y)
        selectedObjects2[0].translateX(aaaaa.z)
      }
      composer.render();
      stats.end();
  };


  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight);
  }
  }
aaa()



  
