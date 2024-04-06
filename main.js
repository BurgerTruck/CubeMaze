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

var ballMesh;
var ballBody;
var glassMesh;
var glassBody;
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
        this.start_cell = this.maze.start
        this.end_cell = this.maze.end
	}

	updateModel(scene){
		scene.remove(this.model)
		const mazeData = createMazeCubeGroup(this.width, this.height, this.depth, this.radiusPercent, this.wall_height, this.wall_thickness, this.cell_size, this.bevelEnabled, this.color, this.maze);
        this.walls = mazeData.walls;
        this.model = mazeData.group;
		scene.add(this.model)

        createBall(maze)
        createCubeBody()
	}
}

const BALL_RADIUS = 0.03
const BALL_MASS = 1000
const GLASSBODY_MASS = 99999999
const DEFAULT_BODY_MATERIAL = new CANNON.Material({
    friction: 0,
    restitution: 0
})
const SENSITIVITY = 0.1
const START = 'START'
const END = 'END'

let isMouseDown = false;
let isShiftPressed = false;
let startX, startY;


// Initialize Physics world
const world = new CANNON.World();
world.gravity = new CANNON.Vec3(0, 0, 0)
world.allowSleep = false; // improve performance
world.defaultContactMaterial.friction = 1; 

const maze = new Maze()
scene.add(maze.model)
createBall(maze)
createCubeBody()
initializeInputHandler(maze, scene)

// Function that gets the inversion; params can be width or height
// e.g. if width is 9:
// 0 -> 8
// 1 -> 7
// 2 -> 6

function getPosition(maze, type){
    // Might also need depth in top bottom left right faces

    // Get face, row col
    let x = 0, y = 0, z = 0;
    let face, row, col;

    if(type == START){
        face = maze.start_cell.face
        row = maze.start_cell.position[0]
        col = maze.start_cell.position[1]
    }
    else{
        face = maze_end_cell.face
        row = maze.end_cell.position[0]
        col = maze.end_cell.position[1]
    }
    
    console.log('Face: ', face)
    console.log('Row: ', row)
    console.log('Col: ', col)

    switch(face){
        case 0: // BACK: same rows invert columns
        // TODO: Fix
        //ROWS - z ; COLS - x
            y = (maze.height - row- 1- Math.floor(maze.height/2)) * maze.cell_size
            x = ((maze.width - col - 1)- Math.floor(maze.width / 2)) * maze.cell_size
            z = (maze.cell_size * -maze.depth / 2 * 1.1)
            break;

        case 1: // LEFT: cols->rows(same) rows->cols(same)
        //ROWS - y ; COLS - z
            y = ((maze.depth - row - 1) - Math.floor(maze.depth / 2)) * maze.cell_size 
            z = (col - Math.floor(maze.height/2)) * maze.cell_size
            x = (maze.cell_size * -maze.width / 2 * 1.1)
            break;

        case 2: // BOTTOM
            z = (maze.depth - row - 1- Math.floor(maze.depth / 2)) * maze.cell_size
            x = (col- Math.floor(maze.width / 2)) * maze.cell_size
            y = (maze.cell_size * -maze.height / 2 * 1.1)
            break;

        case 3: // RIGHT
            y = ((maze.depth - row - 1) - Math.floor(maze.depth / 2)) * maze.cell_size 
            z = ((maze.height - col - 1) - Math.floor(maze.height/2)) * maze.cell_size
            x = (maze.cell_size * maze.width / 2 * 1.1)
            break;

        case 4: // FRONT
            y = ((maze.height - row - 1) - Math.floor(maze.height/2)) * maze.cell_size
            x = (col - Math.floor(maze.width / 2)) * maze.cell_size
            z = (maze.cell_size * maze.depth / 2 * 1.1)
            break;

        case 5: // TOP
            z = (row - Math.floor(maze.depth / 2)) * maze.cell_size 
            x = (col - Math.floor(maze.width / 2)) * maze.cell_size
            y =  (maze.cell_size * maze.height / 2 * 1.1)
            break;
    }
    const position = new THREE.Vector3(x, y, z)
    console.log('Coordinates: ', position)
    return position
}

