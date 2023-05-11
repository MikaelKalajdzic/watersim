import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Water } from 'three/examples/jsm/objects/Water.js';

// Sets the renderer to fit the whole screen
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);

// Injecting space we created into the page 
document.body.appendChild(renderer.domElement);

// Sets the color of the background
renderer.setClearColor(0xDDDDDD);

// Creating the scene
const scene = new THREE.Scene();

// Creating a perspective camera for the scene
const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// Sets orbit control to move the camera around
const orbit = new OrbitControls(camera, renderer.domElement);

// Camera positioning
camera.position.set(6, 8, 14);
orbit.update();

// ====== For Debugging Pruposes ======

// Sets a 12 by 12 gird helper
const gridHelper = new THREE.GridHelper(12, 12);
scene.add(gridHelper);

// Sets the x, y, and z axes with each having a length of 4
const axesHelper = new THREE.AxesHelper(4);
scene.add(axesHelper);

// ====================================

function animate(time) {
    // Rendering the scene along with its camera
    renderer.render(scene, camera);

    // Spotlight animation
    animateSpotlight();

    // Adding rotation to the box
    rotateBox(time);

    // Adding bounce effect on sphere
    bounceSphere();

    // Update water material
    //waterMaterial.uniforms.time.value = time * 0.001;
}

renderer.setAnimationLoop(animate);

// For resizing window
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ============== GUI parameters ============== */

const gui = new dat.GUI();

const options = {
    sphereColor: '#ffea00',
    wireframe: false, // to see geometry
    speed: 0.01,
    angle: 0.2,
    penumbra: 0,
    intensity: 1
};

// for sphere object
gui.addColor(options, 'sphereColor').onChange(function(e){
    sphere.material.color.set(e);
});
gui.add(options, 'wireframe').onChange(function(e){
    sphere.material.wireframe = e;
});
gui.add(options, 'speed', 0, 0.1);

let step = 0;
function bounceSphere() {
    step += options.speed;
    sphere.position.y = 10 * Math.abs(Math.sin(step))
}

gui.add(options, 'angle', 0, 1);
gui.add(options, 'penumbra', 0, 1);
gui.add(options, 'intensity', 0, 1);


/* ============== Lights ============== */

/* ===== Adding ambient light to the scene ===== */
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

// /* ===== Adding directional light to the scene ===== */
// const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.7);
// scene.add(directionalLight);
// directionalLight.position.set(-30, 50, 0);
// directionalLight.shadow.camera.bottom = -25;

// // enabling shadow casting
// directionalLight.castShadow = true;

// // Sets a helper for directional light
// const dLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
// scene.add(dLightHelper);

// const dLightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
// scene.add(dLightShadowHelper);

/* ===== Adding spotlight light to the scene ===== */
const spotLight = new THREE.SpotLight(0xFFFFFF);
scene.add(spotLight);
spotLight.position.set(-100, 100, 0);
spotLight.castShadow = true;
spotLight.angle = 0.2;

// Sets a helper for spotlight light
const sLightHelper = new THREE.SpotLightHelper(spotLight);
scene.add(sLightHelper);

// Animation for spolight
function animateSpotlight() {
    spotLight.angle = options.angle
    spotLight.penumbra = options.penumbra
    spotLight.intensity = options.intensity

    // updating the helper object
    sLightHelper.update();
}


/* ============== Shadows ============== */

// Enabling the shadows im the renderer
renderer.shadowMap.enabled = true;



/* ============== Objects ============== */

/* ===== Adding a box to the scene ===== */
const boxGeometry = new THREE.BoxGeometry();
const boxMaterial = new THREE.MeshBasicMaterial({color: 0x00FF00});
const box = new THREE.Mesh(boxGeometry, boxMaterial);
scene.add(box);

// function to rotate the box
function rotateBox(time) {
    box.rotation.x = time / 1000;
    box.rotation.y = time / 1000;
} 


