// Lấy các phần tử DOM cho chức năng tìm user
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

// Lấy các phần tử DOM cho chức năng posts
const postsList = document.querySelector(".posts-list");
const postError = document.querySelector(".post-error");
const postRetry = document.querySelector(".post-retry");
const loadMoreBtn = document.querySelector(".load-more-btn");

// Lấy các phần tử DOM cho chức năng todo
const numberTodo = document.querySelector(".number-todo");
const userIdInputTodo = document.querySelector(".user-id-input-todo");
const todoList = document.querySelector(".todo-list");
const todoError = document.querySelector(".todo-error");
const todoRetry = document.querySelector(".todo-retry");
const loadTodoBtn = document.querySelector(".load-todo-btn");
const allTodoBtn = document.querySelector(".all-todo-btn");
const completeTodoBtn = document.querySelector(".complete-todo-btn");
const incompleteTodoBtn = document.querySelector(".incomplete-todo-btn");

// Các biến toàn cục
const loadingOverlay = document.querySelector(".loading-overlay");
const baseUrl = "https://jsonplaceholder.typicode.com";
let todoData = null;
let currentPostsLoaded = 5;

// Hàm gửi request với async/await
async function sendRequest(method, url) {
  try {
    // Hiện loading overlay
    loadingOverlay.style.display = "flex";

    // Gửi request
    const response = await fetch(url, { method: method });

    // Ẩn loading overlay
    loadingOverlay.style.display = "none";

    // Kiểm tra response có thành công không
    if (!response.ok) {
      // Xử lý các loại lỗi khác nhau
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

    // Chuyển response thành JSON
    const data = await response.json();
    return data;
  } catch (error) {
    // Ẩn loading overlay khi có lỗi
    loadingOverlay.style.display = "none";

    // Xử lý lỗi mạng
    if (error.name === "TypeError" || error.message.includes("fetch")) {
      throw new Error("Lỗi mạng - Kiểm tra kết nối internet");
    }

    throw error;
  }
}

// Hàm gửi request với cơ chế retry
async function sendRequestWithRetry(method, url, retryElement = null, maxRetries = 1) {
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      // Hiển thị thông tin retry
      if (retryElement && retryCount > 0) {
        retryElement.textContent = `Đang thử lại lần ${retryCount}/${maxRetries}...`;
      }

      // Gửi request
      const result = await sendRequest(method, url);

      // Hiển thị thông báo thành công
      if (retryElement) {
        retryElement.textContent = retryCount > 0 ? `Thành công sau ${retryCount} lần thử lại!` : "";
      }

      return result;
    } catch (error) {
      retryCount++;

      // Nếu đã thử hết số lần cho phép
      if (retryCount > maxRetries) {
        if (retryElement) {
          retryElement.textContent = `Đã thử ${maxRetries + 1} lần, vẫn thất bại!`;
        }
        throw error;
      }

      // Hiển thị thông báo retry
      if (retryElement) {
        retryElement.textContent = `Lỗi! Sẽ thử lại sau 2 giây... (Lần ${retryCount}/${maxRetries})`;
      }

      // Chờ 2 giây trước khi retry
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

// Hàm hiển thị thông tin user
function displayUser(data) {
  userName.textContent = data ? "Name: " + data.name : "";
  userEmail.textContent = data ? "Email: " + data.email : "";
  userPhone.textContent = data ? "Phone: " + data.phone : "";
  userWebsite.textContent = data ? "Website: " + data.website : "";
  userCompany.textContent = data ? "Company: " + data.company.name : "";
  userAddress.textContent = data ? "Address: " + data.address.street + ", " + data.address.city : "";
}

// Hàm xóa thông báo lỗi user
function clearUserError() {
  findUserError.textContent = "";
  findUserRetry.textContent = "";
}

// Sự kiện click nút tìm user
findUserBtn.addEventListener("click", async () => {
  try {
    // Kiểm tra input có giá trị không
    if (!userIdInput.value) {
      findUserError.textContent = "Vui lòng nhập User ID!";
      return;
    }

    // Xóa lỗi cũ và reset display
    clearUserError();
    displayUser(null);

    // Gửi request lấy thông tin user
    const url = baseUrl + "/users/" + userIdInput.value;
    const data = await sendRequestWithRetry("GET", url, findUserRetry);
    displayUser(data);
  } catch (error) {
    findUserError.textContent = error.message;
    console.log(error);
  }
});

// Hàm load comments cho một post
async function loadComments(userId, postId) {
  try {
    const urlUser = baseUrl + "/users/" + userId;
    const urlComments = baseUrl + "/posts/" + postId + "/comments";

    // Gọi API lấy thông tin user và comments
    const userData = await sendRequestWithRetry("GET", urlUser, postRetry);
    const commentsData = await sendRequestWithRetry("GET", urlComments, postRetry);

    // Tìm div của post
    const postDiv = document.querySelector(".post-id-" + postId);

    // Xóa comments cũ nếu có
    let oldComments = postDiv.querySelector(".comments");
    if (oldComments) oldComments.remove();

    // Tạo container cho comments
    const commentsContainer = document.createElement("div");
    commentsContainer.className = "comments";

    // Hiển thị thông tin user
    const userInfo = document.createElement("div");
    userInfo.className = "comment-userinfo";
    userInfo.textContent = `User: ${userData.name} (${userData.email})`;
    commentsContainer.appendChild(userInfo);

    // Hiển thị từng comment
    commentsData.forEach((comment) => {
      const commentDiv = document.createElement("div");
      commentDiv.className = "comment";
      commentDiv.textContent = `${comment.name} (email: ${comment.email}): ${comment.body}`;
      commentsContainer.appendChild(commentDiv);
    });

    // Thêm comments vào post
    postDiv.appendChild(commentsContainer);
  } catch (error) {
    postError.textContent = error.message;
    console.log(error);
  }
}

// Hàm hiển thị danh sách posts
async function displayPosts(posts) {
  try {
    // Tạo HTML cho tất cả posts đồng thời
    const htmlArray = await Promise.all(
      posts.map(async (post) => {
        const urlUser = baseUrl + "/users/" + post.userId;
        const userData = await sendRequestWithRetry("GET", urlUser, postRetry);
        return `<div class="post-id-${post.id}">
                    <div class="post-userid">UserID: ${post.userId}</div>
                    <div class="post-user-name">Name: ${userData.name}</div>
                    <div class="post-user-email">Email: ${userData.email}</div>
                    <div class="post-id">ID: ${post.id}</div>
                    <div class="post-title">Title: ${post.title}</div>
                    <div class="post-body">Body: ${post.body}</div>
                    <button type="button" class="comment-btn" data-post-id="${post.id}" data-user-id="${post.userId}">Xem comments</button>
                </div>`;
      })
    );

    return htmlArray.join("");
  } catch (error) {
    console.log(error);
  }
}

// Hàm gắn sự kiện click cho các nút comment
function bindCommentEvents() {
  document.querySelectorAll(".comment-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const postId = btn.dataset.postId;
      const userId = btn.dataset.userId;
      loadComments(userId, postId);
    });
  });
}

