export{createMazeCubeGroup}
import {generateMaze} from './maze.js'
import * as THREE from 'three';
import { MeshTransmissionMaterial } from '@pmndrs/vanilla';
function getIterationDetails(sideWalls, traversalInformation, planeIndex){
 
	let {wallIndex, reverseTraversal, vertical, reversePlaneIndex} = traversalInformation
	let walls = sideWalls[wallIndex]	
	
	let startIndex = 0
	let endIndex = 1;
	let indices = [0,0]
	let step = [0,0]
	let count = 0
	if(vertical){
		if(reverseTraversal){
			startIndex = walls.length-2
			endIndex = 1;
		}else{
			startIndex = 1;
			endIndex = walls.length-2
		}
		count = Math.abs(endIndex-startIndex)/2+1
		indices[0] = startIndex;
		// console.log(startIndex)
		indices[1] = reversePlaneIndex?walls[1].length -1- planeIndex:planeIndex
		step[0] = startIndex < endIndex?2: -2
	}else{
		if(reverseTraversal){
			startIndex = walls[0].length -1
			endIndex = 0
		}else{
			startIndex = 0
			endIndex = walls[0].length - 1
		}
		
		count = Math.abs(endIndex - startIndex)+1
		indices[0] = reversePlaneIndex?walls.length-1 - 2*planeIndex:2*planeIndex
		indices[1] = startIndex;
		step[1] = startIndex < endIndex?1:-1
	}
	return {walls: walls, indices: indices, step: step, count: count}
}
function traverse(sideWalls, traversalInformation, planeIndex){
	let {walls, indices, step, count} = getIterationDetails(sideWalls, traversalInformation, planeIndex)
	const list = []
	for(let i = 0; i < count; i++){
		const row = indices[0]
		const col = indices[1]
		list.push(walls[row][col])

		indices[0]+=step[0]
		indices[1]+=step[1]
	}
	return list;

}
function isFirstRemoved(sideWalls, traversalInformations, i, planeIndex){
	
	let {walls, indices, step, count} = getIterationDetails(sideWalls, traversalInformations[i], planeIndex)
	let wallIndex = traversalInformations[i].wallIndex

	let firstWall = walls[indices[0]][indices[1]]
	return firstWall.isRemoved || firstWall.face!=wallIndex 
}
function getWallBoxes(width, height, depth, wallHeight, wallThickness,distance_between_walls, segments = 20, quadRadius = 0.001, sideWalls, planeIndex, traversalInformations = null, bevelEnabled, offsets){
	let reversed = false;
	const startX = -width/2
	const startY = -height/2 
	const endX = width/2
	const endY = height/2			

	let currX =  startX;
	let currY = startY + wallHeight + wallThickness;
	const halfWallHeight = wallHeight/2
	const boxPos = [startX +halfWallHeight, endY - halfWallHeight, endX-  halfWallHeight, startY+ halfWallHeight];
	const corners = [startX + wallHeight ,  endY - wallHeight, endX - wallHeight, startY+ wallHeight];
	const boxes = new THREE.Group()
	for(let i = 0; i < 4; i++){
		const wallIndex = traversalInformations[i].wallIndex
		let walls = traverse(sideWalls, traversalInformations[i], planeIndex )
		let start =  -100000;
		for(let j = 0; j <= walls.length; j++ ){
			let currRemoved = false;
			if(j==walls.length){
				const nextIndex = (i+1)%4;
				currRemoved =  isFirstRemoved(sideWalls, traversalInformations, nextIndex, planeIndex)
			}else{
				const wall = walls[j]
				currRemoved = wall.isRemoved ||wall.face!=wallIndex
			}

			if(!currRemoved && start == -100000 && j!=walls.length){
				if(!reversed)start = currY;
				else start = currX;
			}else if((currRemoved && start !=-100000) || (!currRemoved && j==walls.length)){
				if(j==walls.length && start == -100000){
					start = corners[(i+1)%4] 
				}
				let box = null;
				if(!reversed){
					box = new THREE.BoxGeometry(wallHeight, Math.abs(currY - start),wallThickness)
					const mesh = new THREE.Mesh(box, null);

					mesh.position.set(boxPos[i], (currY+start)/2  + (offsets[i]!=0?offsets[i] * wallThickness:0), 0)
					boxes.add(mesh)

					// if(j==walls.length){
					// 	box = new THREE.BoxGeometry(wallThickness, wallHeight, wallThickness);
					// 	const mesh = new THREE.Mesh(box, null);
					// 	mesh.position.set(boxPos[i] + halfWallHeight +wallThickness/2 , currY-wallHeight/2 + wallThickness, 0)
					// 	boxes.add(mesh)
					// }
				}else{
					box = new THREE.BoxGeometry(Math.abs(currX - start), wallHeight, wallThickness)
					const mesh = new THREE.Mesh(box, null);
					mesh.position.set((currX + start )/2 +(+offsets[i]!=0?offsets[i] * wallThickness:0) , boxPos[i], 0 )
					boxes.add(mesh)

					if(j==walls.length){
						box = new THREE.BoxGeometry(wallHeight, wallThickness, wallThickness);
						const mesh = new THREE.Mesh(box, null);
						mesh.position.set( currX - wallHeight/2 + wallThickness, boxPos[i] - halfWallHeight -wallThickness/2, 0)
						// boxes.add(mesh)
					}
				}
				

				start = -100000;
			}

			let distanceToAdd = i>=2?-distance_between_walls:distance_between_walls
			if (j == walls.length-1)distanceToAdd = distanceToAdd*2;
			if(reversed){
				if(j==walls.length){
					if(i==1)currY-=(wallHeight)
					else currY+=wallHeight
				}else currX +=distanceToAdd

			}else{
				if(j==walls.length){
					if(i==0)currX+=wallHeight+wallThickness
					else currX-=wallHeight
				}else currY +=distanceToAdd
			}
		}
		reversed = !reversed
	}
	return boxes;
	
}

