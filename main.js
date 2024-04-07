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
scene.add(new THREE.AmbientLight( 0xffffff, 0.1 ))
const light1 = new THREE.DirectionalLight( 0xffffff, 1 );

light1.position.y = 5


const light2 = new THREE.DirectionalLight( 0xffffff, 1 );
light2.position.z = 5

const light3 = new THREE.DirectionalLight( 0xffffff, 1);
light3.position.z = -5


const light4 = new THREE.DirectionalLight( 0xffffff, 1);
light4.position.y = -5


const light5 = new THREE.DirectionalLight( 0xffffff, 1);
light5.position.x = 5

const light6 = new THREE.DirectionalLight( 0xffffff, 1);
light6.position.x = -5

scene.add(light1)
scene.add(light2)
scene.add(light3)
scene.add(light4)
scene.add(light5)
scene.add(light6)


// TODO: Function to update camera position
function updateCamera(maze){
    console.log(maze.depth / 18 + 1.5)
    camera.position.z=  maze.depth / 18 + 1.5
}
// Function to update lights positions
function updateLights(maze){
    light1.position.y = maze.height / 18 + 4.5
    light2.position.z = maze.depth / 18 + 4.5
    light3.position.z = -maze.depth / 18 - 4.5
    light4.position.y = -maze.height / 18 - 4.5
    light5.position.x = maze.width / 18 + 4.5
    light6.position.x = -maze.width / 18 - 4.5
    console.log(light1.position)
}


// Function to adjust camera automaticall

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
var glassBody;

//TEST

// scene.add(testMesh);
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
        this.updateMaze();
        // console.log(this.start_cell.position)
		console.log("START: "+ this.start_cell.face +"," + this.start_cell.position)

    
        this.updateModel(scene)
	}
	
	updateMaze(){
		this.maze = generateMaze(this.width, this.height, this.depth)
        this.start_cell = this.maze.start;
        this.end_cell = this.maze.end
	}

	updateModel(scene){
		scene.remove(this.model)
        // renderBackground(scene)
        updateCamera(this)
        updateLights(this)
		const mazeData = createMazeCubeGroup(this.width, this.height, this.depth, this.radiusPercent, this.wall_height, this.wall_thickness, this.cell_size, this.bevelEnabled, this.color, this.maze);

        this.walls = mazeData.walls;
        this.model = mazeData.group;
        this.boxHoleGroup = mazeData.boxHoleGroup 
		scene.add(this.model)

        BALL_FORCE = BALL_MASS * GRAVITY_ACCELERATION * this.cell_size;
        console.log("FORCE: "+BALL_FORCE)

        MAX_SPEED  = GRAVITY_ACCELERATION * this.cell_size * MAX_SPEED_MULTIPLIER;
        console.log("MAX_SPEED: "+MAX_SPEED)
        createBall(this)
        createCubeBody(this)

        addStars(200)
	}
}



// Constants

const BALL_MASS = 1000
const GLASSBODY_MASS = 99999999
const GRAVITY_ACCELERATION = 10 // in cells
const MAX_SPEED_MULTIPLIER = 0.20 // MULTIPLED WITH GRAVITY_ACCELERATION TO GET MAX_SPEED
let BALL_RADIUS = 0.03 // UPDATED IN createBall() FUNCTION
let MAX_SPEED  = 0; //UPDATED IN udpateModel() FUNCTION
let BALL_FORCE = 0; //UPDATED IN updateModel() FUNCTION
const DEFAULT_BODY_MATERIAL = new CANNON.Material({
    friction: 0.25,
    restitution: 0
})
const SENSITIVITY = 0.08
const START = 'START'
const END = 'END'

let isMouseDown = false;
let isShiftPressed = false;
let currX, currY;
let prevX, prevY; 

// Textures
const moonTexture = new THREE.TextureLoader().load('./assets/moon.jpg')

// Initialize Physics world
const world = new CANNON.World();

world.gravity = new CANNON.Vec3(0, 0, 0)
world.allowSleep = false; // improve performance
world.defaultContactMaterial.friction = 1; 

