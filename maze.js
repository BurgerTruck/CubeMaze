export {generateMaze}
class Wall {
    constructor({start = (0,0), end = (0,0), isVertical = false, face = 0, isRemoved = false}) {
        this.isRemoved = isRemoved;
        this.start = start;
        this.end = end;
        this.isVertical = isVertical;
        this.face = face
    }
    
    toString() {
        return `${this.start}->${this.end}`;
    }
    
    [Symbol.toPrimitive]() {
        return `${this.start}->${this.end}`;
    }
}

class Cell {
    constructor(position, walls, isVisited, isObstacle, face) {
        this.upWall = walls[0];
        this.rightWall = walls[1];
        this.bottomWall = walls[2];
        this.leftWall = walls[3];
        
        this.upCell = null;
        this.rightCell = null;
        this.bottomCell = null;
        this.leftCell = null;
        
        this.isVisited = isVisited;
        this.isObstacle = isObstacle;
        this.position = position;
        this.face = face
    }
    
    getDirection(direction) {
        switch(direction) {
            case "up":
                return [this.upWall, this.upCell];
            case "right":
                return [this.rightWall, this.rightCell];
            case "bottom":
                return [this.bottomWall, this.bottomCell];
            case "left":
                return [this.leftWall, this.leftCell];
            default:
                return [null, null];
        }
    }
}

function generateWalls(offsetRow = 0, offsetCol = 0, width, height, face = 0) {
    const walls  = [];
    for (let i = 0; i < 2 * height+1; i++) {
        const rowLength = i % 2 === 0 ? width : width + 1;
        walls.push(Array.from({ length: rowLength }, () => null));
    }

    let vertical = false;
    
    for (let i = 0; i < 2 * height + 1; i++) {
        for (let j = 0; j < (vertical ? width + 1 : width); j++) {
            const wall = new Wall({ isVertical: vertical, face: face});
            walls[i][j] = wall;
        }   
        vertical = !vertical;
    }
    
    return walls;
}

function generateCells(walls, width, height, face = 0) {
    const cells = Array.from({ length: height }, () => Array.from({ length: width }, () => null));

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const upWall = walls[i * 2][j];
            const rightWall = walls[i * 2 + 1][j + 1];
            const bottomWall = walls[i * 2 + 2][j];
            const leftWall = walls[i * 2 + 1][j];
            
            const cell = new Cell([i, j], [upWall, rightWall, bottomWall, leftWall], false, false, face);
            cells[i][j] = cell;
        }
    }
    
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            cells[i][j].upCell = i > 0 ? cells[i - 1][j] : null;
            cells[i][j].rightCell = j < width - 1 ? cells[i][j + 1] : null;
            cells[i][j].bottomCell = i < height - 1 ? cells[i + 1][j] : null;
            cells[i][j].leftCell = j > 0 ? cells[i][j - 1] : null;
        }
    }
    
    return cells;
}
const directions = ["up", "right", "bottom", "left"];
function dfs(cell, min_distances, depth = 0 ) {
    cell.isVisited = true;
    min_distances
    const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);
    const min_distance = min_distances.has(cell) ? min_distances.get(cell) : Infinity;
    min_distances.set(cell, Math.min(min_distance, depth));
    for (const direction of shuffledDirections) {
        const [wall, nextCell] = cell.getDirection(direction);
        if (nextCell && !nextCell.isVisited) {
            dfs(nextCell, min_distances, depth+1);
            wall.isRemoved = true;
        }
    }
}
function randomEqual(a, b, aRow, aCol, bRow, bCol){
    if (Math.random() >=0.5){
        a[aRow][aCol] = b[bRow][bCol]
    }else{
        b[bRow][bCol] = a[aRow][aCol]
    }
}
function combineHorizontalWalls(a, b) {
    // a[0] = [...b[b.length - 1]];
    const last = b.length - 1
    for (let i = 0; i < a[0].length; i++) {
        // a[0][i] = b[last][i];
        randomEqual(a, b, 0, i, last, i)
    }
}

function combineVerticalWalls(a, b, index = null) {
    if (index === null) {
        for (let i = 0; i < a.length; i++) {
            if (i & 1) {
                // a[i][0] = b[i][b[i].length - 1];
                randomEqual(a, b, i, 0, i, b[i].length - 1)
            }
        }
    } else {
        const last = a.length - 1;
        const aIndex = index==-1?a[1].length-1:index
        const bIndex = index==-1?b[1].length-1:index
        for (let i = 1; i < a.length; i+=2) {
                // a[i][aIndex] = b[last - i][bIndex];
                randomEqual(a,b , i, aIndex, last- i , bIndex)
        }
    }
}


