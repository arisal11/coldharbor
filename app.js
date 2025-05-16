const nums = [];

var totalNums = 0;
var row = 0; 
var col = 0;
let score = 0;

let isSelecting = false;
let startX, startY;
let selectingBox;
const container = document.getElementById('main');

function getNums(){
    return document.querySelectorAll('.number');
}

container.addEventListener('mousedown', (event) =>{
    isSelecting = true;
    startX = event.clientX;
    startY = event.clientY;
    selectingBox = document.createElement('div');
    selectingBox.classList.add('selecting-box');
    selectingBox.style.left = startX + 'px';
    selectingBox.style.top = startY + 'px';
    container.appendChild(selectingBox);
});

container.addEventListener('mousemove', (event) => {
    if(!isSelecting) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    selectingBox.style.width = Math.abs(dx) + 'px';
    selectingBox.style.height = Math.abs(dy) + 'px';
    selectingBox.style.left = Math.min(startX, event.clientX) + 'px';
    selectingBox.style.top = Math.min(startY, event.clientY) + 'px';

    const boxRect = selectingBox.getBoundingClientRect();
    const numbers = getNums();
    numbers.forEach((number) => {
        const itemRect = number.getBoundingClientRect();
        const intersecting = !(
            boxRect.top > itemRect.bottom ||
            boxRect.bottom < itemRect.top ||
            boxRect.right < itemRect.left ||
            boxRect.left > itemRect.right
        )

        if (intersecting) {
            number.classList.add('selected');
        } else {
            number.classList.remove('selected');
        }
    });
});

container.addEventListener('mouseup', () => {
    if(isSelecting){
        isSelecting = false;
        selectingBox.remove();
        const selectedNumbers = Array.from(document.querySelectorAll('.selected'));
        selectedNumbers.forEach((number) => {
            number.style.backgroundColor = 'black';
        });
        console.log(selectedNumbers);
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const selectedElements = Array.from(document.querySelectorAll('.selected'));
        const correct = selectedElements.every(el => temp.includes(el));

        if (correct) {
            const box = document.querySelector('.container .box1'); 
            animateIntoBox(selectedElements, box);
            setTimeout(() => {
                resetGame(); 
                addNums();
                initNums();
            }, 100);
        }
    }
});

function animateIntoBox(selectedElements, targetBox) {
    targetBox.classList.add('open');

    selectedElements.forEach((el, index) => {
        const clone = el.cloneNode(true);
        document.body.appendChild(clone);

        const startRect = el.getBoundingClientRect();
        const endRect = targetBox.getBoundingClientRect();

        clone.style.position = 'absolute';
        clone.style.left = `${startRect.left}px`;
        clone.style.top = `${startRect.top}px`;
        clone.style.width = `${startRect.width}px`;
        clone.style.height = `${startRect.height}px`;
        clone.style.transition = 'all 1s ease';
        clone.style.zIndex = 1000;

        requestAnimationFrame(() => {
            clone.style.left = `${endRect.left + 20 + index * 10}px`;
            clone.style.top = `${endRect.top + 30}px`;
            clone.style.opacity = 0;
            clone.style.transform = 'scale(0.5)';
        });

        setTimeout(() => {
            clone.remove();
            if (index === selectedElements.length - 1) {
                targetBox.classList.remove('open');
            }
        }, 1000);
    });
}

function resetGame() {
    const main = document.getElementById('main');
    main.innerHTML = '';

    nums.length = 0;
    temp.length = 0;

    totalNums = 0;
    row = 0;
    col = 0;
}


function addNums() {
    const main = document.querySelector('main');
    main.innerHTML = '';
    const mainWidth = main.clientWidth;
    const mainHeight = main.clientHeight;
    
    const itemSize = 50; 

    const columns = Math.floor(mainWidth / itemSize);
    const rows = Math.floor(mainHeight / itemSize);
    const totalItems = columns * rows; 

    col = columns;
    row = rows;
    totalNums = totalItems

    for (let i = 1; i <= totalItems; i++) {
        const numberDiv = document.createElement('div');
        numberDiv.classList.add('number');
        numberDiv.textContent = Math.floor(Math.random() * 9);
        nums.push(numberDiv);
        main.appendChild(numberDiv);
    }

    main.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
}