const maze = new Maze()
renderBackground(scene)
// {
//     //TEST
//     const testGeometry = createRectangleWithHole(2,2,2,0.1, 0.5, 0.5);
//     // testMesh.position.set(0,0,0)
//     const v = extractVerticesAndIndices(testGeometry);
//     const testBody = new CANNON.Body({
//         shape: new CANNON.ConvexPolyhedron(v.vertices, v.indices),
//         mass: 999999999999999
//     })
//     testBody.position.set(0,0,0);
//     world.addBody(testBody)
// }

initializeInputHandler(maze, scene)

function renderBackground(scene){
    // List of possible background file names
    const backgrounds = ['space1.jpg', 'space2.jpg', 'space3.jpg'];

    const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    const textureLoader = new THREE.TextureLoader();
    const spaceTexture = textureLoader.load(`assets/${randomBackground}`);

    scene.background = spaceTexture

}

function addStars(numStars) {
    const geometry = new THREE.SphereGeometry(0.25, 24, 24);
    const colors = [0xffffff, 0x00FFFF, 0x800080, 0xFFA500, 0xFF0000, 0xFFFF66]; // Colors: white, cyan, purple, orange, red, pale yellow

    for (let i = 0; i < numStars; i++) {
        const material = new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
        const star = new THREE.Mesh(geometry, material);

        let [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
        star.position.set(x, y, z);
        scene.add(star);
    }
}

// Function that gets the exact coordinates from start and end pos
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
            z = ((maze.depth - row -1) - Math.floor(maze.depth / 2)) * maze.cell_size 
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
    BALL_RADIUS = (maze.cell_size - maze.wall_thickness)*0.69/2
    // Create new ball mesh
    const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const ballMat = new THREE.MeshBasicMaterial({
        map: moonTexture,
    }); 
    ballMesh = new THREE.Mesh(ballGeometry, ballMat)

    const position = getPosition(maze, START)

    ballMesh.position.set(position.x, position.y, position.z)
    scene.add(ballMesh);

    // Create new ball body
    ballBody = new CANNON.Body({
        shape: new CANNON.Sphere(BALL_RADIUS),
        material: DEFAULT_BODY_MATERIAL,
        mass: BALL_MASS,
    })
    ballBody.linearDamping = 0.9
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
function createCubeBody(maze){
    // Check if glass mesh and glass body exists
    if(glassBody){
        world.remove(glassBody)
    }
    
    // Create the glass mesh
    const glassCubeWidth = maze.width * maze.cell_size + 190 * maze.cell_size;
    const glassCubeHeight = maze.height * maze.cell_size + 190 * maze.cell_size;
    const glassCubeDepth = maze.depth * maze.cell_size + 190 * maze.cell_size;


    // Define positions and orientations of the glass planes
    const planePositions = [
        new CANNON.Vec3(0, 0, -glassCubeDepth),  // Back
        new CANNON.Vec3(-glassCubeWidth, 0, 0),  // Left
        new CANNON.Vec3(0, -glassCubeHeight, 0),  // Bottom
        new CANNON.Vec3(glassCubeWidth, 0, 0),   // Right
        new CANNON.Vec3(0, 0, glassCubeDepth),   // Front
        new CANNON.Vec3(0, glassCubeHeight, 0),  // Top

    ];

    // Create the glass body
    glassBody = new CANNON.Body({
        mass: GLASSBODY_MASS,
        material: DEFAULT_BODY_MATERIAL
    });
    for(let i = 0; i < planePositions.length; i++){
        if(i==maze.end_cell.face){
            const boxHoleGroup = maze.boxHoleGroup;
            // boxHoleGroup.position.set(planePositions[i].x, planePositions[i].y, planePositions[i].z)
            boxHoleGroup.traverse(rectangle => {
                if(rectangle instanceof THREE.Mesh){
                    console.log(rectangle.geometry)
                    const glassShape = new CANNON.Box(new CANNON.Vec3(rectangle.geometry.parameters.width/2, rectangle.geometry.parameters.height/2, rectangle.geometry.parameters.depth/2))
                    const worldPosition = new THREE.Vector3();
                    rectangle.getWorldPosition(worldPosition);
                    glassBody.addShape(glassShape, worldPosition, boxHoleGroup.quaternion)

                }
            })
            // const extracted = extractVerticesAndIndices(maze.boxHoleMesh.geometry)
            // const glassShape = new CANNON.ConvexPolyhedron(extracted.vertices, extracted.indices)
            // glassBody.addShape(glassShape, planePositions[i], maze.boxHoleMesh.quaternion)
            continue;  
        }
        glassBody.addShape(new CANNON.Box(new CANNON.Vec3(glassCubeWidth/2, glassCubeHeight/2, glassCubeDepth/2)), planePositions[i])
    }
    // Add shapes on the body to make it a 'cross' shape


    // Add bodies for the maze
    maze.walls.forEach(wall => {
        createWallShape(glassBody, wall)
    })

    // Add the physics body to the world
    world.addBody(glassBody)    
}


function rotateCube(){
    if(isMouseDown){
        const deltaX = (currX - prevX) *SENSITIVITY;
        const deltaY = (currY - prevY) * SENSITIVITY;

        var cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);

        // Calculate the camera's right vector using cross product
        var cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(cameraDirection, camera.up);
        cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
        // Normalize the resulting vector
        cameraRight.normalize();
        
        var cameraUp = new THREE.Vector3();
        // cameraUp.crossVectors(cameraRight, cameraDirection);
        // cameraUp.normalize();
        cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);
        cameraUp.normalize()

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
        // glassBody.torque.copy(torque.scale(GLASSBODY_MASS))
        // glassBody.torque.set(torqueX.x + torqueY.x,torqueX.y + torqueY.y,torqueX.z + torqueY.z)
        // glassBody.torque.vadd(, glassBody.torque)
        prevX = currX ;
        prevY = currY;

    }else{
        glassBody.angularVelocity.set(0,0,0)
    }
}