function combineVerticalHorizontal(a, b, aIndex, bIndex, reverse = false) {

    if(aIndex ===-1) aIndex = a[1].length - 1
    if(bIndex===-1) bIndex = b.length-1
    let bLast = 0;
    if(reverse)
        bLast = b[bIndex].length - 1
    else
        bLast = 0   

    let j = 0;
    for (let i = 1; i < a.length; i+=2) {
        const bCol = Math.abs(bLast - j)
        // a[i][aIndex] = b[bIndex][bCol];
        randomEqual(a,b, i, aIndex, bIndex, bCol)
        j++;
    }
}

function connectHorizontalCells(a, b) {
    for (let i = 0; i < a[0].length; i++) {
        a[0][i].upCell = b[b.length - 1][i];
        b[b.length - 1][i].bottomCell = a[0][i];
    }
}

function connectVerticalCells(a, b, index = null) {
    if (index === null) {
        for (let i = 0; i < a.length; i++) {
            a[i][0].leftCell = b[i][b[i].length - 1];
            b[i][b[i].length - 1].rightCell = a[i][0];
        }
    } else {
        const last = a.length - 1;
        if (index === 0) {
            for (let i = 0; i < a.length; i++) {
                a[i][index].leftCell = b[last - i][index];
                b[last - i][index].leftCell = a[i][index];
            }
        } else if (index === -1) {
            
            const aIndex = a[0].length - 1
            const bIndex = b[0].length - 1
            for (let i = 0; i < a.length; i++) {
                a[i][aIndex].rightCell = b[last - i][bIndex];
                b[last - i][bIndex].rightCell = a[i][aIndex];
            }
        }
    }
}

function connectVerticalHorizontal(a, b, aIndex, bIndex, reverse= false) {
    if(aIndex===-1) aIndex = a[0].length - 1
    if(bIndex===-1) bIndex = b.length-1
    const last = b[bIndex].length-1
    for (let i = 0; i < a.length; i++) {
        const bCell = reverse?b[bIndex][last-i]:b[bIndex][i]
        const aCell = a[i][aIndex]

        if (aIndex === 0) {
            aCell.leftCell = bCell;
            if (bIndex === 0) bCell.upCell = aCell;
            else bCell.bottomCell = aCell;
        } else {
            aCell.rightCell = bCell;
            if (bIndex === 0) bCell.upCell = aCell;
            else bCell.bottomCell = aCell;
        }
    }
}


