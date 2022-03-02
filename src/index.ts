// https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_additive_blending.html
import * as THREE from 'three'
import Stats from 'stats.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import TWEEN from '@tweenjs/tween.js';
import { BoxGeometry } from 'three';

const { Scene, Vector3, SpriteMaterial, Sprite, PerspectiveCamera, PlaneGeometry, MeshPhongMaterial, WebGLRenderer, AxesHelper, Color, TextureLoader, MeshBasicMaterial, SphereGeometry, Mesh } = THREE

const left = document.getElementById('left')
const right = document.getElementById('right')
const camera = new PerspectiveCamera( 45, (left?.clientWidth || 100) / (left?.clientHeight || 100), 1, 1000 );
const camera2 = new PerspectiveCamera( 45, (right?.clientWidth || 100) / (right?.clientHeight || 100), 1, 1000 );
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
      renderer.render( scene, camera );
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


  
