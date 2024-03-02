export{createMazeCubeGroup}
import {generateMaze} from './maze.js'
import * as THREE from 'three';
function createBoxWithRoundedEdges( width, height, depth, radius, segments = 64, quadRadius = 0.00001 ) {
	let shape = new THREE.Shape();

	const startX = radius
	const startY = radius
	const endX = width - radius
	const endY = height -radius
	
    shape.moveTo(startX, startY + quadRadius);
    shape.lineTo(startX, endY-quadRadius);
	shape.quadraticCurveTo(startX, endY, startX + quadRadius, endY )
	// shape.lineTo(endX/2, endY)
	// shape.lineTo(endX/2, endY/2)
	// shape.lineTo(endX - quadRadius, endY/2)
	// shape.lineTo(endX - quadRadius, endY)
	shape.lineTo(endX - quadRadius, endY)
	shape.quadraticCurveTo(endX, endY, endX, endY - quadRadius)
	shape.lineTo(endX, startY + quadRadius)
	shape.quadraticCurveTo(endX, startY, endX - quadRadius, startY)
	shape.lineTo(startX + quadRadius, startY)
	shape.quadraticCurveTo(startX, startY, startX, startY + quadRadius)
	
	let geometry = new THREE.ExtrudeGeometry( shape, {
	  depth: depth - radius * 2,
	  bevelEnabled: true,
	  bevelSegments: segments,
	  steps: 1,
	  bevelSize: radius,
	  bevelThickness: radius,
	  curveSegments: segments
	});
	geometry.center();
	// geometry.boundingBox
	return geometry;
}
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
function createMazeWallGeometry( width, height, depth, wallHeight, wallThickness,distance_between_walls, segments = 20, quadRadius = 0.00000001, sideWalls, planeIndex, traversalInformations = null, bevelEnabled) {
	let shape = new THREE.Shape();
	// const startX = radius
	// const startY = radius
	// const endX = width - radius
	// const endY = height -radius
	const startX = 0
	const startY = 0
	const endX = width
	const endY = height
	const eps = 0.001
	// quadRadius = 0
	// console.log("RADIUOS: "+ quadRadius + radius)
	let radius  = bevelEnabled?wallThickness/2:0	
	const outerQuadRadius = wallHeight + quadRadius - eps-radius
	// radius = radius - eps

	let e = [eps, - eps, -eps, eps]
	let wallInside = [startX +wallHeight + eps, endY - wallHeight - eps, endX - wallHeight - eps, startY +wallHeight + eps]
	let wallOutside = [startX, endY, endX,startY ]


	let innerCorners = [[startX+wallHeight, endY - wallHeight ], [endX - wallHeight , endY - wallHeight], [endX - wallHeight , wallHeight ], [wallHeight, wallHeight]]
	let innerQuadCurveFrom = [[startX + wallHeight , endY - wallHeight-quadRadius ], [endX - wallHeight-quadRadius , endY - wallHeight ], [endX - wallHeight , wallHeight+quadRadius ], [wallHeight+quadRadius , wallHeight ]]
	let innerQuadCurveTo = [[startX + wallHeight + quadRadius , endY - wallHeight ], [endX - wallHeight , endY - wallHeight-quadRadius ], [endX - wallHeight-quadRadius , wallHeight ], [wallHeight , wallHeight+quadRadius ]]
	
	let outerCorners = [[startX, endY], [endX, endY], [endX, startY], [startX, startY]]	
	let quadCurveFrom = [[startX, endY-outerQuadRadius], [endX - outerQuadRadius, endY], [endX, startY + outerQuadRadius], [startX + outerQuadRadius, startY]]
	let quadCurveTo = [[startX + outerQuadRadius, endY], [endX, endY - outerQuadRadius], [endX - outerQuadRadius, startY], [startX, startY + outerQuadRadius]]


	let starts = [[startX, wallHeight+quadRadius ], [startX + wallHeight + quadRadius, endY], [endX, endY - wallHeight-quadRadius], [endX - wallHeight-quadRadius , startY]]
	let ends = [[startX, endY - wallHeight-quadRadius], [endX - wallHeight-quadRadius, endY], [endX,  wallHeight+quadRadius], [wallHeight+quadRadius, startY]]
	
	let reversed = false
	//index is index of plane
	//i is index of face 

	let currX = starts[0][0]
	let currY = starts[0][1]
    shape.moveTo(currX, currY);
	console.log(traversalInformations)
	if(isFirstRemoved(sideWalls, traversalInformations, 0, planeIndex)){

		currX = wallInside[0]
		shape.moveTo(currX, currY-radius)
	}
	console.log("START: "+currX, currY)	
	let currRemoved = false
	let prevRemoved = false
	let isSideExtended = [false, false, false, false]

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
				if(reversed)shape.lineTo(currX + radiusAdd, currY)
				else shape.lineTo(currX, currY + radiusAdd)
				
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

				if(reversed)shape.lineTo(currX + radiusAdd, currY)
				else shape.lineTo(currX, currY + radiusAdd)

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
			shape.lineTo(currX, currY)
			
			currX = innerQuadCurveTo[i][0]
			currY = innerQuadCurveTo[i][1]
			shape.quadraticCurveTo(innerCorners[i][0], innerCorners[i][1], currX, currY)
			
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
	  bevelEnabled: true ,
	  bevelSegments: segments,
	  steps: 4,
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
	const material = new THREE.MeshPhysicalMaterial( { color: color, side: THREE.DoubleSide, metalness: 0.10, roughness:0.6 } );
	const geometry = createBoxWithRoundedEdges( width, height, depth, radius,)
	const mesh = new THREE.Mesh( geometry, material ) ;
	return mesh
}
function createWallMesh(width, height, depth, wall_height,wallThickness, radius, distance_between_walls, sideWalls, index, traversalInformations, bevelEnabled, color ) {
	const geometry = createMazeWallGeometry( width, height, depth,wall_height,wallThickness,distance_between_walls, 32, radius, sideWalls, index, traversalInformations, bevelEnabled)
	const material = new THREE.MeshPhysicalMaterial( { color: color, side: THREE.DoubleSide, metalness: 0.10, roughness:0.6 } );
	const mesh = new THREE.Mesh( geometry, material ) ;
	return mesh
}

