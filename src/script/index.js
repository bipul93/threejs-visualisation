import "../scss/style.scss";

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import {GUI} from 'three/examples/jsm/libs/dat.gui.module';


var camera, scene, renderer, controls;
var mesh;

const stats = Stats()
document.body.appendChild(stats.dom)

var group = new THREE.Group();
var colors = [0xffffff, 0xff0000, 0x00ff00, 0xffff00, 0x0000ff];

let drawPyramid = (base_size, pow) => {
    let level = pow;
    let total_level = pow;
    let height = 100;
    let distance = 60;
    let base = base_size;

    var geometry = new THREE.SphereBufferGeometry( 5, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0xffffff} );


    let memory = {}
    let xstart = 0, zstart = 0;
    while (level > 0) {
        let base_row = Math.sqrt(base);
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
        xstart = xstart + (30 * (level))-30;
        zstart = zstart + (30 * (level))-30;
        level = level-1;
        base = base/4;
    }


    // connect lines and rearrange points
    let cube1 = new THREE.Mesh(geometry, material);
    cube1.position.copy(memory[1][0]);
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
            for (let j = 0; j < base_row ; j++) {
                pos.push(memory[lev+1][point_index+i]);
                point_index  = point_index + base_row;
            }
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

        for (let i = 0; i < memory[lev+1].length / 4; i++) {
            let position1 = memory[lev+1][slow];
            let position2 = memory[lev+1][slow + base_row];
            let position3 = memory[lev+1][fast + base_row];
            let position4 = memory[lev+1][fast];

            // console.log("pos", slow+1, fast+1, slow+base_row+1, fast+base_row+1);

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
            if (Math.sqrt(memory[lev].length) == reset_count){
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
    new THREE.Box3().setFromObject( group ).getCenter( group.position ).multiplyScalar( - 1 );
    scene.add(group);
}

init();
animate();


function init() {
    scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 5000 );
	// camera.position.z = 800;
    camera.position.set(487.1742857817705, 400.75708837286686, 491.9908244997268);


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
    const params = {
        "Base size": 16,
        "antialiasing": false
    }
    let prev_val = 16;
    let controller = gui.add(params,'Base size').name('Base size');
    controller.onChange(function (value) {
        //validate power of 4
        let pow = getBaseLog(4, value);
        if (Number.isInteger(pow) && value != prev_val) {
            scene.remove(group);
            group = new THREE.Group();
            drawPyramid(value, pow + 1);
            prev_val = value;
        }else{
            console.log("Not a valid base size");
            controller.setValue(prev_val);
        }
    });

    // let hideBarsController = gui.add(params,'antialiasing').name('antialiasing').listen();
    // hideBarsController.onChange(function(newValue) {
    //     renderer.antialias = newValue;
    // });

    drawPyramid(16, 3);
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
    stats.update();
}
