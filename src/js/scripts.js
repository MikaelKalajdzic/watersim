import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

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
camera.position.set(-80, 40, 30);
orbit.update();

// Init grid parameters
const gridSize = 50;
const gridWidth = 50;
const gridHeight = 50;
const pointSize = gridWidth / gridSize;

// Set up spring model parameters
const k = 0.01; // spring constant
const damping = 0.99; // damping factor

// Create grid of points
const positions = new Float32Array(gridSize * gridSize);
const velocities = new Float32Array(gridSize * gridSize);

const geometry = new THREE.PlaneGeometry(gridWidth, gridHeight, gridSize - 1, gridSize - 1);
const material = new THREE.MeshBasicMaterial({color: 0x0000ff, wireframe: true});
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
}

// Function to apply ripple disturbance
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

// // Set up camera controls
// const controls = new OrbitControls(camera, renderer.domElement);
// // controls.enableDamping = true;
// // controls.dampingFactor = 0.05;
// controls.screenSpacePanning = false;
// controls.minDistance = 1;
// controls.maxDistance = 100;
// controls.update();

let ripple = false;

// Render loop
function animate(time) {
    requestAnimationFrame(animate);

    // Apply ripple disturbance at the center of the grid
    if (!ripple) {
        applyRipple(10, 10, 5, 6.);
        ripple = true;
    }

    // Update water simulation
    updateWater();

    // // Update camera controls
    // controls.update();

    // Render the scene along with its camera
    renderer.render(scene, camera);
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

// Start the animation
renderer.setAnimationLoop(animate())