function initNums(){
    var index = Math.floor(Math.random() * totalNums);
    nums[index].classList.add('select');
    var col2 = col * 2
    for(let i = 1; i < 3; i++){
        if(((index + col) > totalNums) || ((index + col2) >= totalNums)){
            nums[index - col].classList.add('select');
            nums[index - col2].classList.add('select');
            nums[index - i].classList.add('select')
            nums[index - col - i].classList.add('select');
            nums[index - col2 - i].classList.add('select');
        }else{
            nums[index + col].classList.add('select');
            nums[index + col2].classList.add('select');
            nums[index + i].classList.add('select')
            nums[index + col + i].classList.add('select');
            if((index + col2 + i) >= totalNums){
                nums[index - 1].classList.add('select')
            } else{
                nums[index + col2 + i].classList.add('select');
            }
        }
    }

    let numType = Math.floor(Math.random() * (4 - 1 + 1) + 1)
    console.log(numType)
    switch (numType) {
        case 1:
            increaseSize();
            break;
        case 2:
            shrinkSize();
            break;
        case 3:
            shakeNum();
            break;
        case 4:
            swayNum();
            break;
        default:
            break;
    }

    selectItem();
}

const temp = [];

const img = document.querySelector('img')
img.addEventListener('click', () =>{
    nums.forEach(element =>{
        if(element.classList.contains('select')){
            element.style.fontSize = "40px"
        }
    })
    
})

function selectItem(){
    nums.forEach(element => {
        if(element.classList.contains('select')){
            element.addEventListener('click', () =>{
                element.style.border = "4px solid white"
            })
        }
    });
}

function shrinkSize(){
    nums.forEach(element => {
        if(element.classList.contains('select')){
            temp.push(element);
        }
    });
    
    temp.forEach(element =>{
        element.addEventListener('mouseenter', () =>{
            element.style.fontSize = "10px";   
        })

        element.addEventListener('mouseout', () => {
            element.style.fontSize = "20px";   
        });

    })
}

function increaseSize(){
    nums.forEach(element => {
        if(element.classList.contains('select')){
            temp.push(element);
        }
    });
    temp.forEach(element =>{
        element.addEventListener('mouseenter', () =>{
            element.style.fontSize = "40px";   
            setTimeout(() => {
                element.style.fontSize = "20px"; 
            }, 5000);
        })
        element.addEventListener('mouseout', () => {
            element.style.fontSize = "20px";   
        });
    })
}

function shakeNum() {
    nums.forEach(element => {
        if (element.classList.contains('select')) {
            temp.push(element);
        }
    });

    temp.forEach(element => {
        element.addEventListener('mouseenter', () => {
            let trembling = true;

            function tremble() {
                if (!trembling) return;
                const xOffset = (Math.random() - 0.5) * 2; 
                const yOffset = (Math.random() - 0.5) * 2;
                element.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
                requestAnimationFrame(tremble);
            }

            tremble();

            setTimeout(() => {
                trembling = false;
                element.style.transform = 'translate(0, 0)';
            }, 5000);
        });

        element.addEventListener('mouseout', () => {
            element.style.transform = 'translate(0, 0)';
        });
    });
}

function swayNum() {
    nums.forEach(element => {
        if (element.classList.contains('select')) {
            temp.push(element);
        }
    });

    temp.forEach(element => {
        element.addEventListener('mouseenter', () => {
            let swaying = true;
            let angle = 0;
            let direction = 2;

            function sway() {
                if (!swaying) return;
                angle += 2 * direction;
                if (angle > 4 || angle < -4) direction *= -1;
                element.style.transform = `rotate(${angle}deg)`;
                requestAnimationFrame(sway);
            }

            sway();

            setTimeout(() => {
                swaying = false;
                element.style.transform = 'rotate(0deg)';
            }, 5000);
        });

        element.addEventListener('mouseout', () => {
            element.style.transform = 'rotate(0deg)';
        });
    });
}

console.log(temp);
console.log(nums);


addNums();
initNums()

