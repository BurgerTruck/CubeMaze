import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as CANNON from 'cannon';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { MathUtils } from 'three';
import { createMazeCubeGroup } from './maze_model.js';
import { generateMaze } from './maze.js';
import { initializeInputHandler } from './input_handler.js';
import CannonDebugger from 'cannon-es-debugger';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 10000 );
const renderer = new THREE.WebGLRenderer({precision: "highp", antialias: true});
const controls = new OrbitControls( camera, renderer.domElement );

controls.mouseButtons = {
	RIGHT: THREE.MOUSE.ROTATE,
	MIDDLE: THREE.MOUSE.DOLLY
	// RIGHT: THREE.MOUSE.PAN
}
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const axesHelper = new THREE.AxesHelper( 10);
scene.add( axesHelper );

camera.position.z = 2

scene.add( new THREE.GridHelper( 10, 10 ) );
scene.add(new THREE.AmbientLight( 0xffffff, 0.6 ))
const light = new THREE.PointLight( 0xffffff, 10, 100 );

light.position.y = 5
scene.add(light)

const light2 = new THREE.PointLight( 0xffffff, 10, 100 );
light2.position.z = 5

const light3 = new THREE.PointLight( 0xffffff, 10, 100 );
light3.position.z = -5


const light4 = new THREE.PointLight( 0xffffff, 10, 100 );
light4.position.y = -5


const light5 = new THREE.PointLight( 0xffffff, 10, 100 );
light5.position.x = 5

const light6 = new THREE.PointLight( 0xffffff, 10, 100 );
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
/// controls.panSpeed = 5


class Maze{
	constructor(width = 9, height = 9, depth = 9, radiusPercent = 0, wall_thickness = 0.01, cell_size = 0.1, bevelEnabled = true, color = '#00FFFF'){
		this.width = width
		this.height = height
		this.depth = depth
		this.radiusPercent = radiusPercent
		this.wall_thickness = wall_thickness
		this.cell_size = cell_size
		this.wall_height = cell_size
		this.bevelEnabled = bevelEnabled
		this.color = color
		this.maze = generateMaze(width, height, depth)
		this.start_cell = this.maze.start
		this.end_cell = this.maze.end

		// console.log("START: "+ this.start_cell.face +"," + this.start_cell.position)
		// console.log("END: "+ this.end_cell.face +"," + this.end_cell.position)
        const data = createMazeCubeGroup(width, height, depth, radiusPercent, this.wall_height, wall_thickness, cell_size, bevelEnabled, color, this.maze)
		this.model = data.group
        this.walls = data.walls
	}
	
	updateMaze(){
		this.maze = generateMaze(this.width, this.height, this.depth)
	}

	updateModel(scene){
		scene.remove(this.model)
		const mazeData = createMazeCubeGroup(this.width, this.height, this.depth, this.radiusPercent, this.wall_height, this.wall_thickness, this.cell_size, this.bevelEnabled, this.color, this.maze);
        this.walls = mazeData.walls;
        this.model = mazeData.group;
		scene.add(this.model)
	}
}

const maze = new Maze()
scene.add(maze.model)
initializeInputHandler(maze, scene)

/////////// PHYSICS ///////////
/////NOTE: There is a bug where sometimes the ball will pass through collisions: may have something to do with timestep/force/ idk

// Physics world
const world = new CANNON.World();
world.gravity = new CANNON.Vec3(0, 0, 0)
world.allowSleep = false; // improve performance
world.defaultContactMaterial.friction = 1; 

// Ball mesh
const ballRadius = 0.025
const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
const ballMat = new THREE.MeshBasicMaterial({
    color: 0xff0000,
}); 
const ball = new THREE.Mesh(ballGeometry, ballMat)
ball.position.set(0, 0.20, 0)
scene.add(ball);

// Ball body
const ballBody = new CANNON.Body({
    shape: new CANNON.Sphere(ballRadius),
    material: new CANNON.Material({
        friction: 0,
        restitution: 0
    }),
    mass: 1000,
})
ballBody.position.set(ball.position.x, ball.position.y, ball.position.z)
ballBody.quaternion.set(ball.quaternion.x, ball.quaternion.y, ball.quaternion.z, ball.quaternion.w)

// Add ball body to world after rendering wall bodiies
world.addBody(ballBody);

////////////// GLASS LAYER ///////////
// For now, might need to change later
const glassCubeWidth = maze.width * maze.cell_size + 20 * maze.wall_thickness;
const glassCubeHeight = maze.height * maze.cell_size + 20 * maze.wall_thickness;
const glassCubeDepth = maze.depth * maze.cell_size + 20 * maze.wall_thickness;

// Create the glass box
const glassMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 });
const glassGeometry = new THREE.BoxGeometry(glassCubeWidth, glassCubeHeight, glassCubeDepth);
const glassBox = new THREE.Mesh(glassGeometry, glassMaterial);
glassBox.position.set(0, 0, 0); // Adjust position as needed