function createRectangleWithHoleGeometry(width, height, depth,hole = {x: 0, y: 0, radius: 0.0}, segments=  8) {

    var shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0, height);
    shape.lineTo(width, height);
    shape.lineTo(width, 0);
	

    if(hole.radius > 0){
		var holePath = new THREE.Path();
		holePath.moveTo(hole.x, hole.y );
		holePath.arc( 0, 0, hole.radius, 0, 2 * Math.PI, false);
		shape.holes.push(holePath);
	}

    let geometry = new THREE.ExtrudeGeometry( shape, {
      depth: depth,
      bevelEnabled:false,
      steps: 1,
      curveSegments: segments
    });

    geometry.center();
    return geometry
}
function createRectangleMesh(startX, startY, width, height, depth){
	// const extrudeSettings = {
	// 	steps: 1,
	// 	depth: depth,
	// 	bevelEnabled: false,
	// 	curveSegments: 0
	// }
	// const shape = new THREE.Shape();
	// shape.moveTo(startX, startY);
	// shape.lineTo(startX, endY);
	// shape.lineTo(endX, endY);
	// shape.lineTo(endX, startY);
	// const geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );


	const box = new THREE.BoxGeometry(width,height,depth);
	const mesh = new THREE.Mesh(box, null);
	mesh.position.x = startX + width/2
	mesh.position.y = startY + height/2


	
	return mesh
}
function createRectanglesWithHoleGroup(width, height, depth,hole = {x: 0, y: 0, radius: 0.0}){
	const group = new THREE.Group();


	const startX = -width/2
	const startY = -height/2

	const holeBottomLeft = new THREE.Vector2( startX + hole.x-hole.radius, startY + hole.y-hole.radius);
	const holeTopRight = new THREE.Vector2(startX + hole.x+hole.radius, startY + hole.y+hole.radius);

	const bottomRect = createRectangleMesh(startX, startY,  width, holeBottomLeft.y - startY,  depth)
	const middleLeftRect = createRectangleMesh(startX, holeBottomLeft.y, holeBottomLeft.x - startX , hole.radius*2, depth)
	const middleRightRect=  createRectangleMesh(holeTopRight.x, holeBottomLeft.y, width/2 - holeTopRight.x, hole.radius*2, depth)
	const topRect = createRectangleMesh(startX, holeTopRight.y, width, height/2 - holeTopRight.y, depth)
	
	group.add(bottomRect)
	group.add(middleLeftRect)
	group.add(middleRightRect)
	group.add(topRect)

    // const boundingBox = new THREE.Box3().setFromObject(group);

    // const center = new THREE.Vector3();
    // boundingBox.getCenter(center);
    // group.position.sub(center);

	return group;
	
}
function createGlassMesh(width, height, depth,hole = {x: 0, y: 0, radius: 0.0}, segments = 8){
	const glassMaterial = new THREE.MeshPhysicalMaterial({
		transmission: 1,
		opacity:1,
		roughness: 0,
		metalness: 0,
		ior: 1.5,
		reflectivity: 0.1,
		refractionRatio: 0.98,
		thickness: depth
	  })
	console.log(glassMaterial)
	// const geometry = new THREE.BoxGeometry(width, height, depth);
	const geometry = createRectangleWithHoleGeometry(width, height, depth,hole, segments)
	// const glassMaterial = new THREE.MeshLambertMaterial({color: 0xffffff, transparent: true, opacity: 0.5})
	const mesh = new THREE.Mesh(geometry, glassMaterial);
	return mesh;
}

