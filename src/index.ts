// https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_additive_blending.html
import * as THREE from 'three'
import Stats from 'stats.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import TWEEN from '@tweenjs/tween.js';
import options from './utils';

const { Scene, Vector3, SpriteMaterial, Sprite, PerspectiveCamera, PlaneGeometry, MeshPhongMaterial, WebGLRenderer, AxesHelper, Color, TextureLoader, MeshBasicMaterial, SphereGeometry, Mesh } = THREE

const scene: THREE.Scene = new Scene(); 
const renderer = new WebGLRenderer( { antialias: true } );
const camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
const controls = new OrbitControls( camera, renderer.domElement ); // 鼠标控制器
const loader = new GLTFLoader(); // gltf-loader
let envtexture: THREE.CubeTexture | null = null; // 环境贴图
let carModel: THREE.Group | null = null // 汽车模型
let carEnvBox: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> | null = null // 汽车模型的环境贴图
let motorTire: THREE.Mesh | null  = null // 车轱辘object
let dashLineMaterial: THREE.ShaderMaterial | null = null // 虚线材质
let cameraTrack: THREE.Vector3[] = [] // 相机动画的轨道数据
let trackIndex = 0;
const rotateObj = {value: Math.PI};
const stats = new Stats(); // 性能分析
document.body.appendChild( stats.dom );
const group = new THREE.Group()

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
  addDashLine()
  loadCar()
  loadCarEnv()

  window.addEventListener( 'click', onMouseClick );
  window.addEventListener( 'resize', onWindowResize );
  window.addEventListener( 'contextmenu', onContextMenu );
}

// 加载天空环境贴图
function loadCubeTexture(){
  //六张图片分别是朝前的（posz）、朝后的（negz）、朝上的（posy）、朝下的（negy）、朝右的（posx）和朝左的（negx）。
  new THREE.CubeTextureLoader().setPath( 'images/g1/' ).load(['px.jpg', 'nx.jpg','py.jpg', 'ny.jpg','pz.jpg', 'nz.jpg'],
  (texture) => {
    scene.background = texture;
    envtexture = texture;
  });
}

// 加载汽车场景环境贴图
function loadCarEnv(){
  carEnvBox = new Mesh( new SphereGeometry( 0.1, 30, 30 ), new MeshBasicMaterial({
    side: THREE.DoubleSide
  }) )
  carEnvBox.position.set(0,0,0)
  carEnvBox.scale.set(700,700,-700)
  scene.add( carEnvBox );
  new TextureLoader().load( 'images/模型全景图.jpg' ,(texture) => {
    if(carEnvBox){
      carEnvBox.material.map = texture;
      carEnvBox.material.needsUpdate = true
    }
  })
}