// Hàm load posts
async function loadPosts(limit = 5, append = false) {
  try {
    // Reset thông báo lỗi
    postError.textContent = "";
    postRetry.textContent = "";

    // Gửi request lấy posts
    const url = baseUrl + "/posts?_limit=" + limit;
    const posts = await sendRequestWithRetry("GET", url, postRetry);

    // Tạo HTML và hiển thị
    const postsHTML = await displayPosts(posts);
    if (append) {
      postsList.innerHTML += postsHTML;
    } else {
      postsList.innerHTML = postsHTML;
    }
    
    // Gắn sự kiện cho các nút comment
    bindCommentEvents();
  } catch (error) {
    postError.textContent = error.message;
    console.log(error);
  }
}

// Sự kiện click nút load more posts
loadMoreBtn.addEventListener("click", async () => {
  currentPostsLoaded += 5;
  await loadPosts(currentPostsLoaded, false);
});

// Hàm hiển thị danh sách todos
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
  numberTodo.textContent = `Số todos: ${todos.length}`;
}

// Hàm load todos
async function loadTodos() {
  try {
    // Kiểm tra input có giá trị không
    if (!userIdInputTodo.value) {
      todoError.textContent = "Vui lòng nhập User ID!";
      return;
    }

    // Reset thông báo lỗi
    todoError.textContent = "";
    todoRetry.textContent = "";

    // Gửi request lấy todos
    const url = baseUrl + "/users/" + userIdInputTodo.value + "/todos";
    const data = await sendRequestWithRetry("GET", url, todoRetry);

    // Lưu data và hiển thị
    todoData = data;
    displayTodos(data);
  } catch (error) {
    todoError.textContent = error.message;
    console.log(error);
  }
}

// Hàm filter todos
async function filterTodos(filterFn) {
  // Nếu chưa có data thì load trước
  if (!todoData) {
    await loadTodos();
  }
  
  // Filter và hiển thị
  if (todoData) {
    const filteredTodos = todoData.filter(filterFn);
    displayTodos(filteredTodos);
  }
}

// Các sự kiện cho todo buttons
loadTodoBtn.addEventListener("click", loadTodos);

allTodoBtn.addEventListener("click", async () => {
  await filterTodos((todo) => todo);
});

completeTodoBtn.addEventListener("click", async () => {
  await filterTodos((todo) => todo.completed);
});

incompleteTodoBtn.addEventListener("click", async () => {
  await filterTodos((todo) => !todo.completed);
});

// Load posts ban đầu khi trang được tải
loadPosts(5);