import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

// Set up Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(1, -40, 40);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 100;
controls.update();

// Init grid parameters
const gridSize = 50;
const gridWidth = 50;
const gridHeight = 50;
const pointSize = gridWidth / gridSize;

// Set up spring model parameters
const k = 0.1; // spring constant
const damping = 0.92; // damping factor

// Create grid of points
const points = [];
for (let i = 0; i < gridSize; i++) {
    points[i] = [];
    for (let j = 0; j < gridSize; j++) {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.PointsMaterial({color: 0x0000ff});
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([i * pointSize - gridWidth / 2, j * pointSize - gridHeight / 2, 0]), 3));
        points[i][j] = new THREE.Points(geometry, material);
        scene.add(points[i][j]);
    }
}

function updateWater() {

    // Calculate forces for each point
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const pointPosition = points[i][j].geometry.attributes.position;
            const force = new THREE.Vector3(0, 0, 0);

            // Calculate forces from neighbors
            if (i > 0) {
                const neighborPosition = points[i - 1][j].geometry.attributes.position;
                force.add(new THREE.Vector3(pointPosition.getX(0) - neighborPosition.getX(0), pointPosition.getY(0) - neighborPosition.getY(0), 0).multiplyScalar(-k));
            }
            if (i < gridSize - 1) {
                const neighborPosition = points[i + 1][j].geometry.attributes.position;
                force.add(new THREE.Vector3(pointPosition.getX(0) - neighborPosition.getX(0), pointPosition.getY(0) - neighborPosition.getY(0), 0).multiplyScalar(-k));
            }
            if (j > 0) {
                const neighborPosition = points[i][j - 1].geometry.attributes.position;
                force.add(new THREE.Vector3(0, pointPosition.getY(0) - neighborPosition.getY(0), pointPosition.getZ(0) - neighborPosition.getZ(0)).multiplyScalar(-k));
            }
            if (j < gridSize - 1) {
                const neighborPosition = points[i][j + 1].geometry.attributes.position;
                force.add(new THREE.Vector3(0, pointPosition.getY(0) - neighborPosition.getY(0), pointPosition.getZ(0) - neighborPosition.getZ(0)).multiplyScalar(-k));
            }

            // Apply damping
            force.multiplyScalar(damping);

            // Update point position
            pointPosition.setZ(0, pointPosition.getZ(0) + force.z);
            points[i][j].geometry.attributes.position.needsUpdate = true;
        }
    }
}

function applyRipple(x, y, radius, strength) {
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const pointPosition = points[i][j].geometry.attributes.position;
            const distance = Math.sqrt((pointPosition.getX(0) - x) ** 2 + (pointPosition.getY(0) - y) ** 2);
            if (distance < radius) {
                const factor = strength * Math.cos((distance / radius) * Math.PI / 2);
                pointPosition.setZ(0, factor);
            }
        }
    }
}

let ripple = false;

function animate() {
    requestAnimationFrame(animate);

    // Update water simulation
    updateWater();

    // Apply one ripple disturbance
    if (!ripple) {
        applyRipple(10, 10, 10, 10);
        ripple = true;
    }

    // Update camera controls
    controls.update();

    // Render the scene
    renderer.render(scene, camera);
}

animate();
