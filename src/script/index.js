import "../scss/style.scss";
console.log("Hello webpack!");

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import {GUI} from 'three/examples/jsm/libs/dat.gui.module';


var camera, scene, renderer, controls;
var mesh;

const stats = Stats()
document.body.appendChild(stats.dom)

var group = new THREE.Group();
var colors = [0x0000ff, 0xff0000, 0x00ff00, 0xffffff];

let drawPyramid = () => {
    let level = 3;
    let height = 100;
    let distance = 60;
    let base  = 16;

    var texture = new THREE.TextureLoader().load( 'src/images/crate.gif' );
	var geometry = new THREE.BoxBufferGeometry( 20, 20, 20 );
	var material = new THREE.MeshBasicMaterial( { map: texture } );


    let memory = {}

    var last_node = 0
    for (let step = 0; step < level; step++) {
        console.log("step", step);
        var line_material = new THREE.LineBasicMaterial( { color: colors[step] } );
        if (step ==  0 && last_node == 0){
            let cube = new THREE.Mesh(geometry, material);
            let position = new THREE.Vector3(0, (level-(step+1)) * height, 0);
            cube.position.copy(position);
            last_node = 1;
            group.add(cube);
            memory[step] = [position];
            distance = distance / 2;
        }else {
            let node_count = last_node * 4;
            distance = (distance) * 2;
            memory[step] = [];
            for (let i = 0; i < memory[step-1].length; i++) {
                let position1 = new THREE.Vector3(memory[step-1][i].x, (level-(step+1)) * height, memory[step-1][i].z + distance);
                let position2 = new THREE.Vector3(memory[step-1][i].x + distance, (level-(step+1)) * height, memory[step-1][i].z);
                let position3 = new THREE.Vector3(memory[step-1][i].x, (level-(step+1)) * height, memory[step-1][i].z - distance);
                let position4 = new THREE.Vector3(memory[step-1][i].x - distance, (level-(step+1)) * height, memory[step-1][i].z);
                let cube1 = new THREE.Mesh(geometry, material);
                cube1.position.copy(position1);
                group.add(cube1);
                let cube2 = new THREE.Mesh(geometry, material);
                cube2.position.copy(position2);
                group.add(cube2);
                let cube3 = new THREE.Mesh(geometry, material);
                cube3.position.copy(position3);
                group.add(cube3);
                let cube4 = new THREE.Mesh(geometry, material);
                cube4.position.copy(position4);
                group.add(cube4);


                var positions = [position1, position2, position3, position4];
                memory[step] = memory[step].concat(positions);
            }
            for (let i = 0; i < memory[step-1].length; i++) {

                var line_geometry1 = new THREE.BufferGeometry().setFromPoints([ memory[step-1][i], position1 ]);
                var line1 = new THREE.Line( line_geometry1, line_material );
                group.add(line1);
                var line_geometry2 = new THREE.BufferGeometry().setFromPoints([ memory[step-1][i], position2 ]);
                var line2 = new THREE.Line( line_geometry2, line_material );
                group.add(line2);
                var line_geometry3 = new THREE.BufferGeometry().setFromPoints([ memory[step-1][i], position3 ]);
                var line3 = new THREE.Line( line_geometry3, line_material );
                group.add(line3);
                var line_geometry4 = new THREE.BufferGeometry().setFromPoints([ memory[step-1][i], position4 ]);
                var line4 = new THREE.Line( line_geometry4, line_material );
                group.add(line4);

                var line_geometry11 = new THREE.BufferGeometry().setFromPoints([ position1, position2 ]);
                var line11 = new THREE.Line( line_geometry11, line_material );
                group.add(line11);
                var line_geometry12 = new THREE.BufferGeometry().setFromPoints([ position2, position3 ]);
                var line12 = new THREE.Line( line_geometry12, line_material );
                group.add(line12);
                var line_geometry13 = new THREE.BufferGeometry().setFromPoints([ position3, position4 ]);
                var line13 = new THREE.Line( line_geometry13, line_material );
                group.add(line13);
                var line_geometry14 = new THREE.BufferGeometry().setFromPoints([ position4, position1 ]);
                var line14 = new THREE.Line( line_geometry14, line_material );
                group.add(line14);

            }
            last_node = node_count;
        }
    }
    console.log(memory);
}