function update(){
    rotateCube()
    ballBody.applyForce(new CANNON.Vec3(0, -BALL_FORCE, 0), ballBody.position)
    let speed = ballBody.velocity.norm()
    if(speed> MAX_SPEED){
        ballBody.velocity.scale(MAX_SPEED/speed, ballBody.velocity)
        speed = MAX_SPEED;
    }
    const angularSpeed = speed/BALL_RADIUS
    const angularVelocity = new THREE.Vector3()
    angularVelocity.crossVectors(ballBody.velocity, new CANNON.Vec3(0,1,0))
    angularVelocity.normalize();
    angularVelocity.multiplyScalar(angularSpeed)
    ballBody.angularVelocity.copy(angularVelocity)

    glassBody.position.set(0,0,0);
    world.step(1/60);

    

}

document.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // Left mouse button

        prevX = event.clientX;
        prevY = event.clientY;
        isMouseDown = true;
    }
});


document.addEventListener('mouseup', (event) => {
    if (event.button === 0) { // Left mouse button
        isMouseDown = false;
        
    }
    // isMouseDown = false;
});

document.addEventListener('mousemove', (event)=>{
    // if(isMouseDown){
        currX = event.clientX;
        currY = event.clientY;
    // }
});

document.addEventListener('keydown', function(event){
    if(event.shiftKey)isShiftPressed = true;
    //listen for wasd key
    if(event.key === 'w'){
        ballBody.applyLocalForce(new CANNON.Vec3(0, 0, -1000), new CANNON.Vec3(0, 0, 0))
    }else if(event.key === 'a'){
        ballBody.applyLocalForce(new CANNON.Vec3(-1000, 0, 0), new CANNON.Vec3(0, 0, 0))
    }else if(event.key === 'd'){
        ballBody.applyLocalForce(new CANNON.Vec3(1000, 0, ), new CANNON.Vec3(0, 0, 0))
    }else if(event.key === 's'){
        ballBody.applyLocalForce(new CANNON.Vec3(0, 0, 1000), new CANNON.Vec3(0, 0, 0))
    }

});

document.addEventListener('keyup', function(event){
    if(!event.shiftKey)isShiftPressed = false;
});

function updateMazeMesh(){
    maze.model.position.copy(glassBody.position)
    maze.model.quaternion.copy(glassBody.quaternion)
}

function updateBallMesh(){
    ballMesh.position.copy(ballBody.position);
    ballMesh.quaternion.copy(ballBody.quaternion); 
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