function createMazeWallGeometry( width, height, depth, wallHeight, wallThickness,distance_between_walls, segments = 20, quadRadius = 0.001, sideWalls, planeIndex, traversalInformations = null, bevelEnabled, offsets = [0,0,0,0]) {
	let shape = new THREE.Shape();
	// const startX = radius
	// const startY = radius
	// const endX = width - radius
	// const endY = height -radius

	const startX = 0
	const startY = 0
	const endX = width
	const endY = height
	const eps = 0.0001
	// const eps = bevelEnabled?0.00001:0
	// quadRadius = 0
	// console.log("RADIUOS: "+ quadRadius + radius)
	// let radius  = bevelEnabled?wallThickness/2:0
	let radius = bevelEnabled?0.005:0
	const outerQuadRadius = wallHeight + quadRadius - eps-radius
	// const outerQuadRadius = 0
	// radius = radius - eps

	let e = [eps, - eps, -eps, eps]
	let wallInside = [startX +wallHeight + eps, endY - wallHeight - eps, endX - wallHeight - eps, startY +wallHeight + eps]
	let wallOutside = [startX, endY, endX,startY ]
	
	let innerCorners = [[startX+wallHeight, endY - wallHeight ], [endX - wallHeight , endY - wallHeight], [endX - wallHeight , wallHeight ], [wallHeight, wallHeight]]
	let innerQuadCurveFrom = [[startX + wallHeight , endY - wallHeight-quadRadius ], [endX - wallHeight-quadRadius , endY - wallHeight ], [endX - wallHeight +eps, wallHeight+quadRadius ], [wallHeight+quadRadius , wallHeight-eps]]
	let innerQuadCurveTo = [[startX + wallHeight + quadRadius , endY - wallHeight+eps ], [endX - wallHeight , endY - wallHeight-quadRadius ], [endX - wallHeight-quadRadius , wallHeight ], [wallHeight , wallHeight+quadRadius ]]
	
	let outerCorners = [[startX, endY], [endX, endY], [endX, startY], [startX, startY]]	
	let quadCurveFrom = [[startX, endY-outerQuadRadius], [endX - outerQuadRadius, endY], [endX, startY + outerQuadRadius], [startX + outerQuadRadius, startY]]
	let quadCurveTo = [[startX + outerQuadRadius, endY], [endX, endY - outerQuadRadius], [endX - outerQuadRadius, startY], [startX, startY + outerQuadRadius+eps]]
	
	// console.log("QUAD RADIIUS: "+quadRadius)
	// console.log(innerQuadCurveFrom[0])
	// console.log(innerQuadCurveTo[0])
	// console.log(innerCorners[0])

	let starts = [[startX, wallHeight+quadRadius ], [startX + wallHeight + quadRadius, endY], [endX, endY - wallHeight-quadRadius], [endX - wallHeight-quadRadius , startY]]
	let ends = [[startX, endY - wallHeight-quadRadius], [endX - wallHeight-quadRadius, endY], [endX,  wallHeight+quadRadius], [wallHeight+quadRadius, startY]]
	
	let reversed = false
	//index is index of plane
	//i is index of face 

	let currX = starts[0][0]
	let currY = starts[0][1]
    shape.moveTo(currX, currY);
	// console.log(traversalInformations)

	let currRemoved = false
	let prevRemoved = false
	if(isFirstRemoved(sideWalls, traversalInformations, 0, planeIndex)){
		currRemoved = true;
		currX = wallInside[0]
		// currX = wallHeight
		// currY = wallHeight
		shape.moveTo(currX, currY)
	}
	// console.log("START: "+currX, currY)	
	let isSideExtended = [false, false, false, false]
	// console.log("START X: " + currX + "START Y: "+currY)
	// console.log("FIRST WALL INSIDE X: "+wallInside[0])
	for(let i = 0; i < 4; i++){
		const wallIndex = traversalInformations[i].wallIndex
		let walls = traverse(sideWalls, traversalInformations[i], planeIndex )
		for(let j = 0; j < walls.length; j++ ){
			let wall = walls[j]
			currRemoved = wall.isRemoved ||wall.face!=wallIndex
			if(i ===0 && j===0) prevRemoved = currRemoved
			if(j===0 && !prevRemoved && currRemoved){
				if(reversed){
					currX = starts[i][0] 
					currY = wallOutside[i]
				}else{
					currX = wallOutside[i]
					currY = starts[i][1]
				}
			}
			if(!currRemoved)isSideExtended[i] = true
			if(prevRemoved!=currRemoved){
				let radiusAdd = 0
				radiusAdd = i>=2?radius:-radius
				radiusAdd = currRemoved?radiusAdd:-radiusAdd
				
				let offset = offsets[i]
				if(offset!=0){
					offset = offset * wallThickness/2;
				}

				if(reversed)shape.lineTo(currX + radiusAdd + offset, currY)
				else shape.lineTo(currX, currY + radiusAdd + offset)
				
				if(currRemoved){
					if(!reversed){
						currX = wallInside[i] + e[i]
					}else{
						currY = wallInside[i]+ e[i]
					}

				}else{
					if(!reversed){
						currX = wallOutside[i]
					}else{
						currY = wallOutside[i]
					}

				}
				
				if(reversed)shape.lineTo(currX + radiusAdd + offset, currY)
				else shape.lineTo(currX, currY + radiusAdd+offset)

				// shape.lineTo(currX, currY)
			}
			prevRemoved = currRemoved
			let distanceToAdd = i>=2?-distance_between_walls:distance_between_walls
			if(reversed){
				currX +=distanceToAdd
			}else{
				currY +=distanceToAdd
			}
		}
		const nextIndex = (i+1)%4;
		const nextFirstRemoved = isFirstRemoved(sideWalls, traversalInformations, nextIndex, planeIndex)
		if(currRemoved && nextFirstRemoved){

			currX = innerQuadCurveFrom[i][0]
			currY = innerQuadCurveFrom[i][1]
			// if(i==3){
			// 	console.log("QUAD CURVING FROM : "+currX + " CURRY: "+currY)
			// }
			shape.lineTo(currX, currY)
			
			currX = innerQuadCurveTo[i][0]
			currY = innerQuadCurveTo[i][1]
			shape.quadraticCurveTo(innerCorners[i][0], innerCorners[i][1], currX, currY)
			// if(i==3){
			// 	console.log("QUAD CURVING TO : "+currX + " CURRY: "+currY)
			// }
		}else{
			if(currRemoved){
				let radiusAdd = radius
				radiusAdd = i>=2?-radius:+radius
				currX = innerQuadCurveFrom[i][0]
				currY = innerQuadCurveFrom[i][1]
				if( reversed)shape.lineTo(currX  +  radiusAdd, currY)
				else shape.lineTo(currX, currY + radiusAdd)
				currX = ends[i][0]
				currY = ends[i][1]
				if( reversed)shape.lineTo(currX  +  radiusAdd, currY)
				else shape.lineTo(currX, currY + radiusAdd)
			}
			currX = quadCurveFrom[i][0]
			currY = quadCurveFrom[i][1]
			shape.lineTo(currX, currY)
			
			currX = quadCurveTo[i][0]
			currY = quadCurveTo[i][1]
			shape.quadraticCurveTo(outerCorners[i][0], outerCorners[i][1], currX, currY)
			let radiusAdd  = nextIndex>=2?radius:-radius
			currX = starts[nextIndex][0]
			currY = starts[nextIndex][1]
			if( !reversed)shape.lineTo(currX  +  radiusAdd, currY)
			else shape.lineTo(currX, currY + radiusAdd)
	
			isSideExtended[i] = true
			isSideExtended[nextIndex] = true
		}

		reversed = !reversed
	}
	
	
	let geometry = new THREE.ExtrudeGeometry( shape, {
	  depth: depth - radius * 2,
	  bevelEnabled: bevelEnabled ,
	  bevelSegments: segments,
	  steps: 1,
	  bevelSize: radius,
	  bevelThickness:radius,
	  curveSegments: segments
	});
	
	
	geometry.center();

	if(isSideExtended[0] ^ isSideExtended[2]){
		geometry.translate((isSideExtended[0]?-1:1) * wallHeight/2, 0, 0)
	}
	if(isSideExtended[1] ^ isSideExtended[3]){
		geometry.translate(0,(isSideExtended[1]?1:-1) * wallHeight/2, 0 )
	}
	return geometry;

}

