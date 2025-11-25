//laser cut drawer/box
//
// v0 by t b mosich
//
// jscad v2 script for generating reinforced drawers or boxes for laser cutting
// example script; work in progress; code is not exemplary
//


const { cuboid, cylinder, roundedRectangle } = require('@jscad/modeling').primitives
    const { rotate, translate, scale } = require('@jscad/modeling').transforms
    const { project, extrudeLinear } = require('@jscad/modeling').extrusions
    const { degToRad } = require('@jscad/modeling').utils
    const { subtract, union, scission } = require('@jscad/modeling').booleans
    const { colorize, hslToRgb, colorNameToRgb, hexToRgb, hsvToRgb, CSG, CAG } = require('@jscad/modeling').colors

function create_rect(length, width, thickness) {
    return cuboid({
        size: [length, width, thickness]
    });
}

function create_colored_rect(length, width, thickness, color_value) {
    return colorize(colorNameToRgb(color_value), create_rect(length, width, thickness));
}

function make_pegs(length, width, peg_width, thickness, num_pegs, kerf, reinforce) {
    const pegs = [];
    const spacing = ((length) - num_pegs * peg_width+reinforce/2) / (num_pegs + 1);

    for (let i = 0; i < num_pegs; i++) {
        let peg = cuboid({
            size: [peg_width + kerf, width, thickness]
        });

        const x = spacing * (i + 1) + (peg_width-reinforce/2) * i;
        peg = translate([x, 0, 0], peg);

        pegs.push(peg);
    }
peggers=union(...pegs);
    return peggers;
}


function make_pegs_extra(length, width, peg_width, thickness, num_pegs, kerf, pegx_width) {
    const pegs = [];
    const spacing = (length - num_pegs * peg_width) / (num_pegs + 1);

    for (let i = 0; i < num_pegs; i++) {
        let peg = cuboid({
            size: [pegx_width + kerf, width, thickness]
        });

        const x = spacing * (i + 1) + peg_width * i;
        peg = translate([x, 0, 0], peg);

        pegs.push(peg);
    }

peggers=union(...pegs);
    return peggers;
}


function make_peg_slots(length, width, peg_width, thickness, num_pegs, kerf,
                        plate_thickness, cutout_width, reinforce) {

    // --- MAIN PEGS ---
    let pegs = make_pegs(
        length,
        width + reinforce,
        peg_width + reinforce,
        thickness,
        num_pegs,
        kerf,
      reinforce
    )
    pegs = translate([reinforce / 2, 0, 0], pegs)   // center correction


    // --- SLOT CUTOUTS ---
    let cutout = make_pegs_extra(
        length,
        thickness,
        peg_width,
        thickness + 6,
        num_pegs,
        0,
        cutout_width
    )

    let cutout2 = translate([0, -width / 2 + thickness / 2 + thickness, 0], cutout);
    cutout = translate([0, width / 2 - thickness / 2 - thickness, 0], cutout);
    cutout = union(cutout, cutout2);
    pegs = subtract(pegs, cutout);

    return pegs
}


function create_bottom_with_slot(length, width, thickness, num_pegs, peg_width, kerfy, plate_thickness, girder_width, reinforce) {

    let bot_plate = cuboid({
        size: [length, width, thickness]
    });
    let bot_fingers = union(make_pegs((length - 2 * thickness), (width + 2 * thickness), peg_width, thickness, num_pegs, kerfy, reinforce));
  bot_fingers = translate([ - (length - 2 * thickness) / 2 + peg_width / 2, 0, 0], bot_fingers);
    bottom = union(bot_plate, bot_fingers);

    let bot_finger_slots = make_peg_slots(width, length + plate_thickness + thickness + 4 * thickness, girder_width + 2 * thickness, thickness, 1, kerfy * 1, plate_thickness, girder_width, reinforce);
    bot_finger_slots = rotate([0, 0, degToRad(90)], bot_finger_slots)
        bot_finger_slots = translate([plate_thickness / 2 - thickness / 2, -width / 2 + girder_width / 2 + thickness, 0], bot_finger_slots);

    bottom = union(bottom, bot_finger_slots);
    return bottom;
}

function create_bottom_with_tab(length, width, thickness, num_pegs, peg_width, kerfy, plate_thickness, girder_width, reinforce) {

    let bot_plate = cuboid({
        size: [length, width, thickness]
    });
    let bot_fingers = union(make_pegs(length - 2 * thickness, width + 2 * thickness, peg_width, thickness, num_pegs, kerfy, 0));
    bot_fingers = translate([ - (length - 2 * thickness) / 2 + peg_width / 2, 0, 0], bot_fingers);
    bottom = union(bot_plate, bot_fingers);

    let bot_finger_slots = union(make_pegs(width, length +1* plate_thickness + 1*thickness + 0 * thickness, peg_width, thickness, num_pegs, kerfy, 0));
    bot_finger_slots = rotate([0, 0, degToRad(90)], bot_finger_slots)
        bot_finger_slots = translate([plate_thickness / 2 - thickness / 2, -width / 2 + peg_width / 2, 0], bot_finger_slots);

    bottom = union(bottom, bot_finger_slots);
    return bottom;
}

