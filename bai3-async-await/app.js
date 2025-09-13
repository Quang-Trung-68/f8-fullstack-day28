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
const baseUrl = "https://jsonplaceholder.typicode.com";

let todoData = null;
let currentPostsLoaded = 5;

// 3.1 Async function wrapper with fetch

async function sendRequest(method, url) {
  try {
    loadingOverlay.style.display = "flex";

    const response = await fetch(url, { method: method });

    loadingOverlay.style.display = "none";

    if (!response.ok) {
      // 3.3: Specific error handling cho từng status code
      if (response.status === 404) {
        throw new Error("Không tìm thấy dữ liệu (404)");
      } else if (response.status === 500) {
        throw new Error("Lỗi server (500)");
      } else if (response.status >= 400 && response.status < 500) {
        throw new Error("Lỗi client (" + response.status + ")");
      } else if (response.status >= 500) {
        throw new Error("Lỗi server (" + response.status + ")");
      } else {
        throw new Error("Request failed with status: " + response.status);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    loadingOverlay.style.display = "none";

    // 3.3: Handle network errors
    if (error.name === "TypeError" || error.message.includes("fetch")) {
      throw new Error("Lỗi mạng - Kiểm tra kết nối internet");
    }

    throw error;
  }
}

// 3.3: Retry mechanism với async/await
async function sendRequestWithRetry(
  method,
  url,
  retryElement = null,
  maxRetries = 1
) {
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      if (retryElement && retryCount > 0) {
        retryElement.textContent = `Đang thử lại lần ${retryCount}/${maxRetries}...`;
      }

      const result = await sendRequest(method, url);

      if (retryElement) {
        retryElement.textContent =
          retryCount > 0 ? `Thành công sau ${retryCount} lần thử lại!` : "";
      }

      return result;
    } catch (error) {
      retryCount++;

      if (retryCount > maxRetries) {
        if (retryElement) {
          retryElement.textContent = `Đã thử ${
            maxRetries + 1
          } lần, vẫn thất bại!`;
        }
        throw error;
      }

      if (retryElement) {
        retryElement.textContent = `Lỗi! Sẽ thử lại sau 2 giây... (Lần ${retryCount}/${maxRetries})`;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

// 3.3 Refactor chuc nang 1 voi async/await

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

findUserBtn.addEventListener("click", async () => {
  try {
    if (!userIdInput.value) {
      findUserError.textContent = "Vui lòng nhập User ID!";
      return;
    }

    clearUserError();
    displayUser(null);

    const url = baseUrl + "/users/" + userIdInput.value;
    const data = await sendRequestWithRetry("GET", url, findUserRetry);
    displayUser(data);
  } catch (error) {
    findUserError.textContent = error.message;
    console.log(error);
  }
});

// 3.2: Refactor chức năng 2 với async/await
async function loadComments(userId, postId) {
  try {
    const urlUser = baseUrl + "/users/" + userId;
    const urlComments = baseUrl + "/posts/" + postId + "/comments";

    // Sequential API calls với async/await
    const userData = await sendRequestWithRetry("GET", urlUser, postRetry);
    const commentsData = await sendRequestWithRetry(
      "GET",
      urlComments,
      postRetry
    );

    const postDiv = document.querySelector(".post-id-" + postId);

    let oldComments = postDiv.querySelector(".comments");
    if (oldComments) oldComments.remove();

    const commentsContainer = document.createElement("div");
    commentsContainer.className = "comments";

    const userInfo = document.createElement("div");
    userInfo.className = "comment-userinfo";
    userInfo.textContent = `User: ${userData.name} (${userData.email})`;
    commentsContainer.appendChild(userInfo);

    commentsData.forEach((comment) => {
      const commentDiv = document.createElement("div");
      commentDiv.className = "comment";
      commentDiv.textContent = `${comment.name}: ${comment.body}`;
      commentsContainer.appendChild(commentDiv);
    });

    postDiv.appendChild(commentsContainer);
  } catch (error) {
    postError.textContent = error.message;
    console.log(error);
  }
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

async function loadPosts(limit = 5, append = false) {
  try {
    postError.textContent = "";
    postRetry.textContent = "";

    const url = baseUrl + "/posts?_limit=" + limit;
    const posts = await sendRequestWithRetry("GET", url, postRetry);

    const postsHTML = displayPosts(posts);
    if (append) {
      postsList.innerHTML += postsHTML;
    } else {
      postsList.innerHTML = postsHTML;
    }
    bindCommentEvents();
  } catch (error) {
    postError.textContent = error.message;
    console.log(error);
  }
}

loadMoreBtn.addEventListener("click", async () => {
  currentPostsLoaded += 5;
  await loadPosts(currentPostsLoaded, false);
});

// 3.2: Refactor chức năng 3 với async/await
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

async function loadTodos() {
  try {
    if (!userIdInputTodo.value) {
      todoError.textContent = "Vui lòng nhập User ID!";
      return;
    }

    todoError.textContent = "";
    todoRetry.textContent = "";

    const url = baseUrl + "/users/" + userIdInputTodo.value + "/todos";
    const data = await sendRequestWithRetry("GET", url, todoRetry);

    todoData = data;
    displayTodos(data);
  } catch (error) {
    todoError.textContent = error.message;
    console.log(error);
  }
}

async function filterTodos(filterFn) {
  if (!todoData) {
    await loadTodos();
  }
  if (todoData) {
    const filteredTodos = todoData.filter(filterFn);
    displayTodos(filteredTodos);
  }
}

allTodoBtn.addEventListener("click", loadTodos);

completeTodoBtn.addEventListener("click", async () => {
  await filterTodos((todo) => todo.completed);
});

incompleteTodoBtn.addEventListener("click", async () => {
  await filterTodos((todo) => !todo.completed);
});

// Initial load
loadPosts(5);