function createBaseCubeMesh( width, height, depth, radius = 0.1, color) {

	// const material = new THREE.MeshStandardMaterial({wireframe:true})
	// const material = new THREE.MeshPhysicalMaterial( { color: color, side: THREE.DoubleSide, metalness: 0.65, roughness:0.5 } );
	// const geometry = createBoxWithRoundedEdges( width, height, depth, radius,)
	// const mesh = new THREE.Mesh( geometry, material ) ;

	const geometry = new THREE.BoxGeometry( width, height, depth );
	const mesh = new THREE.Mesh(geometry)
	return mesh
}
function createWallMesh(width, height, depth, wall_height,wallThickness, radius, distance_between_walls, sideWalls, index, traversalInformations, bevelEnabled, color, offsets, boxOffsets = [0,0,0,0] ) {
	const geometry = createMazeWallGeometry( width, height, depth,wall_height,wallThickness,distance_between_walls, 32, radius, sideWalls, index, traversalInformations, bevelEnabled,offsets )
	// const collisionGeometry = createMazeWallGeometry( width, height, depth,wall_height,wallThickness,distance_between_walls, 32, radius, sideWalls, index, traversalInformations, bevelEnabled, true)
	const boxes = getWallBoxes(width, height, depth,wall_height,wallThickness,distance_between_walls, 32, radius, sideWalls, index, traversalInformations, bevelEnabled, boxOffsets)
	const material = new THREE.MeshPhysicalMaterial( { color: color, side: THREE.DoubleSide, metalness: 0.42, roughness:0.60,wireframe:false } );

	const mesh = new THREE.Mesh( geometry, material ) ;
	return {mesh: mesh, boxes: boxes}
}