/* ===== Adding a plane to the scene ===== */
// const planeGeometry = new THREE.PlaneGeometry(30, 30);
// const planeMaterial = new THREE.MeshStandardMaterial({
//     color: 0xFFFFFF,
//     side: THREE.DoubleSide
// });
// const plane = new THREE.Mesh(planeGeometry, planeMaterial);
// scene.add(plane);
// // Rotate plane so it is horizontal
// plane.rotation.x = -0.5 * Math.PI;
// // Enabling shadows on the plane
// plane.receiveShadow = true;

/* ===== Adding a sphere to the scene ===== */
const sphereGeometry = new THREE.SphereGeometry(4, 50, 50); // higher the number are, the more faces we have - note some of will appear black, beacuse they need a light source
const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0x0000FF,
    wireframe: false // when set to true, we can see the geometry of the sphere 
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
//scene.add(sphere);
sphere.position.set(-10, 10, 0);

// Enabling shadows on the shpere (cast shadows on the plane) 
sphere.castShadow = true;

// Create a plane geometry
const geometry = new THREE.PlaneGeometry(10, 10, 32, 32);
// Create a basic material
//const material = new THREE.MeshBasicMaterial({ color: 0x0088ff });
// Create a mesh object
// Create a shader material
const waterShader = {
    uniforms: {
        time: { value: 0 },
    },

    vertexShader: `
    uniform float time;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.z += sin(pos.x * 3.0 + time) * 0.1;
      pos.z += sin(pos.y * 4.0 + time * 0.5) * 0.1;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,

    fragmentShader: `
    varying vec2 vUv;

    void main() {
      gl_FragColor = vec4(0.0, 0.5, 1.0, 1.0);
    }
  `,
};

// Create the shader material
const material = new THREE.ShaderMaterial({
    uniforms: waterShader.uniforms,
    vertexShader: waterShader.vertexShader,
    fragmentShader: waterShader.fragmentShader,
});
const plane = new THREE.Mesh(geometry, material);
plane.rotateX(-Math.PI / 2);

// Add the mesh object to the scene
scene.add(plane);

// Define variables to store the previous and current mouse positions
let mousePos = new THREE.Vector2();
let lastMousePos = new THREE.Vector2();

// Add an event listener to track the mouse position
document.addEventListener('mousemove', (event) => {
    lastMousePos.copy(mousePos);
    mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Define a function to create ripples on the water surface
function createRipple() {
    // Get the center of the plane geometry
    const center = new THREE.Vector3();
    plane.geometry.computeBoundingBox();
    plane.geometry.boundingBox.getCenter(center);

    // Convert the mouse position to local coordinates
    const localMousePos = mousePos.clone().unproject(camera);
    const ray = new THREE.Raycaster(camera.position, localMousePos.sub(camera.position).normalize());
    const intersection = ray.intersectObject(plane);

    if (intersection) {
        // Calculate the distance from the center of the plane
        const distance = center.distanceTo(intersection.point);

        // Create a ripple by adjusting the `z` position of each vertex in the plane geometry
        const vertices = plane.geometry.vertices;
        const maxDistance = 1;
        const maxHeight = 0.1;
        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            const vertexDistance = center.distanceTo(vertex);
            const d = Math.abs(distance - vertexDistance) / maxDistance;
            if (d <= 1) {
                vertex.z += Math.sin(d * Math.PI) * maxHeight;
            }
        }

        // Notify Three.js that the geometry has been updated
        plane.geometry.verticesNeedUpdate = true;
    }
}

// Define the animate function
function waterAnimate() {
    requestAnimationFrame(animate);

    // Update the shader uniform variables
    material.uniforms.time.value += 0.1;

    // Create ripples on the water surface
    if (mousePos.distanceTo(lastMousePos) > 0) {
        createRipple();
    }

    // Render the scene
    renderer.render(scene, camera);
}
waterAnimate();
