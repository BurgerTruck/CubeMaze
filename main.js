import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createMazeCubeGroup } from './maze_model.js';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 10000 );
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls( camera, renderer.domElement );
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );





const height = 9, width = 9, depth =9, radius = 0
const wall_thickness = 0.01
const cell_size = 0.1
const wall_height = cell_size
const bevel_enabled = true
const color = 0xffff

const axesHelper = new THREE.AxesHelper( 10);
scene.add( axesHelper );

camera.position.z = 2

scene.add( new THREE.GridHelper( 10, 10 ) );
scene.add(new THREE.AmbientLight( 0xffffff, 0.6 ))
const light = new THREE.PointLight( 0xffffff, 10, 100 );

light.position.y = 5
scene.add(light)

const light2 = new THREE.PointLight( 0xffffff, 5, 100 );
light2.position.z = 5

const light3 = new THREE.PointLight( 0xffffff, 5, 100 );
light3.position.z = -5


const light4 = new THREE.PointLight( 0xffffff, 5, 100 );
light4.position.y = -5


const light5 = new THREE.PointLight( 0xffffff, 5, 100 );
light5.position.x = 5

const light6 = new THREE.PointLight( 0xffffff, 5, 100 );
light6.position.x = -5

scene.add(light2)
scene.add(light3)
scene.add(light4)
scene.add(light5)
scene.add(light6)




// let geoms=[]
// let meshes=[]
// clone.updateMatrixWorld(true,true)
// clone.traverse(e=>e.isMesh && meshes.push(e) && (geoms.push(( e.geometry.index ) ? e.geometry.toNonIndexed() : e.geometry().clone())))
// geoms.forEach((g,i)=>g.applyMatrix4(meshes[i].matrixWorld));
// let gg = BufferGeometryUtils.mergeBufferGeometries(geoms,true)
// gg.applyMatrix4(clone.matrix.clone().invert());
// gg.userData.materials = meshes.map(m=>m.material)
// controls.panSpeed = 5

// mesh.rotateY(Math.PI/2)



const maze = createMazeCubeGroup(width, height, depth, radius, wall_height, wall_thickness, cell_size, bevel_enabled, color)
scene.add(maze)

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	controls.update()
}

animate();