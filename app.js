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
            console.log(index+ col2)
            nums[index + col].classList.add('select');
            nums[index + col2].classList.add('select');
            nums[index + i].classList.add('select')
            nums[index + col + i].classList.add('select');
            nums[index + col2 + i].classList.add('select');
        }
    }

    let numType = Math.floor(Math.random() * (4 - 1 + 1) + 1)
    switch (numType) {
        case 1:
            increaseSize();
            break;
        case 2:
            shrinkSize();
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
            console.log('in')
        })

        element.addEventListener('mouseout', () => {
            element.style.fontSize = "20px";   
            console.log('out')
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
            console.log('in')
        })
        element.addEventListener('mouseout', () => {
            element.style.fontSize = "20px";   
            console.log('out')
        });
    })
}

function shakeNum(){
    console.log('nah')
}

console.log(temp);
console.log(nums);

addNums();

emoNums();