// 加载虚线
function addDashLine(){
  // 虚线着色器
  dashLineMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 1.0 },
    },
    vertexShader: /*glsl*/`
      attribute float size;
      varying vec3 vColor;
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        vColor = vec3(1.,0.,0.);
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,
    fragmentShader: /*glsl*/`
      varying vec3 vColor;
      varying vec2 vUv;
      varying vec3 vPosition;
      uniform float time;
      void main() {
        float scale = mod(vPosition.x + time*0.001,.4);
        float final = step(scale,.2);
        if (final > .5) discard;
        gl_FragColor = vec4( 1., 0., 0., 1.0 );
      }
    `
  });

  const points = [];
  points.push( new THREE.Vector3( - 10, 10, 0 ) );
  points.push( new THREE.Vector3( 10, 10, 0 ) );

  const geometry = new THREE.BufferGeometry().setFromPoints( points );

  const line = new THREE.Line( geometry, dashLineMaterial );
  scene.add( line );
}

// 画一条线
function drawLine(start: THREE.Vector3, end: THREE.Vector3){
  const material = new THREE.LineDashedMaterial( { color: 0x0000ff, dashSize: 0.2,gapSize: 0.2}); 
  const geometry = new THREE.BufferGeometry().setFromPoints( [start, end] );
  const line = new THREE.Line( geometry, material );
  line.computeLineDistances();
  scene.add( line );
}

// 加载汽车模型
function loadCar(){
  loader.load( 'models/modelDraco.gltf', function ( gltf ) {
    carModel = gltf.scene;
    console.log(carModel)
    scene.add( carModel );
    const newMaterial = new THREE.MeshStandardMaterial({
      color: 0xff7c04,
      metalness: options.metalness,
      roughness: options.roughness,
      envMapIntensity: options.envMapIntensity,
      envMap: envtexture,
    });
    carModel.scale.set(0.1,0.1,0.1)
    carModel.traverse( function ( object: any ) {
      if ( object.isMesh ) object.castShadow = true;
      if (object.isMesh && object.name === '轮胎') {
        // 通过给轮胎添加group父对象，并在render中旋转父对象以此来达到使得轮胎绕某一特定轴旋转的目的
        console.log(object)
        object.parent.add(group)
        object.parent = group
        group.add(object)
        group.position.copy(object.position)
        group.position.z += 15
        object.position.set(0,0,20)
        object.material = newMaterial; // 覆盖默认材质
        motorTire = object
      }
    });

    cameraTrack = getCameraTrack(); // 轨道动画
    // addSprite(0.5,9.5,9)
    // https://threejs.org/examples/#webgl_loader_gltf_variants 动态切换已加载材质的示例
    // 自定义模型材质 https://threejs.org/examples/#webgl_custom_attributes   https://threejs.org/examples/#webgl_buffergeometry_custom_attributes_particles
  });
}

// 获取相机的初始轨道points
function getCameraTrack(){
  // 相机轨道路径
  const cameraTrack = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-30, 12, 15),
      new THREE.Vector3(-20,20,-20),
      new THREE.Vector3(20,20,20),
    ],true,'centripetal',0.4)
  return cameraTrack.getSpacedPoints(500)
}

 // 添加标注点
function addSprite(x:number = 1, y:number = 1, z:number = 1, text: string){
  const canvas = document.querySelector<HTMLCanvasElement>('#drawText');
  if(!canvas) return
  const ctx = canvas.getContext('2d');
  if(!ctx) return
  ctx.moveTo(0,0)
  ctx.fillStyle = "rgb(255,255,0)";
  ctx.font = "normal 40px Arial ";
  ctx.fillText(text, 0, 40);
  ctx.globalAlpha = 1;

  // 将画布生成的图片作为贴图给精灵使用，并将精灵创建在设定好的位置
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  
  const spriteMaterial = new SpriteMaterial({
  // map: new TextureLoader().load('images/地点.png'), //设置精灵纹理贴图
  map: texture,
  transparent: true, //开启透明(纹理图片png有透明信息)
  });
  // 创建精灵模型对象，不需要几何体geometry参数
  const sprite = new Sprite(spriteMaterial);
  sprite.scale.set(1, 1, 0); //精灵图大小
  sprite.translateY(50);
  sprite.position.set(x,y,z)
  scene.add(sprite);  
}

let flag = false
let iiii = 0

// 旋转轮胎
function rotateTire() {
  new TWEEN.Tween(rotateObj)
  .to({value: Math.PI*210/180}, 2000)
  .easing(TWEEN.Easing.Quadratic.In)
  .start()
}

// 车轱辘变换矩阵
const transformMatrix = new THREE.Matrix4()
// x/y/z轴旋转
// const rotateX = new THREE.Matrix4().set(1,0,0,0,  0,Math.cos(0.2),Math.sin(.2),0, 0,-Math.sin(.2),Math.cos(.2),0, 0,0,0,1)
// const rotateY = new THREE.Matrix4().set(Math.cos(0.2),0,-Math.sin(.2),0,  0,1,0,0, Math.sin(.2),0,Math.cos(0.2),0, 0,0,0,1)
const rotateZ = new THREE.Matrix4().set(Math.cos(Math.PI/180),Math.sin(Math.PI/180),0,0,  -Math.sin(Math.PI/180),Math.cos(Math.PI/180),0,0, 0,0,1,0, 0,0,0,1)
 // x轴平移3
const translate = new THREE.Matrix4().set(1,0,0,0.3, 0,1,0,0, 0,0,1,0, 0,0,0,1)
transformMatrix.multiply(rotateZ.multiply(translate))


function animate(t: number) {
    stats.begin();
    renderer.render( scene, camera );
    requestAnimationFrame( animate );
    // if(cameraTrack.length){
    //   camera.lookAt(new Vector3())
    //   cameraTrack[trackIndex] && camera.position.copy(cameraTrack[trackIndex])
    //   if(trackIndex > cameraTrack.length - 1){
    //     trackIndex = 0
    //     cameraTrack = []
    //   }
    //   trackIndex++
    // }
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

// 添加鼠标交互事件
function onMouseClick(event:any){
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  raycaster.setFromCamera( pointer, camera );
  const intersects: THREE.Intersection[] = raycaster.intersectObjects( scene.children, true );
  if(intersects.length){
    addSprite(intersects[0].point.x,intersects[0].point.y,intersects[0].point.z, 'asdasd')
  }
}

let pointsForLine: THREE.Vector3[] = []

function onContextMenu(event:any) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  raycaster.setFromCamera( pointer, camera );
  const intersects: THREE.Intersection[] = raycaster.intersectObjects( scene.children, true );
  let x =0,y =0,z=0
  if(intersects.length){
    x = intersects[0].point.x
    y = intersects[0].point.y
    z = intersects[0].point.z
  }
  if(pointsForLine.length == 0 || pointsForLine.length > 1){
    pointsForLine = [new Vector3(x,y,z)]
  } else {
    pointsForLine.push(new Vector3(x,y,z))
    drawLine(pointsForLine[0], pointsForLine[1])
  }
}
  
