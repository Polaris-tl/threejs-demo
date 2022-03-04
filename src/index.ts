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
import { BoxGeometry } from 'three';

const { Scene, Vector3, SpriteMaterial, Sprite, PerspectiveCamera, PlaneGeometry, MeshPhongMaterial, WebGLRenderer, AxesHelper, Color, TextureLoader, MeshBasicMaterial, SphereGeometry, Mesh } = THREE

// 创建一个EffectComposer（效果组合器）对象，然后在该对象上添加后期处理通道。
let composer: any, renderPass, outlinePass: any, effectFXAA, selectedObjects: any[]
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const left = document.getElementById('left')
const right = document.getElementById('right')
let carModel: any
let envtexture: any
const a = left?.clientWidth || 100
const b = left?.clientHeight || 100
const camera = new PerspectiveCamera( 45, (left?.clientWidth || 100) / (left?.clientHeight || 100), 1, 1000 );
const camera2 = new PerspectiveCamera( 45, (right?.clientWidth || 100) / (right?.clientHeight || 100), 1, 1000 );
const loader = new GLTFLoader(); // gltf-loader
// loader 扩展
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("utils/draco/");
loader.setDRACOLoader(dracoLoader);
// loader 扩展
function aaa(){
  const scene: THREE.Scene = new Scene(); 
  const renderer = new WebGLRenderer( { antialias: true } );
  const controls = new OrbitControls( camera, renderer.domElement ); // 鼠标控制器
  const loader = new GLTFLoader(); // gltf-loader
  let dashLineMaterial: THREE.ShaderMaterial | null = null // 虚线材质
  const stats = new Stats(); // 性能分析
  document.body.appendChild( stats.dom );
  const group = new THREE.Group()
  controls.addEventListener('change', () => {
    const position = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    }
    const quaternion = {
      x: camera.quaternion.x,
      y: camera.quaternion.y,
      z: camera.quaternion.z,
      w: camera.quaternion.w,
    }
    camera2.position.copy( new Vector3(position.x, position.y, position.z) );
		camera2.quaternion.copy( new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w) );


    
    // camera2.matrixWorldInverse.copy( camera.matrixWorldInverse );
		// camera2.projectionMatrix.copy( camera.projectionMatrix );
		// camera2.projectionMatrixInverse.copy( camera.projectionMatrixInverse );
    // camera2.up.copy( camera.up );
		// camera2.matrix.copy( camera.matrix );
		// camera2.matrixWorld.copy( camera.matrixWorld );
		// camera2.rotation.order = camera.rotation.order;
		// camera2.scale.copy( camera.scale );
  })

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
    renderer.setSize( left?.clientWidth as number, left?.clientHeight  as number );
    left && left.appendChild( renderer.domElement );
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

    outlinePass = new OutlinePass( new THREE.Vector2( a, b ), scene, camera );
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
    effectFXAA.uniforms[ 'resolution' ].value.set( 1 / a, 1 / b );
    composer.addPass( effectFXAA );

    loadCar() 
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.addEventListener( 'pointermove', onPointerMove );
    renderer.domElement.addEventListener( 'click', onClick );
    renderer.domElement.addEventListener( 'contextmenu', onRightClick );
    window.addEventListener( 'resize', onWindowResize );
  }

  function onRightClick(){
    // debugger
    const box1 = new Mesh(new BoxGeometry(10,10,10), new MeshPhongMaterial())
    if(selectedObjects.length) { 
      if (selectedObjects[0].isMesh) {
        console.log(selectedObjects[0])
        box1.position.copy(selectedObjects[0].position)
        box1.quaternion.copy(selectedObjects[0].quaternion)
        box1.matrix.copy(selectedObjects[0].matrix)
        box1.matrixWorld.copy(selectedObjects[0].matrixWorld)
        box1.matrixWorldNeedsUpdate = true
        selectedObjects[0].add(box1)
      }
    }
  }

  function onClick (e: MouseEvent) {
    const newMaterial = new THREE.MeshStandardMaterial({
      color: 0xff7c04,
      metalness:1,
      roughness: 0.3,
      envMapIntensity: 1,
      envMap: envtexture
    });
    if(selectedObjects.length) {
      console.log(selectedObjects[0])
      if (selectedObjects[0].isMesh) {
        selectedObjects[0].material = newMaterial; // 覆盖默认材质
      }
    }
  }
  
  function onPointerMove( event: any ) {
    if ( event.isPrimary === false ) return;
    mouse.x = ( event.offsetX / a ) * 2 - 1;
    mouse.y = - ( event.offsetY / b ) * 2 + 1;
    checkIntersection();
  }

  function checkIntersection() {
    raycaster.setFromCamera( mouse, camera );
    const intersects = raycaster.intersectObject( carModel, true );
    if ( intersects.length > 0 ) {
      selectedObjects = [];
      selectedObjects.push( intersects[ 0 ].object );
      outlinePass.selectedObjects = selectedObjects;
    } else {
      outlinePass.selectedObjects = [];
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
  loader.load( 'models/modelDraco.gltf', function ( gltf ) {
    carModel = gltf.scene;
    console.log(carModel)
    const newMaterial = new THREE.MeshStandardMaterial({
      color: 0xff7c04,
      metalness:1,
      roughness: 0.3,
      envMapIntensity: 1,
      envMap: envtexture,
    });
    scene.add( carModel );
    carModel.scale.set(0.1,0.1,0.1)
    let aa:any
    carModel.traverse( function ( object: any ) {
      if ( object.isMesh ) object.castShadow = true;
      // 600-3B.stp  65_ASM  600_ASM_30_ASM   red__qiangai  
      if (object.name === '600_ASM_30_ASM') {
        aa = object
      }
    });
    console.log(aa)
    aa.traverse(function ( object: any ) {
      if (object.isMesh) {
        object.material = newMaterial; // 覆盖默认材质
      }
    })
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
    camera.aspect = (left?.clientWidth || 100) / (left?.clientHeight || 100);
    camera.updateProjectionMatrix();
    renderer.setSize( left?.clientWidth || 100, left?.clientHeight || 100 );
  }
  }
aaa()

function bbb(){
  const scene: THREE.Scene = new Scene(); 
  const renderer = new WebGLRenderer( { antialias: true } );
  // const camera = new PerspectiveCamera( 45, (right?.clientWidth || 100) / (right?.clientHeight || 100), 1, 1000 );
  const controls = new OrbitControls( camera2, renderer.domElement ); // 鼠标控制器
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
    camera2.position.set( -30, 12, 15 );
    // camera↑↑↑

    // renderer↓↓↓
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.shadowMap.enabled = true;
    renderer.setSize( right?.clientWidth as number, right?.clientHeight  as number );
    right && right.appendChild( renderer.domElement );
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
      renderer.render( scene, camera2 );
      requestAnimationFrame( animate );
      group2.rotation.y += 0.01
      group.rotateX(0.02)
      // group.rotation.x = rotateObj.value
      TWEEN.update();
      dashLineMaterial && (dashLineMaterial.uniforms.time.value = t);
      stats.end();
  };


  function onWindowResize() {
    camera2.aspect = (right?.clientWidth || 100) / (right?.clientHeight || 100);
    camera2.updateProjectionMatrix();
    renderer.setSize( right?.clientWidth || 100, right?.clientHeight || 100 );
  }
  }
  bbb()


  
