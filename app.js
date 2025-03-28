const nums = [];

var totalNums = 0;
var row = 0; 
var col = 0;


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

function emoNums(){
    var index = 142 //Math.floor(Math.random() * totalNums);
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
    
}

const temp = [];

function shrinkSize(){
    nums.forEach(element => {
        if(element.classList.contains('select')){
            temp.push(element);
        }
    });
    
    temp.forEach(element =>{
        element.addEventListener('mouseenter', () =>{
            element.style.fontSize = "10px";   
            setTimeout(() => {
                element.style.fontSize = "20px"; 
            }, 5000);
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
            let direction = 1;

            function sway() {
                if (!swaying) return;
                angle += 0.2 * direction;
                if (angle > 2 || angle < -2) direction *= -1;
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

emoNums();