function create_side(length, width, thickness, kerf, plate_thickness, girder_width, offset, reinforce) {

    //let side_plate = create_colored_rect(length, width, thickness, "teal");
    
        let side_plate = cuboid({
        size: [length, width, thickness]
    });

    let side_finger_slots = make_peg_slots(width, length + plate_thickness + thickness + 4 * thickness, girder_width + 2 * thickness, thickness, 2, kerf, plate_thickness, girder_width,reinforce);
    side_finger_slots = rotate([0, 0, degToRad(90)], side_finger_slots)
        side_finger_slots = translate([plate_thickness / 2 - thickness / 2, -width / 2 + girder_width / 2 + thickness - offset, 0], side_finger_slots);

    side = union(side_plate, side_finger_slots);
    return side;
}

function create_side_girder(length, width, thickness, kerf, plate_thickness, girder_width, offset) {

    //let side_plate = create_colored_rect(length, width, thickness, "teal");

    let side_finger_slots = union(make_peg_slots_girders(width, length + plate_thickness + thickness + 4 * thickness, girder_width + 2 * thickness, thickness, 2, kerf, plate_thickness, girder_width + kerf));
    side_finger_slots = rotate([0, 0, degToRad(90)], side_finger_slots)
        side_finger_slots = translate([plate_thickness / 2 - thickness / 2, -width / 2 + girder_width / 2 + thickness - offset, 0], side_finger_slots);

    side = union(side_finger_slots);
    return side;
}

function make_peg_slots_girders(length, width, peg_width, thickness, num_pegs, kerf, plate_thickness, cutout_width) {
    //let pegs = make_pegs(length, width, peg_width, thickness, num_pegs, kerf);
    //pegs = union(pegs);

    let cutout = make_pegs_extra(length, thickness, peg_width, 1, num_pegs, kerf, cutout_width);

    let cutout2 = translate([0, -width / 2 + thickness / 2 + thickness, 0], cutout);
    cutout = translate([0, width / 2 - thickness / 2 - thickness, 0], cutout);
    cutout = union(cutout, cutout2);
    //pegs = subtract(pegs, cutout);

    return cutout;
}

function create_front(length, width, thickness, radius) {

    let front_plate = roundedRectangle({
        size: [length, width],
        roundRadius: radius
    });
    front_plate = extrudeLinear({
        height: thickness
    }, front_plate);

    return front_plate;
}


function buildBottoms(params) {
    const {
        design_type,
        inside_length,
        inside_width,
        material_thickness,
        num_fingers,
        width_fingers,
        kerf,
        plate_thickness,
        girder_width,
      bracket_reinforce
    } = params

    const maker =
        (design_type === 1)
            ? create_bottom_with_slot
            : create_bottom_with_tab

    let bottom_raw = maker(
        inside_length,
        inside_width,
        material_thickness,
        num_fingers,
        width_fingers,
        0,
        plate_thickness,
        girder_width,
      bracket_reinforce
    )

    let bottom_kerf = maker(
        inside_length,
        inside_width,
        material_thickness,
        num_fingers,
        width_fingers,
        kerf,
        plate_thickness,
        girder_width,
      bracket_reinforce
    )

return {bottom_raw, bottom_kerf}
}



function buildSideBase(params) {
    const {
        inside_length,
        inside_height,
        material_thickness,
        kerf,
        plate_thickness,
        girder_width,
        side_bracket_offset,
      bracket_reinforce
    } = params

    let s = create_side(
        inside_length,
        inside_height + 2 * material_thickness,
        material_thickness,
        kerf,
        plate_thickness,
        girder_width,
        side_bracket_offset,
      bracket_reinforce
    )

    // orient vertically
    s = rotate([degToRad(90), 0, 0], s)
    s = rotate([degToRad(180), 0, 0], s)

    return s
}