function createMazeCubeGroup(width, height, depth, radiusPercent = 0, wall_height = 0.1, wall_thickness = 0.01, cell_size = 0.1, bevelEnabled = false, color = 0xffffff, maze) {
	const effective_depth = depth * cell_size
	const effective_width = width  * cell_size
	const effective_height = height * cell_size
	
	const radius = radiusPercent/100/2 * Math.min(Math.min(effective_depth, effective_width), effective_height)

	const total_depth  =effective_depth + 2* radius 
	const total_width = effective_width + 2 * radius
	const total_height = effective_height + 2* radius
	const walls = []
	
	let {sideCells, sideWalls} = maze
	// console.log(sideWalls)


	// console.log("DEPTH: "+depth)

	const distance_between_walls = cell_size

	const group = new THREE.Group()
	const padding = wall_thickness*2
	const cube = createBaseCubeMesh(total_width + padding, total_height+padding, total_depth+padding, radius, color)


	// const scaleX = (total_width+padding)/total_width
	// const scaleY = (total_height+padding)/total_height
	// const scaleZ = (total_depth+padding)/total_depth
	// cube.scale.set(scaleX, scaleY, scaleZ)


	// console.log("EFFECTIVE: "+effective_depth)
	// console.log("DISTANCE: "+distance_between_walls)
	const zWallOrder = [{wallIndex: 1, reverseTraversal: true, vertical: false, reversePlaneIndex: false},
						 {wallIndex: 5, reverseTraversal: false, vertical: false, reversePlaneIndex: true},
						 {wallIndex: 3, reverseTraversal: true, vertical: false, reversePlaneIndex: false},
						 {wallIndex: 2, reverseTraversal: true, vertical: false, reversePlaneIndex: false}]

	const xWallOrder = [{wallIndex: 4, reverseTraversal: false, vertical: true, reversePlaneIndex: false}, 
						{wallIndex: 5, reverseTraversal: false, vertical: true, reversePlaneIndex: false},
						{wallIndex: 0, reverseTraversal: false, vertical: true, reversePlaneIndex: false},
						{wallIndex: 2, reverseTraversal: false, vertical: true, reversePlaneIndex: false}];

	// const yWallOrder = [{wallIndex: 1, reverseTraversal: true, vertical: true, reversePlaneIndex: true}, 
	// 					{wallIndex: 0, reverseTraversal: false, vertical: false, reversePlaneIndex: true},
	// 					{wallIndex: 3, reverseTraversal: false, vertical: true, reversePlaneIndex: false},
	// 					{wallIndex: 4, reverseTraversal: true, vertical: false, reversePlaneIndex: false}];

	const yWallOrder = [{wallIndex: 1, reverseTraversal: false, vertical: true, reversePlaneIndex: true}, 
		{wallIndex: 4, reverseTraversal: false, vertical: false, reversePlaneIndex: false},
		{wallIndex: 3, reverseTraversal: true, vertical: true, reversePlaneIndex: false},
		{wallIndex: 0, reverseTraversal: true, vertical: false, reversePlaneIndex: true}];
	
	let startZ = -effective_depth/2 + wall_thickness/2

	// group.add(cube)
	let holeRadius = (cell_size - wall_thickness) * 0.8/2
	const glass_thickness = wall_thickness;
	const size_offset = glass_thickness*2
	const half_glass_thickness = glass_thickness/2
	let glassStart = wall_height + wall_thickness*2 
	

	function getHole(row, col){
		return { x: glassStart + col * distance_between_walls + cell_size/2,y: glassStart + row * distance_between_walls + cell_size/2, radius: cell_size/2}
	}

	// maze.end.face = 4;
	// maze.end.position = [0,0]
	let boxHoleGroup = new THREE.Group()
	let eps = 0.01 +wall_thickness/2
	{
		const mesh_width = total_width + wall_height*2 + glass_thickness
		const mesh_height = total_height + wall_height*2 +  glass_thickness
		for(let i = 0; i <= depth	; i++){
			const {mesh, boxes} = createWallMesh(mesh_width, mesh_height, wall_thickness, wall_height,wall_thickness,radius,distance_between_walls, sideWalls, i, zWallOrder, bevelEnabled, color, [2,2,0,0])	
			// console.log(wall)
			mesh.position.z = startZ- (i==0?eps:0)
			group.add(mesh)	

			boxes.position.copy(mesh.position)
			startZ += distance_between_walls
			boxes.traverse(function(e){
				if(e instanceof THREE.Mesh){
					walls.push(e)
					// console.log(e.position)	
				}
			})
		}
		let holeNeg = { x: 0, y: 0, radius: 0.0}
		let holePos = { x: 0, y: 0, radius: 0.0}		
		const boxHoleDepth = total_depth + 2*wall_height
		if(maze.end.face==0){
			const row = height - maze.end.position[0]-1;
			const col = maze.end.position[1];
			holeNeg = getHole(row, col)
			boxHoleGroup = createRectanglesWithHoleGroup(mesh_width + size_offset, mesh_height + size_offset, boxHoleDepth, holeNeg)
			boxHoleGroup.position.z = -startZ- (boxHoleDepth)/2
			
		}else if(maze.end.face == 4){
			const row = maze.end.position[0];
			const col = maze.end.position[1];
			holePos = getHole(row, col)
			boxHoleGroup = createRectanglesWithHoleGroup(mesh_width + size_offset, mesh_height + size_offset, boxHoleDepth, holePos)
			boxHoleGroup.position.z = startZ+ (boxHoleDepth)/2
		}
		const glassMeshNeg = createGlassMesh(mesh_width + size_offset, mesh_height + size_offset, glass_thickness, holeNeg);
		const glassMeshPos = createGlassMesh(mesh_width + size_offset, mesh_height + size_offset, glass_thickness, holePos)
		glassMeshPos.position.z = startZ+ half_glass_thickness
		glassMeshNeg.position.z = -startZ - half_glass_thickness
		group.add(glassMeshNeg)
		group.add(glassMeshPos)
	}

	let startX = -effective_width/2 + wall_thickness/2
	{
		const mesh_width = total_depth + wall_height*2 + glass_thickness
		const mesh_height = total_height + wall_height*2 + glass_thickness
		for(let i = 0; i <= width; i++){
		
			const {mesh, boxes} = createWallMesh(mesh_width, mesh_height, wall_thickness, wall_height,wall_thickness,radius,  distance_between_walls, sideWalls, i, xWallOrder, bevelEnabled, color, [2,0,0,-2], [0, -1, 0, -1])	

			mesh.rotateY(Math.PI/2)
			mesh.position.x = startX - (i==0?eps:0)
			group.add(mesh)
			boxes.rotateY(Math.PI/2)
			boxes.position.copy(mesh.position)



			startX += distance_between_walls
			boxes.traverse(function(e){
				if(e instanceof THREE.Mesh){
					e.quaternion.copy(mesh.quaternion)
					walls.push(e)
				}
			})
		}

		let holeNeg = { x: 0, y: 0, radius: 0.0}
		let holePos = { x: 0, y: 0, radius: 0.0}	
		const boxHoleDepth = total_width + 2* wall_height
		if(maze.end.face==1){
			const row = height - maze.end.position[1]-1;
			const col = depth - maze.end.position[0] - 1;
			holeNeg = getHole(row, col)
			boxHoleGroup = createRectanglesWithHoleGroup(mesh_width + size_offset, mesh_height + size_offset, boxHoleDepth , holeNeg )
			boxHoleGroup.position.x = -startX - (boxHoleDepth)/2
			boxHoleGroup.rotateY(Math.PI/2)
		}else if(maze.end.face == 3){
			const row = maze.end.position[1];
			const col = depth - maze.end.position[0] - 1;
			holePos = getHole(row, col)
			boxHoleGroup = createRectanglesWithHoleGroup(mesh_width + size_offset, mesh_height + size_offset, boxHoleDepth, holePos)
			boxHoleGroup.position.x = startX + (boxHoleDepth)/2
			boxHoleGroup.rotateY(Math.PI/2)
		}
		const glassMeshNeg = createGlassMesh(mesh_width + size_offset, mesh_height + size_offset, glass_thickness, holeNeg)
		const glassMeshPos = createGlassMesh(mesh_width + size_offset, mesh_height + size_offset, glass_thickness, holePos)
		glassMeshPos.position.x = startX + half_glass_thickness
		glassMeshNeg.position.x = -startX  - half_glass_thickness
		glassMeshNeg.rotateY(Math.PI/2)
		glassMeshPos.rotateY(Math.PI/2)
		group.add(glassMeshNeg)
		group.add(glassMeshPos)
	}

	{
		const mesh_width = total_width + wall_height*2 + glass_thickness
		const mesh_height = total_depth + wall_height*2 + glass_thickness
		let startY = -effective_height/2 +  wall_thickness/2
		for(let i = 0; i <= height; i++){
		
			const {mesh, boxes} = createWallMesh(mesh_width, mesh_height, wall_thickness, wall_height,wall_thickness,radius,distance_between_walls, sideWalls, i, yWallOrder, bevelEnabled, color, [2,2,0,0])	
			mesh.rotateX(Math.PI/2)
			mesh.position.y = startY	- (i==0?eps:0) 
			group.add(mesh)

			boxes.position.copy(mesh.position)
			boxes.rotateX(Math.PI/2)	
			startY += distance_between_walls
			boxes.traverse(function(e){
				if(e instanceof THREE.Mesh){
					e.quaternion.copy(mesh.quaternion)
					walls.push(e)
				}
			})
		}
		let holeNeg = { x: 0, y: 0, radius: 0.0}
		let holePos = { x: 0, y: 0, radius: 0.0}		
		const boxHoleDepth =total_height + 2*wall_height
		if(maze.end.face==2){
			const row = maze.end.position[0];
			const col = maze.end.position[1];
			holeNeg = getHole(row, col)
			boxHoleGroup = createRectanglesWithHoleGroup(mesh_width + size_offset, mesh_height + size_offset, boxHoleDepth, holeNeg)
			boxHoleGroup.position.y = -startY - (boxHoleDepth)/2
			boxHoleGroup.rotateX(Math.PI/2)
		}else if(maze.end.face == 5){
			const row = depth - maze.end.position[0]-1;
			const col = maze.end.position[1];
			holePos = getHole(row, col)
			boxHoleGroup = createRectanglesWithHoleGroup(mesh_width + size_offset, mesh_height + size_offset, boxHoleDepth, holePos)
			boxHoleGroup.position.y = startY + (boxHoleDepth)/2
			boxHoleGroup.rotateX(Math.PI/2)
		}
		const glassMeshNeg = createGlassMesh(mesh_width + size_offset, mesh_height + size_offset, glass_thickness, holeNeg)
		const glassMeshPos = createGlassMesh(mesh_width + size_offset, mesh_height + size_offset, glass_thickness, holePos)
		glassMeshPos.position.y = startY + half_glass_thickness
		glassMeshNeg.position.y = -startY  - half_glass_thickness
		glassMeshNeg.rotateX(Math.PI/2)
		glassMeshPos.rotateX(Math.PI/2)
		group.add(glassMeshNeg)
		group.add(glassMeshPos)
	}
	walls.push(cube)
	return {
		group: group,
		walls: walls,
		boxHoleGroup: boxHoleGroup
	}
}