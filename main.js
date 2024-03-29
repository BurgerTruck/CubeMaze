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
// controls.panSpeed = 5


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
		const mazeData = createMazeCubeGroup(width, height, depth, radiusPercent, this.wall_height, wall_thickness, cell_size, bevelEnabled, color, this.maze)
		this.walls = mazeData.walls;
        this.model = mazeData.group;
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
const world = new CANNON.World();
world.gravity = new CANNON.Vec3(0, -1, -1)

// Ball mesh
const ballRadius = 0.025
const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
const ballMat = new THREE.MeshBasicMaterial({
    color: 0xff0000,
}); 
const ball = new THREE.Mesh(ballGeometry, ballMat)
ball.position.set(0, 0, 0.5)
scene.add(ball);

// Ball body
const ballBody = new CANNON.Body({
    shape: new CANNON.Sphere(ballRadius),
    material: new CANNON.Material({
        friction: 0,
        restitution: 0.5
    }),
    mass: 1,
})
ballBody.position.set(ball.position.x, ball.position.y, ball.position.z)
ballBody.quaternion.set(ball.quaternion.x, ball.quaternion.y, ball.quaternion.z, ball.quaternion.w)

// Add ball body to world after rendering wall bodiies
world.addBody(ballBody);




// Wall bodies
const wallBodies = []

//Function to extract vertices and indices from extrudeGeometry
function extractVerticesAndIndices(geometry) {
    const position = geometry.getAttribute('position');
    const vertices = [];
    const indices = [];
    
    // Extract vertices
    for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);
        vertices.push(new CANNON.Vec3(x, y, z));

        if( i % 3 == 0){
            indices.push([i, i + 1, i + 2]);
        }
    }
    
    // for (let i = 0; i < position.count; i += 3) {
        // indices.push([i, i + 1, i + 2]);
    // }
    
    return { vertices: vertices, indices: indices };
}

// Assign a collision body for each wall
maze.walls.forEach(wall => {
    
    // Get width, height, depth for each wall
    // wall.updateMatrixWorld();
    // const bbox = new THREE.Box3().setFromObject(wall);
    // const width = bbox.max.x - bbox.min.x;
    // const height = bbox.max.y - bbox.min.y;
    // const depth = bbox.max.z - bbox.min.z;
    
    // const wallShape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2)); // not sure about this if Box is enough or it should be convex polyhedron


    // Create the wall shape based on the width, height and depth of the wall
    // ConvexPolyhedron takes in: points - list of all vertices (?) and faces - array of integer arrays, describes which vertices is included in each face
    const wallData = extractVerticesAndIndices(wall.geometry);
    let vertices = wallData.vertices
    let indices = wallData.indices
    console.log(vertices, indices)
    const wallShape = new CANNON.ConvexPolyhedron(vertices, indices);


    // Create wall body with shape, material, mass, position and quaternion as properties
    
    const wallBody = new CANNON.Body({ 
        shape: wallShape,
        material: new CANNON.Material({
            friction: 0,
            restitution: 0.5
        }),
        
        type: CANNON.Body.STATIC
    }); 
    wallBody.position.copy(wall.position)
    wallBody.quaternion.copy(wall.quaternion)
    
    world.addBody(wallBody);
    wallBodies.push(wallBody);
})

world.allowSleep = true; // improve performance
world.defaultContactMaterial.friction = 1; 



// Move the ball
const moveForce = 1; 

const moveDistance = 0.01

//WARNING: DOES NOT WORK Move the ball using force
function handleKeyDown(event) {
    const keyCode = event.keyCode;
    const moveForce = 1; // Adjust this value as needed

    // Apply force based on the key pressed
    ballBody.wakeUp()
    switch (keyCode) {
        case 87: // W
            ballBody.applyForce(new CANNON.Vec3(0, moveForce, 0), ballBody.position);
            break;
        case 65: // A
            ballBody.applyForce(new CANNON.Vec3(-moveForce, 0, 0), ballBody.position);
            break;
        case 83: // S
            ballBody.applyForce(new CANNON.Vec3(0, -moveForce, 0), ballBody.position);
            break;
        case 68: // D
            ballBody.applyForce(new CANNON.Vec3(moveForce, 0, 0), ballBody.position);
            break;
    }
}

// function handleKeyDown(event){
//     const keyCode = event.keyCode;
//     switch (keyCode) {
//         case 87: // W
//             ballBody.position.y += moveDistance
//             break;
//         case 65: // A
//             ballBody.position.x -= moveDistance
//             break;
//         case 83: // S
//             ballBody.position.y -= moveDistance
//             break;
//         case 68: // D
//             ballBody.position.x += moveDistance
//             break;
//     }
// }


function updateWallAndBallPositionAndQuaternion(){
    ball.position.copy(ballBody.position);
    ball.quaternion.copy(ballBody.quaternion);
    // console.log('Ball Mesh Position: ', ball.position)
    // console.log('Ball Body Position: ', ballBody.position)
    maze.walls.forEach((wall, index) =>{
        if(wallBodies[index]){
            wall.position.copy(wallBodies[index].position);
            wall.quaternion.copy(wallBodies[index].quaternion);
        }
    })
}


const cannonDebugger = new CannonDebugger(scene, world, {
    //
})

document.addEventListener('keydown', handleKeyDown, false);
function animate() {
	requestAnimationFrame( animate );
    world.step(1/60); // Step the physics world
    
    
    updateWallAndBallPositionAndQuaternion();
    

	renderer.render( scene, camera );
    cannonDebugger.update()
	controls.update()
    
}
animate();


