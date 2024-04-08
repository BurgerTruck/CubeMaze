import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as CANNON from 'cannon';
// import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
// import { MathUtils } from 'three';
import { createMazeCubeGroup } from './maze_model.js';
import { generateMaze } from './maze.js';
import { initializeInputHandler } from './input_handler.js';
// import CannonDebugger from 'cannon-es-debugger';
import { RGBELoader } from 'three/examples/jsm/Addons.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 10000 );
const renderer = new THREE.WebGLRenderer({precision: "highp", antialias: true});
const controls = new OrbitControls( camera, renderer.domElement );
const hdrTextureURL = new URL('./assets/silver_nebulae.hdr', import.meta.url)
const loader = new RGBELoader();

const BALL_MASS = 1000
const GLASSBODY_MASS = 99999999
const GRAVITY_ACCELERATION = 50 // in cells
const MAX_SPEED_MULTIPLIER = 0.05 // MULTIPLED WITH GRAVITY_ACCELERATION TO GET MAX_SPEED
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
const STARS_SIZE = 0.001
const PARTICLE_COUNT = 10000
const STARS_VELOCITY = 0.0001
const NEBULAE_COUNT = 1


var ballMesh;
var ballBody;
var glassBody;
var starsMesh
var starGeo = new THREE.BufferGeometry();
var stars
var nebulae = []
//TEST

// scene.add(testMesh);


let isMouseDown = false;
let isShiftPressed = false;
let currX, currY;
let prevX, prevY; 

const world = new CANNON.World();
world.solver.iterations = 20
world.quatNormalizeSkip = 0
world.quatNormalizeFast = false
world.solver.tolerance = 1

controls.mouseButtons = {
	RIGHT: THREE.MOUSE.ROTATE,
	MIDDLE: THREE.MOUSE.DOLLY
	// RIGHT: THREE.MOUSE.PAN
}
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// const axesHelper = new THREE.AxesHelper( 10);
// scene.add( axesHelper );

camera.position.z = 2

// scene.add( new THREE.GridHelper( 10, 10 ) );
scene.add(new THREE.AmbientLight( 0xffffff, 0 ))
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

let ballLight = null;   
scene.add(light1)
scene.add(light2)
scene.add(light3)
scene.add(light4)
scene.add(light5)
scene.add(light6)

function updateCamera(maze){
    console.log(maze.depth / 18 + 1.5)
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z=  maze.depth / 18 + 1.5
}
function updateLights(maze){
    light1.position.y = maze.height / 18 + 4.5
    light2.position.z = maze.depth / 18 + 4.5
    light3.position.z = -maze.depth / 18 - 4.5
    light4.position.y = -maze.height / 18 - 4.5
    light5.position.x = maze.width / 18 + 4.5
    light6.position.x = -maze.width / 18 - 4.5


    if(maze.colorful){
        light1.color = new THREE.Color().setHSL(Math.random(), 1, 0.5);
        light2.color = new THREE.Color().setHSL(Math.random(), 1, 0.5);
        light3.color = new THREE.Color().setHSL(Math.random(), 1, 0.5);
        light4.color = new THREE.Color().setHSL(Math.random(), 1, 0.5);
        light5.color = new THREE.Color().setHSL(Math.random(), 1, 0.5);
        light6.color = new THREE.Color().setHSL(Math.random(), 1, 0.5);
    }else{
        light1.color.set(1,1,1)
        light2.color.set(1,1,1)
        light3.color.set(1,1,1)
        light4.color.set(1,1,1)
        light5.color.set(1,1,1)
        light6.color.set(1,1,1)
    }
    console.log(light1.position)
}
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
        this.colorful = false;
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
		const mazeData = createMazeCubeGroup(this.width, this.height, this.depth, this.radiusPercent, this.wall_height, this.wall_thickness, this.cell_size, this.bevelEnabled, this.color, this.maze, null);

        this.walls = mazeData.walls;
        this.model = mazeData.group;
        this.boxHoleGroup = mazeData.boxHoleGroup 
		scene.add(this.model)

        BALL_FORCE = BALL_MASS * GRAVITY_ACCELERATION * this.cell_size;
        console.log("FORCE: "+BALL_FORCE)

        MAX_SPEED  = GRAVITY_ACCELERATION * this.cell_size * MAX_SPEED_MULTIPLIER;
        // MAX_SPEED = 0;  
        console.log("MAX_SPEED: "+MAX_SPEED)
        createBall(this)
        createCubeBody(this)

        stars = addStars(PARTICLE_COUNT, this)
        loadNebula()
	}
}

