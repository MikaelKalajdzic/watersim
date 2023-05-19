import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

// Set up Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(1, -40, 40);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Init grid parameters
const gridSize = 70;
const gridWidth = 70;
const gridHeight = 70;
const pointSize = gridWidth / gridSize;

// Set up spring model parameters
const k = 0.01; // spring constant
const damping = 0.98; // damping factor

// Create grid of points
const positions = new Float32Array(gridSize * gridSize);
const velocities = new Float32Array(gridSize * gridSize);

for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
        const index = i * gridSize + j;
        positions[index] = 0;
        velocities[index] = 0;

        const geometry = new THREE.BufferGeometry();
        const material = new THREE.PointsMaterial({color: 0x0000ff});
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([i * pointSize - gridWidth / 2, j * pointSize - gridHeight / 2, positions[index]]), 3));
        const point = new THREE.Points(geometry, material);
        scene.add(point);
    }
}

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
        }
    }

    // Update point positions
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const index = i * gridSize + j;
            const positionAttribute = scene.children[i * gridSize + j].geometry.getAttribute('position');
            positionAttribute.setZ(0, positions[index]);
            positionAttribute.needsUpdate = true;
        }
    }
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

// Set up camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 100;
controls.update();

let ripple = false;

// Render loop
function animate() {
    requestAnimationFrame(animate);

    // Apply ripple disturbance at the center of the grid
    if (!ripple) {
        applyRipple(10, 10, 5, 6);
        ripple = true;
    }

    // Update water simulation
    updateWater();

    // Update camera controls
    controls.update();

    // Render the scene
    renderer.render(scene, camera);
}

// Start the animation
animate();
