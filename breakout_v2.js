let scene, camera, renderer;
let paddle, ball, bricks = [];
let ballVelocity = new THREE.Vector3(0.05, 0.05, 0);
let moveLeft = false, moveRight = false;


let lastTime = 0;
const targetFPS = 60;
const interval = 1000 / targetFPS;

init();
animate();

function init() {
    scene = new THREE.Scene();

    // Cámara ortográfica para vista 2D
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 20;
    camera = new THREE.OrthographicCamera(
    -aspect * viewSize / 2,
    aspect * viewSize / 2,
    viewSize / 2,
    -viewSize / 2,
    0.1,
    100
    );
    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body. appendChild(renderer.domElement);

    // Luz
    //const light = new THREE.AmbientLight(0xffffff, 1);
    //scene.add(light);

    // Paleta
    const paddleGeometry = new THREE.BoxGeometry(4, 0.5, 1);
    const paddleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    paddle.position.y = -8;
    scene.add(paddle);

    // Pelota
    const ballGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, -7, 0);
    scene.add(ball);

    // Ladrillos
    /*
    const brickGeometry = new THREE.BoxGeometry(2, 1, 1);
    const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xff44ff, 0x44ffff];
    for (let i = -8; i <= 8; i += 3) {
    for (let j = 3; j <= 8; j += 2) {
        const colorIndex = Math.floor(Math.random() * colors.length);
        const brickMaterial = new THREE.MeshBasicMaterial({ color: colors[colorIndex] });
        const brick = new THREE.Mesh(brickGeometry, brickMaterial);
        brick.position.set(i, j, 0);
        scene.add(brick);
        bricks.push(brick);
    }
    }
    */

    // ladrillos version 2
    const brickGeometry = new THREE.BoxGeometry(1, 0.5, 1); // Tamaño más pequeño para que entren más
    const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xff44ff, 0x44ffff];

    const rows = 20;
    const cols = 20;
    const startX = -cols / 2; // Centrado horizontal
    const startY = 1;          // Altura inicial

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const colorIndex = Math.floor(Math.random() * colors.length);
            const brickMaterial = new THREE.MeshBasicMaterial({ color: colors[colorIndex] });
            const brick = new THREE.Mesh(brickGeometry, brickMaterial);
            brick.position.set(startX + col * 1.1, startY + row * 0.6, 0); // Espaciado entre ladrillos
            scene.add(brick);
            bricks.push(brick);

            // Borde negro
            const edgeGeometry = new THREE.EdgesGeometry(brickGeometry);
            const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
            const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
            edges.position.copy(brick.position);
            scene.add(edges);
        }
    }


    // Controles
    document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') moveLeft = true;
    if (e.key === 'ArrowRight') moveRight = true;
    });
    document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') moveLeft = false;
    if (e.key === 'ArrowRight') moveRight = false;
    });

        // Marco del área de juego
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const borderGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-10, -10, 0), // esquina inferior izquierda
        new THREE.Vector3(10, -10, 0),  // esquina inferior derecha
        new THREE.Vector3(10, 10, 0),   // esquina superior derecha
        new THREE.Vector3(-10, 10, 0),  // esquina superior izquierda
        new THREE.Vector3(-10, -10, 0)  // cerrar el rectángulo
    ]);
    const border = new THREE.Line(borderGeometry, borderMaterial);
    scene.add(border);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 20;
    camera.left = -aspect * viewSize / 2;
    camera.right = aspect * viewSize / 2;
    camera.top = viewSize / 2;
    camera.bottom = -viewSize / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    requestAnimationFrame(animate);
    if (time - lastTime < interval) return;
        lastTime = time;

    // Movimiento paleta
    if (moveLeft && paddle.position.x > -8) paddle.position.x -= 0.3;
    if (moveRight && paddle.position.x < 8) paddle.position.x += 0.3;

    // Movimiento pelota
    ball.position.add(ballVelocity);

    // Rebote en paredes
    if (ball.position.x <= -10 || ball.position.x >= 10) ballVelocity.x *= -1;
    if (ball.position.y >= 10 || ball.position.y <= -10) ballVelocity.y *= -1;

    // Rebote en paleta
    if (
    ball.position.y <= paddle.position.y + 0.4 &&
    ball.position.y >= paddle.position.y - 0.4 &&
    ball.position.x >= paddle.position.x - 2 &&
    ball.position.x <= paddle.position.x + 2
    ) {
    ballVelocity.y *= -1;
    // Añadir un poco de variación al rebote basado en dónde golpea la paleta
    const hitPosition = (ball.position.x - paddle.position.x) / 2;
    ballVelocity.x = hitPosition * 0.2;
    }

    // Colisión con ladrillos
    bricks.forEach((brick, index) => {
    if (brick && ball.position.distanceTo(brick.position) < 0.8) { 
        scene.remove(brick);
        brick.geometry.dispose();
        brick.material.dispose();
        bricks[index] = null;
        ballVelocity.y *= -1;
    }
    });

    // Verificar si ganaste
    const remainingBricks = bricks.filter(brick => brick !== null);
    if (remainingBricks.length === 0) {
    alert("¡Ganaste! Reiniciando juego...");
    location.reload();
    }

    // Fin del juego

    /*
    if (ball.position.y < -10) {
    alert("¡Juego terminado! Reiniciando...");
    ball.position.set(0, -7, 0);
    ballVelocity.set(0.15, 0.15, 0);
    }
    */
    renderer.render(scene, camera);
    



}