function buildSides(params, bottom) {

    const {
        inside_length,
        inside_height,
        inside_width,
        material_thickness,
        kerf,
        plate_thickness,
        girder_width,
        side_bracket_offset,
      bracket_reinforce
    } = params

    // --- RAW SIDES ---
    let side1 = create_side(
        inside_length,
        inside_height + 2 * material_thickness,
        material_thickness,
        0,                      // no kerf
        plate_thickness,
        girder_width,
        side_bracket_offset,
      bracket_reinforce
    )
    side1 = rotate([degToRad(90), 0, 0], side1)
    side1 = rotate([degToRad(180), 0, 0], side1)
    side1 = translate(
        [0, inside_width / 2 + material_thickness / 2,
            inside_height / 2 - 2 * material_thickness],
        side1
    )
    side1 = subtract(side1, bottom)

    let side2 = translate(
        [0, -inside_width - material_thickness, 0],
        side1
    )

    // --- KERF SIDES ---
    let side1k = create_side(
        inside_length,
        inside_height + 2 * material_thickness,
        material_thickness,
        kerf,                   // <--- kerf version
        plate_thickness,
        girder_width,
        side_bracket_offset,
      bracket_reinforce
    )
    side1k = rotate([degToRad(90), 0, 0], side1k)
    side1k = rotate([degToRad(180), 0, 0], side1k)
    side1k = translate(
        [0, inside_width / 2 + material_thickness / 2,
            inside_height / 2 - 2 * material_thickness],
        side1k
    )
    side1k = subtract(side1k, bottom)

    let side2k = translate(
        [0, -inside_width - material_thickness, 0],
        side1k
    )

    return {
        side1,   // raw
        side2,   // raw
        side1k,  // kerf
        side2k   // kerf
    }
}



function buildFront(params, bottom, side1, side2) {
    let front = create_front(params.plate_width, params.plate_height, params.plate_thickness, params.plate_corner_radius);
    front = rotate([degToRad(90), 0, degToRad(90)], front);
    front = translate([params.inside_length / 2, 0, params.plate_height / 3 + params.plate_vert_offset], front);
    front = subtract(front, bottom);
    front = subtract(front, side1);
    front = subtract(front, side2);
    return front;
}

function buildBack(params, bottom, side1, side2) {
    let back = create_front(
        params.inside_width + 4 * params.material_thickness,
        params.inside_height + params.material_thickness,
        params.material_thickness,
        0
    );
    back = rotate([degToRad(90), 0, degToRad(90)], back);
    back = translate(
        [-params.inside_length / 2 - params.material_thickness, 0, params.inside_height / 2 - 1.5 * params.material_thickness],
        back
    );
    back = subtract(back, bottom);
    back = subtract(back, side1);
    back = subtract(back, side2);
    return back;
}

function buildGirders(params) {
    let girder = create_side_girder(
        params.inside_length,
        params.inside_height + 2 * params.material_thickness,
        params.material_thickness,
        params.kerf,
        params.plate_thickness,
        params.girder_width,
        params.side_bracket_offset
    );
    girder = scale([1, 1, params.inside_width + 4 * params.material_thickness], girder);
    girder = rotate([degToRad(90), 0, 0], girder);
    girder = rotate([degToRad(180), 0, 0], girder);
    girder = translate([0, params.inside_width / 2 + params.material_thickness / 2, params.inside_height / 2 - 2 * params.material_thickness], girder);
    girder = translate([0, -params.inside_width / 2 - params.material_thickness / 2, 0], girder);
    return girder;
}

// -------------------------------------------------------
// Main
// -------------------------------------------------------