function loadHDREnvironmentMap() {
    return new Promise((resolve, reject) => {
        loader.load(
            hdrTextureURL,
            (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                scene.environment = texture;
                scene.background = texture;
                $('#loading-screen').hide()
                resolve(texture);

            },
            (xhr) => {
                const progress = (xhr.loaded / xhr.total) * 100;
                $('#progress-bar').width(`${progress}%`);
                
                // progressBar.style.width = `${progress}%`;
            },
            (error) => {
                reject(error);
            }
        );
    });
}

const moonTexture = new THREE.TextureLoader().load('./assets/moon.jpg')
const maze = new Maze()
// const hdrTexture = await loadHDREnvironmentMap();
$('#loading-screen').hide()




// TODO: Function to update camera position

// Function to update lights positions



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

// Constants


world.gravity = new CANNON.Vec3(0, 0, 0)
world.allowSleep = false; // improve performance
world.defaultContactMaterial.friction = 1; 



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

// Adds 1 nebula
function addNebula(nebulaGeometry, nebulaMaterial, posX, posY, posZ){
    let nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
    nebula.position.set(posX, posY, posZ)
    nebula.material.opacity = 0.75
    nebula.rotation.x =1.15
    nebula.rotation.y = -0.12
    nebula.rotation.z = Math.random() * 2 * Math.PI
    nebulae.push(nebula)
    scene.add(nebula)
}

// Adds all nebula
function loadNebula(){
    // scene.fog = new THREE.FogExp2(0x03544e, 0.001);
    // renderer.setClearColor(scene.fog.color)

    if (nebulae.length > 0) {
        nebulae.forEach(nebula => {
            scene.remove(nebula); // Remove from scene
        });
        nebulae = []; // Clear the array
    }

    const textureLoader = new THREE.TextureLoader();
    const colors = [0xd8547e, 0xD22B2B, 0x3677ac];
    var posY = 50
    textureLoader.load('./assets/smoke3.png', function(texture){
        let nebulaGeometry = new THREE.PlaneGeometry(400, 400);
        colors.forEach(color =>{
            let nebulaMaterial = new THREE.MeshLambertMaterial({
                map: texture,
                transparent: true,
                color: color
            })
            addNebula(nebulaGeometry, nebulaMaterial, 0, posY, 0)
            posY+=30
            // Nebula top
            // let nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
            // nebula.position.set(0, posY, 0)
            // posY+=20
            // nebula.material.opacity = 0.75
            // nebula.rotation.x =1.15
            // nebula.rotation.y = -0.12
            // nebula.rotation.z = Math.random() * 2 * Math.PI
            // nebulae.push(nebula)
            // scene.add(nebula)
        })


        // // Nebula Bottom
        // nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        // nebula.position.set(0, -10, 0)
        // nebula.material.opacity = 0.55
        // nebulae.push(nebula)
        // scene.add(nebula)

        // // Nebula Top Left
        // nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        // nebula.position.set(-10, 10, 0)
        // nebula.material.opacity = 0.55
        // nebulae.push(nebula)
        // scene.add(nebula)

        // // Nebula Top Right
        // nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        // nebula.position.set(10, 10, 0)
        // nebula.material.opacity = 0.55
        // nebulae.push(nebula)
        // scene.add(nebula)

        // // Neula Behind
        // nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        // nebula.position.set(0, 10, -10)
        // nebula.material.opacity = 0.55
        // nebulae.push(nebula)
        // scene.add(nebula)
    })
}


function renderNebula(){
    nebulae.forEach(n=>{
        n.rotation.z -= 0.0002
        // if(n.position.z > 50)
        //     n.position.z += 0.0001
        // else
        //     n.position.z -= 0.0001
    })
}
console.log(nebulae)



