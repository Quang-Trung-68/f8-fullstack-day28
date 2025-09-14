const findUserBtn = document.querySelector(".find-user");
const userIdInput = document.querySelector(".user-id-input");
const userName = document.querySelector(".user-name");
const userEmail = document.querySelector(".user-email");
const userPhone = document.querySelector(".user-phone");
const userWebsite = document.querySelector(".user-website");
const userCompany = document.querySelector(".user-company");
const userAddress = document.querySelector(".user-address");
const findUserError = document.querySelector(".find-user-error");
const findUserRetry = document.querySelector(".find-user-retry");
const userResult = document.querySelector(".user-result");
const baseUrl = "https://jsonplaceholder.typicode.com";

const postsList = document.querySelector(".posts-list");
const postError = document.querySelector(".post-error");
const postRetry = document.querySelector(".post-retry");
const loadMoreBtn = document.querySelector(".load-more-btn");

const numberTodo = document.querySelector(".number-todo");
const userIdInputTodo = document.querySelector(".user-id-input-todo");
const todoList = document.querySelector(".todo-list");
const todoError = document.querySelector(".todo-error");
const todoRetry = document.querySelector(".todo-retry");
const allTodoBtn = document.querySelector(".all-todo-btn");
const completeTodoBtn = document.querySelector(".complete-todo-btn");
const incompleteTodoBtn = document.querySelector(".incomplete-todo-btn");

const loadingOverlay = document.querySelector(".loading-overlay");

let todoData = null;
let currentPostsLoaded = 5;

// 2.1: Promise wrapper cho XHR
function sendRequest(method, url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    loadingOverlay.style.display = "flex";

    xhr.onload = function () {
      loadingOverlay.style.display = "none";
      if (this.status >= 200 && this.status < 400) {
        const data = JSON.parse(this.responseText);
        resolve(data);
      } else {
        reject(new Error("Request failed with status: " + this.status));
      }
    };

    xhr.onerror = function () {
      loadingOverlay.style.display = "none";
      reject(new Error("Network error occurred"));
    };

    xhr.send();
  });
}

// 2.3: Retry mechanism
function sendRequestWithRetry(
  method,
  url,
  retryElement = null,
  maxRetries = 1
) {
  let retryCount = 0;

  function attemptRequest() {
    if (retryElement && retryCount > 0) {
      retryElement.textContent = `Đang thử lại lần ${retryCount}/${maxRetries}...`;
    }

    return sendRequest(method, url).catch((error) => {
      if (retryCount < maxRetries) {
        retryCount++;
        if (retryElement) {
          retryElement.textContent = `Lỗi! Sẽ thử lại sau 2 giây... (Lần ${retryCount}/${maxRetries})`;
        }
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(attemptRequest());
          }, 2000);
        });
      } else {
        if (retryElement) {
          retryElement.textContent = `Đã thử ${
            maxRetries + 1
          } lần, vẫn thất bại!`;
        }
        throw error;
      }
    });
  }

  return attemptRequest().then((result) => {
    if (retryElement) {
      retryElement.textContent =
        retryCount > 0 ? `Thành công sau ${retryCount} lần thử lại!` : "";
    }
    return result;
  });
}

// 2.2: Refactor chức năng 1 - User Profile Card
function displayUser(data) {
  userName.textContent = data ? "Name: " + data.name : "";
  userEmail.textContent = data ? "Email: " + data.email : "";
  userPhone.textContent = data ? "Phone: " + data.phone : "";
  userWebsite.textContent = data ? "Website: " + data.website : "";
  userCompany.textContent = data ? "Company: " + data.company.name : "";
  userAddress.textContent = data
    ? "Address: " + data.address.street + ", " + data.address.city
    : "";
}

function clearUserError() {
  findUserError.textContent = "";
  findUserRetry.textContent = "";
}

findUserBtn.addEventListener("click", () => {
  if (!userIdInput.value) {
    findUserError.textContent = "Vui lòng nhập User ID!";
    return;
  }

  clearUserError();
  displayUser(null);

  const url = `${baseUrl}/users/${userIdInput.value}`;

  sendRequestWithRetry("GET", url, findUserRetry)
    .then((data) => {
      displayUser(data);
    })
    .catch((error) => {
      findUserError.textContent = error.message;
      console.log(error);
    });
});