// Creates ball mesh and body
function createBall(maze){
    // Removes mesh and body when they are existing
    if(ballMesh){
        scene.remove(ballMesh)
    }
    if(ballBody){
        world.remove(ballBody)
    }

    // Create new ball mesh
    const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const ballMat = new THREE.MeshBasicMaterial({
        color: 0xff0000,
    }); 
    ballMesh = new THREE.Mesh(ballGeometry, ballMat)
    // TODO: Get and set initial position
    const position = getPosition(maze, START)

    ballMesh.position.set(position.x, position.y, position.z)
    scene.add(ballMesh);

    // Create new ball body
    ballBody = new CANNON.Body({
        shape: new CANNON.Sphere(BALL_RADIUS),
        material: DEFAULT_BODY_MATERIAL,
        mass: BALL_MASS,
    })

    // Set position and quaternion of physics body accordingly
    ballBody.position.set(ballMesh.position.x, ballMesh.position.y, ballMesh.position.z)
    ballBody.quaternion.set(ballMesh.quaternion.x, ballMesh.quaternion.y, ballMesh.quaternion.z, ballMesh.quaternion.w)

    // Add ball body to world after rendering ball body
    world.addBody(ballBody);
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

// Creates glass layer mesh, body and maze body
function createCubeBody(){
    // Check if glass mesh and glass body exists
    if(glassMesh){
        scene.remove(glassMesh)
    }
    if(glassBody){
        world.remove(glassBody)
    }
    
    // Create the glass mesh
    const glassCubeWidth = maze.width * maze.cell_size + 190 * maze.cell_size * maze.wall_thickness;
    const glassCubeHeight = maze.height * maze.cell_size + 190 * maze.cell_size * maze.wall_thickness;
    const glassCubeDepth = maze.depth * maze.cell_size + 190 * maze.cell_size * maze.wall_thickness;

    const glassMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 });
    const glassGeometry = new THREE.BoxGeometry(glassCubeWidth, glassCubeHeight, glassCubeDepth);
    glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
    glassMesh.position.set(0, 0, 0); // Adjust position as needed
    scene.add(glassMesh)

    // Define positions and orientations of the glass planes
    const planePositions = [
        new CANNON.Vec3(0, 0, glassCubeDepth),   // Front
        new CANNON.Vec3(0, 0, -glassCubeDepth),  // Back
        new CANNON.Vec3(-glassCubeWidth, 0, 0),  // Left
        new CANNON.Vec3(glassCubeWidth, 0, 0),   // Right
        new CANNON.Vec3(0, glassCubeHeight, 0),  // Top
        new CANNON.Vec3(0, -glassCubeHeight, 0)  // Bottom
    ];

    // Create the glass body
    glassBody = new CANNON.Body({
        mass: GLASSBODY_MASS,
        material: DEFAULT_BODY_MATERIAL
    });

    // Add shapes on the body to make it a 'cross' shape
    planePositions.forEach(position =>{
        const glassShape = new CANNON.Box(new CANNON.Vec3(glassCubeWidth/2, glassCubeHeight/2, glassCubeDepth/2))
        glassBody.addShape(glassShape, position)
    })

    // Add bodies for the maze
    maze.walls.forEach(wall => {
        createWallShape(glassBody, wall)
    })

    // Add the physics body to the world
    world.addBody(glassBody)
}


function rotateCube(event){
    if(isMouseDown){
        const deltaX = (event.clientX - startX) *SENSITIVITY;
        const deltaY = (event.clientY - startY) * SENSITIVITY;

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
    glassMesh.position.copy(glassBody.position)
    glassMesh.quaternion.copy(glassBody.quaternion)
}

function updateBallMesh(){
    ballMesh.position.copy(ballBody.position);
    // ballMesh.quaternion.copy(ballBody.quaternion); 
}


// Hide later only for debugging collisions
// const cannonDebugger = new CannonDebugger(scene, world, {
// })

function animate() {
	requestAnimationFrame( animate );
    update();    
    updateBallMesh()

    updateMazeMesh();
	renderer.render( scene, camera );
    // cannonDebugger.update()
	// controls.update()
    
}
animate();


