import React, {Component} from 'react';
import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';
import GLTFLoader from 'three-gltf-loader';

class Scene extends Component{
  constructor(props){
    super(props);
    this.state={
      loading: true,
      counter: 0,
    }
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.animate = this.animate.bind(this);
    this.renderScene = this.renderScene.bind(this);
    this.computeBoundingBox = this.computeBoundingBox.bind(this);
    this.setupScene = this.setupScene.bind(this);
    this.destroyContext = this.destroyContext.bind(this);
  }

  componentWillMount(){
    window.addEventListener('resize', this.onWindowResize.bind(this))
  }

  componentDidMount(){
    this.setupScene();
  }

  setupScene(){
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.width = width;
    this.height = height;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;

    let scene = new THREE.Scene();
  
    let camera = new THREE.PerspectiveCamera(60, width/height, 1, 90000);
    camera.position.set(-2200, 800, 900)
    scene.add(camera);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.skyBox();
    this.models = ['bird1', 'bird2', 'bird3'];
    this.addBirds();

    let hemiLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)
    camera.add(hemiLight);

    var ambientLight = new THREE.AmbientLight( 0xFFFFFF, 0.3 );
    camera.add( ambientLight );

    let dirLight = new THREE.DirectionalLight(0xffffff, .9);
    dirLight.position.set(150, 350, 350);
    dirLight.castShadow = true; 
    dirLight.shadow.camera.left = -400;
    dirLight.shadow.camera.right = 400;
    dirLight.shadow.camera.top = 400;
    dirLight.shadow.camera.bottom = -400;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 1000;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    camera.add(dirLight);

    
    let controls = new OrbitControls( this.camera, this.renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.1;
    controls.enableKeys = false;
    controls.screenSpacePanning = false;
    controls.enableRotate = true;
    controls.autoRotate = false;
    controls.dampingFactor = 1;
    controls.autoRotateSpeed = 1.2;
    controls.enablePan = false;
    controls.update();
    this.controls = controls;
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
    this.setState({loading: false})
    this.start();
  }

  addBirds(){
    this.modelLoader('phoenix_bird/scene.gltf', {x: -500, y: -150, z: -1000}, this.models[0]);
    this.modelLoader('phoenix_bird/scene.gltf', {x: -150, y: -250, z: -1900}, this.models[1]);
    this.modelLoader('phoenix_bird/scene.gltf', {x: -850, y: -650, z: -1400}, this.models[2]);
  }

  modelLoader(model, position, name){
    this.state[name] = {};
    this.state[name].actions = {};
    let gltfLoader = new GLTFLoader();
    gltfLoader.load(model, object => {
      this.mesh = object.scene;
      this.mesh.name = name;
      this.mesh.traverse(item => {
        if (item.isMesh){
          item.castShadow = true;
        }
      });
      this.state[name].mixer = new THREE.AnimationMixer(this.mesh);
      this.state[name].mesh = this.mesh;
      this.state[name].clock = new THREE.Clock();
      for (var i = 0; i < object.animations.length; i++){
        var clip = object.animations[i];
        var action =  this.state[name].mixer.clipAction(clip);
        this.state[name].actions[clip.name] = action;
      }
      this.state[name].activeAction = this.state[name].actions[Object.keys(this.state[name].actions)[0]];
      if (this.state[name].activeAction){
        this.state[name].activeAction.fadeIn(0.5);
        this.state[name].activeAction.play();
      }
      this.object = this.mesh;
      this.mesh.position.set(position.x, position.y, position.z)
      this.scene.add(this.mesh);  
    });
  }

  skyBox(){
    let geometry = new THREE.CubeGeometry(9000,9000,9000);
    var cubeMaterials = [
      new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( "Skybox/nightsky_ft.png" ), side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( 'Skybox/nightsky_bk.png' ), side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( 'Skybox/nightsky_up.png' ), side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( 'Skybox/nightsky_dn.png' ), side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( 'Skybox/nightsky_rt.png' ), side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( 'Skybox/nightsky_lf.png' ), side: THREE.DoubleSide })
    ];
  
    var cubeMaterial = new THREE.MeshFaceMaterial( cubeMaterials );
    this.cube = new THREE.Mesh( geometry, cubeMaterial );
    this.scene.add(this.cube);
  }
  
  computeBoundingBox(){
    let offset = 1.60;
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(this.object);
    const center = boundingBox.getCenter();
    const size = boundingBox.getSize();
    const maxDim = Math.max( size.x, size.y, size.z );
    const fov = this.camera.fov * ( Math.PI / 180 );
    let cameraZ = maxDim / 2 / Math.tan( fov / 2 );
    cameraZ *= offset;
    this.camera.position.z = center.z + cameraZ;
    const minZ = boundingBox.min.z;
    const cameraToFarEdge = ( minZ < 0 ) ? -minZ + cameraZ : cameraZ - minZ;

    this.camera.far = cameraToFarEdge * 3;
    this.camera.lookAt(center);
    this.camera.updateProjectionMatrix();

    let controls = new OrbitControls( this.camera, this.renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.1;
    controls.enableKeys = false;
    controls.screenSpacePanning = false;
    controls.enableRotate = true;
    controls.autoRotate = false;
    controls.dampingFactor = 1;
    controls.autoRotateSpeed = 1.2;
    controls.enablePan = false;
    controls.target.set(center.x, center.y, center.z);
    controls.update();
    this.controls = controls;
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
    this.setState({loading: false})
    this.start();
  }
  
  start(){
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate)
    }
  }
  
  renderScene(){
    this.renderer.render(this.scene, this.camera)
  }

  animate() {
    this.frameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.models.map(model => {
      if (this.state[model].mixer && this.state[model].clock){
        this.state[model].mixer.update(this.state[model].clock.getDelta());
        this.state[model].mesh.position.set(this.state[model].mesh.position.x + 10, this.state[model].mesh.position.y + 2, this.state[model].mesh.position.z + 4);
        this.camera.fov *= 1.0004;
        this.state.counter += 1;
        if (this.state.counter > 2000){
          this.state.counter = 0;
          this.camera.fov = 60;
          this.removeModels();
          this.addBirds();
        }
        this.camera.updateProjectionMatrix();
      }
    })
    this.renderScene();
  }

  removeModels(){
    this.models.map(model => {
      this.scene.remove(this.scene.getObjectByName(model));
    })
  }

  stop() {
    cancelAnimationFrame(this.frameId);
  }

  onWindowResize(e){
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth/window.innerHeight
    this.camera.updateProjectionMatrix();
  }

  componentWillUnmount(){
    this.stop();
    this.destroyContext();
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }

  destroyContext(){
    this.container.removeChild(this.renderer.domElement);
    this.renderer.forceContextLoss();
    this.renderer.context = null;
    this.renderer.domElement = null;
    this.renderer = null;
  }


  render(){
    const width = '100%';
    const height = '100%';
    return(
      <div 
        ref={(container) => {this.container = container}}
        style={{width: width, height: height, position: 'absolute'}} 
      >
      </div>
    )
  }
  
}

export default Scene;