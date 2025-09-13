// const listPosts = document.querySelector("#list-post");
// const listComments = document.querySelector("#list-comment");

// function send(method, url, callback) {
//   const xhr = new XMLHttpRequest();
//   xhr.open(method, url);

//   xhr.onload = function () {
//     if (this.status >= 200 && this.status < 400) {
//       const data = JSON.parse(this.responseText);
//       callback(data);
//     }
//   };

//   xhr.send();
// }

// // Callback riêng để hiển thị posts
// function renderPosts(data) {
//   listPosts.innerHTML = data
//     .map((dt) => `<li><a>${dt.id}. ${dt.title}</a></li>`)
//     .join("");
// }

// // Callback riêng để hiển thị comments
// function renderComments(data) {
//   listComments.innerHTML = data
//     .map((dt) => `<li><a>${dt.id}. ${dt.name}</a></li>`)
//     .join("");
// }

// send("GET", "https://jsonplaceholder.typicode.com/posts", renderPosts);
// send("GET", "https://jsonplaceholder.typicode.com/comments", renderComments);


const promise = new Promise((resolve,reject)=>{
    resolve("Done");
})

promise.then((data)=>{
    console.log(data);
},
()=>{

})