function createMazeCubeGroup(width, height, depth, radius = 0, wall_height = 0.1, wall_thickness = 0.01, cell_size = 0.1, bevelEnabled = false, color = 0xffffff) {
	const effective_depth = depth * cell_size
	const effective_width = width  * cell_size
	const effective_height = height * cell_size
	
	const total_depth  =effective_depth + 2* radius 
	const total_width = effective_width + 2 * radius
	const total_height = effective_height + 2* radius
	const result = generateMaze(width,height,depth)
	let {sideCells, sideWalls} = result
	console.log(sideWalls)


	console.log("DEPTH: "+depth)

	const distance_between_walls = cell_size

	const group = new THREE.Group()
	const cube = createBaseCubeMesh(total_width, total_height, total_depth, radius, color)

    let scale = 1
    if(radius > 0)scale+=0.01
    if(bevelEnabled)scale+=0.015
	cube.scale.set(scale, scale, scale)
	group.add(cube)

	console.log("EFFECTIVE: "+effective_depth)
	console.log("DISTANCE: "+distance_between_walls)
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

	let eps = 0.01
	for(let i = 0; i <= depth	; i++){
		
		const wall = createWallMesh(total_width + wall_height*2, total_height + wall_height*2, wall_thickness, wall_height,wall_thickness,radius,distance_between_walls, sideWalls, i, zWallOrder, bevelEnabled, color)	
		wall.position.z = startZ- (i==0?eps:0)
		group.add(wall)

		startZ += distance_between_walls

	}
	let startX = -effective_width/2 + wall_thickness/2
	for(let i = 0; i <= width; i++){
	
		const wall = createWallMesh(total_depth + wall_height*2, total_height + wall_height*2, wall_thickness, wall_height,wall_thickness,radius,  distance_between_walls, sideWalls, i, xWallOrder, bevelEnabled, color)	
	

		wall.rotateY(Math.PI/2)
		wall.position.x = startX - (i==0?eps:0)
		group.add(wall)

		startX += distance_between_walls
	}

	let startY = -effective_height/2 +  wall_thickness/2
	for(let i = 0; i <= height; i++){
	
		const wall = createWallMesh(total_width + wall_height*2, total_depth + wall_height*2, wall_thickness, wall_height,wall_thickness,radius,distance_between_walls, sideWalls, i, yWallOrder, bevelEnabled, color)	


		wall.rotateX(Math.PI/2)
		wall.position.y = startY	- (i==0?eps:0) 
		group.add(wall)

		startY += distance_between_walls
	}

	return group
}