let drawPyramidNew = () => {
    let level = 4;
    let total_level = 4;
    let height = 100;
    let distance = 60;
    let base  = 64;

    var geometry = new THREE.SphereBufferGeometry( 5, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );


    let memory = {}
    let xstart = 0, zstart = 0;
    while (level > 0) {
        let base_row = Math.sqrt(base);
        // console.log("base_row", base_row);
        memory[level] = []
        for (let z = 0; z < base_row; z++) {
            for (let x = 0; x < base_row; x++) {
                let position = new THREE.Vector3((x*distance)+xstart, (total_level-level) * height, (z*distance)+zstart);
                // console.log(x, z, position);
                memory[level].push(position);
            }
        }
        // rearrange points
        // center point to shift
        xstart = xstart + 30;
        zstart = zstart + 30;
        // console.log("mem", memory, memory);
        level = level-1;
        base = base/4;
    }


    // connect lines and rearrange points
    let cube1 = new THREE.Mesh(geometry, material);
    cube1.position.copy(memory[1][0]);
    console.log(memory);
    group.add(cube1);
    let lev = 1;
    while (lev < total_level) {
        var line_material = new THREE.LineBasicMaterial( { color: colors[lev] } );
        let base_row = Math.sqrt(memory[lev+1].length);
        let slow = 0;
        let fast = slow + 1;
        let reset_count = 0;
        let last_slow = slow;

        //first link all equal level nodes
        for (let i = 0; i < base_row ; i++) {
            let point_index = 0
            let pos = [];
            // console.log("break");
            for (let j = 0; j < base_row ; j++) {
                // console.log("position", i , point_index+i,  memory[lev+1][point_index+i]);
                pos.push(memory[lev+1][point_index+i]);
                point_index  = point_index + base_row;
            }
            // console.log("pos", pos);
            var line_geometry11 = new THREE.BufferGeometry().setFromPoints(pos);
            var line11 = new THREE.Line( line_geometry11, line_material );
            group.add(line11);
        }
        //column connect
        let point_index = 0
        for (let i = 0; i < base_row ; i++) {
            let pos = [];
            for (let j = 0; j < base_row ; j++) {
                pos.push(memory[lev+1][point_index+j]);
            }
            point_index  = point_index + base_row;
            var line_geometry11 = new THREE.BufferGeometry().setFromPoints(pos);
            var line11 = new THREE.Line( line_geometry11, line_material );
            group.add(line11);
        }
        console.log("------------");

        for (let i = 0; i < memory[lev+1].length / 4; i++) {
            let position1 = memory[lev+1][slow];
            let position2 = memory[lev+1][slow + base_row];
            let position3 = memory[lev+1][fast + base_row];
            let position4 = memory[lev+1][fast];

            console.log("pos", slow+1, fast+1, slow+base_row+1, fast+base_row+1);

            let cube1 = new THREE.Mesh(geometry, material );
            cube1.position.copy(position1);
            group.add(cube1);
            let cube2 = new THREE.Mesh(geometry, material);
            cube2.position.copy(position2);
            group.add(cube2);
            let cube3 = new THREE.Mesh(geometry, material);
            cube3.position.copy(position3);
            group.add(cube3);
            let cube4 = new THREE.Mesh(geometry, material);
            cube4.position.copy(position4);
            group.add(cube4);


            //connect all these four points to respective index points

            var line_geometry1 = new THREE.BufferGeometry().setFromPoints([ memory[lev][i], position1 ]);
            var line1 = new THREE.Line( line_geometry1, line_material );
            group.add(line1);
            var line_geometry2 = new THREE.BufferGeometry().setFromPoints([ memory[lev][i], position2 ]);
            var line2 = new THREE.Line( line_geometry2, line_material );
            group.add(line2);
            var line_geometry3 = new THREE.BufferGeometry().setFromPoints([ memory[lev][i], position3 ]);
            var line3 = new THREE.Line( line_geometry3, line_material );
            group.add(line3);
            var line_geometry4 = new THREE.BufferGeometry().setFromPoints([ memory[lev][i], position4 ]);
            var line4 = new THREE.Line( line_geometry4, line_material );
            group.add(line4);

            reset_count = reset_count + 1;
            //reset slow fast after every current / 2
            if (Math.sqrt(memory[lev].length) == reset_count){
                console.log("reset", (memory[lev].length), Math.sqrt(memory[lev].length), reset_count);
                slow = last_slow + (Math.sqrt(memory[lev+1].length) * 2);
                fast = slow + 1;
                last_slow = slow;
                reset_count = 0;
            }else{
                slow = slow + 2;
                fast = slow + 1;
            }

        }
        lev = lev + 1;
    }

}

init();
// scene.add(group);
drawPyramidNew();
animate();


function init() {

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.z = 400;

	scene = new THREE.Scene();



	// mesh = new THREE.Mesh( geometry, material );
	// scene.add( group );

	// renderer = new THREE.WebGLRenderer( { antialias: false } );
	// renderer.setPixelRatio( window.devicePixelRatio );
	// renderer.setSize( window.innerWidth, window.innerHeight );
	// document.body.appendChild( renderer.domElement );
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls( camera, renderer.domElement );
    controls.update();

	//

	window.addEventListener( 'resize', onWindowResize, false );

    const gui = new GUI()
    // const cubeFolder = gui.addFolder("Cube")
    // cubeFolder.add(cube.rotation, "x", 0, Math.PI * 2, 0.01)
    // cubeFolder.add(cube.rotation, "y", 0, Math.PI * 2, 0.01)
    // cubeFolder.add(cube.rotation, "z", 0, Math.PI * 2, 0.01)
    // cubeFolder.open()
    const cameraFolder = gui.addFolder("Camera")
    cameraFolder.add(camera.position, "z", 0, 10, 0.01)
    cameraFolder.open()

    const params = {
        "Base size": 64
    }
    gui.add(params, "Base size").onFinishChange(function (value) {
        //validate power of 4
        if (Number.isInteger(getBaseLog(4, value))) {

        }else{
            alert("Not a valid base size")
        }
    });

}

function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}


function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
    controls.update();
    stats.update()
}