function generateMaze(width, height, depth){
    const sideWalls = Array.from({ length: 6 }, () => []);
    const sizes = [[width, height],[height, depth], [width, depth], [height, depth],[width, height], [width, depth] ]
    const sideOffsets = [[0,0], [height, -height], [height,0], [height,width], [depth+height,0], [depth+height+ height,0]]
    for (let i = 0; i < 6; i++){
        const size = sizes[i]
        const offset = sideOffsets[i]
        const offset_row = offset[0]
        const offset_col = offset[1]
        const walls = generateWalls(offset_row, offset_col, size[0],  size[1], i)
        sideWalls[i] = walls
    }

    // Combining and connecting walls and cells
    combineHorizontalWalls(sideWalls[2], sideWalls[0])
    combineHorizontalWalls(sideWalls[4], sideWalls[2])
    combineHorizontalWalls(sideWalls[5], sideWalls[4])
    combineHorizontalWalls(sideWalls[0], sideWalls[5])
    
    combineVerticalWalls(sideWalls[2], sideWalls[1])
    combineVerticalWalls(sideWalls[3], sideWalls[2])
    
    combineVerticalWalls(sideWalls[1], sideWalls[5], 0)
    combineVerticalWalls(sideWalls[3], sideWalls[5], -1)
    
    combineVerticalHorizontal(sideWalls[0], sideWalls[1], 0, 0)
    combineVerticalHorizontal(sideWalls[0], sideWalls[3], -1, 0, true)
    combineVerticalHorizontal(sideWalls[4], sideWalls[3],-1, -1)
    combineVerticalHorizontal(sideWalls[4], sideWalls[1], 0, -1, true)

    // Generating side cells
    const sideCells = Array.from({ length: 6 }, () => []);

    for (let i = 0; i < 6; i++) {
        const size = sizes[i];
        const cells = generateCells(sideWalls[i],  size[0], size[1], i);
        sideCells[i] = cells;
    }

    // Connecting side cells
    connectHorizontalCells(sideCells[2], sideCells[0]);
    connectHorizontalCells(sideCells[4], sideCells[2]);
    connectHorizontalCells(sideCells[5], sideCells[4]);
    connectHorizontalCells(sideCells[0], sideCells[5]);

    connectVerticalCells(sideCells[2], sideCells[1]);
    connectVerticalCells(sideCells[3], sideCells[2]);

    connectVerticalCells(sideCells[1], sideCells[5], 0);
    connectVerticalCells(sideCells[5], sideCells[3], -1);

    connectVerticalHorizontal(sideCells[0], sideCells[1], 0, 0);
    connectVerticalHorizontal(sideCells[0], sideCells[3], -1, 0, true);
    connectVerticalHorizontal(sideCells[4], sideCells[3], -1, -1);
    connectVerticalHorizontal(sideCells[4], sideCells[1], 0, -1, true);

    // Initiating DFS
    const startSide = 5; // or choose randomly: Math.floor(Math.random() * 6);
    const startRow = Math.floor(Math.random() * sideCells[startSide].length);
    const startCol = Math.floor(Math.random() * sideCells[startSide][0].length);

    const min_distances = new Map()
    const start = sideCells[startSide][startRow][startCol];
    dfs(start, min_distances);
    
    let max_distance = -Infinity;
    let end = null
    for(const [cell, min_distance] of min_distances){
        if (min_distance > max_distance) {
            max_distance = min_distance
            end = cell
        }
    }
    console.log("MAX DISTANCE: "+max_distance)
    console.log(sideWalls[5][sideWalls[5].length -2][sideWalls[5][sideWalls[5].length -2].length-1] === sideWalls[3][1][sideWalls[3][1].length-1])
    console.log(sideWalls[5][sideWalls[5].length -2][sideWalls[5][sideWalls[5].length -2].length-1])
    console.log(sideWalls[3][1][sideWalls[3][1].length-1])
        // const sideWalls = [[[[true, 5], [false, 5], [true, 5], [true, 5], [true, 5], [false, 5], [true, 5]], [[false, 1], [false, 0], [true, 0], [false, 0], [false, 0], [true, 0], [true, 0], [false, 3]], [[true, 0], [true, 0], [false, 0], [true, 0], [false, 0], [false, 0], [false, 0]], [[true, 1], [false, 0], [true, 0], [true, 0], [false, 0], [true, 0], [true, 0], [false, 3]], [[false, 0], [false, 0], [false, 0], [false, 0], [true, 0], [true, 0], [false, 0]], [[true, 1], [true, 0], [true, 0], [true, 0], [true, 0], [false, 0], [false, 0], [true, 3]], [[true, 0], [true, 0], [false, 0], [false, 0], [false, 0], [true, 0], [true, 0]], [[false, 1], [false, 0], [false, 0], [true, 0], [false, 0], [true, 0], [false, 0], [true, 3]], [[true, 0], [true, 0], [true, 0], [true, 0], [false, 0], [false, 0], [false, 0]], [[true, 1], [false, 0], [false, 0], [false, 0], [true, 0], [false, 0], [true, 0], [true, 3]], [[false, 0], [true, 0], [true, 0], [false, 0], [true, 0], [true, 0], [false, 0]], [[true, 1], [false, 0], [false, 0], [false, 0], [true, 0], [true, 0], [false, 0], [true, 3]], [[true, 0], [true, 0], [true, 0], [false, 0], [false, 0], [true, 0], [false, 0]], [[false, 1], [true, 0], [false, 0], [true, 0], [true, 0], [false, 0], [false, 0], [true, 3]], [[false, 0], [false, 0], [false, 0], [false, 0], [true, 0], [false, 0], [true, 0]]], [[[false, 1], [true, 1], [true, 1], [false, 1], [true, 1], [true, 1], [false, 1]], [[false, 5], [false, 1], [false, 1], [true, 1], [false, 1], [false, 1], [false, 1], [true, 1]], [[true, 1], [true, 1], [false, 1], [false, 1], [true, 1], [true, 1], [true, 1]], [[true, 5], [false, 1], [true, 1], [true, 1], [true, 1], [false, 1], [true, 1], [false, 1]], [[false, 1], [false, 1], [false, 1], [false, 1], [false, 1], [true, 1], [false, 1]], [[true, 5], [true, 1], [true, 1], [false, 1], [true, 1], [true, 1], [false, 1], [true, 1]], [[true, 1], [false, 1], [false, 1], [true, 1], [false, 1], [false, 1], [true, 1]], [[false, 5], [false, 1], [true, 1], [true, 1], [false, 1], [true, 1], [false, 1], [true, 1]], [[true, 1], [true, 1], [false, 1], [false, 1], [false, 1], [true, 1], [false, 1]], [[false, 5], [false, 1], [false, 1], [false, 1], [true, 1], [true, 1], [false, 1], [false, 1]], [[true, 1], [true, 1], [true, 1], [true, 1], [true, 1], [true, 1], [true, 1]], [[false, 5], [false, 1], [false, 1], [true, 1], [false, 1], [false, 1], [true, 1], [false, 1]], [[true, 1], [true, 1], [false, 1], [true, 1], [true, 1], [false, 1], [true, 1]], [[false, 5], [true, 1], [true, 1], [false, 1], [false, 1], [false, 1], [false, 1], [true, 1]], [[false, 1], [false, 1], [true, 1], [true, 1], [true, 1], [true, 1], [false, 1]]], [[[false, 0], [false, 0], [false, 0], [false, 0], [true, 0], [false, 0], [true, 0]], [[true, 1], [true, 2], [true, 2], [false, 2], [false, 2], [true, 2], [true, 2], [false, 2]], [[false, 2], [false, 2], [true, 2], [true, 2], [false, 2], [false, 2], [false, 2]], [[false, 1], [true, 2], [false, 2], [true, 2], [true, 2], [false, 2], [true, 2], [true, 2]], [[true, 2], [true, 2], [false, 2], [false, 2], [true, 2], [true, 2], [false, 2]], [[true, 1], [false, 2], [true, 2], [true, 2], [false, 2], [false, 2], [true, 2], [false, 2]], [[false, 2], [false, 2], [false, 2], [true, 2], [false, 2], [false, 2], [true, 2]], [[true, 1], [false, 2], [true, 2], [true, 2], [true, 2], [false, 2], [true, 2], [false, 2]], [[true, 2], [false, 2], [false, 2], [false, 2], [true, 2], [true, 2], [true, 2]], [[false, 1], [false, 2], [true, 2], [true, 2], [false, 2], [true, 2], [false, 2], [false, 2]], [[true, 2], [true, 2], [false, 2], [true, 2], [true, 2], [false, 2], [false, 2]], [[false, 1], [true, 2], [true, 2], [false, 2], [false, 2], [false, 2], [true, 2], [false, 2]], [[false, 2], [false, 2], [false, 2], [true, 2], [true, 2], [true, 2], [true, 2]], [[true, 1], [true, 2], [false, 2], [false, 2], [false, 2], [false, 2], [false, 2], [false, 2]], [[false, 2], [true, 2], [true, 2], [true, 2], [false, 2], [true, 2], [true, 2]]], [[[true, 3], [true, 3], [true, 3], [true, 3], [true, 3], [false, 3], [false, 3]], [[false, 2], [false, 3], [true, 3], [false, 3], [false, 3], [true, 3], [true, 3], [false, 5]], [[true, 3], [true, 3], [false, 3], [true, 3], [false, 3], [false, 3], [true, 3]], [[true, 2], [false, 3], [true, 3], [false, 3], [false, 3], [true, 3], [false, 3], [false, 5]], [[false, 3], [false, 3], [true, 3], [true, 3], [true, 3], [false, 3], [true, 3]], [[false, 2], [true, 3], [true, 3], [true, 3], [false, 3], [true, 3], [true, 3], [true, 5]], [[false, 3], [false, 3], [false, 3], [false, 3], [true, 3], [false, 3], [false, 3]], [[false, 2], [true, 3], [true, 3], [false, 3], [true, 3], [true, 3], [false, 3], [true, 5]], [[true, 3], [false, 3], [true, 3], [false, 3], [false, 3], [false, 3], [true, 3]], [[false, 2], [false, 3], [false, 3], [false, 3], [true, 3], [true, 3], [true, 3], [false, 5]], [[true, 3], [true, 3], [true, 3], [true, 3], [false, 3], [false, 3], [false, 3]], [[false, 2], [false, 3], [false, 3], [true, 3], [false, 3], [true, 3], [true, 3], [false, 5]], [[true, 3], [true, 3], [false, 3], [false, 3], [false, 3], [false, 3], [true, 3]], [[false, 2], [false, 3], [true, 3], [true, 3], [true, 3], [true, 3], [true, 3], [false, 5]], [[true, 3], [true, 3], [false, 3], [true, 3], [false, 3], [false, 3], [false, 3]]], [[[false, 2], [true, 2], [true, 2], [true, 2], [false, 2], [true, 2], [true, 2]], [[false, 1], [false, 4], [false, 4], [false, 4], [true, 4], [true, 4], [false, 4], [true, 3]], [[true, 4], [true, 4], [true, 4], [false, 4], [false, 4], [true, 4], [false, 4]], [[true, 1], [true, 4], [false, 4], [true, 4], [true, 4], [false, 4], [true, 4], [true, 3]], [[false, 4], [false, 4], [false, 4], [false, 4], [true, 4], [false, 4], [false, 4]], [[true, 1], [true, 4], [true, 4], [false, 4], [true, 4], [false, 4], [true, 4], [false, 3]], [[false, 4], [true, 4], [false, 4], [true, 4], [false, 4], [true, 4], [false, 4]], [[true, 1], [false, 4], [true, 4], [false, 4], [false, 4], [true, 4], [true, 4], [true, 3]], [[false, 4], [false, 4], [true, 4], [true, 4], [false, 4], [false, 4], [false, 4]], [[true, 1], [false, 4], [true, 4], [false, 4], [false, 4], [true, 4], [true, 4], [false, 3]], [[true, 4], [true, 4], [false, 4], [true, 4], [true, 4], [false, 4], [true, 4]], [[false, 1], [true, 4], [false, 4], [true, 4], [false, 4], [false, 4], [true, 4], [false, 3]], [[false, 4], [false, 4], [true, 4], [false, 4], [true, 4], [false, 4], [true, 4]], [[false, 1], [true, 4], [true, 4], [false, 4], [true, 4], [true, 4], [false, 4], [false, 3]], [[true, 4], [false, 4], [false, 4], [false, 4], [false, 4], [true, 4], [true, 4]]], [[[true, 4], [false, 4], [false, 4], [false, 4], [false, 4], [true, 4], [true, 4]], [[false, 5], [false, 5], [true, 5], [true, 5], [true, 5], [true, 5], [false, 5], [false, 5]], [[true, 5], [true, 5], [true, 5], [false, 5], [false, 5], [false, 5], [true, 5]], [[false, 5], [false, 5], [false, 5], [false, 5], [true, 5], [true, 5], [false, 5], [false, 5]], [[true, 5], [false, 5], [true, 5], [true, 5], [false, 5], [true, 5], [true, 5]], [[false, 5], [true, 5], [true, 5], [false, 5], [false, 5], [true, 5], [false, 5], [false, 5]], [[false, 5], [false, 5], [false, 5], [false, 5], [true, 5], [true, 5], [true, 5]], [[false, 5], [true, 5], [true, 5], [true, 5], [true, 5], [false, 5], [false, 5], [true, 5]], [[true, 5], [false, 5], [false, 5], [false, 5], [false, 5], [true, 5], [false, 5]], [[true, 5], [false, 5], [true, 5], [true, 5], [true, 5], [true, 5], [false, 5], [true, 5]], [[false, 5], [true, 5], [false, 5], [false, 5], [false, 5], [false, 5], [true, 5]], [[true, 5], [true, 5], [true, 5], [true, 5], [true, 5], [true, 5], [false, 5], [false, 5]], [[false, 5], [false, 5], [false, 5], [false, 5], [false, 5], [true, 5], [true, 5]], [[false, 5], [true, 5], [true, 5], [false, 5], [true, 5], [false, 5], [false, 5], [false, 5]], [[true, 5], [false, 5], [true, 5], [true, 5], [true, 5], [false, 5], [true, 5]]]]

        // for(let i = 0; i < sideWalls.length; i++){
        //     for(let j = 0; j < sideWalls[i].length; j++){
        //         for(let k = 0; k < sideWalls[i][j].length; k++){
        //             sideWalls[i][j][k] = new Wall({isRemoved: sideWalls[i][j][k][0], face: sideWalls[i][j][k][1]})
        //         }
        //     }
        // }
        // const sideCells = []
        
        // Printing visited cells
    // for (const side of sideCells) {
    //     for (const row of side) {
    //         for (const cell of row) {
    //             process.stdout.write(cell.isVisited ? "1 " : "0 ");
    //         }
    //         process.stdout.write("\n");
    //     }
    //     process.stdout.write("\n");
    // }
    
		console.log("START: "+ start.face +"," + start.position)
		console.log("END: "+ end.face +"," + end.position)
     return {sideCells, sideWalls, start, end}
}