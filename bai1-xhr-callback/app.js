const findUserBtn = document.querySelector(".find-user");
const userIdInput = document.querySelector(".user-id-input");
const userName = document.querySelector(".user-name");
const userEmail = document.querySelector(".user-email");
const userPhone = document.querySelector(".user-phone");
const userWebsite = document.querySelector(".user-website");
const userCompany = document.querySelector(".user-company");
const userAddress = document.querySelector(".user-address");
const findUserError = document.querySelector(".find-user-error");
const userResult = document.querySelector(".user-result");
const baseUrl = "https://jsonplaceholder.typicode.com";

const loadingOverlay = document.querySelector(".loading-overlay");

// 1.1
function callbackUser(error, data) {
  userName.textContent = "";
  userEmail.textContent = "";
  userPhone.textContent = "";
  userWebsite.textContent = "";
  userCompany.textContent = "";
  userAddress.textContent = "";
  findUserError.textContent = "";
  if (data) {
    userName.textContent = "Name: " + data.name;
    userEmail.textContent = "Email: " + data.email;
    userPhone.textContent = "Phone: " + data.phone;
    userWebsite.textContent = "Website: " + data.website;
    userCompany.textContent = "Company name,: " + data.company.name;
    userAddress.textContent =
      "Address (street, city): " +
      data.address.street +
      ", " +
      data.address.city;
  } else if (error) {
    findUserError.textContent = error;
    console.log(error);
  }
}

function send(method, url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url);

  // Hiện overlay chặn click
  loadingOverlay.style.display = "flex";

  xhr.onload = function () {
    loadingOverlay.style.display = "none";
    if (this.status >= 200 && this.status < 400) {
      // success: callback with data
      const data = JSON.parse(this.responseText);
      callback(null, data);
    } else {
      // error HTTP: create new error
      callback(new Error("Request failed with status :" + this.status), null);
    }
  };
  //   error network
  xhr.onerror = function () {
    loadingOverlay.style.display = "none";
    callback(new Error("Network error occurred", null));
  };

  xhr.send();
}

findUserBtn.addEventListener("click", () => {
  const url = "https://jsonplaceholder.typicode.com/users/" + userIdInput.value;
  send("GET", url, callbackUser);
});

// 1.2

const postsList = document.querySelector(".posts-list");
const postError = document.querySelector(".post-error");

function onLoadComments(userId, postId) {
  const urlUser = baseUrl + `/users/${userId}`;
  const urlComments = baseUrl + `/posts/${postId}/comments`;

  send("GET", urlUser, (errorUser, dataUser) => {
    if (errorUser) {
      console.log(errorUser);
    } else {
      send("GET", urlComments, (errorCmt, dataComments) => {
        if (errorCmt) {
          console.log(errorCmt);
        } else {
          // Tìm đúng post để chèn comments vào
          const postDiv = document.querySelector(`.post-id-${postId}`);

          // Xóa khối comment cũ (nếu có) để tránh trùng lặp
          let oldComments = postDiv.querySelector(".comments");
          if (oldComments) oldComments.remove();

          // Tạo khối chứa mới
          const commentsContainer = document.createElement("div");
          commentsContainer.className = "comments";

          // Thêm thông tin user
          const userInfo = document.createElement("div");
          userInfo.className = "comment-userinfo";
          userInfo.textContent = `User: ${dataUser.name} (${dataUser.email})`;
          commentsContainer.appendChild(userInfo);

          // Thêm từng comment
          dataComments.forEach((cmt) => {
            const cmtDiv = document.createElement("div");
            cmtDiv.className = "comment";
            cmtDiv.textContent = `${cmt.name}: ${cmt.body}`;
            commentsContainer.appendChild(cmtDiv);
          });

          postDiv.appendChild(commentsContainer);
        }
      });
    }
  });
}

function callbackPosts(error, data) {
  if (data) {
    postsList.innerHTML = data
      .map((post) => {
        return `<div class = "post-id-${post.id}">
                <div class="post-userid">UserID: ${post.userId}</div>
                <div class="post-id">ID: ${post.id}</div>
                <div class="post-title">Title: ${post.title}</div>
                <div class="post-body">Body: ${post.body}</div>
                <button type="button" class="comment-btn" data-post-id="${post.id}" data-user-id="${post.userId}">Xem comments</button>
                </div>`;
      })
      .join("");

    // gán click cho tất cả nút vừa tạo
    document.querySelectorAll(".comment-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const postId = btn.dataset.postId;
        const userId = btn.dataset.userId;
        onLoadComments(userId, postId);
      });
    });
  } else if (error) {
    postError.textContent = error;
    console.log(error);
  }
}

const onLoad = () => {
  const urlPosts = "https://jsonplaceholder.typicode.com/posts?_limit=5";
  send("GET", urlPosts, callbackPosts);
};

onLoad();

// 1.3

const numberTodo = document.querySelector(".number-todo");
const userIdInputTodo = document.querySelector(".user-id-input-todo");
const todoList = document.querySelector(".todo-list");
const allTodoBtn = document.querySelector(".all-todo-btn");
const completeTodoBtn = document.querySelector(".complete-todo-btn");
const incompleteTodoBtn = document.querySelector(".incomplete-todo-btn");
let todoData = null;

const onLoadTodo = () => {
  const urlTodos = baseUrl + `/users/${userIdInputTodo.value}/todos`;
  send("GET", urlTodos, (error, data) => {
    if (error) console.log(error);
    else {
      todoData = data;

      const htmlTodos = data
        .map((todo) => {
          const cls = todo.completed ? "todo-completed" : "todo-incomplete";
          return `
                <div class = "${cls}">
                    <div>UserId: ${todo.userId}</div>
                    <div>Id: ${todo.id}</div>
                    <div>Title: ${todo.title}</div>
                    <div>Completed: ${todo.completed}</div>
                </div>
                `;
        })
        .join("");
      todoList.innerHTML = htmlTodos;
      numberTodo.textContent = data.length;
    }
  });
};

allTodoBtn.addEventListener("click", () => {
  onLoadTodo();
});

completeTodoBtn.addEventListener("click", () => {
  todoList.innerHTML = "";
  const htmlFilter = todoData
    .filter((todo) => {
      return todo.completed;
    })
    .map((todo) => {
      const cls = todo.completed ? "todo-completed" : "todo-incomplete";
      return `
                <div class = "${cls}">
                    <div>UserId: ${todo.userId}</div>
                    <div>Id: ${todo.id}</div>
                    <div>Title: ${todo.title}</div>
                    <div>Completed: ${todo.completed}</div>
                </div>
                `;
    })
    .join("");
  todoList.innerHTML = htmlFilter;
  numberTodo.textContent = todoData.filter((todo) => {
    return todo.completed;
  }).length;
});

incompleteTodoBtn.addEventListener("click", () => {
  todoList.innerHTML = "";
  const htmlFilter = todoData
    .filter((todo) => {
      return !todo.completed;
    })
    .map((todo) => {
      const cls = todo.completed ? "todo-completed" : "todo-incomplete";
      return `
                <div class = "${cls}">
                    <div>UserId: ${todo.userId}</div>
                    <div>Id: ${todo.id}</div>
                    <div>Title: ${todo.title}</div>
                    <div>Completed: ${todo.completed}</div>
                </div>
                `;
    })
    .join("");
  todoList.innerHTML = htmlFilter;
  numberTodo.textContent = todoData.filter((todo) => {
    return !todo.completed;
  }).length;
});