function main(params) {

    // base dimensions
    let inside_width = params.inside_width
        let inside_length = params.inside_length
        let inside_height = params.inside_height
        let material_thickness = params.material_thickness

        // front plate (different material)
        let plate_width = params.plate_width
        let plate_height = params.plate_height
        let plate_thickness = params.plate_thickness
        let plate_vert_offset = params.plate_vert_offset
        let plate_corner_radius = params.plate_corner_radius

        // joinery + settings
        let kerf = params.kerf
        let num_fingers = params.num_fingers
        let width_fingers = params.width_fingers
        let girder_width = params.girder_width
        let side_bracket_offset = params.side_bracket_offset
        let  bracket_reinforce = params.bracket_reinforce

        // view transform
        let model_view = params.model_view
        let design_type = params.design_type


let { bottom_raw: bottom, bottom_kerf: bottom_kerf} = buildBottoms(params)

let { side1: side1, side2: side2, side1k: side1_kerf, side2k: side2_kerf} = buildSides(params, bottom)

const front = buildFront(params, bottom, side1, side2)

const back = buildBack(params, bottom, side1, side2)


    const girder = buildGirders(params)


    let girders = scission(girder) // split to array
        girders = girders.map((p, i) =>
            colorize(colorNameToRgb(['red', 'brown', 'crimson', 'darkred'][i]), p));

   side1_kerf = rotate([degToRad(-90), 0, 0], side1_kerf)
   side2_kerf = rotate([degToRad(-90), 0, 0], side2_kerf)
    side1_kerf = translate([0, inside_width * 1.5, 0], side1_kerf);
    side2_kerf = translate([0, inside_width * 2.5, 0], side2_kerf);

    let W = girder_width + kerf;
    let extra_offset = 0;

    // Base girder
    let bottom_girder = cuboid({
        size: [W + side_bracket_offset + extra_offset, W, material_thickness]
    });

    // Rotated diamond piece
    let bottom_girder_part = cuboid({
        size: [W / 1.414, W / 1.414, material_thickness]
    });
    bottom_girder_part = rotate([0, 0, degToRad(45)], bottom_girder_part);

    // --- Correct placement that works for ALL offsets ---
    const girder_len = W + side_bracket_offset / 2 + extra_offset / 2;
    const overhang = W / 2;

    const tx = girder_len - overhang; // stable, correct for all values
    const ty = 0;
    const tz = 0;

    bottom_girder_part = translate([tx, ty, tz], bottom_girder_part);

    bottom_girder = union(bottom_girder_part, bottom_girder)
        bottom_girder = rotate([0, degToRad(90), 0], bottom_girder)
        bottom_girder = rotate([0, degToRad(180), 0], bottom_girder)
        bottom_girder = translate([inside_length * 0.5 + plate_thickness + material_thickness / 2, 0, 0], bottom_girder)
        bottom_girder = translate([0, 0, material_thickness * 2.5], bottom_girder)
        bottom_girder = colorize(colorNameToRgb('blueviolet'), bottom_girder);

    if (model_view === 1) {
bottom = colorize(colorNameToRgb('yellow'), bottom);
side1 = colorize(colorNameToRgb('teal'), side1);
side2 = colorize(colorNameToRgb('teal'), side2);
        return [bottom, side1, side2, front, back, girders]

    } else if (model_view === 2) {
        back2d = rotate([0, degToRad(-90), 0], back)
        back2d = translate([-inside_width * 2.5, 0, 0], back2d);
        front2d = rotate([0, degToRad(-90), 0], front)
        front2d = translate([-inside_width * 2.5, plate_width * 1.5, 0], front2d);

       girder2d = rotate([0, degToRad(-90), 0], girder);
       girder2d = translate([0, -inside_width * 2.5, 0], girder2d);
       // return project({}, bottom_kerf, side1_kerf, side2_kerf, front, back, girders)
       return project({}, bottom_kerf, front2d, back2d, girder2d, side1_kerf, side2_kerf)
    }

}

// -------------------------------------------------------
// Parameters for UI
// -------------------------------------------------------


function getParameterDefinitions() {
    return [{
            name: 'model_view',
            type: 'choice',
            caption: 'Model view:',
            values: [1, 2],
            captions: ['3D view', '2D flattened'],
            initial: 1
        }, {
            name: 'design_type',
            type: 'choice',
            caption: 'design type:',
            values: [1, 2, 3],
            captions: ['drawer 1', 'drawer 2', 'box 3'],
            initial: 2
        },{
            name: 'inside_width',
            type: 'number',
            caption: 'Inside Width',
        default:
            100
        }, {
            name: 'inside_length',
            type: 'number',
            caption: 'Inside Length',
        default:
            150
        }, {
            name: 'inside_height',
            type: 'number',
            caption: 'Inside Height',
        default:
            80
        }, {
            name: 'material_thickness',
            type: 'number',
            caption: 'Material Thickness',
        default:
            3
        }, {
            name: 'plate_width',
            type: 'number',
            caption: 'Front Plate Width',
        default:
            130
        }, {
            name: 'plate_height',
            type: 'number',
            caption: 'Front Plate Height',
        default:
            110
        }, {
            name: 'plate_thickness',
            type: 'number',
            caption: 'Front Plate Thick.',
        default:
            6
        }, {
            name: 'plate_vert_offset',
            type: 'number',
            caption: 'Front Plate vert Offset',
        default:
            0
        }, {
            name: 'plate_corner_radius',
            type: 'number',
            caption: 'Front Plate Corner Radius',
        default:
            20
        }, {
            name: 'kerf',
            type: 'number',
            caption: 'Kerf mm',
        default:
            0.10,
            min: 0,
            step: 0.05
        }, {
            name: 'num_fingers',
            type: 'number',
            caption: 'Finger Count bottom',
        default:
            2
        }, {
            name: 'width_fingers',
            type: 'number',
            caption: 'finger width mm',
        default:
            30
        }, {
            name: 'girder_width',
            type: 'number',
            caption: 'girder width mm',
        default:
            15
        }, {
            name: 'side_bracket_offset',
            type: 'number',
            caption: 'side bracket offset mm',
        default:
            8
        }, {
            name: 'bracket_reinforce',
            type: 'number',
            caption: 'bracket extra mm',
        default:
            3
        }
    ]
}

module.exports = {
    main,
    getParameterDefinitions
}
