import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import * as dat from 'dat.gui';
import fragmentShader from '../../shaders/water/water.frag.glsl';
import vertexShader from '../../shaders/water/water.vert.glsl';
import { Vector3 } from 'three';

// Set up Three.js scene
const scene = new THREE.Scene();

// Sets the renderer to fit the whole screen
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Sets the color of the background
renderer.setClearColor(0x222222);

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
camera.position.set(-90, 70, -70);
orbit.update();

// Load the HDR texture using RGBELoader
const HdrFileURL = new URL("../../textures/kloofendal_48d_partly_cloudy_puresky_1k.hdr", import.meta.url)
const loader = new RGBELoader();
loader.load(HdrFileURL, function(texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
});

// Init grid parameters
const gridSize = 50;
const gridWidth = 50;
const gridHeight = 50;

// Set up spring model parameters
const k = 0.01; // spring constant
const damping = 0.99; // damping factor

// Create grid of points
const positions = new Float32Array(gridSize * gridSize);
const velocities = new Float32Array(gridSize * gridSize);

const geometry = new THREE.PlaneGeometry(gridWidth, gridHeight, gridSize - 1, gridSize - 1);


// Create a ShaderMaterial using the vertex and fragment shaders
const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        Ka: { value: 0.2 },                                    // Ambient reflection coefficient
        Kd: { value: 0.8 },                                    // Diffuse reflection coefficient
        Ks: { value: 0.8 },                                    // Specular reflection coefficient
        shininessVal: { value: 200.0 },                        // Shininess
        ambientColor: { value: new THREE.Color(0x87ceeb) }, // Ambient color (light blue)
    diffuseColor: { value: new THREE.Color(0x0055ff) },     // Diffuse color (light blue)
    specularColor: { value: new THREE.Color(0xffffff) },    // Specular color (white)
    lightPos: { value: new Vector3(100, 100, 0) },    // Light position
    reflectionIntensity: { value: 0.5 },                       // Reflection intensity
    opacity: { value: 0.3 },                                   // Opacity
    },
    transparent: true,                                         // Enable transparency
});

const mesh = new THREE.Mesh(geometry, material);
mesh.rotation.x = -0.5 * Math.PI;
scene.add(mesh);

// Function to update water simulation
function updateWater() {
    const deltaT = 0.7; // Time step

    // Calculate forces for each point
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const index = i * gridSize + j;
            let force = 0;

            // Calculate forces from neighbors
            if (i > 0) {
                const neighborIndex = (i - 1) * gridSize + j;
                force += k * (positions[neighborIndex] - positions[index]);
            }
            if (i < gridSize - 1) {
                const neighborIndex = (i + 1) * gridSize + j;
                force += k * (positions[neighborIndex] - positions[index]);
            }
            if (j > 0) {
                const neighborIndex = i * gridSize + j - 1;
                force += k * (positions[neighborIndex] - positions[index]);
            }
            if (j < gridSize - 1) {
                const neighborIndex = i * gridSize + j + 1;
                force += k * (positions[neighborIndex] - positions[index]);
            }

            // Apply damping
            force *= damping;

            // Update velocity and position
            velocities[index] += force * deltaT;
            positions[index] += velocities[index] * deltaT;
            velocities[index] *= damping;
        }
    }

    // Update mesh vertices
    const vertices = mesh.geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const index = i / 3;
        vertices[i + 2] = positions[index];
    }
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.computeVertexNormals(); // recompute normals
}

// Function to create ripple disturbance
function applyRipple(x, y, radius, strength) {
    const centerX = (gridSize / gridWidth) * (x + gridWidth / 2);
    const centerY = (gridSize / gridHeight) * (y + gridHeight / 2);
    const radiusSquared = radius * radius;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const index = i * gridSize + j;
            const dx = i - centerX;
            const dy = j - centerY;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared < radiusSquared) {
                const factor = strength * Math.cos((Math.sqrt(distanceSquared) / radius) * Math.PI / 2);
                positions[index] += factor;
            }
        }
    }
}

let toggleRain = false;
let rainProbability = 0.5;
let rainDrops = 4;

function applyRain(numberOfDrops) {
    for (let i = 0; i < numberOfDrops; i++) {
        const x = (Math.random() * gridWidth) - gridWidth / 2;
        const y = (Math.random() * gridHeight) - gridHeight / 2;
        const radius = Math.random() * 1.5;
        const strength = Math.random() * 2;
        applyRipple(x, y, radius, strength);
    }
}

// appling rain with probability
function applyRainWithProbability(rainDrops, rainProbability) {
    if (Math.random() < rainProbability / 10) {
        applyRain(rainDrops);
    }
}

// Create a raycaster
const raycaster = new THREE.Raycaster();

// Create a vector to store the mouse coordinates
const mouse = new THREE.Vector2();

// Set up the mousemove event listener
window.addEventListener('mousemove', onMouseMove, false);

// Function to handle mouse movement
function onMouseMove(event) {
    // Calculate normalized device coordinates (-1 to +1) for the mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Set up the click event listener
window.addEventListener('click', onMouseClick, false);

// Function to handle mouse click
function onMouseClick() {
    // Cast a ray from the camera through the mouse position
    raycaster.setFromCamera(mouse, camera);

    // Find all objects intersected by the ray
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        // The first intersected object will be at [0]
        const intersect = intersects[0];

        // The position of the intersection point
        const intersectionPoint = intersect.point;

        //console.log('Intersection point:', intersectionPoint);
        applyRipple(intersectionPoint.z, intersectionPoint.x, 5, 6.);
    }
}

// GUI parameters
const gui = new dat.GUI();

const waterFolder = gui.addFolder('Water');
const waterOptions = {
    waterReflectionIntensity:  0.5,          // Reflection intensity
    waterOpacity: 0.3 ,
};
waterFolder.add(waterOptions, 'waterOpacity', 0, 1).onChange((e) => {
    material.uniforms.opacity.value = e;
});
waterFolder.add(waterOptions, "waterReflectionIntensity", 0, 1).onChange((e) => {
    material.uniforms.reflectionIntensity.value = e;
});
waterFolder.open();

// Rain section
const rainFolder = gui.addFolder('Rain');
const rainOptions = {
    toggleRain: false,
    numberOfDrops: 1,
    probability: 0.5
};
rainFolder.add(rainOptions, "toggleRain", false).onChange((e) => {
    toggleRain = !toggleRain;
})
rainFolder.add(rainOptions, "numberOfDrops", 0, 10, 1).onChange((e) => {
    rainDrops = Math.floor(e);
})
rainFolder.add(rainOptions, "probability", 0, 1).onChange((e) => {
    rainProbability = e;
})
rainFolder.open();


// Render loop
function animate(time) {
    requestAnimationFrame(animate);

    if(toggleRain) {
        applyRainWithProbability(rainDrops, rainProbability);
    }

    // Update water simulation
    updateWater();

    // Render the scene along with its camera
    renderer.render(scene, camera);
}

// Start the animation
renderer.setAnimationLoop(animate())