function addStars(numStars, maze){
    scene.remove(starsMesh)
    const loader = new THREE.TextureLoader()
    // const starsTexture = loader.load('./assets/shrek.jpg')

    const starsMaterial = new THREE.PointsMaterial({
        size: STARS_SIZE,
        transparent: false,
        // blending: THREE.AdditiveBlending,
    })
    const starsGeometry = new THREE.BufferGeometry;
    
    const posArray = new Float32Array(PARTICLE_COUNT * 3)
    var threshold
    for (let i = 0; i < numStars * 3; i ++) {
        // X - width
        if(i % 3 == 0){ 
            threshold = maze.width / 19
        }
        // Y - height
        else if(i % 3 == 1){
            threshold = maze.height / 19
        }
        // Z - depth
        else{
            threshold = maze.depth / 19
        }

        do{
            posArray[i] = (Math.random() - 0.5) * 100;
        }while(Math.abs(posArray[i]) < threshold)
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    starsMesh = new THREE.Points(starsGeometry, starsMaterial)
    scene.add(starsMesh)
    return starsMesh
}

function animateStars(starsMesh, velocity){
    starsMesh.rotation.y += velocity;
}
// function addStars(numStars) {
//     const geometry = new THREE.SphereGeometry(0.10, 24, 24);
//     const colors = [0xffffff, 0x00FFFF, 0x800080, 0xFFA500, 0xFF0000, 0xFFFF66]; // Colors: white, cyan, purple, orange, red, pale yellow

//     for (let i = 0; i < numStars; i++) {
//         const material = new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
//         const star = new THREE.Mesh(geometry, material);

//         let [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
//         star.position.set(x, y, z);
//         scene.add(star);
//     }
// }





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
        scene.remove(ballLight)
    }

    ballLight = new THREE.PointLight(0xe7e0db, maze.cell_size/10, maze.cell_size);
    scene.add(ballLight)
    if(ballBody){
        world.remove(ballBody)
    }
    BALL_RADIUS = (maze.cell_size - maze.wall_thickness)*0.69/2
    // Create new ball mesh
    const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
        map: moonTexture, emissive: 0xe7e0db, emissiveIntensity: 0.5
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
    const glassCubeWidth = maze.width * maze.cell_size + 190 * maze.cell_size * 0.01;
    const glassCubeHeight = maze.height * maze.cell_size + 190 * maze.cell_size * 0.01;
    const glassCubeDepth = maze.depth * maze.cell_size + 190 * maze.cell_size * 0.01;


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
        
        // if(Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3){
        //     prevX = currX;
        //     prevY = currY;
        //     return;
        // }
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
let prevTime = -1;
const fixedStep = 1/60

function step(elapsed){
    ballBody.applyForce(new CANNON.Vec3(0, -BALL_FORCE*(elapsed/fixedStep), 0), ballBody.position)
    let time = 0;
    while(time < elapsed){
        const step = Math.min(fixedStep, elapsed - time)
        world.step(step)
        let speed = ballBody.velocity.norm()
        if(speed> MAX_SPEED){
            ballBody.velocity.scale(MAX_SPEED/speed, ballBody.velocity)
        }
        time+=step
    }
}
function update(){
    rotateCube()
    const currTime = performance.now();
    const delta = prevTime == -1?0:(currTime - prevTime)/1000
    step(delta)
    
    let speed = ballBody.velocity.norm()
    const angularSpeed = speed/BALL_RADIUS
    const angularVelocity = new THREE.Vector3()
    angularVelocity.crossVectors(ballBody.velocity, new CANNON.Vec3(0,1,0))
    angularVelocity.normalize();
    angularVelocity.multiplyScalar(angularSpeed)
    ballBody.angularVelocity.copy(angularVelocity)

    glassBody.position.set(0,0,0);
    // const currTime = performance.now();
    // if(prevTime ==0 ) prevTime = currTime
    // const elapsed = (currTime - prevTime)/1000;

    updateMazeMesh()
    updateBallMesh()
    prevTime = currTime

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
    console.log("MOUSE MOVE ")
    // if(isMouseDown){
        currX = event.clientX;
        currY = event.clientY;
        // }
});

document.addEventListener('keydown', function(event){
    if(event.shiftKey)isShiftPressed = true;
    //listen for wasd key

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
    ballLight.position.copy(ballBody.position)
}


// Hide later only for debugging collisions
// const cannonDebugger = new CannonDebugger(scene, world, {
// })

function animate() {
    console.log("ANIMATE")

    renderNebula();
    update();    
    updateBallMesh()

    updateMazeMesh();
    animateStars(stars, STARS_VELOCITY)
	renderer.render( scene, camera );
    requestAnimationFrame( animate );
    // cannonDebugger.update()
	// controls.update()
    
    
}
animate();


