let asyncFunction1 = (message) => new Promise((resolve) => {
    setTimeout(() => {
        console.log('func1', message);
        resolve('func1');
    }, 1000);
});

let asyncFunction2 = (message) => new Promise((resolve) => {
    setTimeout(() => {
        console.log('func2', message);
        resolve('func2');
    }, 500);
});

function notAsyncMain() {
    asyncFunction1('hello').then((data) => {
        console.log(data);
        return asyncFunction2('world');
    }).then((data) => {
        console.log(data);
    });
}

notAsyncMain();

async function asyncMain() {
    let data = await asyncFunction1('hello');
    console.log(data);
    data = await asyncFunction2('node');
    console.log(data);
}

asyncMain();