import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as CANNON from 'cannon';
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

///////// CONSTANTS ///////
const GRAVITY = new CANNON.Vec3(0, -1, 0)
const BALL_RADIUS = 0.025
const BALLBODY_FRICTION = 0
const BALLBODY_RESTITUTION = 0.25
const GLASSBODY_FRICTION = 0.25
const GLASSBODY_RESTITUTION = 0
const GLASS_OPACITY = 0.35
// for turning of cube
const ROTATE_SENSITIVITY = 0.002
const ROTATE_THRESHOLD = 1
// speed of ball
const VELOCITY_THRESHOLD = 0.25


/////////// PHYSICS ///////////
/////NOTE: There is a bug where sometimes the ball will pass through collisions: may have something to do with timestep/force/ idk

// Physics world
const world = new CANNON.World();
world.gravity = GRAVITY
world.allowSleep = false; // improve performance
world.defaultContactMaterial.friction = 1; 

// Ball mesh
const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
const ballMat = new THREE.MeshBasicMaterial({
    color: 0xff0000,
}); 
const ball = new THREE.Mesh(ballGeometry, ballMat)
//TODO: need to change later
ball.position.set(0, 0, 0.2)
scene.add(ball);

// Ball body
const ballBody = new CANNON.Body({
    shape: new CANNON.Sphere(BALL_RADIUS),
    material: new CANNON.Material({
        friction: BALLBODY_FRICTION,
        restitution: BALLBODY_RESTITUTION
    }),
    mass: 1,
})
ballBody.position.set(ball.position.x, ball.position.y, ball.position.z)
ballBody.quaternion.set(ball.quaternion.x, ball.quaternion.y, ball.quaternion.z, ball.quaternion.w)
ballBody.allowSleep = false;
// Add ball body to world after rendering wall bodiies
world.addBody(ballBody);

////////////// GLASS LAYER ///////////
// For now, might need to change later
const glassCubeWidth = maze.width * maze.cell_size + 20 * maze.wall_thickness;
const glassCubeHeight = maze.height * maze.cell_size + 20 * maze.wall_thickness;
const glassCubeDepth = maze.depth * maze.cell_size + 20 * maze.wall_thickness;

// Create the glass box
const glassMaterial = new THREE.MeshPhongMaterial({ transparent: true, opacity: GLASS_OPACITY });
const glassGeometry = new THREE.BoxGeometry(glassCubeWidth, glassCubeHeight, glassCubeDepth);
const glassBox = new THREE.Mesh(glassGeometry, glassMaterial);
glassBox.position.set(0, 0, 0); // Adjust position as needed
scene.add(glassBox)

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
        mass: 0,
        material: new CANNON.Material({
            friction: GLASSBODY_FRICTION,
            restitution: GLASSBODY_RESTITUTION
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


// Assign a collision body for each wall
maze.walls.forEach(wall => {

    const wallData = extractVerticesAndIndices(wall);
    let vertices = wallData.vertices
    let indices = wallData.indices
    console.log(vertices, indices)
    const wallShape = new CANNON.ConvexPolyhedron(vertices, indices);

    // Add wall shape to the glass body to make them into 1 shape
    glassBody.addShape(wallShape, wall.position, wall.quaternion)
})

// Add the physics body to the world
world.addBody(glassBody)


let isMouseDown = false;
let startX, startY;


function rotateCube(event){
    if(isMouseDown){
        let deltaX = event.clientX - startX;
        let deltaY = event.clientY - startY;

        // TODO: limit the speed of the turning of the cube
        if(Math.abs(deltaX) > ROTATE_THRESHOLD){
            deltaX = Math.sign(deltaX) * ROTATE_THRESHOLD;
        }

        if(Math.abs(deltaY) > ROTATE_THRESHOLD){
            deltaY = Math.sign(deltaY) * ROTATE_THRESHOLD;
        }
        
        // Update maze mesh rotation
        maze.model.rotation.y += deltaX * ROTATE_SENSITIVITY;
        maze.model.rotation.x += deltaY * ROTATE_SENSITIVITY;
       
        // Update glass mesh rotation
        glassBox.rotation.y += deltaX * ROTATE_SENSITIVITY;
        glassBox.rotation.x += deltaY * ROTATE_SENSITIVITY;
        
        // Update physics of cubes bodies
        updateBallBody()
        updateCubeBodies()
        
        // Update start positions for the next iteration
        startX = event.clientX;
        startY = event.clientY;
    }

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

function updateCubeBodies(){
    cannonDebugger.update()
    glassBody.quaternion.copy(glassBox.quaternion)
    glassBody.position.copy(glassBox.position)
}


function updateBallBody(){
    if (Math.abs(ballBody.velocity.x) > VELOCITY_THRESHOLD) {
        ballBody.velocity.x = Math.sign(ballBody.velocity.x) * VELOCITY_THRESHOLD;
    }
    if (Math.abs(ballBody.velocity.y) > VELOCITY_THRESHOLD) {
        ballBody.velocity.y = Math.sign(ballBody.velocity.y) * VELOCITY_THRESHOLD;
    }
    if (Math.abs(ballBody.velocity.z) > VELOCITY_THRESHOLD) {
        ballBody.velocity.z = Math.sign(ballBody.velocity.z) * VELOCITY_THRESHOLD;
    }

    if(Math.abs(ballBody.velocity.x) > VELOCITY_THRESHOLD){
        console.log('TOO FAST BRO')
    }
    cannonDebugger.update()
    ball.position.copy(ballBody.position);
    ball.quaternion.copy(ballBody.quaternion); 
}


// Hide later only for debugging collisions
const cannonDebugger = new CannonDebugger(scene, world, {
})

function animate() {
	requestAnimationFrame( animate );
    world.step(1/60); // Step the physics world
    updateBallBody()
    
	renderer.render( scene, camera );
	// controls.update()
    
}
animate();