// Define positions and orientations of the glass planes
const planePositions = [
    new CANNON.Vec3(0, 0, 0),  // Center
    new CANNON.Vec3(0, 0, glassCubeDepth),   // Front
    new CANNON.Vec3(0, 0, -glassCubeDepth),  // Back
    new CANNON.Vec3(-glassCubeWidth, 0, 0),  // Left
    new CANNON.Vec3(glassCubeWidth, 0, 0),   // Right
    new CANNON.Vec3(0, glassCubeHeight, 0),  // Top
    new CANNON.Vec3(0, -glassCubeHeight, 0)  // Bottom
];

// Define a body for the glass
const glassBody = new CANNON.Body({
        mass: 99999999,
        material: new CANNON.Material({
            friction: 0,
            restitution: 0
        }),
});

// Add shapes on the body to make it a 'cross' shape
planePositions.forEach(position =>{
    const glassShape = new CANNON.Box(new CANNON.Vec3(glassCubeWidth/2, glassCubeHeight/2, glassCubeDepth/2))
    glassBody.addShape(glassShape, position)
})


//Function to extract vertices and indices from extrudeGeometry
function extractVerticesAndIndices(geometry) {
    const position = geometry.getAttribute('position');
    const vertices = [];
    const indices = [];

    for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);
        vertices.push(new CANNON.Vec3(x, y, z));

        if( i % 3 == 0){
            indices.push([i, i + 1, i + 2]);
        }
    }
    
    return { vertices: vertices, indices: indices };
}


function createWallShape(body, box){
    // box.geometry.computeBoundingBox();
    const width = box.geometry.parameters.width/2
    const height = box.geometry.parameters.height/2
    const depth = box.geometry.parameters.depth/2
    const worldPosition = new THREE.Vector3();
    box.getWorldPosition(worldPosition);

    const wallShape = new CANNON.Box(new CANNON.Vec3(width, height, depth));
    body.addShape(wallShape, worldPosition, box.quaternion);
}
//Function to extract vertices and indices from extrudeGeometry
// Assign a collision body for each wall

maze.walls.forEach(wall => {
    createWallShape(glassBody, wall)
    // console.log(wall)
    // Add wall shape to the glass body to make them into 1 shape
})

// Add the physics body to the world
world.addBody(glassBody)


let isMouseDown = false;
let isShiftPressed = false;
let startX, startY;
const sensitivity = 0.1



function rotateCube(event){
    if(isMouseDown){
        const deltaX = (event.clientX - startX) *sensitivity;
        const deltaY = (event.clientY - startY) * sensitivity;

        var cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        
        // Calculate the camera's right vector using cross product
        var cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(cameraDirection, camera.up);
        
        // Normalize the resulting vector
        cameraRight.normalize();
        
        var cameraUp = new THREE.Vector3();
        cameraUp.crossVectors(cameraRight, cameraDirection);
        cameraUp.normalize();

        var torque = new CANNON.Vec3(0, 0, 0)
        if(isShiftPressed){
            var torqueX = new CANNON.Vec3(cameraDirection.x * deltaX, cameraDirection.y * deltaX, cameraDirection.z * deltaX)
            torque.vadd(torqueX, torque)
        }else{
            var torqueX = new CANNON.Vec3(cameraUp.x * deltaX, cameraUp.y * deltaX, cameraUp.z * deltaX)
            var torqueY = new CANNON.Vec3(cameraRight.x * deltaY, cameraRight.y * deltaY, cameraRight.z * deltaY)
            torque.vadd(torqueX, torque)
            torque.vadd(torqueY, torque)
        }


        glassBody.angularVelocity.copy(torque)
        // glassBody.torque.copy(torque)
        // glassBody.torque.set(torqueX.x + torqueY.x,torqueX.y + torqueY.y,torqueX.z + torqueY.z)
        // glassBody.torque.vadd(, glassBody.torque)
        startX = event.clientX;
        startY = event.clientY;

    }
}

function update(){
    ballBody.applyLocalForce(new CANNON.Vec3(0, -1000, 0), new CANNON.Vec3(0, 0, 0))
    world.step(1/60);
}

document.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // Left mouse button
        isMouseDown = true;
        startX = event.clientX;
        startY = event.clientY;
    }
});


document.addEventListener('mouseup', (event) => {
    if (event.button === 0) { // Left mouse button
        isMouseDown = false;
    }
});

document.addEventListener('mousemove', rotateCube);

document.addEventListener('keydown', function(event){
    if(event.shiftKey)isShiftPressed = true;
});

document.addEventListener('keyup', function(event){
    if(!event.shiftKey)isShiftPressed = false;
});

function updateMazeMesh(){
    maze.model.position.copy(glassBody.position)
    maze.model.quaternion.copy(glassBody.quaternion)
    // glassBody.position.copy(glassBox.position)
}

function updateBallMesh(){
    ball.position.copy(ballBody.position);
    // ball.quaternion.copy(ballBody.quaternion); 
}


// Hide later only for debugging collisions
const cannonDebugger = new CannonDebugger(scene, world, {
})

function animate() {
	requestAnimationFrame( animate );
    update();    
    updateBallMesh()

    updateMazeMesh();
	renderer.render( scene, camera );
    cannonDebugger.update()
	// controls.update()
    
}
animate();


