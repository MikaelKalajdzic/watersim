import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';

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
    waterAnimate(time);

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
      rippleCenter: { value: new THREE.Vector2(5.5, 0.5) }, // Center of the ripple
      rippleRadius: { value: 0.1 }, // Radius of the ripple
      rippleStrength: { value: 0.5 }, // Strength/intensity of the ripple
    },
  
    vertexShader: `
      uniform float time;
      varying vec2 vUv;
  
      void main() {
        vUv = uv;
        vec3 pos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
  
    fragmentShader: `
      uniform float time;
      uniform vec2 rippleCenter;
      uniform float rippleRadius;
      uniform float rippleStrength;
      varying vec2 vUv;
  
      void main() {
        float distanceToCenter = distance(rippleCenter, vUv);
        float rippleAmount = smoothstep(rippleRadius - 0.5, rippleRadius + 0.5, distanceToCenter);
        vec4 color = vec4(0.0, 0.5, 1.0, 1.0);
        gl_FragColor = color * (1.0 - rippleStrength * rippleAmount);
      }
    `,
  };
  

let gridSize = 100;
let damping = 0.05;
let springConstant = 0.05;
let waterHeight = [];
let velocity = [];


// Create the shader material
const material = new THREE.ShaderMaterial({
    uniforms: waterShader.uniforms,
    vertexShader: waterShader.vertexShader,
    fragmentShader: waterShader.fragmentShader,
});
const plane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, gridSize, gridSize), material);
plane.rotateX(-Math.PI / 2);

for(let i = 0; i <= gridSize; i++) {
    waterHeight[i] = [];
    velocity[i] = [];
    for(let j = 0; j <= gridSize; j++) {
        waterHeight[i][j] = 0;
        velocity[i][j] = 0;
    }
}

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
function createRipple(intersection) {
    let intersectedVertex = intersection.face.a;
    let i = Math.floor(intersectedVertex / (gridSize + 1));
    let j = intersectedVertex % (gridSize + 1);
    waterHeight[i][j] += 0.2;
}

// Define the animate function
function waterAnimate(time) {
    material.uniforms.time.value += 0.5;
  
    let newHeight = [];
    const positionAttribute = plane.geometry.attributes.position;
  
    for (let i = 0; i <= gridSize; i++) {
      newHeight[i] = [];
      for (let j = 0; j <= gridSize; j++) {
        if (i > 0 && i < gridSize && j > 0 && j < gridSize) {
          let force = 0;
          force += springConstant * (waterHeight[i - 1][j] - waterHeight[i][j]);
          force += springConstant * (waterHeight[i + 1][j] - waterHeight[i][j]);
          force += springConstant * (waterHeight[i][j - 1] - waterHeight[i][j]);
          force += springConstant * (waterHeight[i][j + 1] - waterHeight[i][j]);
          let acceleration = force / 1; // mass = 1
          velocity[i][j] = damping * (velocity[i][j] + acceleration);
        }
        newHeight[i][j] = waterHeight[i][j] + velocity[i][j];
        positionAttribute.setZ(i * (gridSize + 1) + j, newHeight[i][j]);
  
        // Propagate ripple to neighboring vertices in a circular pattern
        const rippleRadius = material.uniforms.rippleRadius.value;
        const rippleStrength = material.uniforms.rippleStrength.value;
        const rippleCenter = material.uniforms.rippleCenter.value;
  
        const dx = j - rippleCenter.x * gridSize;
        const dy = i - rippleCenter.y * gridSize;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < rippleRadius) {
          const influence = (1 - distance / rippleRadius) * rippleStrength;
          if (i > 0) {
            velocity[i - 1][j] += influence;
          }
          if (i < gridSize) {
            velocity[i + 1][j] += influence;
          }
          if (j > 0) {
            velocity[i][j - 1] += influence;
          }
          if (j < gridSize) {
            velocity[i][j + 1] += influence;
          }
        }
      }
    }
    waterHeight = newHeight;
    positionAttribute.needsUpdate = true;
  
    renderer.render(scene, camera);
  }
  
  

// Mouse event
renderer.domElement.addEventListener('mousedown', function(event) {
    event.preventDefault();

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(plane);
    if (intersects.length > 0) {
        createRipple(intersects[0]);
    }
}, false);

// For resizing window
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(waterAnimate);
