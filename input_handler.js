export function initializeInputHandler(maze, scene) {
    let input_width = maze.width
    let input_height = maze.height
    let input_depth = maze.depth
    $(document).ready(function() {
        $('#cube-width-value').text(maze.width);
        $('#cube-height-value').text(maze.height);
        $('#cube-depth-value').text(maze.depth);

        // $('#bevel-radius').prop('checked', maze.bevel_enabled);
        // $('#bevel-radius-value').text(maze.radiusPercent);
        $('#wall-thickness-value').text(maze.wall_thickness);
        $('#cell-size-value').text(maze.cell_size);
        $('#wall-height-value').text(maze.wall_height);
        $('#cube-color').val(maze.color);

        // $('#bevel-radius').val(maze.radiusPercent);
        $('#wall-thickness').val(maze.wall_thickness);
        $('#cell-size').val(maze.cell_size);
        $('#wall-height').val(maze.wall_height);
        $('#cube-height').val(maze.height);
        $('#cube-width').val(maze.width);
        $('#cube-depth').val(maze.depth);

        $('#bevel-enabled').prop('checked', !maze.bevel_enabled);


        $('#settings-icon').on('click', function() {
            $('#ui-container').toggleClass('hidden');
            $('#ui-container').toggleClass('show');
        });

        $('#cube-width, #cube-height, #cube-depth').on('input', function() {
            input_width = parseFloat($('#cube-width').val());
            input_height = parseFloat($('#cube-height').val());
            input_depth = parseFloat($('#cube-depth').val());

            $('#cube-width-value').text(input_width);
            $('#cube-height-value').text(input_height);
            $('#cube-depth-value').text(input_depth);

        });

        $('#radius, #wall-thickness, #cell-size, #cube-color').on('input', function() {
            // maze.radiusPercent = parseFloat($('#radius').val());
            maze.wall_thickness = parseFloat($('#wall-thickness').val());
            maze.cell_size = parseFloat($('#cell-size').val());
            maze.color = $('#cube-color').val();
            maze.wall_height = maze.cell_size;

            // $('#radius-value').text(maze.radiusPercent);
            $('#wall-thickness-value').text(maze.wall_thickness);
            $('#cell-size-value').text(maze.cell_size);

        });

        $('#bevel-enabled').on('change', function() {
            maze.bevelEnabled = $('#bevel-enabled').prop('checked');
        });

        $('#generate-btn').on('click', function() {
            if (input_width != maze.width || input_height != maze.height || input_depth != maze.depth) {
                maze.width = input_width;
                maze.height = input_height;
                maze.depth = input_depth;
                maze.updateMaze();
                maze.updateModel(scene);
            } else {
                maze.updateModel(scene)
            }
        });
        $('#colorful').on('change', function() {
            maze.colorful = $('#colorful').prop('checked');
        });
    });
}