// 2.2: Refactor chức năng 2 - Posts với Comments (Promise Chain)
function loadComments(userId, postId) {
  const urlUser = `${baseUrl}/users/${userId}`;
  const urlComments = `${baseUrl}/posts/${postId}/comments`;

  // Promise chain để tránh callback hell
  return sendRequestWithRetry("GET", urlUser, postRetry)
    .then((userData) => {
      return sendRequestWithRetry("GET", urlComments, postRetry).then(
        (commentsData) => {
          return { userData, commentsData };
        }
      );
    })
    .then(({ userData, commentsData }) => {
      const postDiv = document.querySelector(`.post-id-${postId}`);

      // Xóa comments cũ nếu có
      let oldComments = postDiv.querySelector(".comments");
      if (oldComments) oldComments.remove();

      // Tạo container cho comments
      const commentsContainer = document.createElement("div");
      commentsContainer.className = "comments";

      // Thêm thông tin user
      const userInfo = document.createElement("div");
      userInfo.className = "comment-userinfo";
      userInfo.textContent = `User: ${userData.name} (${userData.email})`;
      commentsContainer.appendChild(userInfo);

      // Thêm từng comment
      commentsData.forEach((comment) => {
        const commentDiv = document.createElement("div");
        commentDiv.className = "comment";
        commentDiv.textContent = `${comment.name}: ${comment.body}`;
        commentsContainer.appendChild(commentDiv);
      });

      postDiv.appendChild(commentsContainer);
    })
    .catch((error) => {
      postError.textContent = error.message;
      console.log(error);
    });
}

function displayPosts(posts) {
  const postsHTML = posts
    .map((post) => {
      return `<div class="post-id-${post.id}">
                    <div class="post-userid">UserID: ${post.userId}</div>
                    <div class="post-id">ID: ${post.id}</div>
                    <div class="post-title">Title: ${post.title}</div>
                    <div class="post-body">Body: ${post.body}</div>
                    <button type="button" class="comment-btn" data-post-id="${post.id}" data-user-id="${post.userId}">Xem comments</button>
                </div>`;
    })
    .join("");

  return postsHTML;
}

function bindCommentEvents() {
  document.querySelectorAll(".comment-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const postId = btn.dataset.postId;
      const userId = btn.dataset.userId;
      loadComments(userId, postId);
    });
  });
}

function loadPosts(limit = 5, append = false) {
  postError.textContent = "";
  postRetry.textContent = "";

  const url = `${baseUrl}/posts?_limit=${limit}`;

  sendRequestWithRetry("GET", url, postRetry)
    .then((posts) => {
      const postsHTML = displayPosts(posts);
      if (append) {
        postsList.innerHTML += postsHTML;
      } else {
        postsList.innerHTML = postsHTML;
      }
      bindCommentEvents();
    })
    .catch((error) => {
      postError.textContent = error.message;
      console.log(error);
    });
}

// Load more functionality
loadMoreBtn.addEventListener("click", () => {
  currentPostsLoaded += 5;
  loadPosts(currentPostsLoaded, false);
});

// 2.2: Refactor chức năng 3 - Todo List với Filter
function displayTodos(todos) {
  const todosHTML = todos
    .map((todo) => {
      const cls = todo.completed ? "todo-completed" : "todo-incomplete";
      return `<div class="${cls}">
                    <div>UserId: ${todo.userId}</div>
                    <div>Id: ${todo.id}</div>
                    <div>Title: ${todo.title}</div>
                    <div>Completed: ${todo.completed}</div>
                </div>`;
    })
    .join("");

  todoList.innerHTML = todosHTML;
  numberTodo.textContent = todos.length;
}

function loadTodos() {
  if (!userIdInputTodo.value) {
    todoError.textContent = "Vui lòng nhập User ID!";
    return Promise.reject(new Error("Missing User ID"));
  }

  todoError.textContent = "";
  todoRetry.textContent = "";

  const url = `${baseUrl}/users/${userIdInputTodo.value}/todos`;

  return sendRequestWithRetry("GET", url, todoRetry)
    .then((data) => {
      todoData = data;
      displayTodos(data);
      return data;
    })
    .catch((error) => {
      todoError.textContent = error.message;
      console.log(error);
      throw error;
    });
}

allTodoBtn.addEventListener("click", () => {
  loadTodos();
});

completeTodoBtn.addEventListener("click", () => {
  if (!todoData) {
    loadTodos().then(() => {
      const completedTodos = todoData.filter((todo) => todo.completed);
      displayTodos(completedTodos);
    });
  } else {
    const completedTodos = todoData.filter((todo) => todo.completed);
    displayTodos(completedTodos);
  }
});

incompleteTodoBtn.addEventListener("click", () => {
  if (!todoData) {
    loadTodos().then(() => {
      const incompleteTodos = todoData.filter((todo) => !todo.completed);
      displayTodos(incompleteTodos);
    });
  } else {
    const incompleteTodos = todoData.filter((todo) => !todo.completed);
    displayTodos(incompleteTodos);
  }
});

// Initial load
loadPosts(5);
